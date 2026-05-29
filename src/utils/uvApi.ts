import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UVHourData } from '../types';

export interface UVApiResult {
  currentUVIndex: number;
  hourlyData: UVHourData[];
}

function getUVColor(uv: number): string {
  if (uv <= 2) return '#e1e3e4';
  if (uv <= 5) return '#ffe171';
  if (uv <= 7) return '#FFD600';
  if (uv <= 9) return '#FF9500';
  return '#ba1a1a';
}

const SEOUL = { lat: 37.5665, lon: 126.978 };

// 위치는 한 번만 가져와 캐시(메모리 + AsyncStorage)에서 재사용한다.
// 지역 단위(소수점 2자리 ≈ 1km)면 충분하므로 정확한 좌표는 저장하지 않는다.
const LOCATION_KEY = 'cachedLocation';
const LOCATION_TTL = 60 * 60 * 1000; // 1시간
let cachedLocation: { lat: number; lon: number } | null = null;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

export async function getUserLocation(): Promise<{ lat: number; lon: number }> {
  // 1) 메모리 캐시 — 앱 실행 중 재요청 시 즉시 반환
  if (cachedLocation) return cachedLocation;

  // 2) 저장된 캐시 — TTL 이내면 GPS를 다시 켜지 않음
  try {
    const stored = await AsyncStorage.getItem(LOCATION_KEY);
    if (stored) {
      const p = JSON.parse(stored);
      if (typeof p?.lat === 'number' && typeof p?.lon === 'number' &&
          typeof p?.ts === 'number' && Date.now() - p.ts < LOCATION_TTL) {
        cachedLocation = { lat: p.lat, lon: p.lon };
        return cachedLocation;
      }
    }
  } catch {}

  // 3) 실제 측정 — 지역 단위로만, 저전력
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return SEOUL;

    const last = await Location.getLastKnownPositionAsync();
    const coords = last
      ? last.coords
      : (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          5000,
        )).coords;

    const region = {
      lat: Math.round(coords.latitude * 100) / 100,
      lon: Math.round(coords.longitude * 100) / 100,
    };
    cachedLocation = region;
    AsyncStorage.setItem(LOCATION_KEY, JSON.stringify({ ...region, ts: Date.now() })).catch(() => {});
    return region;
  } catch {
    return SEOUL;
  }
}

export async function fetchUVData(lat: number, lon: number): Promise<UVApiResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=uv_index&hourly=uv_index&timezone=auto&forecast_days=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const currentUVIndex = Math.round(data.current?.uv_index ?? 0);
  const times: string[] = data.hourly?.time ?? [];
  const uvValues: number[] = data.hourly?.uv_index ?? [];
  const now = new Date();
  const fromHour = now.getHours() >= 20 ? 6 : Math.max(now.getHours(), 6);

  const hourlyData: UVHourData[] = times
    .map((t, i) => ({ d: new Date(t), uv: Math.max(0, Math.round(uvValues[i])) }))
    .filter(({ d }) => {
      const same = d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      return same && d.getHours() >= fromHour && d.getHours() <= 20;
    })
    .slice(0, 10)
    .map(({ d, uv }) => ({ hour: `${d.getHours()}시`, uvIndex: uv, bgColor: getUVColor(uv) }));

  return { currentUVIndex, hourlyData };
}

export function getMockUVData(): UVApiResult {
  const h = new Date().getHours();
  const all = [
    { hour: '9시', uvIndex: 4, bgColor: '#ffe171' },
    { hour: '10시', uvIndex: 6, bgColor: '#FFD600' },
    { hour: '11시', uvIndex: 8, bgColor: '#FF9500' },
    { hour: '12시', uvIndex: 10, bgColor: '#FF9500' },
    { hour: '13시', uvIndex: 11, bgColor: '#ba1a1a' },
    { hour: '14시', uvIndex: 9, bgColor: '#FF9500' },
    { hour: '15시', uvIndex: 7, bgColor: '#FFD600' },
    { hour: '16시', uvIndex: 5, bgColor: '#ffe171' },
    { hour: '17시', uvIndex: 3, bgColor: '#ffe171' },
    { hour: '18시', uvIndex: 1, bgColor: '#e1e3e4' },
  ];
  const hourlyData = all.filter((_, i) => i + 9 >= h).slice(0, 10);
  const nowData = all.find((_, i) => i + 9 === h);
  return { currentUVIndex: nowData?.uvIndex ?? 0, hourlyData };
}

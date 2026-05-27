import * as Location from 'expo-location';
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

export async function getUserLocation(): Promise<{ lat: number; lon: number }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { lat: 37.5665, lon: 126.978 };
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: loc.coords.latitude, lon: loc.coords.longitude };
  } catch {
    return { lat: 37.5665, lon: 126.978 };
  }
}

export async function fetchUVData(lat: number, lon: number): Promise<UVApiResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=uv_index&hourly=uv_index&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
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

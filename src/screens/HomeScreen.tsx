import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Dimensions, RefreshControl,
} from 'react-native';
import { fetchUVData, getUserLocation, getMockUVData } from '../utils/uvApi';
import { UVHourData } from '../types';

interface Props {
  uvIndex: number;
  setUvIndex: (v: number) => void;
  onNavigate: (s: string) => void;
}

function getStatus(uv: number) {
  if (uv <= 2) return { label: '낮음', color: '#4caf50', bg: '#eafaf1', text: '자외선이 미미합니다. 안전하게 야외활동이 가능합니다.' };
  if (uv <= 5) return { label: '보통', color: '#ffe171', bg: '#fff9db', text: '약간의 자외선 노출이 있습니다. 자외선 차단제를 바르세요.' };
  if (uv <= 7) return { label: '높음', color: '#FF9500', bg: '#ffeacc', text: '외출 시 모자나 선글라스를 착용하고 차단제를 꼼꼼히 바르세요.' };
  return { label: '매우높음', color: '#ba1a1a', bg: '#ffdad6', text: '그늘에 머무르세요. 햇볕에 노출 시 피부 화상을 입을 수 있습니다.' };
}

export default function HomeScreen({ uvIndex, setUvIndex, onNavigate }: Props) {
  const [hourlyData, setHourlyData] = useState<UVHourData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const status = getStatus(uvIndex);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { lat, lon } = await getUserLocation();
      const result = await fetchUVData(lat, lon);
      setUvIndex(result.currentUVIndex);
      setHourlyData(result.hourlyData.length > 0 ? result.hourlyData : getMockUVData().hourlyData);
      setIsRealtime(true);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      const mock = getMockUVData();
      setUvIndex(mock.currentUVIndex);
      setHourlyData(mock.hourlyData);
      setIsRealtime(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#ff9500" />}>

      {/* UV 게이지 */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.sectionLabel}>☀️ 현재 자외선 지수</Text>
          <View style={styles.row}>
            {loading && <ActivityIndicator size="small" color="#ff9500" style={{ marginRight: 6 }} />}
            {isRealtime && <Text style={styles.realtimeBadge}>실시간</Text>}
            {!isRealtime && !loading && <Text style={styles.fallbackBadge}>추정값</Text>}
            <View style={styles.uvBadge}>
              <Text style={styles.uvNum}>{uvIndex}</Text>
              <Text style={styles.uvDen}>/11</Text>
              <View style={[styles.levelTag, { backgroundColor: status.color }]}>
                <Text style={styles.levelTagTxt}>{status.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {lastUpdated ? <Text style={styles.updatedTxt}>📍 {lastUpdated} 기준</Text> : null}

        {/* UV 게이지 (API 기반, 읽기 전용) */}
        <View style={styles.gaugeWrap}>
          <View style={styles.gaugeBar}>
            <View style={[styles.gaugeSeg, { flex: 18, backgroundColor: '#FFD600' }]} />
            <View style={[styles.gaugeSeg, { flex: 27, backgroundColor: '#fdd404' }]} />
            <View style={[styles.gaugeSeg, { flex: 18, backgroundColor: '#FF9500' }]} />
            <View style={[styles.gaugeSeg, { flex: 37, backgroundColor: '#ba1a1a' }]} />
          </View>
          <View
            style={[
              styles.gaugeThumb,
              {
                left: `${Math.min(100, Math.max(0, (uvIndex / 11) * 100))}%`,
                borderColor: status.color,
              },
            ]}
          >
            <View style={[styles.gaugeThumbDot, { backgroundColor: status.color }]} />
          </View>
        </View>
        <View style={styles.scaleRow}>
          {['낮음', '보통', '높음', '매우높음'].map(l => (
            <Text key={l} style={styles.scaleLbl}>{l}</Text>
          ))}
        </View>

        {/* 경고 배너 */}
        <TouchableOpacity style={[styles.alertBanner, { backgroundColor: status.bg }]}
          onPress={() => onNavigate('timer')}>
          <Text style={[styles.alertTxt, { color: status.color === '#4caf50' ? '#1e4620' : status.color }]}>
            ⚠ {status.text}
          </Text>
          <Text style={{ color: status.color }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 시간대별 예보 */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>☀️ 시간대별 자외선 지수</Text>
          {isRealtime && <Text style={styles.realtimeBadge}>실시간</Text>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {(hourlyData.length > 0 ? hourlyData : getMockUVData().hourlyData).map((d, i) => (
            <View key={i} style={styles.hourCard}>
              <Text style={styles.hourLabel}>{d.hour}</Text>
              <View style={[styles.hourDot, { backgroundColor:
                d.uvIndex >= 8 ? '#ba1a1a' : d.uvIndex >= 6 ? '#FF9500' : d.uvIndex >= 3 ? '#FFD600' : '#ccc' }]} />
              <Text style={styles.hourNum}>{d.uvIndex}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 위젯 2열 */}
      <View style={styles.widgetRow}>
        <View style={[styles.widgetCard, { flex: 1 }]}>
          <Text style={styles.widgetLabel}>외출 환경</Text>
          <View style={styles.row}>
            <Text style={styles.temp}>28°C</Text>
            <Text style={{ fontSize: 22 }}>☀️</Text>
          </View>
          <Text style={styles.weatherSub}>맑음 · 습도 62%</Text>
          <View style={styles.activityTag}>
            <Text style={styles.activityTxt}>테니스 지수 좋음</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.surveyCard, { flex: 1 }]} onPress={() => onNavigate('survey')}>
          <Text style={styles.surveyLabel}>🛡 피부 MBTI</Text>
          <Text style={styles.surveyTitle}>내 피부 타입을{'\n'}안다면?</Text>
          <View style={styles.surveyBtn}>
            <Text style={styles.surveyBtnTxt}>설문 시작</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  section: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  realtimeBadge: { fontSize: 9, fontWeight: '700', color: '#2e7d32', backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  fallbackBadge: { fontSize: 9, fontWeight: '700', color: '#e65100', backgroundColor: '#fff3e0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  uvBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: 8 },
  uvNum: { fontSize: 22, fontWeight: '900', color: '#8c5000' },
  uvDen: { fontSize: 10, color: '#aaa', fontWeight: '700', marginRight: 6 },
  levelTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  levelTagTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
  updatedTxt: { fontSize: 9, color: '#bbb', marginBottom: 4 },
  gaugeWrap: { width: '100%', height: 28, justifyContent: 'center', marginVertical: 6, position: 'relative' },
  gaugeBar: { width: '100%', height: 10, borderRadius: 99, overflow: 'hidden', flexDirection: 'row' },
  gaugeSeg: { height: '100%' },
  gaugeThumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginLeft: -12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  gaugeThumbDot: { width: 6, height: 6, borderRadius: 3 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 2 },
  scaleLbl: { fontSize: 10, color: '#bbb', fontWeight: '700' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginTop: 8 },
  alertTxt: { fontSize: 11, fontWeight: '700', flex: 1, marginRight: 8 },
  hourCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, marginRight: 8, borderWidth: 1, borderColor: '#f0f0f0', minWidth: 56 },
  hourLabel: { fontSize: 11, fontWeight: '700', color: '#aaa' },
  hourDot: { width: 10, height: 10, borderRadius: 5, marginVertical: 6 },
  hourNum: { fontSize: 13, fontWeight: '900', color: '#1a1a1a' },
  widgetRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  widgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  widgetLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', marginBottom: 4 },
  temp: { fontSize: 26, fontWeight: '900', color: '#8c5000' },
  weatherSub: { fontSize: 10, fontWeight: '700', color: '#aaa', marginTop: 6 },
  activityTag: { backgroundColor: '#ffdcbf', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
  activityTxt: { fontSize: 9, fontWeight: '800', color: '#2d1600' },
  surveyCard: { backgroundColor: '#fdd404', borderRadius: 16, padding: 16, justifyContent: 'space-between' },
  surveyLabel: { fontSize: 11, fontWeight: '700', color: '#554600' },
  surveyTitle: { fontSize: 13, fontWeight: '900', color: '#221b00', marginTop: 6, lineHeight: 18 },
  surveyBtn: { backgroundColor: '#fff', paddingVertical: 8, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  surveyBtnTxt: { fontSize: 11, fontWeight: '900', color: '#8c5000' },
});

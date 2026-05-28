import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props { uvIndex: number }

function getMinutes(uv: number, smart: boolean): number {
  if (!smart) return 120;
  if (uv >= 8) return 60;
  if (uv >= 5) return 90;
  return 120;
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const hStr = h > 0 ? `${String(h).padStart(2, '0')}:` : '';
  return `${hStr}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerScreen({ uvIndex }: Props) {
  const [smart, setSmart] = useState(true);
  const mins = getMinutes(uvIndex, smart);
  const initial = mins * 60;
  const [secs, setSecs] = useState(initial);
  const [running, setRunning] = useState(true);
  const prevMins = useRef(mins);

  useEffect(() => {
    if (prevMins.current !== mins) {
      prevMins.current = mins;
      setSecs(mins * 60);
      setRunning(true);
    }
  }, [mins]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secs === 0 && running) setRunning(false);
  }, [secs, running]);

  const done = secs === 0;
  const radius = 100;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (secs / initial) * circ;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 원형 게이지 */}
      <View style={styles.card}>
        <View style={styles.svgWrap}>
          <Svg width={240} height={240} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={120} cy={120} r={radius} stroke="#f0f0f0" strokeWidth={14} fill="none" />
            <Circle cx={120} cy={120} r={radius}
              stroke={done ? '#4caf50' : '#ff9500'} strokeWidth={14} fill="none"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" />
          </Svg>
          <View style={styles.innerText}>
            <Text style={styles.timerLabel}>{done ? '재도포 시간!' : '다음 재도포까지'}</Text>
            <Text style={[styles.timerNum, { color: done ? '#4caf50' : '#8c5000' }]}>
              {done ? '✓ 완료' : fmt(secs)}
            </Text>
            <View style={styles.targetTag}>
              <Text style={styles.targetTxt}>목표: {mins}분 후 재도포</Text>
            </View>
          </View>
        </View>

        {done && (
          <View style={styles.doneBox}>
            <Text style={styles.doneTxt}>☀️ 선크림 재도포 시간입니다!</Text>
            <Text style={styles.doneSub}>타이머 재설정 후 외출을 즐기세요.</Text>
          </View>
        )}
      </View>

      {/* 버튼 */}
      <TouchableOpacity style={styles.btnPrimary} onPress={() => { setSecs(initial); setRunning(true); }}>
        <Text style={styles.btnPrimaryTxt}>↺  타이머 재설정</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} disabled={done}
        onPress={() => setRunning(p => !p)}>
        <Text style={styles.btnSecondaryTxt}>{running ? '⏸  일시정지' : '▶  다시시작'}</Text>
      </TouchableOpacity>

      {/* 상태 카드 */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>재도포 주기</Text>
          <Text style={styles.infoValue}>{mins}분</Text>
          <Text style={styles.infoSub}>UV {uvIndex} 기준{smart ? ' (스마트)' : ''}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>알림 소리</Text>
          <Text style={styles.infoValue}>🔔 기본음</Text>
        </View>
      </View>

      {/* 스마트 알림 토글 */}
      <View style={styles.smartCard}>
        <View style={styles.smartIcon}>
          <Text style={{ fontSize: 20 }}>⚡</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.smartTitle}>스마트 알림</Text>
          <Text style={styles.smartSub}>UV 지수에 따라 재도포 주기를 자동 조절합니다</Text>
          <Text style={styles.smartHint}>UV≥8→60분 / UV≥5→90분 / 그 외→120분</Text>
        </View>
        <Switch value={smart} onValueChange={setSmart}
          trackColor={{ false: '#ccc', true: '#8c5000' }} thumbColor="#fff" />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  svgWrap: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center' },
  innerText: { position: 'absolute', alignItems: 'center' },
  timerLabel: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  timerNum: { fontSize: 38, fontWeight: '900', fontVariant: ['tabular-nums'], marginVertical: 4 },
  targetTag: { backgroundColor: 'rgba(255,225,113,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  targetTxt: { fontSize: 11, color: '#666', fontWeight: '600' },
  doneBox: { marginTop: 12, backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, width: '100%', alignItems: 'center' },
  doneTxt: { fontSize: 14, fontWeight: '800', color: '#2e7d32' },
  doneSub: { fontSize: 11, color: '#388e3c', marginTop: 2 },
  btnPrimary: { backgroundColor: '#8c5000', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center' },
  btnPrimaryTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { backgroundColor: '#f0f0f0', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  btnSecondaryTxt: { color: '#333', fontSize: 16, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  infoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  infoLabel: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  infoValue: { fontSize: 22, fontWeight: '800', color: '#8c5000', marginTop: 2 },
  infoSub: { fontSize: 9, color: '#bbb', marginTop: 2 },
  smartCard: { backgroundColor: '#ffe171', borderRadius: 14, padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  smartIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fdd404', justifyContent: 'center', alignItems: 'center' },
  smartTitle: { fontSize: 14, fontWeight: '700', color: '#2d1600' },
  smartSub: { fontSize: 11, color: 'rgba(45,22,0,0.7)', marginTop: 2 },
  smartHint: { fontSize: 9, color: 'rgba(45,22,0,0.5)', marginTop: 2 },
});

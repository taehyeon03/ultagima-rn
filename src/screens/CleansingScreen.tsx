import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { skinTypeData, generateCleansingRoutine, SkinTypeDetail, CleansingRoutine } from '../data/skinTypeData';

interface Props { onNavigate: (s: string) => void; }
type Cat = 'all' | 'morning' | 'evening' | 'caution';

export default function CleansingScreen({ onNavigate }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<SkinTypeDetail | null>(null);
  const [routine, setRoutine] = useState<CleansingRoutine | null>(null);
  const [cat, setCat] = useState<Cat>('all');

  useEffect(() => {
    (async () => {
      const c = await AsyncStorage.getItem('skinTypeCode');
      const raw = await AsyncStorage.getItem('skinTypeDetail');
      let d: SkinTypeDetail | null = null;
      if (raw) { try { d = JSON.parse(raw); } catch { d = c ? skinTypeData[c] ?? null : null; } }
      else if (c) { d = skinTypeData[c] ?? null; }
      setCode(c); setDetail(d);
      if (c) setRoutine(generateCleansingRoutine(c));
    })();
  }, []);

  const cards = useMemo(() => {
    if (!detail || !routine) return [];
    return [
      { id: 'morning', title: routine.morning.title, desc: routine.morning.description, tips: routine.morning.points, tag: '아침 관리', icon: '☀️', color: '#fff8df', border: '#ffe8a8' },
      { id: 'evening', title: routine.evening.title, desc: routine.evening.description, tips: routine.evening.points, tag: '선크림 제거', icon: '🌙', color: '#fbf4ea', border: '#ead8c4' },
      { id: 'caution', title: routine.caution.title, desc: routine.caution.description, tips: routine.caution.points, tag: '주의', icon: '⚠️', color: '#fff0ea', border: '#ffd7c7' },
    ] as const;
  }, [detail, routine]);

  const filtered = cards.filter(c => cat === 'all' || c.id === cat);

  if (!code || !detail) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>맞춤 세안법</Text>
          <Text style={styles.bannerDesc}>피부 타입을 설정하면{'\n'}내 피부에 맞는 세안 루틴을 추천해 드립니다.</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💧</Text>
          <Text style={styles.emptyTitle}>아직 피부 타입이 설정되지 않았어요.</Text>
          <Text style={styles.emptyDesc}>피부 설정 탭에서 피부 타입을 먼저 선택하면 맞춤 세안법을 추천해드려요.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('survey')}>
            <Text style={styles.emptyBtnTxt}>피부 타입 설정하러 가기 →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>{code} 맞춤 세안법</Text>
        <Text style={styles.bannerDesc}>사용자의 {code} 타입을 분석하여{'\n'}피부 자극을 줄이는 세안 루틴을 추천해 드립니다.</Text>
      </View>

      {/* 카테고리 탭 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {([['all','전체'],['morning','아침 세안'],['evening','저녁 세안'],['caution','주의사항']] as [Cat,string][]).map(([id, label]) => (
          <TouchableOpacity key={id} style={[styles.tab, cat===id && styles.tabActive]} onPress={() => setCat(id)}>
            <Text style={[styles.tabTxt, cat===id && styles.tabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 피부 요약 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryIcon}>✨</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.summaryTitle}>{code} 피부 타입 요약</Text>
          <Text style={styles.summaryDesc}>{detail.summary}</Text>
        </View>
      </View>

      {/* 루틴 카드 */}
      {filtered.map(card => (
        <View key={card.id} style={[styles.routineCard, { backgroundColor: card.color, borderColor: card.border }]}>
          <View style={styles.routineHeader}>
            <View style={styles.routineIconWrap}>
              <Text style={{ fontSize: 20 }}>{card.icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.routineTitle}>{card.title}</Text>
              <Text style={styles.routineDesc}>{card.desc}</Text>
            </View>
            <View style={styles.routineTag}><Text style={styles.routineTagTxt}>{card.tag}</Text></View>
          </View>
          <View style={styles.tipList}>
            {card.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipCheck}>✅</Text>
                <Text style={styles.tipTxt}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 16 },
  banner: { backgroundColor: '#ff9500', borderRadius: 16, padding: 20, marginTop: 12 },
  bannerTitle: { color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '800' },
  bannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginTop: 14, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a' },
  emptyDesc: { fontSize: 13, color: '#777', marginTop: 8, lineHeight: 20 },
  emptyBtn: { backgroundColor: '#ff9500', borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginTop: 16 },
  emptyBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  tabScroll: { marginTop: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginRight: 8 },
  tabActive: { backgroundColor: '#8c5000', borderColor: '#8c5000' },
  tabTxt: { fontSize: 12, fontWeight: '700', color: '#888' },
  tabTxtActive: { color: '#fff' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  summaryIcon: { fontSize: 24 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  summaryDesc: { fontSize: 12, color: '#777', marginTop: 2, lineHeight: 17 },
  routineCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12 },
  routineHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  routineIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  routineTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  routineDesc: { fontSize: 11, color: '#666', marginTop: 3, lineHeight: 16 },
  routineTag: { backgroundColor: '#ffdbc9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  routineTagTxt: { fontSize: 10, fontWeight: '700', color: '#934b19' },
  tipList: { marginTop: 12, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.06)', paddingTop: 10, gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  tipCheck: { fontSize: 13 },
  tipTxt: { fontSize: 12, color: '#555', flex: 1, lineHeight: 18, fontWeight: '600' },
});

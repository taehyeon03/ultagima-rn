import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { skinTypeData, generateCleansingRoutine } from '../data/skinTypeData';

interface Props {
  onNavigate: (s: string) => void;
  setUserSkinType: (t: string) => void;
}

const steps = [
  { id: 1, title: '유수분 밸런스', question: '피부가 건조한 편인가요, 피지가 많은 편인가요?', options: [{ code: 'D', name: '건성', en: 'Dry' }, { code: 'O', name: '지성', en: 'Oily' }] },
  { id: 2, title: '피부 민감도', question: '피부가 자극에 민감한 편인가요?', options: [{ code: 'S', name: '민감성', en: 'Sensitive' }, { code: 'R', name: '저항성', en: 'Resistant' }] },
  { id: 3, title: '색소 고민', question: '기미, 잡티, 색소침착이 잘 생기는 편인가요?', options: [{ code: 'P', name: '색소성', en: 'Pigmented' }, { code: 'N', name: '비색소성', en: 'Non-Pigmented' }] },
  { id: 4, title: '주름/탄력', question: '잔주름이나 탄력 저하가 고민인가요?', options: [{ code: 'W', name: '주름', en: 'Wrinkled' }, { code: 'T', name: '탄탄함', en: 'Tight' }] },
];

const labels: Record<string, string> = { D:'건성', O:'지성', S:'민감성', R:'저항성', P:'색소성', N:'비색소성', W:'주름', T:'탄탄함' };

export default function SurveyScreen({ onNavigate, setUserSkinType }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      const keys = ['moistureType','sensitivityType','pigmentType','wrinkleType'];
      const saved: Record<number,string> = {};
      const vals = await AsyncStorage.getMany(keys);
      keys.forEach((k, i) => { if (vals[k]) saved[i + 1] = vals[k] as string; });
      setAnswers(saved);
    })();
  }, []);

  const codes = steps.map(s => answers[s.id] ?? '-');
  const done = codes.every(c => c !== '-');
  const skinCode = codes.join('');

  const select = async (stepId: number, code: string) => {
    const next = { ...answers, [stepId]: code };
    setAnswers(next);
    const [m, s, p, w] = [next[1], next[2], next[3], next[4]];
    const entries: Record<string, string> = {};
    if (m) entries['moistureType'] = m;
    if (s) entries['sensitivityType'] = s;
    if (p) entries['pigmentType'] = p;
    if (w) entries['wrinkleType'] = w;
    if (Object.keys(entries).length > 0) await AsyncStorage.setMany(entries);
    if (m && s && p && w) {
      const code4 = [m, s, p, w].join('');
      const detail = { ...(skinTypeData[code4] ?? { code: code4, summary: [m,s,p,w].map(c=>labels[c]).join(' · ') }), cleansingRoutine: generateCleansingRoutine(code4) };
      await AsyncStorage.setItem('skinTypeCode', code4);
      await AsyncStorage.setItem('skinTypeDetail', JSON.stringify(detail));
      setUserSkinType(code4);
    }
  };

  const submit = async () => {
    if (!done) return;
    Alert.alert('저장 완료', '피부 타입이 저장되었어요.', [{ text: '확인', onPress: () => onNavigate('recommend') }]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>✨ 피부 MBTI 설문</Text>
        <Text style={styles.counter}>{codes.filter(c=>c!=='-').length}/4</Text>
      </View>
      <Text style={styles.desc}>4가지 기준을 선택하면 나에게 맞는 선크림과 세안법을 추천해드려요.</Text>

      {/* 진행 바 */}
      <View style={styles.progressRow}>
        {steps.map(s => (
          <View key={s.id} style={[styles.progressBar, answers[s.id] ? styles.progressDone : styles.progressEmpty]} />
        ))}
      </View>

      {/* 스텝 카드 */}
      {steps.map(step => (
        <View key={step.id} style={styles.stepCard}>
          <View style={styles.stepLeft}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeTxt}>STEP {step.id}</Text>
              {answers[step.id] && <Text style={styles.checkMark}>  ✓</Text>}
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepQ}>{step.question}</Text>
          </View>
          <View style={styles.optionRow}>
            {step.options.map((opt, idx) => {
              const sel = answers[step.id] === opt.code;
              return (
                <React.Fragment key={opt.code}>
                  {idx === 1 && <View style={styles.vsWrap}><Text style={styles.vs}>VS</Text></View>}
                  <TouchableOpacity
                    style={[styles.optBtn, sel ? styles.optBtnSel : styles.optBtnUnsel]}
                    onPress={() => select(step.id, opt.code)}>
                    <Text style={[styles.optCode, { color: sel ? '#fff' : '#8c5000' }]}>{opt.code}</Text>
                    <Text style={[styles.optName, { color: sel ? '#fff' : '#333' }]}>{opt.name}</Text>
                    <Text style={[styles.optEn, { color: sel ? 'rgba(255,255,255,0.8)' : '#aaa' }]}>{opt.en}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      ))}

      {/* 현재 선택 요약 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>현재 선택</Text>
          <Text style={styles.summaryCode}>{done ? skinCode : codes.join(' ')}</Text>
        </View>
        {codes.filter(c=>c!=='-').map(c => (
          <View key={c} style={styles.summaryRow}>
            <View style={styles.summaryTag}><Text style={styles.summaryTagTxt}>{c} {labels[c]}</Text></View>
          </View>
        ))}
        {codes.every(c=>c==='-') && <Text style={styles.summaryEmpty}>아직 선택되지 않았어요.</Text>}
      </View>

      {/* 제출 버튼 */}
      <TouchableOpacity
        style={[styles.submitBtn, done ? styles.submitBtnActive : styles.submitBtnDisabled]}
        onPress={submit} disabled={!done}>
        <Text style={[styles.submitTxt, { color: done ? '#fff' : '#aaa' }]}>결과 확인하기 →</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  counter: { fontSize: 14, fontWeight: '700', color: '#8c5000' },
  desc: { fontSize: 12, color: '#888', marginTop: 8, lineHeight: 18 },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  progressBar: { flex: 1, height: 10, borderRadius: 99 },
  progressDone: { backgroundColor: '#ff9500' },
  progressEmpty: { backgroundColor: '#e0e0e0' },
  stepCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  stepLeft: { flex: 1 },
  stepBadge: { flexDirection: 'row', alignItems: 'center' },
  stepBadgeTxt: { fontSize: 10, fontWeight: '900', color: '#8c5000', backgroundColor: '#fff3db', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  checkMark: { color: '#ff9500', fontWeight: '900', fontSize: 12 },
  stepTitle: { fontSize: 14, fontWeight: '900', color: '#1a1a1a', marginTop: 6 },
  stepQ: { fontSize: 10, color: '#888', marginTop: 4, lineHeight: 15 },
  optionRow: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  vsWrap: { justifyContent: 'center', alignItems: 'center' },
  vs: { fontSize: 9, fontWeight: '900', color: '#8c5000', backgroundColor: '#fff8e8', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 99 },
  optBtn: { width: 64, minHeight: 60, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  optBtnSel: { backgroundColor: '#ff9500', borderColor: '#ff9500' },
  optBtnUnsel: { backgroundColor: '#faf9f6', borderColor: '#e0e0e0' },
  optCode: { fontSize: 18, fontWeight: '900' },
  optName: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  optEn: { fontSize: 8, fontWeight: '700', marginTop: 1 },
  summaryCard: { backgroundColor: '#fffdf5', borderWidth: 1, borderColor: '#ffe6b8', borderRadius: 16, padding: 16, marginTop: 12 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryTitle: { fontSize: 12, fontWeight: '900', color: '#555' },
  summaryCode: { fontSize: 16, fontWeight: '900', color: '#8c5000', letterSpacing: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  summaryTag: { backgroundColor: '#fff3db', borderWidth: 1, borderColor: '#ffe1a8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  summaryTagTxt: { fontSize: 10, fontWeight: '900', color: '#8c5000' },
  summaryEmpty: { fontSize: 11, color: '#bbb' },
  submitBtn: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 14 },
  submitBtnActive: { backgroundColor: '#ff9500' },
  submitBtnDisabled: { backgroundColor: '#e0e0e0' },
  submitTxt: { fontSize: 15, fontWeight: '900' },
});

import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { AbsenceLevel, STAGE_ICONS, STAGE_INFO } from '../hooks/useAbsenceTracker';

interface Props {
  level: AbsenceLevel;
  onDismiss: () => void;
}

const stageLabel: Record<AbsenceLevel, string> = { 0: '', 1: '1단계', 2: '2단계', 3: '4단계' };

export default function AbsenceBanner({ level, onDismiss }: Props) {
  if (level === 0) return null;
  const info = STAGE_INFO[level];
  if (!info) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* 스테이지 이미지 */}
          <View style={styles.imageWrap}>
            <Image source={STAGE_ICONS[level]} style={styles.image} resizeMode="cover" />
            <View style={[styles.badge, { backgroundColor: info.color }]}>
              <Text style={styles.badgeText}>{stageLabel[level]}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 메시지 */}
          <View style={styles.body}>
            <Text style={styles.emoji}>{info.emoji}</Text>
            <Text style={styles.title}>{info.title}</Text>
            <Text style={styles.desc}>{info.body}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: info.color }]} onPress={onDismiss}>
              <Text style={styles.btnTxt}>지금 바로 관리하기 →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 210 },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  closeTxt: { color: '#fff', fontSize: 14 },
  body: { padding: 20 },
  emoji: { fontSize: 28, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  desc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  btn: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

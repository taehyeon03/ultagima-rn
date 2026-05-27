import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export type AbsenceLevel = 0 | 1 | 2 | 3;

const TWO_HOURS   = 2 * 60 * 60 * 1000;
const FIVE_HOURS  = 5 * 60 * 60 * 1000;
const SEVEN_HOURS = 7 * 60 * 60 * 1000;

export const STAGE_ICONS = {
  0: require('../../assets/icons/stage0.png'),
  1: require('../../assets/icons/stage1.jpg'),
  2: require('../../assets/icons/stage2.jpg'),
  3: require('../../assets/icons/stage3.jpg'),
} as const;

export const STAGE_INFO: Record<AbsenceLevel, { emoji: string; title: string; body: string; color: string } | null> = {
  0: null,
  1: { emoji: '😟', title: '2시간 만에 돌아오셨군요!', body: '피부가 걱정됐어요. 선크림 재도포 시간을 확인해보세요.', color: '#FF9500' },
  2: { emoji: '😫', title: '벌써 5시간이나 지났어요!', body: '자외선이 피부를 공격하고 있어요. 지금 바로 선크림을 바르세요!', color: '#e07000' },
  3: { emoji: '🚨', title: '피부 긴급 경보!', body: '7시간 동안 얼타지마를 안 여셨어요. 피부를 즉시 점검하세요!', color: '#ba1a1a' },
};

export function calcAbsenceLevel(lastMs: number): AbsenceLevel {
  const elapsed = Date.now() - lastMs;
  if (elapsed >= SEVEN_HOURS) return 3;
  if (elapsed >= FIVE_HOURS)  return 2;
  if (elapsed >= TWO_HOURS)   return 1;
  return 0;
}

// 알림 핸들러 설정 (앱 진입점에서 한 번 설정)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function scheduleAbsenceNotifications() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    // 기존 예약 알림 취소
    await Notifications.cancelAllScheduledNotificationsAsync();

    const notifications = [
      { seconds: TWO_HOURS / 1000,   title: '피부가 걱정돼요 😟',   body: '2시간 동안 얼타지마를 안 여셨어요. 선크림 재도포 잊지 마세요!' },
      { seconds: FIVE_HOURS / 1000,  title: '선크림 잊으셨나요? 😫', body: '5시간이나 지났어요! 자외선이 피부를 공격하고 있어요.' },
      { seconds: SEVEN_HOURS / 1000, title: '🚨 피부 긴급 경보!',    body: '7시간 동안 얼타지마를 방치하셨어요! 지금 바로 확인하세요!' },
    ];

    for (const n of notifications) {
      await Notifications.scheduleNotificationAsync({
        content: { title: n.title, body: n.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: n.seconds, repeats: false },
      });
    }
  } catch (e) {
    console.warn('[AbsenceTracker] Notification scheduling failed:', e);
  }
}

const LAST_VISIT_KEY = 'ultagima_lastVisit';

export function useAbsenceTracker() {
  const [absenceLevel, setAbsenceLevel] = useState<AbsenceLevel>(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    (async () => {
      const lastStr = await AsyncStorage.getItem(LAST_VISIT_KEY);
      const now = Date.now();

      if (lastStr) {
        const lastMs = parseInt(lastStr, 10);
        if (!isNaN(lastMs)) {
          const level = calcAbsenceLevel(lastMs);
          setAbsenceLevel(level);
          if (level > 0) setShowBanner(true);
        }
      }

      await AsyncStorage.setItem(LAST_VISIT_KEY, now.toString());
      await scheduleAbsenceNotifications();
    })();
  }, []);

  const dismissBanner = () => setShowBanner(false);
  return { absenceLevel, showBanner, dismissBanner };
}

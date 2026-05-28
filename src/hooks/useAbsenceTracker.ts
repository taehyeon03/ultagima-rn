import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

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

/** 알림 트리거 시각이 야간(21시~6시)이면 true — UV가 사실상 0~1이라 알림 무의미 */
function isNightHour(delayMs: number): boolean {
  const hour = new Date(Date.now() + delayMs).getHours();
  return hour >= 21 || hour < 6;
}

async function scheduleAbsenceNotifications() {
  try {
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) return;

    const channelId = await notifee.createChannel({
      id: 'absence',
      name: '부재 알림',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    // 기존 예약 알림 모두 취소
    await notifee.cancelAllNotifications();

    const allNotifications = [
      {
        delayMs: TWO_HOURS,
        title: '피부가 걱정돼요 😟',
        body: '2시간 동안 얼타지마를 안 여셨어요. 선크림 재도포 잊지 마세요!',
        largeIcon: require('../../assets/icons/stage1.jpg'),
        color: '#FF9500',
      },
      {
        delayMs: FIVE_HOURS,
        title: '선크림 잊으셨나요? 😫',
        body: '5시간이나 지났어요! 자외선이 피부를 공격하고 있어요.',
        largeIcon: require('../../assets/icons/stage2.jpg'),
        color: '#e07000',
      },
      {
        delayMs: SEVEN_HOURS,
        title: '🚨 피부 긴급 경보!',
        body: '7시간 동안 얼타지마를 방치하셨어요! 지금 바로 확인하세요!',
        largeIcon: require('../../assets/icons/stage3.jpg'),
        color: '#ba1a1a',
      },
    ];

    const daytimeNotifications = allNotifications.filter((n) => !isNightHour(n.delayMs));

    for (const n of daytimeNotifications) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: Date.now() + n.delayMs,
      };

      await notifee.createTriggerNotification(
        {
          title: n.title,
          body: n.body,
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            largeIcon: n.largeIcon,
            color: n.color,
            pressAction: { id: 'default' },
          },
        },
        trigger
      );
    }
  } catch (e) {
    console.warn('[AbsenceTracker] Notification scheduling failed:', e);
  }
}

const LAST_VISIT_KEY = 'ultagima_lastVisit';

export function useAbsenceTracker() {
  // bannerLevel: 부재 기간으로 계산된 레벨 (배너 표시용으로만 사용)
  const [bannerLevel, setBannerLevel] = useState<AbsenceLevel>(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    (async () => {
      const lastStr = await AsyncStorage.getItem(LAST_VISIT_KEY);
      const now = Date.now();

      if (lastStr) {
        const lastMs = parseInt(lastStr, 10);
        if (!isNaN(lastMs)) {
          const level = calcAbsenceLevel(lastMs);
          if (level > 0) {
            setBannerLevel(level);
            setShowBanner(true);
          }
        }
      }

      await AsyncStorage.setItem(LAST_VISIT_KEY, now.toString());
      await scheduleAbsenceNotifications();
    })();
  }, []);

  const dismissBanner = () => setShowBanner(false);

  // 사용자가 앱에 들어온 시점부터는 부재 끝. 헤더는 항상 0단계로 표시.
  // 부재 사실은 배너로만 알려주고, 헤더 아이콘/링/뱃지는 깨끗한 상태.
  return { absenceLevel: 0 as AbsenceLevel, bannerLevel, showBanner, dismissBanner };
}

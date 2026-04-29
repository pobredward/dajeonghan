/**
 * 다정한 - 알림 리스너 Hook
 * 
 * 알림 수신 및 사용자 응답을 처리하는 React Hook
 */

import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '@/services/notifications/NotificationService';

export const useNotificationListener = () => {
  const navigation = useNavigation();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const type = data?.type as string | undefined;

      // 로컬 알림 타입: 관련 탭으로 이동
      // 약/식재료/청소 → 집 탭(HouseMap), 다이제스트/태스크 → 달력 탭
      if (type === 'medicine' || type === 'food' || type === 'cleaning' || type === 'task') {
        navigation.navigate('HouseMap' as never);
      } else if (
        type === 'digest' ||
        type === 'morning_digest' ||
        type === 'evening_digest' ||
        type === 'weekly_report'
      ) {
        navigation.navigate('Calendar' as never);
      } else if (type === 'streak_reminder' || type === 'reengagement') {
        // 스트릭/재참여 → 달력(오늘 할 일 확인 유도)
        navigation.navigate('Calendar' as never);
      }

      NotificationService.clearBadge();
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [navigation]);
};

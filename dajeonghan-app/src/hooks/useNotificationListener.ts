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
      const data = response.notification.request.content.data as any;

      if (data.type === 'medicine') {
        navigation.navigate('Medicine' as never);
      } else if (data.type === 'food') {
        navigation.navigate('Fridge' as never);
      } else if (data.type === 'cleaning' || data.type === 'task') {
        navigation.navigate('Cleaning' as never);
      } else if (data.type === 'digest') {
        navigation.navigate('Home' as never);
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

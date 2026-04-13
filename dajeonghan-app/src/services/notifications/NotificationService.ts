/**
 * 다정한 - 알림 서비스
 * 
 * expo-notifications를 래핑하여 알림 관리 기능을 제공합니다.
 * - 권한 요청
 * - 로컬 알림 스케줄링
 * - 다이제스트 알림
 * - 약 복용 알림
 * - 식재료 임박 알림
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  NotificationChannelType,
  NotificationData,
  NotificationPermissionStatus
} from '@/types/notification.types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export class NotificationService {
  /**
   * 알림 권한 요청
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    return true;
  }

  /**
   * 권한 상태 확인
   */
  static async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status as NotificationPermissionStatus;
  }

  /**
   * Android 알림 채널 설정
   */
  private static async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default'
    });

    await Notifications.setNotificationChannelAsync('digest', {
      name: '다이제스트 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: [0, 100],
      description: '하루 2회 모아서 알려드려요'
    });

    await Notifications.setNotificationChannelAsync('medicine', {
      name: '약 복용 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: 'default',
      description: '약 복용 시간 알림'
    });

    await Notifications.setNotificationChannelAsync('food', {
      name: '식재료 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      description: '식재료 유통기한 알림'
    });
  }

  /**
   * 로컬 알림 스케줄링
   */
  static async scheduleNotification(
    title: string,
    body: string,
    trigger: Date | Notifications.NotificationTriggerInput,
    data?: NotificationData,
    channelId: NotificationChannelType = 'default'
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: channelId === 'digest' ? false : true,
        priority: channelId === 'medicine' 
          ? Notifications.AndroidNotificationPriority.HIGH
          : Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && { channelId })
      },
      trigger: trigger instanceof Date 
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger } 
        : trigger
    });

    return notificationId;
  }

  /**
   * 다이제스트 알림 스케줄링 (매일 반복)
   */
  static async scheduleDigestNotification(
    time: string,
    title: string,
    body: string
  ): Promise<string> {
    const [hours, minutes] = time.split(':').map(Number);

    return await this.scheduleNotification(
      title,
      body,
      {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true
      },
      { type: 'digest', time: hours === 9 ? 'morning' : 'evening' },
      'digest'
    );
  }

  /**
   * 약 복용 알림 (매일 반복)
   */
  static async scheduleMedicineNotification(
    medicineName: string,
    time: string,
    mealTiming: string,
    medicineId: string
  ): Promise<string> {
    const [hours, minutes] = time.split(':').map(Number);

    const body = mealTiming !== '무관' 
      ? `${medicineName} (${mealTiming})`
      : medicineName;

    return await this.scheduleNotification(
      '💊 약 먹을 시간이에요',
      body,
      {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true
      },
      { 
        type: 'medicine', 
        itemId: medicineId,
        itemName: medicineName 
      },
      'medicine'
    );
  }

  /**
   * 식재료 임박 알림 (1회성)
   */
  static async scheduleFoodExpiryNotification(
    foodName: string,
    expiryDate: Date,
    daysBeforeExpiry: number,
    foodId: string
  ): Promise<string | null> {
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - daysBeforeExpiry);
    notificationDate.setHours(20, 0, 0, 0);

    if (notificationDate <= new Date()) {
      return null;
    }

    const message = daysBeforeExpiry === 0
      ? '오늘까지입니다!'
      : daysBeforeExpiry === 1
      ? '내일까지입니다!'
      : `${daysBeforeExpiry}일 남았어요`;

    return await this.scheduleNotification(
      `🥗 ${foodName} ${message}`,
      '빨리 먹거나 요리해보세요!',
      notificationDate,
      { 
        type: 'food', 
        itemId: foodId,
        itemName: foodName 
      },
      'food'
    );
  }

  /**
   * 모든 예약 알림 취소
   */
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * 특정 알림 취소
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * 예약된 알림 목록 조회
   */
  static async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * 배지 숫자 설정
   */
  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * 배지 숫자 초기화
   */
  static async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * 즉시 알림 표시 (테스트용)
   */
  static async showImmediateNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<string> {
    return await this.scheduleNotification(
      title,
      body,
      { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
      data
    );
  }
}

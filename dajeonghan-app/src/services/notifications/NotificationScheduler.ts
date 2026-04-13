/**
 * 다정한 - 알림 스케줄러
 * 
 * 사용자의 알림 모드에 따라 알림을 스케줄링합니다.
 * - 다이제스트 모드: 하루 2회 배치 알림
 * - 즉시 모드: 다이제스트 + 개별 알림
 * - 최소 모드: 알림 없음 (앱 내 배지만)
 */

import { NotificationService } from './NotificationService';
import { DigestService } from './DigestService';
import { UserProfile } from '@/types/user.types';
import { Task } from '@/types/task.types';
import { Medicine } from '@/modules/medicine/types';
import { FoodItem } from '@/modules/fridge/types';

export class NotificationScheduler {
  /**
   * 사용자 알림 초기화 (온보딩 후)
   */
  static async initializeNotifications(
    userId: string,
    profile: UserProfile
  ): Promise<void> {
    await NotificationService.cancelAllNotifications();

    if (profile.notificationMode === 'digest') {
      await this.setupDigestMode(profile);
    } else if (profile.notificationMode === 'immediate') {
      await this.setupImmediateMode(profile);
    }
  }

  /**
   * 다이제스트 모드 설정
   */
  private static async setupDigestMode(profile: UserProfile): Promise<void> {
    const times = profile.digestTimes || ['09:00', '20:00'];

    for (const time of times) {
      const [hours] = time.split(':').map(Number);
      const title = hours < 12 ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일';
      
      await NotificationService.scheduleDigestNotification(
        time,
        title,
        '탭하여 확인하세요'
      );
    }
  }

  /**
   * 즉시 모드 설정
   */
  private static async setupImmediateMode(profile: UserProfile): Promise<void> {
    await this.setupDigestMode(profile);
  }

  /**
   * 약 복용 알림 등록
   */
  static async scheduleMedicineNotifications(medicines: Medicine[]): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const medicine of medicines) {
      const { schedule } = medicine.metadata;

      for (const time of schedule.times) {
        const id = await NotificationService.scheduleMedicineNotification(
          medicine.name,
          time,
          schedule.mealTiming,
          medicine.id
        );
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  /**
   * 식재료 임박 알림 등록
   * 
   * D-3, D-1, D-day에 알림 발송
   */
  static async scheduleFoodExpiryNotifications(food: FoodItem): Promise<string[]> {
    const notificationIds: string[] = [];
    const expiryDate = food.metadata.recommendedConsumption || food.metadata.expiryDate;

    if (!expiryDate) return notificationIds;

    const daysToNotify = [3, 1, 0];

    for (const days of daysToNotify) {
      const id = await NotificationService.scheduleFoodExpiryNotification(
        food.name,
        new Date(expiryDate),
        days,
        food.id
      );
      if (id) notificationIds.push(id);
    }

    return notificationIds;
  }

  /**
   * 테스크 알림 등록 (즉시 모드)
   */
  static async scheduleTaskNotification(task: Task): Promise<string | null> {
    if (task.notificationSettings.timing === 'silent') {
      return null;
    }

    const nextDue = new Date(task.recurrence.nextDue);
    const now = new Date();

    if (nextDue <= now) return null;

    const notificationTime = new Date(nextDue);
    notificationTime.setHours(9, 0, 0, 0);

    if (notificationTime <= now) return null;

    return await NotificationService.scheduleNotification(
      '📋 할 일 알림',
      `${task.title} (${task.estimatedMinutes}분)`,
      notificationTime,
      { type: 'task', itemId: task.id, itemName: task.title }
    );
  }

  /**
   * 다이제스트 미리보기 생성 (테스트용)
   */
  static async generateDigestPreview(
    tasks: Task[],
    foods: FoodItem[],
    medicines: Medicine[]
  ): Promise<{ morning: string; evening: string }> {
    const morningDigest = DigestService.generateDigest('morning', tasks, foods, medicines);
    const eveningDigest = DigestService.generateDigest('evening', tasks, foods, medicines);

    return {
      morning: DigestService.renderDigestHTML(morningDigest),
      evening: DigestService.renderDigestHTML(eveningDigest)
    };
  }

  /**
   * 모든 알림 재설정
   */
  static async resetAllNotifications(
    userId: string,
    profile: UserProfile,
    medicines: Medicine[],
    foods: FoodItem[]
  ): Promise<void> {
    await NotificationService.cancelAllNotifications();

    await this.initializeNotifications(userId, profile);

    if (profile.notificationMode !== 'minimal') {
      await this.scheduleMedicineNotifications(medicines);

      for (const food of foods) {
        await this.scheduleFoodExpiryNotifications(food);
      }
    }
  }

  /**
   * 알림 통계
   */
  static async getNotificationStats(): Promise<{
    total: number;
    byChannel: Record<string, number>;
  }> {
    const scheduled = await NotificationService.getAllScheduledNotifications();

    const byChannel: Record<string, number> = {
      default: 0,
      digest: 0,
      medicine: 0,
      food: 0
    };

    scheduled.forEach(notification => {
      const content = notification.content as any;
      const channelId = content.channelId || 'default';
      byChannel[channelId] = (byChannel[channelId] || 0) + 1;
    });

    return {
      total: scheduled.length,
      byChannel
    };
  }
}

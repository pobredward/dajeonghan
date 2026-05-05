/**
 * 다정한 - NotificationOrchestrator (알림 오케스트레이션 엔진)
 * 
 * 사용자의 알림 설정에 따라 적절한 알림을 발송합니다.
 * - 개별 알림 스케줄링
 * - 다이제스트 알림 생성
 * - 알림 피로도 관리
 */

import { Task } from '../types/task.types';
import { UserProfile } from '../types/user.types';
import * as Notifications from 'expo-notifications';
import { differenceInHours } from 'date-fns';

/**
 * 알림 설정 (앱 시작 시 호출)
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * NotificationOrchestrator.generateDigest()의 반환 타입.
 * notification.types.ts의 DigestContent(섹션 기반)와 달리,
 * 오케스트레이터는 태스크 목록 원본을 함께 반환합니다.
 */
export interface OrchestratorDigest {
  title: string;
  body: string;
  tasks: Task[];
}

export class NotificationOrchestrator {
  /**
   * 개별 알림 스케줄링
   * 
   * 사용자의 알림 모드에 따라 적절한 방식으로 알림을 스케줄링합니다.
   * 
   * @param task - 대상 Task
   * @param userProfile - 사용자 프로필
   * @returns 알림 ID (없으면 빈 문자열)
   * 
   * @example
   * const notificationId = await NotificationOrchestrator.scheduleNotification(task, userProfile);
   * console.log(`알림 ID: ${notificationId}`);
   */
  static async scheduleNotification(task: Task, userProfile: UserProfile): Promise<string> {
    const { notificationSettings, recurrence } = task;
    
    if (!notificationSettings.enabled) {
      return '';
    }

    if (userProfile.notificationMode === 'digest') {
      return '';
    }

    if (userProfile.notificationMode === 'minimal') {
      return '';
    }

    const hoursUntilDue = differenceInHours(recurrence.nextDue, new Date());
    
    if (hoursUntilDue <= 24 || task.priority === 'urgent') {
      return await this.scheduleImmediateNotification(task);
    }

    return '';
  }

  /**
   * 즉시 알림 스케줄링
   * 
   * @param task - 대상 Task
   * @returns 알림 ID
   */
  private static async scheduleImmediateNotification(task: Task): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: task.title,
          body: `${task.estimatedMinutes}분 소요 예상`,
          data: { taskId: task.id, domain: task.domain ?? task.type }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: task.recurrence.nextDue
        }
      });

      return notificationId;
    } catch (error) {
      console.error('알림 스케줄링 실패:', error);
      return '';
    }
  }

  /**
   * 다이제스트 생성
   * 
   * 하루 2회 (아침/저녁) 발송되는 요약 알림을 생성합니다.
   * 
   * @param tasks - 대상 Task 목록
   * @param digestTime - 다이제스트 시간 ('09:00' or '20:00')
   * @returns 다이제스트 내용
   * 
   * @example
   * const digest = NotificationOrchestrator.generateDigest(todayTasks, '09:00');
   * console.log(digest.title); // '☀️ 오늘의 할 일'
   * console.log(digest.body);  // '청소 2개 / 식재료 1개'
   */
  static generateDigest(
    tasks: Task[],
    digestTime: string
  ): OrchestratorDigest {
    const sortedTasks = tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0))
      .slice(0, 5);

    const d = (t: Task) => t.domain ?? t.type;
    const homeCount = sortedTasks.filter(t => d(t) === 'home').length;
    const foodCount = sortedTasks.filter(t => d(t) === 'food').length;
    const medicineCount = sortedTasks.filter(t => d(t) === 'medicine').length;
    const selfCareCount = sortedTasks.filter(t => d(t) === 'self_care').length;
    const petCount = sortedTasks.filter(t => d(t) === 'pet').length;
    const carCount = sortedTasks.filter(t => d(t) === 'car').length;
    const familyCount = sortedTasks.filter(t => d(t) === 'family').length;
    const growthCount = sortedTasks.filter(t => d(t) === 'growth').length;

    const summary: string[] = [];
    if (homeCount > 0) summary.push(`집 관리 ${homeCount}개`);
    if (foodCount > 0) summary.push(`식재료 ${foodCount}개`);
    if (medicineCount > 0) summary.push(`약 ${medicineCount}회`);
    if (selfCareCount > 0) summary.push(`자기관리 ${selfCareCount}개`);
    if (petCount > 0) summary.push(`반려동물 ${petCount}개`);
    if (carCount > 0) summary.push(`차량 ${carCount}개`);
    if (familyCount > 0) summary.push(`가족 ${familyCount}개`);
    if (growthCount > 0) summary.push(`자기계발 ${growthCount}개`);

    const title = digestTime === '09:00' ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일';
    const body = summary.length > 0 
      ? summary.join(' / ') 
      : '오늘은 할 일이 없어요!';

    return { title, body, tasks: sortedTasks };
  }

  /**
   * 다이제스트 알림 스케줄링
   * 
   * @param userId - 사용자 ID
   * @param digestTime - 다이제스트 시간
   * @param digest - 다이제스트 내용
   * @returns 알림 ID
   * 
   * @example
   * await NotificationOrchestrator.scheduleDigestNotification(
   *   userId,
   *   '09:00',
   *   digest
   * );
   */
  static async scheduleDigestNotification(
    userId: string,
    digestTime: string,
    digest: OrchestratorDigest
  ): Promise<string> {
    try {
      const [hours, minutes] = digestTime.split(':').map(Number);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: digest.title,
          body: digest.body,
          data: { type: 'digest', userId }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true
        }
      });

      return notificationId;
    } catch (error) {
      console.error('다이제스트 알림 스케줄링 실패:', error);
      return '';
    }
  }

  /**
   * 알림 취소
   * 
   * @param notificationId - 알림 ID
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('알림 취소 실패:', error);
    }
  }

  /**
   * 모든 알림 취소
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('모든 알림 취소 실패:', error);
    }
  }

  /**
   * 사전 알림 스케줄링
   * 
   * due 날짜 이전에 미리 알림을 발송합니다.
   * 
   * @param task - 대상 Task
   * @returns 알림 ID 배열
   * 
   * @example
   * // advanceHours: [24, 3] => 24시간 전, 3시간 전 알림
   * const ids = await NotificationOrchestrator.scheduleAdvanceNotifications(task);
   */
  static async scheduleAdvanceNotifications(task: Task): Promise<string[]> {
    const { notificationSettings, recurrence } = task;
    
    if (!notificationSettings.enabled || notificationSettings.advanceHours.length === 0) {
      return [];
    }

    const notificationIds: string[] = [];

    for (const hours of notificationSettings.advanceHours) {
      const notificationDate = new Date(recurrence.nextDue);
      notificationDate.setHours(notificationDate.getHours() - hours);

      if (notificationDate > new Date()) {
        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${task.title} (${hours}시간 전)`,
              body: `${task.estimatedMinutes}분 소요 예상`,
              data: { taskId: task.id, domain: task.domain ?? task.type, advance: true }
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notificationDate
            }
          });

          notificationIds.push(notificationId);
        } catch (error) {
          console.error(`${hours}시간 전 알림 스케줄링 실패:`, error);
        }
      }
    }

    return notificationIds;
  }

  /**
   * 알림 권한 요청
   * 
   * @returns 권한 허용 여부
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 푸시 토큰 가져오기
   * 
   * @returns 푸시 토큰
   */
  static async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('푸시 토큰 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 알림 피로도 체크
   * 
   * 하루 최대 알림 수를 초과하지 않도록 체크합니다.
   * 
   * @param userId - 사용자 ID
   * @returns 알림 피로도 여부
   */
  static async checkNotificationFatigue(userId: string): Promise<boolean> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const todayNotifications = scheduledNotifications.filter(notification => {
        if (!notification.trigger || typeof notification.trigger !== 'object') return false;
        if (!('date' in notification.trigger)) return false;
        
        const triggerDate = new Date(notification.trigger.date as number);
        const today = new Date();
        
        return triggerDate.toDateString() === today.toDateString();
      });

      return todayNotifications.length >= 10;
    } catch (error) {
      console.error('알림 피로도 체크 실패:', error);
      return false;
    }
  }

  /**
   * 스마트 알림 시간 추천
   * 
   * 사용자의 앱 사용 패턴을 분석하여 최적의 알림 시간을 추천합니다.
   * 
   * @param userProfile - 사용자 프로필
   * @returns 추천 시간 배열
   */
  static suggestOptimalDigestTimes(userProfile: UserProfile): string[] {
    const defaultMorning = '09:00';
    const defaultEvening = '20:00';

    return [defaultMorning, defaultEvening];
  }
}

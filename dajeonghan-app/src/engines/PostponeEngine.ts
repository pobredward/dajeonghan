/**
 * 다정한 - PostponeEngine (미루기 엔진)
 * 
 * 사용자의 미루기 패턴을 학습하여 최적의 날짜를 추천합니다.
 * - 주말/평일 선호 패턴 감지
 * - 미루기 횟수 체크 및 주기 재조정 제안
 * - 컨디션 기반 스마트 미루기
 */

import { Task } from '../types/task.types';
import { UserProfile } from '../types/user.types';
import { addDays, getDay, setHours, setMinutes } from 'date-fns';

export type PostponeReason = 'tired' | 'busy' | 'later' | 'custom';

export class PostponeEngine {
  /**
   * 사용자 패턴 기반 최적 날짜 추천
   * 
   * 사용자의 완료 이력을 분석하여 완료 가능성이 높은 날짜를 추천합니다.
   * 
   * @param task - 대상 Task
   * @param userProfile - 사용자 프로필
   * @param baseDate - 기준 날짜 (기본값: 현재)
   * @returns 추천 날짜
   * 
   * @example
   * const suggestedDate = PostponeEngine.suggestNextDate(task, userProfile);
   * console.log(`추천 날짜: ${suggestedDate}`);
   */
  static suggestNextDate(
    task: Task, 
    userProfile: UserProfile,
    baseDate: Date = new Date()
  ): Date {
    let suggestedDate = addDays(baseDate, 2);

    const weekendPreference = this.detectWeekendPreference(task);
    if (weekendPreference && getDay(suggestedDate) >= 1 && getDay(suggestedDate) <= 5) {
      const daysUntilSaturday = (6 - getDay(suggestedDate) + 7) % 7;
      suggestedDate = addDays(suggestedDate, daysUntilSaturday || 7);
    }

    suggestedDate = setHours(setMinutes(suggestedDate, 0), 20);

    return suggestedDate;
  }

  /**
   * 주말 선호 패턴 감지
   * 
   * 완료 이력에서 주말 완료 비율을 계산합니다.
   * 
   * @param task - 대상 Task
   * @returns 주말 선호 여부
   * 
   * @example
   * if (PostponeEngine.detectWeekendPreference(task)) {
   *   console.log('이 작업은 주말에 하시는 경향이 있어요');
   * }
   */
  static detectWeekendPreference(task: Task): boolean {
    const history = task.completionHistory.filter(h => !h.postponed);
    if (history.length < 3) return false;

    const weekendCompletions = history.filter(h => {
      const day = getDay(h.date);
      return day === 0 || day === 6;
    });

    return (weekendCompletions.length / history.length) > 0.6;
  }

  /**
   * 평일 선호 시간대 감지
   * 
   * @param task - 대상 Task
   * @returns 선호 시간대 (0~23)
   */
  static detectPreferredTimeOfDay(task: Task): number | null {
    const history = task.completionHistory.filter(h => !h.postponed);
    if (history.length < 3) return null;

    const hours = history.map(h => h.date.getHours());
    const hourCounts: Record<number, number> = {};

    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a);

    if (sortedHours.length === 0) return null;

    const [mostCommonHour, count] = sortedHours[0];
    
    if (count / history.length > 0.4) {
      return parseInt(mostCommonHour);
    }

    return null;
  }

  /**
   * 미루기 횟수 체크 및 주기 재조정 제안
   * 
   * 최근 이력에서 미루기가 빈번하면 주기 변경을 제안합니다.
   * 
   * @param task - 대상 Task
   * @returns 주기 변경 제안
   * 
   * @example
   * const pattern = PostponeEngine.checkPostponePattern(task);
   * if (pattern.shouldSuggestRecurrenceChange) {
   *   alert(pattern.message);
   * }
   */
  static checkPostponePattern(task: Task): {
    shouldSuggestRecurrenceChange: boolean;
    message: string;
    suggestedAction?: 'increase_interval' | 'change_to_flexible';
  } {
    const recentHistory = task.completionHistory.slice(-5);
    const postponeCount = recentHistory.filter(h => h.postponed).length;

    if (postponeCount >= 3) {
      const consecutivePostpones = this.countConsecutivePostpones(task);
      
      if (consecutivePostpones >= 3) {
        return {
          shouldSuggestRecurrenceChange: true,
          message: '연속으로 미루고 계시네요. 주기를 늘려보는 건 어떨까요?',
          suggestedAction: 'increase_interval'
        };
      }

      return {
        shouldSuggestRecurrenceChange: true,
        message: '자주 미루고 계시네요. 유연 주기로 변경해볼까요?',
        suggestedAction: 'change_to_flexible'
      };
    }

    return {
      shouldSuggestRecurrenceChange: false,
      message: ''
    };
  }

  /**
   * 연속 미루기 횟수 계산
   * 
   * @param task - 대상 Task
   * @returns 연속 미루기 횟수
   */
  private static countConsecutivePostpones(task: Task): number {
    let count = 0;
    const history = [...task.completionHistory].reverse();

    for (const record of history) {
      if (record.postponed) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  /**
   * 스마트 미루기 (컨디션 기반)
   * 
   * 미루기 사유에 따라 적절한 날짜를 계산합니다.
   * 
   * @param task - 대상 Task
   * @param reason - 미루기 사유
   * @returns 추천 날짜
   * 
   * @example
   * const nextDate = PostponeEngine.smartPostpone(task, 'tired');
   * // 피곤하면 2일 후로 연기
   */
  static smartPostpone(
    task: Task,
    reason: PostponeReason = 'later'
  ): Date {
    const now = new Date();
    let postponeDays = 1;

    switch (reason) {
      case 'tired':
        postponeDays = 2;
        break;
      case 'busy':
        postponeDays = 1;
        break;
      case 'later':
        postponeDays = 1;
        break;
      case 'custom':
        postponeDays = 3;
        break;
    }

    return addDays(now, postponeDays);
  }

  /**
   * 미루기 패널티 계산
   * 
   * 미루기가 잦을수록 우선순위 점수에 가산점을 부여합니다.
   * 
   * @param task - 대상 Task
   * @returns 패널티 점수 (0~10)
   */
  static calculatePostponePenalty(task: Task): number {
    const recentHistory = task.completionHistory.slice(-10);
    const postponeCount = recentHistory.filter(h => h.postponed).length;
    const consecutivePostpones = this.countConsecutivePostpones(task);

    const basePenalty = Math.min(postponeCount * 0.5, 5);
    const consecutivePenalty = Math.min(consecutivePostpones * 1.5, 5);

    return Math.min(basePenalty + consecutivePenalty, 10);
  }

  /**
   * 미루기 통계
   * 
   * @param task - 대상 Task
   * @returns 미루기 통계
   */
  static getPostponeStats(task: Task): {
    totalPostpones: number;
    recentPostpones: number;
    consecutivePostpones: number;
    postponeRate: number;
  } {
    const totalPostpones = task.completionHistory.filter(h => h.postponed).length;
    const recentHistory = task.completionHistory.slice(-10);
    const recentPostpones = recentHistory.filter(h => h.postponed).length;
    const consecutivePostpones = this.countConsecutivePostpones(task);
    const postponeRate = task.completionHistory.length > 0
      ? totalPostpones / task.completionHistory.length
      : 0;

    return {
      totalPostpones,
      recentPostpones,
      consecutivePostpones,
      postponeRate
    };
  }
}

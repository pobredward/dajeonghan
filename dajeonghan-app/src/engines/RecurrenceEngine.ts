/**
 * 다정한 - RecurrenceEngine (주기 계산 엔진)
 * 
 * Task의 주기를 자동으로 계산하고 개인화합니다.
 * - 완료 시 다음 due 날짜 계산
 * - 완료 이력 기반 주기 조정
 * - 경과 비율 계산 (더러움 점수)
 */

import { Task, CompletionHistory } from '../types/task.types';
import { addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';

export class RecurrenceEngine {
  /**
   * 완료 시 다음 due 날짜 계산
   * 
   * @param task - 대상 Task
   * @param completedAt - 완료 시각 (기본값: 현재)
   * @returns 다음 예정일
   * 
   * @example
   * const nextDue = RecurrenceEngine.calculateNextDue(task, new Date());
   */
  static calculateNextDue(task: Task, completedAt: Date = new Date()): Date {
    const { recurrence } = task;
    const { interval, unit } = recurrence;

    let nextDue: Date;

    switch (unit) {
      case 'day':
        nextDue = addDays(completedAt, interval);
        break;
      case 'week':
        nextDue = addWeeks(completedAt, interval);
        break;
      case 'month':
        nextDue = addMonths(completedAt, interval);
        break;
      default:
        nextDue = addDays(completedAt, interval);
    }

    return nextDue;
  }

  /**
   * 완료 이력 기반 주기 개인화
   * 
   * 사용자가 실제로 완료하는 평균 간격을 계산하여
   * 템플릿 주기를 개인화합니다.
   * 
   * @param task - 대상 Task
   * @returns 개인화된 주기 (null이면 조정 불필요)
   * 
   * @example
   * const adjustedInterval = RecurrenceEngine.adjustRecurrenceByHistory(task);
   * if (adjustedInterval) {
   *   task.recurrence.interval = adjustedInterval;
   * }
   */
  static adjustRecurrenceByHistory(task: Task): number | null {
    const history = task.completionHistory.filter(h => !h.postponed);
    
    if (history.length < 3) {
      return null;
    }

    const recentHistory = history.slice(-5);
    const intervals: number[] = [];

    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i - 1].date;
      const curr = recentHistory[i].date;
      const interval = differenceInDays(curr, prev);
      intervals.push(interval);
    }

    const avgInterval = Math.round(
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length
    );

    return avgInterval;
  }

  /**
   * 주기 업데이트 제안
   * 
   * 현재 주기와 실제 완료 패턴을 비교하여
   * 주기 변경을 제안할지 결정합니다.
   * 
   * @param task - 대상 Task
   * @returns 업데이트 제안 정보
   * 
   * @example
   * const suggestion = RecurrenceEngine.suggestRecurrenceUpdate(task);
   * if (suggestion.shouldUpdate) {
   *   console.log(suggestion.reason);
   *   task.recurrence.interval = suggestion.suggestedInterval;
   * }
   */
  static suggestRecurrenceUpdate(task: Task): {
    shouldUpdate: boolean;
    suggestedInterval: number;
    reason: string;
  } {
    const newInterval = this.adjustRecurrenceByHistory(task);

    if (!newInterval) {
      return {
        shouldUpdate: false,
        suggestedInterval: task.recurrence.interval,
        reason: '데이터 부족'
      };
    }

    const currentInterval = task.recurrence.interval;
    const diff = Math.abs(newInterval - currentInterval);
    const diffPercent = (diff / currentInterval) * 100;

    if (diffPercent >= 20) {
      return {
        shouldUpdate: true,
        suggestedInterval: newInterval,
        reason: `평균 ${newInterval}일 주기로 완료하고 계세요`
      };
    }

    return {
      shouldUpdate: false,
      suggestedInterval: currentInterval,
      reason: '현재 주기가 적절합니다'
    };
  }

  /**
   * 경과 비율 계산
   * 
   * 마지막 완료부터 현재까지 경과한 시간의 비율을 계산합니다.
   * 청소 모듈의 "더러움 점수" 등에 활용됩니다.
   * 
   * @param task - 대상 Task
   * @returns 경과 비율 (0~2, 200%까지)
   * 
   * @example
   * const ratio = RecurrenceEngine.calculateElapsedRatio(task);
   * const dirtyScore = ratio * 50; // 0~100 점수
   */
  static calculateElapsedRatio(task: Task): number {
    const now = new Date();
    const lastCompleted = task.recurrence.lastCompleted || task.createdAt;
    const nextDue = task.recurrence.nextDue;

    const totalDuration = differenceInDays(nextDue, lastCompleted);
    const elapsed = differenceInDays(now, lastCompleted);

    if (totalDuration === 0) return 0;

    return Math.min(elapsed / totalDuration, 2);
  }

  /**
   * 더러움 점수 계산 (청소 모듈용)
   * 
   * @param task - 청소 Task
   * @returns 0~100 점수
   */
  static calculateDirtyScore(task: Task): number {
    const elapsedRatio = this.calculateElapsedRatio(task);
    return Math.round(Math.min(elapsedRatio * 50, 100));
  }

  /**
   * 주기 타입 변경 제안
   * 
   * 고정 주기 vs 유연 주기 전환을 제안합니다.
   * 
   * @param task - 대상 Task
   * @returns 변경 제안
   */
  static suggestRecurrenceTypeChange(task: Task): {
    shouldChange: boolean;
    suggestedType: 'fixed' | 'flexible';
    reason: string;
  } {
    if (task.completionHistory.length < 5) {
      return {
        shouldChange: false,
        suggestedType: task.recurrence.type,
        reason: '데이터 부족'
      };
    }

    const intervals = task.completionHistory
      .filter(h => !h.postponed && h.actualInterval)
      .map(h => h.actualInterval!);

    if (intervals.length < 3) {
      return {
        shouldChange: false,
        suggestedType: task.recurrence.type,
        reason: '간격 데이터 부족'
      };
    }

    const avg = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    if (task.recurrence.type === 'fixed' && coefficientOfVariation > 0.3) {
      return {
        shouldChange: true,
        suggestedType: 'flexible',
        reason: '완료 간격이 불규칙하여 유연 주기가 더 적합합니다'
      };
    }

    if (task.recurrence.type === 'flexible' && coefficientOfVariation < 0.15) {
      return {
        shouldChange: true,
        suggestedType: 'fixed',
        reason: '완료 간격이 일정하여 고정 주기로 전환 가능합니다'
      };
    }

    return {
      shouldChange: false,
      suggestedType: task.recurrence.type,
      reason: '현재 주기 타입이 적절합니다'
    };
  }
}

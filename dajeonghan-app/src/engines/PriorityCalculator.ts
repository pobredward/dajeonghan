/**
 * 다정한 - PriorityCalculator (우선순위 계산 엔진)
 * 
 * Task의 긴급도와 중요도를 계산하여 오늘 할 일을 추천합니다.
 * - 기한 긴급도, 경과 비율, 소요 시간 등을 종합
 * - 우선순위 점수(urgencyScore) 계산
 * - 10분 코스 vs 여유 코스 분류
 */

import { Task } from '../types/task.types';
import { RecurrenceEngine } from './RecurrenceEngine';
import { PostponeEngine } from './PostponeEngine';
import { differenceInHours, differenceInDays } from 'date-fns';

export interface PrioritizedTask extends Task {
  urgencyScore: number;
  reason: string;
}

export class PriorityCalculator {
  /**
   * 오늘 할 일 계산
   * 
   * 모든 Task를 urgencyScore 순으로 정렬하여 상위 N개를 반환합니다.
   * 
   * @param tasks - 전체 Task 목록
   * @param topN - 반환할 개수 (기본값: 5)
   * @returns 우선순위가 높은 Task 배열
   * 
   * @example
   * const dailyTasks = PriorityCalculator.calculateDailyTasks(allTasks, 5);
   * dailyTasks.forEach(task => {
   *   console.log(`${task.title} (점수: ${task.urgencyScore}, 이유: ${task.reason})`);
   * });
   */
  static calculateDailyTasks(
    tasks: Task[],
    topN: number = 5
  ): PrioritizedTask[] {
    const now = new Date();

    const scored = tasks.map(task => {
      const score = this.calculateUrgencyScore(task, now);
      const reason = this.generateReason(task, now);

      return {
        ...task,
        urgencyScore: score,
        reason
      };
    });

    scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return scored.slice(0, topN);
  }

  /**
   * 긴급도 점수 계산
   * 
   * 점수 = (기한 긴급도 × 3) + (경과 비율 × 2) + (소요시간 역수) + (미루기 패널티)
   * 
   * @param task - 대상 Task
   * @param now - 현재 시각
   * @returns 긴급도 점수 (0~100+)
   * 
   * @example
   * const score = PriorityCalculator.calculateUrgencyScore(task, new Date());
   * console.log(`긴급도: ${score}점`);
   */
  static calculateUrgencyScore(task: Task, now: Date = new Date()): number {
    const hoursUntilDue = differenceInHours(task.recurrence.nextDue, now);
    const elapsedRatio = RecurrenceEngine.calculateElapsedRatio(task);

    // 1. 기한 긴급도 (0~10)
    let dueUrgency = 0;
    if (hoursUntilDue < 0) {
      const daysOverdue = Math.abs(differenceInDays(task.recurrence.nextDue, now));
      dueUrgency = 10 + Math.min(daysOverdue, 5);
    } else if (hoursUntilDue < 24) {
      dueUrgency = 8;
    } else if (hoursUntilDue < 72) {
      dueUrgency = 5;
    } else if (hoursUntilDue < 168) {
      dueUrgency = 3;
    } else {
      dueUrgency = 1;
    }

    // 2. 경과 비율 (0~10)
    const elapsedScore = Math.min(elapsedRatio * 10, 10);

    // 3. 소요시간 역수 (짧을수록 높은 점수)
    const timeScore = task.estimatedMinutes <= 10 ? 3 : 
                     task.estimatedMinutes <= 30 ? 2 : 1;

    // 4. 우선순위 가중치
    const priorityWeight = {
      urgent: 2,
      high: 1.5,
      medium: 1,
      low: 0.5
    }[task.priority];

    // 5. 미루기 패널티
    const postponePenalty = PostponeEngine.calculatePostponePenalty(task);

    const baseScore = (dueUrgency * 3 + elapsedScore * 2 + timeScore);
    const totalScore = baseScore * priorityWeight + postponePenalty;

    return Math.round(totalScore);
  }

  /**
   * 이유 생성
   * 
   * 왜 이 Task가 추천되었는지 이유를 생성합니다.
   * 
   * @param task - 대상 Task
   * @param now - 현재 시각
   * @returns 추천 이유
   */
  static generateReason(task: Task, now: Date = new Date()): string {
    const hoursUntilDue = differenceInHours(task.recurrence.nextDue, now);

    if (hoursUntilDue < 0) {
      const daysOverdue = Math.abs(differenceInDays(task.recurrence.nextDue, now));
      if (daysOverdue === 0) return '오늘까지였어요';
      return `${daysOverdue}일 지남`;
    } else if (hoursUntilDue < 24) {
      return '오늘까지';
    } else if (hoursUntilDue < 72) {
      return '곧 만료';
    }

    const elapsedRatio = RecurrenceEngine.calculateElapsedRatio(task);
    if (elapsedRatio > 1.5) {
      return '오래됨';
    }

    if (task.estimatedMinutes <= 10) {
      return '빠름';
    }

    const stats = PostponeEngine.getPostponeStats(task);
    if (stats.consecutivePostpones >= 2) {
      return '자주 미룸';
    }

    return '추천';
  }

  /**
   * 시간대별 분류
   * 
   * 10분 코스 vs 여유 코스로 분류합니다.
   * 
   * @param tasks - 우선순위 Task 목록
   * @returns 시간대별 분류
   * 
   * @example
   * const categorized = PriorityCalculator.categorizeByTime(prioritizedTasks);
   * console.log(`빠른 작업: ${categorized.quickTasks.length}개`);
   * console.log(`여유 작업: ${categorized.leisureTasks.length}개`);
   */
  static categorizeByTime(
    tasks: PrioritizedTask[]
  ): {
    quickTasks: PrioritizedTask[];
    leisureTasks: PrioritizedTask[];
  } {
    return {
      quickTasks: tasks.filter(t => t.estimatedMinutes <= 10),
      leisureTasks: tasks.filter(t => t.estimatedMinutes > 10)
    };
  }

  /**
   * 모듈별 분류
   * 
   * @param tasks - 우선순위 Task 목록
   * @returns 모듈별 분류
   */
  static categorizeByModule(tasks: PrioritizedTask[]): {
    cleaning: PrioritizedTask[];
    food: PrioritizedTask[];
    medicine: PrioritizedTask[];
    selfCare: PrioritizedTask[];
    selfDevelopment: PrioritizedTask[];
  } {
    return {
      cleaning: tasks.filter(t => t.type === 'cleaning'),
      food: tasks.filter(t => t.type === 'food'),
      medicine: tasks.filter(t => t.type === 'medicine'),
      selfCare: tasks.filter(t => t.type === 'self_care'),
      selfDevelopment: tasks.filter(t => t.type === 'self_development')
    };
  }

  /**
   * 주간 계획 생성
   * 
   * 향후 7일간의 할 일을 날짜별로 분류합니다.
   * 
   * @param tasks - 전체 Task 목록
   * @returns 날짜별 Task 목록
   */
  static generateWeeklyPlan(tasks: Task[]): Map<string, PrioritizedTask[]> {
    const now = new Date();
    const weeklyPlan = new Map<string, PrioritizedTask[]>();

    const scored = tasks.map(task => {
      const score = this.calculateUrgencyScore(task, now);
      const reason = this.generateReason(task, now);

      return {
        ...task,
        urgencyScore: score,
        reason
      };
    });

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];

      const dayTasks = scored.filter(task => {
        const taskDate = new Date(task.recurrence.nextDue);
        return taskDate.toISOString().split('T')[0] === dateKey;
      }).sort((a, b) => b.urgencyScore - a.urgencyScore);

      weeklyPlan.set(dateKey, dayTasks);
    }

    return weeklyPlan;
  }

  /**
   * 총 소요 시간 계산
   * 
   * @param tasks - Task 목록
   * @returns 총 소요 시간 (분)
   */
  static calculateTotalEstimatedMinutes(tasks: Task[]): number {
    return tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  }

  /**
   * 실행 가능성 체크
   * 
   * 주어진 가용 시간 내에 완료 가능한 Task를 선택합니다.
   * 
   * @param tasks - 우선순위 Task 목록
   * @param availableMinutes - 가용 시간 (분)
   * @returns 실행 가능한 Task 목록
   * 
   * @example
   * const feasibleTasks = PriorityCalculator.selectFeasibleTasks(dailyTasks, 60);
   * console.log(`60분 내에 ${feasibleTasks.length}개 가능`);
   */
  static selectFeasibleTasks(
    tasks: PrioritizedTask[],
    availableMinutes: number
  ): PrioritizedTask[] {
    const selected: PrioritizedTask[] = [];
    let remainingMinutes = availableMinutes;

    for (const task of tasks) {
      if (task.estimatedMinutes <= remainingMinutes) {
        selected.push(task);
        remainingMinutes -= task.estimatedMinutes;
      }
    }

    return selected;
  }
}

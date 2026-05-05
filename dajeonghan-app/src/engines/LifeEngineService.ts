/**
 * 다정한 - LifeEngineService (통합 서비스)
 * 
 * 4대 엔진을 통합하여 Task 관리의 핵심 기능을 제공합니다.
 * - Task 완료 처리
 * - Task 미루기
 * - 오늘의 할 일 생성
 * - 주간 계획 생성
 */

import { Task, TaskLog } from '../types/task.types';
import { UserProfile } from '../types/user.types';
import { RecurrenceEngine } from './RecurrenceEngine';
import { PostponeEngine, PostponeReason } from './PostponeEngine';
import { PriorityCalculator, PrioritizedTask } from './PriorityCalculator';
import { NotificationOrchestrator } from './NotificationOrchestrator';
import { saveTask, saveTaskLog } from '../services/firestoreService';
import { v4 as uuidv4 } from 'uuid';

export interface CompleteTaskResult {
  updatedTask: Task;
  recurrenceSuggestion?: {
    shouldUpdate: boolean;
    suggestedInterval: number;
    reason: string;
  };
  taskLog: TaskLog;
}

export interface PostponeTaskResult {
  updatedTask: Task;
  postponePattern?: {
    shouldSuggestRecurrenceChange: boolean;
    message: string;
  };
  taskLog: TaskLog;
}

export interface DailyTasksResult {
  quickTasks: PrioritizedTask[];
  leisureTasks: PrioritizedTask[];
  allTasks: PrioritizedTask[];
  totalEstimatedMinutes: number;
}

export class LifeEngineService {
  /**
   * Task 완료 처리
   * 
   * Task를 완료 처리하고 다음 due 날짜를 계산합니다.
   * 필요시 주기 조정을 제안합니다.
   * 
   * @param task - 완료할 Task
   * @param userProfile - 사용자 프로필
   * @param completedAt - 완료 시각 (기본값: 현재)
   * @returns 완료 결과
   * 
   * @example
   * const result = await LifeEngineService.completeTask(task, userProfile);
   * console.log(result.recurrenceSuggestion?.reason);
   */
  static async completeTask(
    task: Task,
    userProfile: UserProfile,
    completedAt: Date = new Date()
  ): Promise<CompleteTaskResult> {
    const now = completedAt;

    const nextDue = RecurrenceEngine.calculateNextDue(task, now);

    const actualInterval = task.recurrence.lastCompleted
      ? Math.round((now.getTime() - task.recurrence.lastCompleted.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const newHistory = [
      ...task.completionHistory,
      {
        date: now,
        postponed: false,
        actualInterval
      }
    ];

    const tempTask = {
      ...task,
      completionHistory: newHistory
    };

    const recurrenceSuggestion = RecurrenceEngine.suggestRecurrenceUpdate(tempTask);

    const updatedTask: Task = {
      ...task,
      status: 'pending',
      recurrence: {
        ...task.recurrence,
        nextDue,
        lastCompleted: now,
        interval: recurrenceSuggestion.shouldUpdate 
          ? recurrenceSuggestion.suggestedInterval 
          : task.recurrence.interval
      },
      completionHistory: newHistory,
      updatedAt: now
    };

    await saveTask(updatedTask);

    await NotificationOrchestrator.scheduleNotification(updatedTask, userProfile);
    await NotificationOrchestrator.scheduleAdvanceNotifications(updatedTask);

    const taskLog: TaskLog = {
      id: uuidv4(),
      userId: task.userId,
      taskId: task.id,
      furnitureId: task.furnitureId,
      action: 'completed',
      timestamp: now,
      nextDue,
      createdAt: now,
      updatedAt: now
    };

    await saveTaskLog(taskLog);

    return {
      updatedTask,
      recurrenceSuggestion: recurrenceSuggestion.shouldUpdate ? recurrenceSuggestion : undefined,
      taskLog
    };
  }

  /**
   * Task 미루기
   * 
   * Task를 미루고 최적의 날짜를 추천합니다.
   * 미루기가 빈번하면 주기 변경을 제안합니다.
   * 
   * @param task - 미룰 Task
   * @param userProfile - 사용자 프로필
   * @param reason - 미루기 사유
   * @returns 미루기 결과
   * 
   * @example
   * const result = await LifeEngineService.postponeTask(task, userProfile, 'tired');
   * console.log(result.postponePattern?.message);
   */
  static async postponeTask(
    task: Task,
    userProfile: UserProfile,
    reason?: PostponeReason
  ): Promise<PostponeTaskResult> {
    const now = new Date();

    const suggestedDate = reason
      ? PostponeEngine.smartPostpone(task, reason)
      : PostponeEngine.suggestNextDate(task, userProfile);

    const newHistory = [
      ...task.completionHistory,
      {
        date: now,
        postponed: true
      }
    ];

    const tempTask = {
      ...task,
      completionHistory: newHistory
    };

    const postponePattern = PostponeEngine.checkPostponePattern(tempTask);

    const updatedTask: Task = {
      ...task,
      status: 'postponed',
      recurrence: {
        ...task.recurrence,
        nextDue: suggestedDate
      },
      completionHistory: newHistory,
      updatedAt: now
    };

    await saveTask(updatedTask);

    const taskLog: TaskLog = {
      id: uuidv4(),
      userId: task.userId,
      taskId: task.id,
      furnitureId: task.furnitureId,
      action: 'postponed',
      timestamp: now,
      nextDue: suggestedDate,
      note: reason,
      createdAt: now,
      updatedAt: now
    };

    await saveTaskLog(taskLog);

    return {
      updatedTask,
      postponePattern: postponePattern.shouldSuggestRecurrenceChange ? postponePattern : undefined,
      taskLog
    };
  }

  /**
   * 오늘의 할 일 생성
   * 
   * 우선순위를 계산하여 오늘 해야 할 Task를 추천합니다.
   * 10분 코스와 여유 코스로 분류합니다.
   * 
   * @param tasks - 전체 Task 목록
   * @param userProfile - 사용자 프로필
   * @param topN - 추천할 개수 (기본값: 10)
   * @returns 오늘의 할 일
   * 
   * @example
   * const dailyTasks = await LifeEngineService.generateDailyTasks(allTasks, userProfile);
   * console.log(`빠른 작업: ${dailyTasks.quickTasks.length}개`);
   * console.log(`총 소요 시간: ${dailyTasks.totalEstimatedMinutes}분`);
   */
  static async generateDailyTasks(
    tasks: Task[],
    userProfile: UserProfile,
    topN: number = 10
  ): Promise<DailyTasksResult> {
    const prioritized = PriorityCalculator.calculateDailyTasks(tasks, topN);
    const categorized = PriorityCalculator.categorizeByTime(prioritized);
    const totalMinutes = PriorityCalculator.calculateTotalEstimatedMinutes(prioritized);

    return {
      quickTasks: categorized.quickTasks.slice(0, 3),
      leisureTasks: categorized.leisureTasks.slice(0, 5),
      allTasks: prioritized,
      totalEstimatedMinutes: totalMinutes
    };
  }

  /**
   * 주간 계획 생성
   * 
   * 향후 7일간의 할 일을 날짜별로 분류합니다.
   * 
   * @param tasks - 전체 Task 목록
   * @returns 날짜별 Task 목록
   * 
   * @example
   * const weeklyPlan = await LifeEngineService.generateWeeklyPlan(allTasks);
   * weeklyPlan.forEach((tasks, date) => {
   *   console.log(`${date}: ${tasks.length}개`);
   * });
   */
  static async generateWeeklyPlan(tasks: Task[]): Promise<Map<string, PrioritizedTask[]>> {
    return PriorityCalculator.generateWeeklyPlan(tasks);
  }

  /**
   * 다이제스트 알림 생성 및 스케줄링
   * 
   * @param userId - 사용자 ID
   * @param tasks - 오늘의 Task 목록
   * @param userProfile - 사용자 프로필
   * @returns 알림 ID 배열
   */
  static async scheduleDigestNotifications(
    userId: string,
    tasks: Task[],
    userProfile: UserProfile
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const digestTime of userProfile.digestTimes) {
      const digest = NotificationOrchestrator.generateDigest(tasks, digestTime);
      const notificationId = await NotificationOrchestrator.scheduleDigestNotification(
        userId,
        digestTime,
        digest
      );

      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }

    return notificationIds;
  }

  /**
   * Task 건너뛰기
   * 
   * Task를 이번 주기에서 건너뛰고 다음 주기로 넘깁니다.
   * 
   * @param task - 건너뛸 Task
   * @returns 업데이트된 Task
   */
  static async skipTask(task: Task): Promise<Task> {
    const now = new Date();
    const nextDue = RecurrenceEngine.calculateNextDue(task, now);

    const updatedTask: Task = {
      ...task,
      status: 'pending',
      recurrence: {
        ...task.recurrence,
        nextDue
      },
      updatedAt: now
    };

    await saveTask(updatedTask);

    const taskLog: TaskLog = {
      id: uuidv4(),
      userId: task.userId,
      taskId: task.id,
      furnitureId: task.furnitureId,
      action: 'skipped',
      timestamp: now,
      nextDue,
      createdAt: now,
      updatedAt: now
    };

    await saveTaskLog(taskLog);

    return updatedTask;
  }

  /**
   * 실행 가능한 Task 선택
   * 
   * 주어진 가용 시간 내에 완료 가능한 Task를 선택합니다.
   * 
   * @param tasks - Task 목록
   * @param availableMinutes - 가용 시간 (분)
   * @returns 실행 가능한 Task 목록
   */
  static async selectFeasibleTasks(
    tasks: Task[],
    availableMinutes: number
  ): Promise<PrioritizedTask[]> {
    const prioritized = PriorityCalculator.calculateDailyTasks(tasks, 20);
    return PriorityCalculator.selectFeasibleTasks(prioritized, availableMinutes);
  }

  /**
   * Task 통계
   * 
   * @param tasks - Task 목록
   * @returns Task 통계
   */
  static getTaskStats(tasks: Task[]): {
    total: number;
    pending: number;
    completed: number;
    postponed: number;
    overdue: number;
    byModule: Record<string, number>;
  } {
    const now = new Date();

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      postponed: tasks.filter(t => t.status === 'postponed').length,
      overdue: tasks.filter(t => t.status === 'pending' && t.recurrence.nextDue < now).length,
      byModule: {
        home: tasks.filter(t => (t.domain ?? t.type) === 'home').length,
        food: tasks.filter(t => (t.domain ?? t.type) === 'food').length,
        medicine: tasks.filter(t => (t.domain ?? t.type) === 'medicine').length,
        self_care: tasks.filter(t => (t.domain ?? t.type) === 'self_care').length,
        growth: tasks.filter(t => (t.domain ?? t.type) === 'growth').length,
        pet: tasks.filter(t => (t.domain ?? t.type) === 'pet').length,
        car: tasks.filter(t => (t.domain ?? t.type) === 'car').length,
        family: tasks.filter(t => (t.domain ?? t.type) === 'family').length,
      }
    };
  }
}

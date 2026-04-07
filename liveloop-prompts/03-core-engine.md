# 03. 공통 엔진 구현

## 목표
리브루프의 핵심 차별화 요소인 공통 엔진을 구현합니다. 모든 모듈이 공유하는 주기·미루기·알림·우선순위 로직입니다.

## 1. RecurrenceEngine (주기 계산 엔진)

`src/core/engines/RecurrenceEngine.ts`:

```typescript
import { Task, CompletionHistory } from '@/types/task.types';
import { addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';

export class RecurrenceEngine {
  /**
   * 완료 시 다음 due 날짜 계산
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
   * 3회 이상 완료 이력이 있으면 평균 간격으로 조정
   */
  static adjustRecurrenceByHistory(task: Task): number | null {
    const history = task.completionHistory.filter(h => !h.postponed);
    
    if (history.length < 3) {
      return null; // 데이터 부족, 템플릿 주기 유지
    }

    // 최근 3~5회 평균 간격 계산
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

    // 20% 이상 차이 나면 업데이트 제안
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
   * 경과 비율 계산 (더러움 점수 등에 사용)
   */
  static calculateElapsedRatio(task: Task): number {
    const now = new Date();
    const lastCompleted = task.recurrence.lastCompleted || task.createdAt;
    const nextDue = task.recurrence.nextDue;

    const totalDuration = differenceInDays(nextDue, lastCompleted);
    const elapsed = differenceInDays(now, lastCompleted);

    if (totalDuration === 0) return 0;

    return Math.min(elapsed / totalDuration, 2); // 최대 200%
  }
}
```

## 2. PostponeEngine (미루기 엔진)

`src/core/engines/PostponeEngine.ts`:

```typescript
import { Task } from '@/types/task.types';
import { UserProfile } from '@/types/user.types';
import { addDays, getDay, setHours, setMinutes } from 'date-fns';

export class PostponeEngine {
  /**
   * 사용자 패턴 기반 최적 날짜 추천
   */
  static suggestNextDate(
    task: Task, 
    userProfile: UserProfile,
    baseDate: Date = new Date()
  ): Date {
    // 1. 기본: 1~3일 후
    let suggestedDate = addDays(baseDate, 2);

    // 2. 주말 선호 패턴 감지
    const weekendPreference = this.detectWeekendPreference(task);
    if (weekendPreference && getDay(suggestedDate) >= 1 && getDay(suggestedDate) <= 5) {
      // 평일이면 다음 주말로
      const daysUntilSaturday = (6 - getDay(suggestedDate) + 7) % 7;
      suggestedDate = addDays(suggestedDate, daysUntilSaturday);
    }

    // 3. 시간대 조정 (저녁 시간대 선호)
    suggestedDate = setHours(setMinutes(suggestedDate, 0), 20);

    return suggestedDate;
  }

  /**
   * 주말 선호 패턴 감지
   */
  private static detectWeekendPreference(task: Task): boolean {
    const history = task.completionHistory.filter(h => !h.postponed);
    if (history.length < 3) return false;

    const weekendCompletions = history.filter(h => {
      const day = getDay(h.date);
      return day === 0 || day === 6; // 일요일 또는 토요일
    });

    return (weekendCompletions.length / history.length) > 0.6; // 60% 이상
  }

  /**
   * 미루기 횟수 체크 및 주기 재조정 제안
   */
  static checkPostponePattern(task: Task): {
    shouldSuggestRecurrenceChange: boolean;
    message: string;
  } {
    const recentHistory = task.completionHistory.slice(-5);
    const postponeCount = recentHistory.filter(h => h.postponed).length;

    if (postponeCount >= 3) {
      return {
        shouldSuggestRecurrenceChange: true,
        message: '자주 미루고 계시네요. 주기를 늘려볼까요?'
      };
    }

    return {
      shouldSuggestRecurrenceChange: false,
      message: ''
    };
  }

  /**
   * 스마트 미루기 (컨디션 기반)
   */
  static smartPostpone(
    task: Task,
    reason: 'tired' | 'busy' | 'later' = 'later'
  ): Date {
    const now = new Date();
    let postponeDays = 1;

    switch (reason) {
      case 'tired':
        postponeDays = 2; // 피곤하면 이틀 후
        break;
      case 'busy':
        postponeDays = 1; // 바쁘면 하루 후
        break;
      case 'later':
        postponeDays = 1; // 기본 하루 후
        break;
    }

    return addDays(now, postponeDays);
  }
}
```

## 3. PriorityCalculator (우선순위 계산)

`src/core/engines/PriorityCalculator.ts`:

```typescript
import { Task } from '@/types/task.types';
import { RecurrenceEngine } from './RecurrenceEngine';
import { differenceInHours } from 'date-fns';

export interface PrioritizedTask extends Task {
  urgencyScore: number;
  reason: string;
}

export class PriorityCalculator {
  /**
   * 오늘 할 일 계산 (상위 N개)
   */
  static calculateDailyTasks(
    tasks: Task[],
    topN: number = 5
  ): PrioritizedTask[] {
    const now = new Date();

    // 1. 각 테스크의 urgencyScore 계산
    const scored = tasks.map(task => {
      const score = this.calculateUrgencyScore(task, now);
      const reason = this.generateReason(task, now);

      return {
        ...task,
        urgencyScore: score,
        reason
      };
    });

    // 2. 점수 순으로 정렬
    scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // 3. 상위 N개 반환
    return scored.slice(0, topN);
  }

  /**
   * 긴급도 점수 계산
   * 점수 = (기한 긴급도 × 3) + (경과 비율 × 2) + (소요시간 역수)
   */
  private static calculateUrgencyScore(task: Task, now: Date): number {
    const hoursUntilDue = differenceInHours(task.recurrence.nextDue, now);
    const elapsedRatio = RecurrenceEngine.calculateElapsedRatio(task);

    // 1. 기한 긴급도 (0~10)
    let dueUrgency = 0;
    if (hoursUntilDue < 0) {
      dueUrgency = 10; // 이미 지남
    } else if (hoursUntilDue < 24) {
      dueUrgency = 8; // 24시간 이내
    } else if (hoursUntilDue < 72) {
      dueUrgency = 5; // 3일 이내
    } else if (hoursUntilDue < 168) {
      dueUrgency = 3; // 1주 이내
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

    const totalScore = (dueUrgency * 3 + elapsedScore * 2 + timeScore) * priorityWeight;

    return totalScore;
  }

  /**
   * 이유 생성
   */
  private static generateReason(task: Task, now: Date): string {
    const hoursUntilDue = differenceInHours(task.recurrence.nextDue, now);

    if (hoursUntilDue < 0) {
      return '기한 지남';
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

    return '추천';
  }

  /**
   * 시간대별 추천 (10분 코스 vs 여유 코스)
   */
  static categorizeByTime(
    tasks: PrioritizedTask[]
  ): {
    quickTasks: PrioritizedTask[]; // 10분 이내
    leisureTasks: PrioritizedTask[]; // 10분 이상
  } {
    return {
      quickTasks: tasks.filter(t => t.estimatedMinutes <= 10),
      leisureTasks: tasks.filter(t => t.estimatedMinutes > 10)
    };
  }
}
```

## 4. NotificationOrchestrator (알림 오케스트레이션)

`src/core/engines/NotificationOrchestrator.ts`:

```typescript
import { Task } from '@/types/task.types';
import { UserProfile } from '@/types/user.types';
import * as Notifications from 'expo-notifications';
import { differenceInHours, parseISO } from 'date-fns';

export class NotificationOrchestrator {
  /**
   * 개별 알림 스케줄링
   */
  static async scheduleNotification(task: Task, userProfile: UserProfile): Promise<string> {
    const { notificationSettings, recurrence } = task;
    
    if (!notificationSettings.enabled) {
      return '';
    }

    // 사용자 모드에 따라 분기
    if (userProfile.notificationMode === 'digest') {
      // 다이제스트 모드: 즉시 알림 안 함 (배치에서 처리)
      return '';
    }

    if (userProfile.notificationMode === 'minimal') {
      // 최소 모드: 알림 없음
      return '';
    }

    // 즉시 모드 또는 긴급 테스크
    const hoursUntilDue = differenceInHours(recurrence.nextDue, new Date());
    
    if (hoursUntilDue <= 24 || task.priority === 'urgent') {
      return await this.scheduleImmediateNotification(task);
    }

    return '';
  }

  /**
   * 즉시 알림
   */
  private static async scheduleImmediateNotification(task: Task): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: `${task.estimatedMinutes}분 소요 예상`,
        data: { taskId: task.id, type: task.type }
      },
      trigger: {
        date: task.recurrence.nextDue
      }
    });

    return notificationId;
  }

  /**
   * 다이제스트 생성 (하루 2회)
   */
  static generateDigest(
    tasks: Task[],
    digestTime: string // '09:00' or '20:00'
  ): {
    title: string;
    body: string;
    tasks: Task[];
  } {
    // 긴급도 순으로 정렬
    const sortedTasks = tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0))
      .slice(0, 5);

    const cleaningCount = sortedTasks.filter(t => t.type === 'cleaning').length;
    const foodCount = sortedTasks.filter(t => t.type === 'food').length;
    const medicineCount = sortedTasks.filter(t => t.type === 'medicine').length;

    const summary: string[] = [];
    if (cleaningCount > 0) summary.push(`청소 ${cleaningCount}개`);
    if (foodCount > 0) summary.push(`식재료 ${foodCount}개`);
    if (medicineCount > 0) summary.push(`약 ${medicineCount}회`);

    const title = digestTime === '09:00' ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일';
    const body = summary.length > 0 
      ? summary.join(' / ') 
      : '오늘은 할 일이 없어요!';

    return { title, body, tasks: sortedTasks };
  }

  /**
   * 다이제스트 알림 스케줄링
   */
  static async scheduleDigestNotification(
    userId: string,
    digestTime: string,
    digest: { title: string; body: string }
  ): Promise<string> {
    const [hours, minutes] = digestTime.split(':').map(Number);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: digest.title,
        body: digest.body,
        data: { type: 'digest', userId }
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true
      }
    });

    return notificationId;
  }

  /**
   * 알림 피로 체크 (하루 최대 알림 수)
   */
  static async checkNotificationFatigue(userId: string): Promise<boolean> {
    // 오늘 발송된 알림 수 체크
    const todayNotifications = await this.getTodayNotificationsCount(userId);
    
    // 하루 최대 5개
    return todayNotifications >= 5;
  }

  private static async getTodayNotificationsCount(userId: string): Promise<number> {
    // Firestore에서 오늘 발송 기록 조회
    // 구현 필요
    return 0;
  }
}
```

## 5. 통합 서비스

`src/core/LifeEngineService.ts`:

```typescript
import { Task } from '@/types/task.types';
import { UserProfile } from '@/types/user.types';
import { RecurrenceEngine } from './engines/RecurrenceEngine';
import { PostponeEngine } from './engines/PostponeEngine';
import { PriorityCalculator } from './engines/PriorityCalculator';
import { NotificationOrchestrator } from './engines/NotificationOrchestrator';

export class LifeEngineService {
  /**
   * 테스크 완료 처리
   */
  static async completeTask(
    task: Task,
    userProfile: UserProfile
  ): Promise<Task> {
    const now = new Date();

    // 1. 다음 due 계산
    const nextDue = RecurrenceEngine.calculateNextDue(task, now);

    // 2. 완료 이력 추가
    const newHistory = [
      ...task.completionHistory,
      {
        date: now,
        postponed: false,
        actualInterval: task.recurrence.lastCompleted
          ? Math.round((now.getTime() - task.recurrence.lastCompleted.getTime()) / (1000 * 60 * 60 * 24))
          : undefined
      }
    ];

    // 3. 주기 조정 체크
    const suggestion = RecurrenceEngine.suggestRecurrenceUpdate({
      ...task,
      completionHistory: newHistory
    });

    // 4. 업데이트된 테스크
    const updatedTask: Task = {
      ...task,
      status: 'pending',
      recurrence: {
        ...task.recurrence,
        nextDue,
        lastCompleted: now,
        interval: suggestion.shouldUpdate ? suggestion.suggestedInterval : task.recurrence.interval
      },
      completionHistory: newHistory,
      updatedAt: now
    };

    // 5. 알림 재스케줄링
    await NotificationOrchestrator.scheduleNotification(updatedTask, userProfile);

    return updatedTask;
  }

  /**
   * 테스크 미루기
   */
  static async postponeTask(
    task: Task,
    userProfile: UserProfile,
    reason?: 'tired' | 'busy' | 'later'
  ): Promise<Task> {
    const now = new Date();

    // 1. 최적 날짜 추천
    const suggestedDate = PostponeEngine.suggestNextDate(task, userProfile);

    // 2. 이력 추가
    const newHistory = [
      ...task.completionHistory,
      {
        date: now,
        postponed: true
      }
    ];

    // 3. 미루기 패턴 체크
    const pattern = PostponeEngine.checkPostponePattern({
      ...task,
      completionHistory: newHistory
    });

    // 4. 업데이트
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

    return updatedTask;
  }

  /**
   * 오늘의 할 일 생성
   */
  static async generateDailyTasks(
    tasks: Task[],
    userProfile: UserProfile
  ) {
    const prioritized = PriorityCalculator.calculateDailyTasks(tasks, 10);
    const categorized = PriorityCalculator.categorizeByTime(prioritized);

    return {
      quickTasks: categorized.quickTasks.slice(0, 3),
      leisureTasks: categorized.leisureTasks.slice(0, 3),
      allTasks: prioritized
    };
  }
}
```

## 테스트 예제

`src/core/engines/__tests__/RecurrenceEngine.test.ts`:

```typescript
import { RecurrenceEngine } from '../RecurrenceEngine';
import { Task } from '@/types/task.types';

describe('RecurrenceEngine', () => {
  it('should calculate next due date correctly', () => {
    const task: Task = {
      // ... 테스트 데이터
      recurrence: {
        type: 'fixed',
        interval: 7,
        unit: 'day',
        nextDue: new Date('2026-04-01')
      }
    };

    const nextDue = RecurrenceEngine.calculateNextDue(task, new Date('2026-04-08'));
    expect(nextDue).toEqual(new Date('2026-04-15'));
  });
});
```

## 다음 단계
- 04-cleaning.md: 청소 모듈 구현
- 공통 엔진을 활용한 도메인별 확장

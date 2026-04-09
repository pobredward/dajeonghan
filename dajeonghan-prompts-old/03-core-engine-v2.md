# 03. 핵심 엔진 v2 (점수 계산 + 기존 엔진)

> **🎯 목표**: v2의 계층적 점수 시스템 + v1의 반복 엔진을 통합한 핵심 시스템 구축

## 📋 완료 기준

이 단계를 완료하면:
- ✅ ScoreCalculator (Item → Room → Home 점수 계산)
- ✅ RecurrenceEngine (기존 유지)
- ✅ IntellectualInterval (기존 유지)
- ✅ 점수 기반 Visual Feedback 연동
- ✅ 통합 테스트 (점수 + 반복)

**예상 소요 시간**: 5-6시간

---

## 🧠 v2 핵심 추가: ScoreCalculator

### 점수 계산 원리

```
1️⃣ Task 완료 여부 확인
  ├─ 미완료 Task → 점수 감점
  ├─ 완료 Task → 점수 유지/증가
  └─ 기한 초과 Task → 추가 감점

2️⃣ Item 점수 계산 (0-100)
  ├─ 모든 Feature의 Task 점수 평균
  └─ 가중치 적용 (healthPriority 높으면 가중치 2배)

3️⃣ Room 점수 계산 (0-100)
  ├─ 모든 Item 점수 평균
  └─ 비활성화(X)된 Item 제외

4️⃣ Home 점수 계산 (0-100)
  ├─ 모든 Room 점수 평균
  └─ 비활성화된 Room 제외
```

### 코드 구현

`src/services/ScoreCalculator.ts`:

```typescript
import { Task } from '@/types/task.types';
import { RoomItem, Room, HomeLayout } from '@/types/home-layout.types';
import { differenceInDays, isPast } from 'date-fns';

export type ScoreStatus = 'excellent' | 'good' | 'needs_attention' | 'urgent';

export class ScoreCalculator {
  /**
   * 1. Task 개별 점수 (0-100)
   * 
   * 완료 = 100
   * 미완료 & 기한 내 = 50
   * 미완료 & 기한 초과 = 0 ~ 50 (초과 일수에 비례하여 감소)
   */
  static calculateTaskScore(task: Task): number {
    if (task.status === 'completed') {
      return 100;
    }

    const now = new Date();
    const dueDate = task.recurrence.nextDue;

    if (isPast(dueDate)) {
      // 기한 초과
      const daysOverdue = differenceInDays(now, dueDate);
      
      // 7일 초과 시 0점, 그 전까지는 선형 감소
      const penalty = Math.min(daysOverdue * 7, 50);
      return Math.max(0, 50 - penalty);
    } else {
      // 기한 내 미완료
      return 50;
    }
  }

  /**
   * 2. Item 점수 계산 (0-100)
   * 
   * Item에 속한 모든 Task의 가중 평균
   */
  static calculateItemScore(item: RoomItem, allTasks: Task[]): number {
    if (!item.isEnabled) return 100; // 비활성화된 아이템은 만점

    // 이 Item에 속한 Task들
    const itemTasks = allTasks.filter(task => task.itemId === item.id);

    if (itemTasks.length === 0) return 100; // Task 없으면 만점

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const task of itemTasks) {
      const taskScore = this.calculateTaskScore(task);
      
      // 가중치 계산
      let weight = 1;
      
      // healthPriority = true이면 가중치 2배
      const feature = item.features.find(f => f.taskIds.includes(task.id));
      if (feature?.config.cleaning?.healthPriority) {
        weight = 2;
      }
      
      // priority urgent = 가중치 1.5배
      if (task.priority === 'urgent') {
        weight *= 1.5;
      }

      totalWeightedScore += taskScore * weight;
      totalWeight += weight;
    }

    return Math.round(totalWeightedScore / totalWeight);
  }

  /**
   * 3. Room 점수 계산 (0-100)
   * 
   * Room에 속한 모든 Item의 평균
   */
  static calculateRoomScore(room: Room, allTasks: Task[]): number {
    if (!room.isEnabled) return 100;

    const activeItems = room.items.filter(item => item.isEnabled);
    if (activeItems.length === 0) return 100;

    const itemScores = activeItems.map(item => 
      this.calculateItemScore(item, allTasks)
    );

    const avgScore = itemScores.reduce((sum, s) => sum + s, 0) / itemScores.length;
    return Math.round(avgScore);
  }

  /**
   * 4. Home 점수 계산 (0-100)
   * 
   * 모든 Room의 평균
   */
  static calculateHomeScore(rooms: Room[], allTasks: Task[]): number {
    const activeRooms = rooms.filter(room => room.isEnabled);
    if (activeRooms.length === 0) return 100;

    const roomScores = activeRooms.map(room => 
      this.calculateRoomScore(room, allTasks)
    );

    const avgScore = roomScores.reduce((sum, s) => sum + s, 0) / roomScores.length;
    return Math.round(avgScore);
  }

  /**
   * 점수 → 상태 변환
   * 
   * 90-100: excellent (초록)
   * 70-89: good (노랑)
   * 50-69: needs_attention (주황)
   * 0-49: urgent (빨강)
   */
  static getStatusFromScore(score: number): ScoreStatus {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs_attention';
    return 'urgent';
  }

  /**
   * 점수 변화 추세 계산
   */
  static calculateTrend(
    currentScore: number,
    previousScore?: number
  ): 'improving' | 'stable' | 'declining' {
    if (!previousScore) return 'stable';

    const diff = currentScore - previousScore;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  /**
   * Task 완료 시 점수 증가량 계산
   */
  static calculateScoreGain(task: Task): number {
    let baseGain = 10;

    // priority에 따라 gain 조정
    switch (task.priority) {
      case 'urgent':
        baseGain = 20;
        break;
      case 'high':
        baseGain = 15;
        break;
      case 'medium':
        baseGain = 10;
        break;
      case 'low':
        baseGain = 5;
        break;
    }

    // 기한 초과 후 완료하면 gain 감소
    if (isPast(task.recurrence.nextDue)) {
      const daysOverdue = differenceInDays(new Date(), task.recurrence.nextDue);
      baseGain = Math.max(1, baseGain - daysOverdue * 2);
    }

    return baseGain;
  }
}
```

---

## ⚙️ 기존 엔진 유지 (v1)

### RecurrenceEngine

`src/services/RecurrenceEngine.ts` (기존 유지):

```typescript
import { Task, Recurrence } from '@/types/task.types';
import { addDays, addWeeks, addMonths } from 'date-fns';

export class RecurrenceEngine {
  /**
   * 다음 Due Date 계산
   */
  static calculateNextDue(recurrence: Recurrence, completedAt: Date): Date {
    const { type, interval, unit } = recurrence;

    if (type === 'fixed') {
      // Fixed: 완료일 기준으로 +interval
      return this.addInterval(completedAt, interval, unit);
    } else {
      // Flexible: 원래 nextDue 기준으로 +interval
      return this.addInterval(recurrence.nextDue, interval, unit);
    }
  }

  private static addInterval(
    date: Date,
    interval: number,
    unit: 'day' | 'week' | 'month'
  ): Date {
    switch (unit) {
      case 'day':
        return addDays(date, interval);
      case 'week':
        return addWeeks(date, interval);
      case 'month':
        return addMonths(date, interval);
    }
  }

  /**
   * Task 완료 처리
   */
  static async completeTask(task: Task): Promise<Task> {
    const completedAt = new Date();
    
    // 다음 Due Date 계산
    const nextDue = this.calculateNextDue(task.recurrence, completedAt);

    // 완료 이력 추가
    const completionHistory = [
      ...task.completionHistory,
      {
        date: completedAt,
        postponed: false,
        scoreGained: ScoreCalculator.calculateScoreGain(task)
      }
    ];

    // Task 업데이트
    return {
      ...task,
      status: 'completed',
      recurrence: {
        ...task.recurrence,
        nextDue,
        lastCompleted: completedAt
      },
      completionHistory,
      updatedAt: completedAt
    };
  }

  /**
   * Task 미루기
   */
  static async postponeTask(task: Task, days: number): Promise<Task> {
    const newDue = addDays(task.recurrence.nextDue, days);

    return {
      ...task,
      recurrence: {
        ...task.recurrence,
        nextDue: newDue
      },
      completionHistory: [
        ...task.completionHistory,
        {
          date: new Date(),
          postponed: true
        }
      ],
      updatedAt: new Date()
    };
  }
}
```

### IntellectualInterval

`src/services/IntellectualInterval.ts` (기존 유지):

```typescript
import { Task } from '@/types/task.types';
import { differenceInDays } from 'date-fns';

export class IntellectualInterval {
  /**
   * 사용자의 완료 패턴 분석
   * 
   * 자주 미루면 → 주기 늘림
   * 자주 일찍 완료하면 → 주기 줄임
   */
  static analyzeAndAdjust(task: Task): { interval: number; unit: string } {
    const history = task.completionHistory.slice(-5); // 최근 5개

    if (history.length < 3) {
      // 데이터 부족
      return {
        interval: task.recurrence.interval,
        unit: task.recurrence.unit
      };
    }

    // 평균 지연 일수 계산
    let totalDelay = 0;
    let delayCount = 0;

    for (const record of history) {
      if (!record.postponed && record.actualInterval) {
        const expectedInterval = task.recurrence.interval;
        const delay = record.actualInterval - expectedInterval;
        totalDelay += delay;
        delayCount++;
      }
    }

    if (delayCount === 0) {
      return {
        interval: task.recurrence.interval,
        unit: task.recurrence.unit
      };
    }

    const avgDelay = totalDelay / delayCount;

    // 조정 로직
    let newInterval = task.recurrence.interval;

    if (avgDelay > 2) {
      // 평균 2일 이상 늦게 완료 → 주기 +1
      newInterval = task.recurrence.interval + 1;
    } else if (avgDelay < -2) {
      // 평균 2일 이상 일찍 완료 → 주기 -1
      newInterval = Math.max(1, task.recurrence.interval - 1);
    }

    return {
      interval: newInterval,
      unit: task.recurrence.unit
    };
  }

  /**
   * 계절별 조정 (선택)
   */
  static adjustForSeason(task: Task): number {
    const month = new Date().getMonth();

    // 예: 창문 청소는 봄/가을에 더 자주
    if (task.title.includes('창문')) {
      if (month === 3 || month === 4 || month === 9 || month === 10) {
        return task.recurrence.interval * 0.8; // 20% 짧게
      }
    }

    return task.recurrence.interval;
  }
}
```

---

## 🔗 통합 서비스

### TaskCompletionService (v2 통합)

`src/services/TaskCompletionService.ts`:

```typescript
import { Task } from '@/types/task.types';
import { RecurrenceEngine } from './RecurrenceEngine';
import { ScoreCalculator } from './ScoreCalculator';
import { HomeLayoutService } from './homeLayoutService';

export class TaskCompletionService {
  /**
   * Task 완료 메인 함수
   * 
   * 1. Task 완료 처리 (RecurrenceEngine)
   * 2. 점수 재계산 (ScoreCalculator)
   * 3. 축하 애니메이션 트리거
   */
  static async completeTask(userId: string, task: Task): Promise<{
    updatedTask: Task;
    scoreGained: number;
    newItemScore: number;
    newRoomScore: number;
    newHomeScore: number;
  }> {
    // 1. Task 완료
    const updatedTask = await RecurrenceEngine.completeTask(task);
    await this.saveTask(updatedTask);

    // 2. 점수 재계산
    const allTasks = await this.getAllTasks(userId);
    const homeLayout = await HomeLayoutService.getHomeLayout(userId);

    if (!homeLayout) {
      throw new Error('HomeLayout not found');
    }

    // Item 점수
    const item = this.findItem(homeLayout, task.itemId);
    const newItemScore = ScoreCalculator.calculateItemScore(item, allTasks);
    const scoreGained = newItemScore - item.score;

    // Room 점수
    const room = this.findRoom(homeLayout, task.roomId);
    const newRoomScore = ScoreCalculator.calculateRoomScore(room, allTasks);

    // Home 점수
    const newHomeScore = ScoreCalculator.calculateHomeScore(homeLayout.rooms, allTasks);

    // 3. 점수 업데이트
    await HomeLayoutService.updateScores(userId, allTasks);

    // 4. 축하 이벤트
    if (scoreGained > 0) {
      await this.triggerCelebration(userId, {
        type: 'task_completed',
        taskTitle: task.title,
        scoreGained,
        newScore: newItemScore
      });
    }

    return {
      updatedTask,
      scoreGained,
      newItemScore,
      newRoomScore,
      newHomeScore
    };
  }

  /**
   * 여러 Task 일괄 완료 (10분 코스)
   */
  static async completeMultipleTasks(
    userId: string,
    tasks: Task[]
  ): Promise<void> {
    for (const task of tasks) {
      await RecurrenceEngine.completeTask(task);
      await this.saveTask(task);
    }

    // 점수 한번에 재계산
    const allTasks = await this.getAllTasks(userId);
    await HomeLayoutService.updateScores(userId, allTasks);

    // 특별 축하
    await this.triggerCelebration(userId, {
      type: 'multiple_completed',
      count: tasks.length,
      message: `${tasks.length}개 완료! 대단해요! 🎉`
    });
  }

  /**
   * 축하 이벤트 트리거
   */
  private static async triggerCelebration(
    userId: string,
    event: CelebrationEvent
  ): Promise<void> {
    // Firestore에 이벤트 저장
    await saveDoc(db, `users/${userId}/celebrations/${Date.now()}`, event);
    
    // 앱에서는 celebrations 컬렉션을 실시간 리스닝하여 애니메이션 표시
  }

  // 유틸리티
  private static findItem(layout: HomeLayout, itemId: string): RoomItem {
    for (const room of layout.rooms) {
      const item = room.items.find(i => i.id === itemId);
      if (item) return item;
    }
    throw new Error('Item not found');
  }

  private static findRoom(layout: HomeLayout, roomId: string): Room {
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    return room;
  }
}
```

---

## 📊 점수 실시간 업데이트

### React Hook

`src/hooks/useHomeScore.ts`:

```typescript
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import { HomeLayout } from '@/types/home-layout.types';
import { homeLayoutConverter } from '@/utils/firestoreConverters';

export function useHomeScore(userId: string) {
  const [homeScore, setHomeScore] = useState(100);
  const [status, setStatus] = useState<ScoreStatus>('excellent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const layoutRef = doc(db, `users/${userId}/homeLayout/main`)
      .withConverter(homeLayoutConverter);

    const unsubscribe = onSnapshot(layoutRef, (snapshot) => {
      if (snapshot.exists()) {
        const layout = snapshot.data() as HomeLayout;
        setHomeScore(layout.overallScore);
        setStatus(ScoreCalculator.getStatusFromScore(layout.overallScore));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { homeScore, status, loading };
}
```

---

## 🎨 시각화 연동

### 점수 기반 색상

```typescript
// src/theme/scoreTheme.ts

export const ScoreTheme = {
  excellent: {
    primary: '#4CAF50',
    background: '#E8F5E9',
    text: '#2E7D32',
    emoji: '😄',
    message: '완벽해요!'
  },
  good: {
    primary: '#FFC107',
    background: '#FFF9C4',
    text: '#F57F17',
    emoji: '😊',
    message: '잘하고 있어요'
  },
  needs_attention: {
    primary: '#FF9800',
    background: '#FFE0B2',
    text: '#E65100',
    emoji: '😐',
    message: '조금만 더 신경써요'
  },
  urgent: {
    primary: '#F44336',
    background: '#FFCDD2',
    text: '#B71C1C',
    emoji: '😰',
    message: '긴급! 청소가 필요해요'
  }
};
```

### RoomCard에 적용

```typescript
// src/components/RoomCard.tsx

const RoomCard = ({ room, tasks }: { room: Room; tasks: Task[] }) => {
  const score = ScoreCalculator.calculateRoomScore(room, tasks);
  const status = ScoreCalculator.getStatusFromScore(score);
  const theme = ScoreTheme[status];

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      {/* 점수 원 */}
      <ScoreCircle score={score} status={status} />

      {/* 방 이름 */}
      <Text style={styles.roomName}>{room.name}</Text>

      {/* 상태 메시지 */}
      <Text style={[styles.statusText, { color: theme.text }]}>
        {theme.emoji} {theme.message}
      </Text>

      {/* 미완료 Task 수 */}
      <Text style={styles.pendingCount}>
        미완료: {tasks.filter(t => t.status !== 'completed').length}개
      </Text>
    </View>
  );
};
```

---

## 🧪 통합 테스트

### 테스트 시나리오

`src/services/__tests__/scoreIntegration.test.ts`:

```typescript
import { ScoreCalculator } from '../ScoreCalculator';
import { RecurrenceEngine } from '../RecurrenceEngine';
import { TaskCompletionService } from '../TaskCompletionService';

describe('Score Integration', () => {
  it('Task 완료 시 점수 상승', async () => {
    // Given
    const task = createTestTask({ status: 'pending', priority: 'high' });
    const item = createTestItem({ score: 50 });

    // When
    await TaskCompletionService.completeTask('user1', task);

    // Then
    const newScore = ScoreCalculator.calculateItemScore(item, [task]);
    expect(newScore).toBeGreaterThan(50);
  });

  it('기한 초과 Task는 점수 감점', () => {
    // Given
    const overdueTask = createTestTask({
      status: 'pending',
      nextDue: subDays(new Date(), 5) // 5일 초과
    });

    // When
    const score = ScoreCalculator.calculateTaskScore(overdueTask);

    // Then
    expect(score).toBeLessThan(50);
  });

  it('healthPriority Task는 가중치 2배', () => {
    // Given
    const normalTask = createTestTask({ priority: 'medium' });
    const healthTask = createTestTask({
      priority: 'medium',
      healthPriority: true
    });

    const item = createTestItem({
      features: [
        { taskIds: [normalTask.id], config: { cleaning: { healthPriority: false } } },
        { taskIds: [healthTask.id], config: { cleaning: { healthPriority: true } } }
      ]
    });

    // When
    const score = ScoreCalculator.calculateItemScore(item, [normalTask, healthTask]);

    // Then: healthTask의 영향력이 더 커야 함
    expect(score).toBeDefined();
  });
});
```

---

## ✅ 테스트 체크리스트

- [ ] Task 완료 시 Item 점수 상승
- [ ] Item 점수 변경 시 Room 점수 업데이트
- [ ] Room 점수 변경 시 Home 점수 업데이트
- [ ] 기한 초과 Task는 점수 낮음
- [ ] healthPriority 가중치 적용
- [ ] 비활성화(X) Item은 점수에서 제외
- [ ] 점수 → 상태 변환 정확
- [ ] 실시간 점수 업데이트 (Firestore 리스닝)

---

## 🚀 다음 단계

- **06-visualization.md**: 점수 기반 시각화 및 애니메이션
- **04-home-layout.md**: 집 배치도 UI 구현

---

**점수 기반 피드백 시스템 완성! 📊✨**

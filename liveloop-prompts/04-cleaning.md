# 04. 청소 모듈 구현

## 목표
"오늘 할 청소"를 자동으로 추천하는 청소 관리 모듈을 구현합니다.

## 핵심 개념
- **우선순위 자동 생성**: Tody 방식 (긴급도 기반 리스트)
- **포인트 기반 추천**: Sweepy 방식 (오늘 할 만큼만)
- **환경별 분기**: 세탁기/건조기 유무에 따른 테스크 변경
- **방/공간 기반 구성**: 거실, 침실, 화장실, 주방 등

## 데이터 확장

`src/modules/cleaning/types.ts`:

```typescript
import { Task, LifeObject } from '@/types/task.types';

export interface CleaningObject extends LifeObject {
  type: 'cleaning';
  metadata: CleaningMetadata;
}

export interface CleaningMetadata {
  room: RoomType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  healthPriority: boolean;
  requiresTools?: string[]; // ['세탁기', '청소기']
  seasonalAdjustment?: boolean; // 계절별 주기 조정 여부
}

export type RoomType = 
  | '거실'
  | '침실'
  | '화장실'
  | '주방'
  | '현관'
  | '베란다'
  | '전체';

export interface CleaningTask extends Task {
  type: 'cleaning';
  dirtyScore: number; // 0~10, 경과일 기반 자동 계산
}

export interface CleaningSession {
  tasks: CleaningTask[];
  totalMinutes: number;
  totalPoints: number;
}
```

## 청소 템플릿 데이터

`src/modules/cleaning/templates/cleaningTemplates.json`:

```json
{
  "student_20s": [
    {
      "name": "화장실 청소",
      "room": "화장실",
      "interval": 7,
      "unit": "day",
      "difficulty": 3,
      "estimatedMinutes": 20,
      "healthPriority": true,
      "priority": "high"
    },
    {
      "name": "침구 세탁",
      "room": "침실",
      "interval": 14,
      "unit": "day",
      "difficulty": 2,
      "estimatedMinutes": 10,
      "healthPriority": false,
      "priority": "medium",
      "requiresTools": ["세탁기"]
    },
    {
      "name": "칫솔 교체",
      "room": "화장실",
      "interval": 90,
      "unit": "day",
      "difficulty": 1,
      "estimatedMinutes": 2,
      "healthPriority": true,
      "priority": "medium"
    },
    {
      "name": "주방 싱크대 청소",
      "room": "주방",
      "interval": 3,
      "unit": "day",
      "difficulty": 2,
      "estimatedMinutes": 10,
      "healthPriority": true,
      "priority": "high"
    },
    {
      "name": "바닥 청소",
      "room": "전체",
      "interval": 7,
      "unit": "day",
      "difficulty": 3,
      "estimatedMinutes": 30,
      "healthPriority": false,
      "priority": "medium"
    },
    {
      "name": "냉장고 정리",
      "room": "주방",
      "interval": 14,
      "unit": "day",
      "difficulty": 2,
      "estimatedMinutes": 15,
      "healthPriority": true,
      "priority": "medium"
    },
    {
      "name": "쓰레기 분리수거",
      "room": "현관",
      "interval": 7,
      "unit": "day",
      "difficulty": 2,
      "estimatedMinutes": 10,
      "healthPriority": false,
      "priority": "medium"
    },
    {
      "name": "환기",
      "room": "전체",
      "interval": 1,
      "unit": "day",
      "difficulty": 1,
      "estimatedMinutes": 5,
      "healthPriority": true,
      "priority": "low"
    }
  ],
  "worker_single": [
    {
      "name": "화장실 청소",
      "room": "화장실",
      "interval": 7,
      "unit": "day",
      "difficulty": 3,
      "estimatedMinutes": 20,
      "healthPriority": true,
      "priority": "high"
    },
    {
      "name": "침구 세탁",
      "room": "침실",
      "interval": 10,
      "unit": "day",
      "difficulty": 2,
      "estimatedMinutes": 10,
      "healthPriority": false,
      "priority": "medium"
    },
    {
      "name": "주방 청소",
      "room": "주방",
      "interval": 3,
      "unit": "day",
      "difficulty": 2,
      "estimatedMinutes": 15,
      "healthPriority": true,
      "priority": "high"
    },
    {
      "name": "바닥 청소 (주말)",
      "room": "전체",
      "interval": 14,
      "unit": "day",
      "difficulty": 4,
      "estimatedMinutes": 40,
      "healthPriority": false,
      "priority": "medium"
    }
  ]
}
```

## 청소 서비스

`src/modules/cleaning/cleaningService.ts`:

```typescript
import { CleaningTask, CleaningSession, RoomType } from './types';
import { UserProfile } from '@/types/user.types';
import { RecurrenceEngine } from '@/core/engines/RecurrenceEngine';
import cleaningTemplates from './templates/cleaningTemplates.json';

export class CleaningService {
  /**
   * 템플릿으로부터 청소 테스크 생성
   */
  static createTasksFromTemplate(
    userId: string,
    persona: string,
    userEnvironment: UserProfile['environment']
  ): CleaningTask[] {
    const template = cleaningTemplates[persona as keyof typeof cleaningTemplates] || [];
    
    return template.map((item, index) => {
      // 환경에 따른 필터링
      if (item.requiresTools?.includes('세탁기') && !userEnvironment.hasWasher) {
        // 세탁기 없으면 코인세탁 모드로 변경
        return this.adaptToCoinLaundry(userId, item, index);
      }

      return this.createCleaningTask(userId, item, index);
    });
  }

  /**
   * 코인세탁 모드로 변경
   */
  private static adaptToCoinLaundry(
    userId: string,
    template: any,
    index: number
  ): CleaningTask {
    return {
      ...this.createCleaningTask(userId, template, index),
      title: `${template.name} (코인세탁)`,
      description: '1. 세탁물 준비 → 2. 코인세탁 방문 → 3. 세탁 완료 후 픽업',
      estimatedMinutes: template.estimatedMinutes + 30 // 이동 시간 추가
    };
  }

  /**
   * 청소 테스크 생성
   */
  private static createCleaningTask(
    userId: string,
    template: any,
    index: number
  ): CleaningTask {
    const now = new Date();
    
    return {
      id: `cleaning_${userId}_${index}_${Date.now()}`,
      userId,
      objectId: `cleaning_obj_${userId}_${index}`,
      title: template.name,
      type: 'cleaning',
      recurrence: {
        type: 'fixed',
        interval: template.interval,
        unit: template.unit,
        nextDue: new Date(now.getTime() + template.interval * 24 * 60 * 60 * 1000)
      },
      priority: template.priority,
      estimatedMinutes: template.estimatedMinutes,
      status: 'pending',
      notificationSettings: {
        enabled: true,
        timing: 'digest',
        advanceHours: [24]
      },
      completionHistory: [],
      dirtyScore: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 더러움 점수 계산
   */
  static calculateDirtyScore(task: CleaningTask): number {
    const elapsedRatio = RecurrenceEngine.calculateElapsedRatio(task);
    
    // 경과 비율 × 난이도
    const metadata = task.metadata as any;
    const difficulty = metadata?.difficulty || 3;
    
    const score = Math.min(elapsedRatio * difficulty * 2, 10);
    
    return Math.round(score * 10) / 10;
  }

  /**
   * 오늘의 청소 10분 코스
   */
  static recommendQuickSession(
    tasks: CleaningTask[],
    targetMinutes: number = 10
  ): CleaningSession {
    // 1. 긴급도 + 더러움 점수 순 정렬
    const scored = tasks.map(task => ({
      task,
      score: this.calculateDirtyScore(task)
    })).sort((a, b) => b.score - a.score);

    // 2. 10분 이내로 조합
    const selected: CleaningTask[] = [];
    let totalMinutes = 0;

    for (const { task } of scored) {
      if (totalMinutes + task.estimatedMinutes <= targetMinutes) {
        selected.push(task);
        totalMinutes += task.estimatedMinutes;
      }

      if (selected.length >= 3) break; // 최대 3개
    }

    return {
      tasks: selected,
      totalMinutes,
      totalPoints: selected.reduce((sum, t) => sum + this.calculateDirtyScore(t), 0)
    };
  }

  /**
   * 여유 있을 때 코스
   */
  static recommendLeisureSession(
    tasks: CleaningTask[],
    targetMinutes: number = 30
  ): CleaningSession {
    // 10~30분 소요 테스크 중 긴급한 것
    const leisure = tasks.filter(t => 
      t.estimatedMinutes >= 10 && t.estimatedMinutes <= 30
    );

    const scored = leisure.map(task => ({
      task,
      score: this.calculateDirtyScore(task)
    })).sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, 3).map(s => s.task);

    return {
      tasks: selected,
      totalMinutes: selected.reduce((sum, t) => sum + t.estimatedMinutes, 0),
      totalPoints: selected.reduce((sum, t) => sum + this.calculateDirtyScore(t), 0)
    };
  }

  /**
   * 방별 필터링
   */
  static filterByRoom(tasks: CleaningTask[], room: RoomType): CleaningTask[] {
    return tasks.filter(task => {
      const metadata = task.metadata as any;
      return metadata?.room === room;
    });
  }

  /**
   * 건강 우선순위 테스크 (화장실/주방)
   */
  static getHealthPriorityTasks(tasks: CleaningTask[]): CleaningTask[] {
    return tasks.filter(task => {
      const metadata = task.metadata as any;
      return metadata?.healthPriority === true;
    });
  }
}
```

## UI 컴포넌트

`src/modules/cleaning/components/CleaningCard.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CleaningTask } from '../types';

interface Props {
  task: CleaningTask;
  onComplete: () => void;
  onPostpone: () => void;
}

export const CleaningCard: React.FC<Props> = ({ task, onComplete, onPostpone }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{task.estimatedMinutes}분</Text>
        </View>
      </View>
      
      <View style={styles.metadata}>
        <Text style={styles.room}>🏠 {(task.metadata as any).room}</Text>
        <Text style={styles.difficulty}>
          {'⭐'.repeat((task.metadata as any).difficulty)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.completeButton]} 
          onPress={onComplete}
        >
          <Text style={styles.buttonText}>✓ 완료</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.postponeButton]} 
          onPress={onPostpone}
        >
          <Text style={styles.buttonText}>→ 미루기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600'
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12
  },
  room: {
    fontSize: 14,
    color: '#666'
  },
  difficulty: {
    fontSize: 14
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  completeButton: {
    backgroundColor: '#4CAF50'
  },
  postponeButton: {
    backgroundColor: '#FF9800'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  }
});
```

## 청소 화면

`src/modules/cleaning/screens/CleaningHomeScreen.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CleaningService } from '../cleaningService';
import { CleaningCard } from '../components/CleaningCard';
import { CleaningTask } from '../types';
import { LifeEngineService } from '@/core/LifeEngineService';

export const CleaningHomeScreen: React.FC = () => {
  const [quickSession, setQuickSession] = useState<any>(null);
  const [leisureSession, setLeisureSession] = useState<any>(null);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    // Firestore에서 청소 테스크 로드
    // 여기서는 예시
    const mockTasks: CleaningTask[] = []; // 실제로는 Firestore 조회
    
    setTasks(mockTasks);
    
    const quick = CleaningService.recommendQuickSession(mockTasks, 10);
    const leisure = CleaningService.recommendLeisureSession(mockTasks, 30);
    
    setQuickSession(quick);
    setLeisureSession(leisure);
  };

  const handleComplete = async (task: CleaningTask) => {
    // 완료 처리
    const userProfile = {}; // 실제로는 Context에서 가져옴
    await LifeEngineService.completeTask(task, userProfile as any);
    loadTasks();
  };

  const handlePostpone = async (task: CleaningTask) => {
    // 미루기 처리
    const userProfile = {};
    await LifeEngineService.postponeTask(task, userProfile as any);
    loadTasks();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 오늘의 10분 코스</Text>
        <Text style={styles.sectionSubtitle}>
          총 {quickSession?.totalMinutes}분 · {quickSession?.tasks?.length}개
        </Text>
        
        {quickSession?.tasks?.map((task: CleaningTask) => (
          <CleaningCard
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task)}
            onPostpone={() => handlePostpone(task)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ 여유 있을 때</Text>
        <Text style={styles.sectionSubtitle}>
          총 {leisureSession?.totalMinutes}분 · {leisureSession?.tasks?.length}개
        </Text>
        
        {leisureSession?.tasks?.map((task: CleaningTask) => (
          <CleaningCard
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task)}
            onPostpone={() => handlePostpone(task)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  }
});
```

## 다음 단계
- 05-fridge.md: 냉장고 모듈 구현
- 식재료 유통기한 관리 및 보관 조건별 수명 계산

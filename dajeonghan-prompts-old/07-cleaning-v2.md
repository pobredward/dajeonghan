# 07. 청소 모듈 v2 (공간 기반)

> **🎯 목표**: 공간 구조를 기반으로 한 청소 관리 시스템 재구성

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 청소 Task가 Item과 연결
- ✅ 10분 코스 시스템 (공간별)
- ✅ 청소 통계 (공간별, 아이템별)
- ✅ 건강 우선순위 필터링

**예상 소요 시간**: 3-4시간

---

## 🔄 v1 vs v2

### v1 구조
```
Task (청소) - flat list
  - 화장실 청소
  - 주방 청소
  - 거실 청소
```

**문제점**:
- ❌ 어떤 공간의 어떤 아이템인지 불명확
- ❌ 공간별 현황 파악 어려움
- ❌ 확장 불가

### v2 구조
```
Room (주방)
  ├─ Item (냉장고)
  │    └─ Task (냉장고 선반 청소)
  ├─ Item (싱크대)
  │    └─ Task (싱크대 청소)
  └─ Item (가스레인지)
       └─ Task (가스레인지 청소)
```

**장점**:
- ✅ 공간-아이템-Task 명확한 계층
- ✅ 공간별 현황 한눈에
- ✅ 무한 확장

---

## 🧹 청소 Task 구조

### Task 타입 (v2 업데이트)

```typescript
// src/types/task.types.ts

export interface CleaningTask extends Task {
  type: 'cleaning';
  
  // v2: 공간 정보
  itemId: string;           // 어떤 아이템의 청소인지
  roomId: string;           // 어떤 방인지
  
  // 청소 특화 필드
  cleaningMetadata: {
    difficulty: 1 | 2 | 3 | 4 | 5;     // 난이도
    tools: string[];                   // 필요한 도구
    healthPriority: boolean;           // 건강 관련
    areaType: 'surface' | 'deep' | 'maintenance';  // 청소 타입
    beforePhotoUrl?: string;           // 청소 전 사진
    afterPhotoUrl?: string;            // 청소 후 사진
  };
}
```

---

## 📱 청소 메인 화면 (공간별)

`src/screens/cleaning/CleaningHomeScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useHomeLayout } from '@/hooks/useHomeLayout';
import { useCleaningTasks } from '@/hooks/useCleaningTasks';
import { RoomCleaningCard } from '@/components/RoomCleaningCard';
import { ScoreCalculator } from '@/services/ScoreCalculator';

export const CleaningHomeScreen = () => {
  const { homeLayout } = useHomeLayout();
  const { tasks } = useCleaningTasks();

  if (!homeLayout) return <Loading />;

  return (
    <ScrollView style={styles.container}>
      {/* 전체 청소 점수 */}
      <OverallCleaningScore
        score={homeLayout.overallScore}
        rooms={homeLayout.rooms}
        tasks={tasks}
      />

      {/* 급한 청소 */}
      <UrgentCleaningSection tasks={tasks} />

      {/* 공간별 청소 현황 */}
      <Text style={styles.sectionTitle}>공간별 청소</Text>
      {homeLayout.rooms.map(room => {
        const roomTasks = tasks.filter(t => t.roomId === room.id);
        const roomScore = ScoreCalculator.calculateRoomScore(room, roomTasks);
        
        return (
          <RoomCleaningCard
            key={room.id}
            room={room}
            tasks={roomTasks}
            score={roomScore}
            onPress={() => navigateToRoomCleaning(room.id)}
          />
        );
      })}

      {/* 10분 코스 추천 */}
      <QuickCleaningSuggestion tasks={tasks} />
    </ScrollView>
  );
};

// 전체 점수
const OverallCleaningScore = ({ score, rooms, tasks }) => {
  const status = ScoreCalculator.getStatusFromScore(score);
  const theme = ScoreTheme[status];

  return (
    <View style={[styles.scoreCard, { backgroundColor: theme.background }]}>
      <ScoreCircle score={score} size="large" />
      
      <View style={styles.scoreInfo}>
        <Text style={styles.scoreMessage}>
          {theme.emoji} {theme.message}
        </Text>
        <Text style={styles.scoreDetail}>
          {rooms.length}개 공간 · {tasks.filter(t => t.status !== 'completed').length}개 미완료
        </Text>
      </View>
    </View>
  );
};

// 급한 청소
const UrgentCleaningSection = ({ tasks }) => {
  const urgentTasks = tasks
    .filter(t => {
      const score = ScoreCalculator.calculateTaskScore(t);
      return score < 50; // 기한 초과
    })
    .slice(0, 3);

  if (urgentTasks.length === 0) return null;

  return (
    <View style={styles.urgentSection}>
      <Text style={styles.urgentTitle}>⚠️ 급한 청소</Text>
      {urgentTasks.map(task => (
        <UrgentTaskRow key={task.id} task={task} />
      ))}
    </View>
  );
};
```

---

## 🏠 공간별 청소 화면

`src/screens/cleaning/RoomCleaningScreen.tsx`:

```typescript
export const RoomCleaningScreen = ({ route }) => {
  const { roomId } = route.params;
  const { room } = useRoom(roomId);
  const { tasks } = useCleaningTasks({ roomId });

  // 아이템별 그룹핑
  const tasksByItem = groupBy(tasks, 'itemId');

  return (
    <ScrollView>
      {/* 방 헤더 */}
      <RoomHeader room={room} tasks={tasks} />

      {/* 아이템별 청소 */}
      {room.items.map(item => {
        const itemTasks = tasksByItem[item.id] || [];
        const itemScore = ScoreCalculator.calculateItemScore(item, itemTasks);

        return (
          <ItemCleaningCard
            key={item.id}
            item={item}
            tasks={itemTasks}
            score={itemScore}
          />
        );
      })}

      {/* 이 방 10분 코스 */}
      <QuickCleaningButton roomId={roomId} />
    </ScrollView>
  );
};

// 아이템 청소 카드
const ItemCleaningCard = ({ item, tasks, score }) => {
  const status = ScoreCalculator.getStatusFromScore(score);
  const theme = ScoreTheme[status];

  return (
    <View style={[styles.itemCard, { borderColor: theme.primary }]}>
      {/* 아이템 정보 */}
      <View style={styles.itemHeader}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <ScoreCircle score={score} size="small" />
      </View>

      {/* Task 목록 */}
      {tasks.map(task => (
        <CleaningTaskRow
          key={task.id}
          task={task}
          onComplete={() => completeTask(task)}
        />
      ))}
    </View>
  );
};
```

---

## ⚡ 10분 코스 시스템 v2

`src/services/QuickCleaningService.ts`:

```typescript
import { Task } from '@/types/task.types';
import { Room } from '@/types/home-layout.types';
import { ScoreCalculator } from './ScoreCalculator';
import { isPast } from 'date-fns';

export class QuickCleaningService {
  /**
   * 10분 안에 할 수 있는 Task 추천
   * 
   * 우선순위:
   * 1. 기한 초과 (urgent)
   * 2. healthPriority
   * 3. 높은 priority
   * 4. 짧은 estimatedMinutes
   */
  static suggestQuickCleaning(
    tasks: Task[],
    targetMinutes: number = 10
  ): Task[] {
    // 미완료만
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    // 점수 계산
    const scored = pendingTasks.map(task => ({
      task,
      urgencyScore: this.calculateUrgencyScore(task)
    }));

    // 정렬
    scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // 시간 제약 내에서 선택
    const selected: Task[] = [];
    let totalMinutes = 0;

    for (const { task } of scored) {
      if (totalMinutes + task.estimatedMinutes <= targetMinutes) {
        selected.push(task);
        totalMinutes += task.estimatedMinutes;
      }

      if (totalMinutes >= targetMinutes * 0.8) break; // 80% 채우면 충분
    }

    return selected;
  }

  /**
   * 공간별 10분 코스
   */
  static suggestRoomQuickCleaning(
    room: Room,
    tasks: Task[],
    targetMinutes: number = 10
  ): Task[] {
    const roomTasks = tasks.filter(t => t.roomId === room.id);
    return this.suggestQuickCleaning(roomTasks, targetMinutes);
  }

  /**
   * 긴급도 점수 계산
   */
  private static calculateUrgencyScore(task: Task): number {
    let score = 0;

    // 1. 기한 초과 (+50)
    if (isPast(task.recurrence.nextDue)) {
      score += 50;
    }

    // 2. priority
    switch (task.priority) {
      case 'urgent':
        score += 40;
        break;
      case 'high':
        score += 30;
        break;
      case 'medium':
        score += 20;
        break;
      case 'low':
        score += 10;
        break;
    }

    // 3. healthPriority (+30)
    if (task.cleaningMetadata?.healthPriority) {
      score += 30;
    }

    // 4. 짧은 시간 (+10)
    if (task.estimatedMinutes <= 5) {
      score += 10;
    }

    return score;
  }

  /**
   * 10분 코스 완료 처리
   */
  static async completeQuickCleaning(
    userId: string,
    tasks: Task[]
  ): Promise<{
    totalMinutes: number;
    scoreGained: number;
  }> {
    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    // 일괄 완료
    await TaskCompletionService.completeMultipleTasks(userId, tasks);

    // 점수 계산
    const scoreGained = tasks.reduce((sum, t) => 
      sum + ScoreCalculator.calculateScoreGain(t), 0
    );

    return { totalMinutes, scoreGained };
  }
}
```

### 10분 코스 UI

```typescript
const QuickCleaningSuggestion = ({ tasks }) => {
  const suggestedTasks = QuickCleaningService.suggestQuickCleaning(tasks, 10);
  const totalMinutes = suggestedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  if (suggestedTasks.length === 0) {
    return (
      <View style={styles.suggestion}>
        <Text>✅ 급한 청소가 없어요!</Text>
      </View>
    );
  }

  return (
    <View style={styles.suggestion}>
      <Text style={styles.suggestionTitle}>⚡ {totalMinutes}분 코스</Text>
      <Text style={styles.suggestionSubtitle}>
        {suggestedTasks.length}개 항목
      </Text>

      {suggestedTasks.map(task => (
        <QuickTaskRow key={task.id} task={task} />
      ))}

      <Button
        title="한번에 완료하기"
        onPress={() => completeAllQuick(suggestedTasks)}
      />
    </View>
  );
};
```

---

## 📊 청소 통계 (공간별)

`src/screens/cleaning/CleaningStatsScreen.tsx`:

```typescript
export const CleaningStatsScreen = () => {
  const { homeLayout } = useHomeLayout();
  const { tasks, logs } = useCleaningData();

  // 이번 주 청소 완료 횟수
  const thisWeekCount = logs.filter(log => 
    isThisWeek(log.date)
  ).length;

  // 공간별 완료율
  const roomStats = homeLayout.rooms.map(room => {
    const roomTasks = tasks.filter(t => t.roomId === room.id);
    const completed = roomTasks.filter(t => t.status === 'completed').length;
    const total = roomTasks.length;
    
    return {
      room,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      score: ScoreCalculator.calculateRoomScore(room, roomTasks)
    };
  });

  return (
    <ScrollView>
      {/* 이번 주 요약 */}
      <WeeklySummary count={thisWeekCount} />

      {/* 공간별 통계 */}
      <Text style={styles.sectionTitle}>공간별 현황</Text>
      {roomStats.map(stat => (
        <RoomStatCard key={stat.room.id} stat={stat} />
      ))}

      {/* 청소 히스토리 */}
      <CleaningHistory logs={logs} />
    </ScrollView>
  );
};

const RoomStatCard = ({ stat }) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.roomName}>{stat.room.name}</Text>
        <ScoreCircle score={stat.score} size="small" />
      </View>

      {/* 완료율 바 */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${stat.completionRate}%` }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {stat.completionRate.toFixed(0)}% 완료
      </Text>
    </View>
  );
};
```

---

## 🏥 건강 우선순위 필터

### 건강 관련 청소만 보기

```typescript
const HealthPriorityFilter = ({ tasks, onFilter }) => {
  const healthTasks = tasks.filter(task => 
    task.cleaningMetadata?.healthPriority === true
  );

  return (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => onFilter(healthTasks)}
      >
        <Text style={styles.filterIcon}>🏥</Text>
        <Text style={styles.filterText}>
          건강 관련 청소 ({healthTasks.length})
        </Text>
      </TouchableOpacity>

      <Text style={styles.filterDescription}>
        식중독, 곰팡이 등 건강에 영향을 주는 청소
      </Text>
    </View>
  );
};
```

---

## 📸 청소 전/후 사진 (선택)

### 사진 기능

```typescript
const CleaningPhotoCapture = ({ task }) => {
  const [beforePhoto, setBeforePhoto] = useState(task.cleaningMetadata.beforePhotoUrl);
  const [afterPhoto, setAfterPhoto] = useState(task.cleaningMetadata.afterPhotoUrl);

  const takePhoto = async (type: 'before' | 'after') => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      aspect: [4, 3]
    });

    if (!result.canceled) {
      const photoUrl = await uploadToFirebase(result.assets[0].uri);
      
      if (type === 'before') {
        setBeforePhoto(photoUrl);
      } else {
        setAfterPhoto(photoUrl);
      }

      // Firestore 업데이트
      await updateTask(task.id, {
        [`cleaningMetadata.${type}PhotoUrl`]: photoUrl
      });
    }
  };

  return (
    <View style={styles.photoSection}>
      <Text style={styles.photoTitle}>청소 기록 📸</Text>
      
      <View style={styles.photoRow}>
        <PhotoSlot
          label="청소 전"
          photoUrl={beforePhoto}
          onTakePhoto={() => takePhoto('before')}
        />
        <PhotoSlot
          label="청소 후"
          photoUrl={afterPhoto}
          onTakePhoto={() => takePhoto('after')}
        />
      </View>
    </View>
  );
};
```

---

## ✅ 테스트 체크리스트

- [ ] 공간별 청소 현황 표시
- [ ] 아이템별 청소 Task 그룹핑
- [ ] 공간별 점수 계산 정확
- [ ] 10분 코스 추천 (우선순위 정렬)
- [ ] 10분 코스 일괄 완료
- [ ] 건강 우선순위 필터
- [ ] 청소 통계 (주간, 공간별)
- [ ] 급한 청소 알림

---

## 🚀 다음 단계

- **08-fridge-v2.md**: 냉장고 모듈 (공간 기반)
- **09-medicine-v2.md**: 약 모듈 (공간 기반)

---

**공간 기반 청소 시스템 완성! 🧹✨**

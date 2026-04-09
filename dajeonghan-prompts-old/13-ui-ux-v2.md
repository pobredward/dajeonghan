# 13. UI/UX v2 (시각화 + 인터랙션)

> **🎯 목표**: 점수 기반 시각화와 직관적인 인터랙션으로 몰입감 있는 UX 구현

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 점수 기반 시각적 피드백
- ✅ 애니메이션 (Lottie, Reanimated)
- ✅ 제스처 (드래그, 스와이프)
- ✅ 접근성 (VoiceOver, TalkBack)
- ✅ 다크 모드

**예상 소요 시간**: 2-3일

---

## 🎨 디자인 시스템

### 색상 팔레트

`src/theme/colors.ts`:

```typescript
export const Colors = {
  // Primary (초록 - 신선함, 성장)
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    500: '#4CAF50',  // Main
    700: '#388E3C',
    900: '#1B5E20'
  },

  // 점수 상태별 색상
  score: {
    excellent: '#4CAF50',    // 90-100: 초록
    good: '#FFC107',         // 70-89: 노랑
    needsAttention: '#FF9800', // 50-69: 주황
    urgent: '#F44336'        // 0-49: 빨강
  },

  // Neutral
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    500: '#9E9E9E',
    700: '#616161',
    900: '#212121'
  },

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#EEEEEE'
  },

  // Text
  text: {
    primary: '#212121',
    secondary: '#616161',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF'
  }
};

// 다크 모드
export const DarkColors = {
  ...Colors,
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2C2C2C'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#808080',
    inverse: '#000000'
  }
};
```

---

## 🎭 점수 기반 시각화

### ScoreCircle (원형 점수)

`src/components/ScoreCircle.tsx`:

```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import { ScoreStatus } from '@/services/ScoreCalculator';
import { Colors } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreCircleProps {
  score: number;              // 0-100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  animated = true
}) => {
  const progress = useSharedValue(0);

  const dimensions = {
    small: { radius: 30, strokeWidth: 6, fontSize: 14 },
    medium: { radius: 50, strokeWidth: 8, fontSize: 20 },
    large: { radius: 80, strokeWidth: 12, fontSize: 32 }
  }[size];

  const { radius, strokeWidth, fontSize } = dimensions;
  const circumference = 2 * Math.PI * radius;

  // 점수 → 상태
  const status: ScoreStatus =
    score >= 90 ? 'excellent' :
    score >= 70 ? 'good' :
    score >= 50 ? 'needs_attention' : 'urgent';

  const color = Colors.score[status];

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: animated ? 1000 : 0,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    const offset = circumference * (1 - progress.value);
    return {
      strokeDashoffset: offset
    };
  });

  return (
    <View style={[styles.container, { width: radius * 2 + 20, height: radius * 2 + 20 }]}>
      <Svg width={radius * 2} height={radius * 2}>
        {/* 배경 원 */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke={Colors.gray[200]}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 진행 원 */}
        <AnimatedCircle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${radius}, ${radius}`}
        />
      </Svg>

      {/* 점수 텍스트 */}
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { fontSize, color }]}>
          {Math.round(score)}
        </Text>
        {showLabel && (
          <Text style={styles.scoreLabel}>점</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  scoreContainer: {
    position: 'absolute',
    alignItems: 'center'
  },
  scoreText: {
    fontWeight: '700',
    fontFamily: 'System'
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: -4
  }
});
```

---

## 🏠 HomeOverview (집 전체 뷰)

`src/screens/home/HomeOverviewScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useHomeLayout } from '@/hooks/useHomeLayout';
import { useAllTasks } from '@/hooks/useTasks';
import { ScoreCalculator } from '@/services/ScoreCalculator';
import { ScoreCircle } from '@/components/ScoreCircle';
import { RoomCard } from '@/components/RoomCard';
import { Colors } from '@/theme/colors';

export const HomeOverviewScreen = () => {
  const { homeLayout } = useHomeLayout();
  const { tasks } = useAllTasks();

  if (!homeLayout) return <Loading />;

  const homeScore = homeLayout.overallScore;
  const status = ScoreCalculator.getStatusFromScore(homeScore);

  return (
    <ScrollView style={styles.container}>
      {/* 헤더: 집 점수 */}
      <View style={styles.header}>
        <ScoreCircle score={homeScore} size="large" />
        
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>
            {getGreeting(status)}
          </Text>
          <Text style={styles.statusMessage}>
            {getStatusMessage(status)}
          </Text>
        </View>
      </View>

      {/* 긴급 알림 */}
      <UrgentTasksSection tasks={tasks} />

      {/* 공간별 카드 */}
      <Text style={styles.sectionTitle}>공간별 현황</Text>
      {homeLayout.rooms.map(room => {
        const roomTasks = tasks.filter(t => t.roomId === room.id);
        const roomScore = ScoreCalculator.calculateRoomScore(room, roomTasks);

        return (
          <RoomCard
            key={room.id}
            room={room}
            score={roomScore}
            tasks={roomTasks}
            onPress={() => navigateToRoomDetail(room.id)}
          />
        );
      })}
    </ScrollView>
  );
};

// 인사말
function getGreeting(status: ScoreStatus): string {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? '좋은 아침이에요' :
    hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  return `${timeGreeting} 😊`;
}

// 상태 메시지
function getStatusMessage(status: ScoreStatus): string {
  switch (status) {
    case 'excellent':
      return '집이 아주 깔끔해요! 👏';
    case 'good':
      return '잘 유지하고 계시네요!';
    case 'needs_attention':
      return '조금만 더 신경써주세요';
    case 'urgent':
      return '청소가 필요한 곳이 있어요';
  }
}
```

---

## 🎴 RoomCard (방 카드)

`src/components/RoomCard.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Room } from '@/types/home-layout.types';
import { Task } from '@/types/task.types';
import { ScoreCircle } from './ScoreCircle';
import { Colors } from '@/theme/colors';
import { ScoreCalculator } from '@/services/ScoreCalculator';

interface RoomCardProps {
  room: Room;
  score: number;
  tasks: Task[];
  onPress: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  score,
  tasks,
  onPress
}) => {
  const status = ScoreCalculator.getStatusFromScore(score);
  const theme = getThemeForStatus(status);
  
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const overdueCount = tasks.filter(t => 
    t.status === 'pending' && isPast(t.recurrence.nextDue)
  ).length;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.background, borderColor: theme.border }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 왼쪽: 점수 */}
      <ScoreCircle score={score} size="medium" />

      {/* 중앙: 정보 */}
      <View style={styles.info}>
        <Text style={styles.roomName}>
          {getRoomIcon(room.type)} {room.name}
        </Text>
        
        <Text style={styles.itemCount}>
          {room.items.length}개 아이템
        </Text>

        {pendingCount > 0 && (
          <View style={styles.taskStatus}>
            <Text style={[styles.taskText, { color: theme.text }]}>
              미완료 {pendingCount}개
            </Text>
            {overdueCount > 0 && (
              <Text style={styles.overdueText}>
                · 긴급 {overdueCount}개
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 오른쪽: 화살표 */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

function getThemeForStatus(status: ScoreStatus) {
  const themes = {
    excellent: {
      background: '#E8F5E9',
      border: '#4CAF50',
      text: '#2E7D32'
    },
    good: {
      background: '#FFF9C4',
      border: '#FFC107',
      text: '#F57F17'
    },
    needs_attention: {
      background: '#FFE0B2',
      border: '#FF9800',
      text: '#E65100'
    },
    urgent: {
      background: '#FFCDD2',
      border: '#F44336',
      text: '#B71C1C'
    }
  };

  return themes[status];
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  info: {
    flex: 1,
    marginLeft: 16
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4
  },
  itemCount: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500'
  },
  overdueText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600'
  },
  chevron: {
    fontSize: 24,
    color: Colors.gray[400]
  }
});
```

---

## 🎉 CelebrationAnimation (축하 애니메이션)

`src/components/CelebrationAnimation.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence
} from 'react-native-reanimated';

interface CelebrationAnimationProps {
  visible: boolean;
  type: 'task_completed' | 'level_up' | 'streak';
  message?: string;
  scoreGained?: number;
  onComplete: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  type,
  message,
  scoreGained,
  onComplete
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 등장 애니메이션
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });

      // 3초 후 자동 닫기
      const timer = setTimeout(() => {
        // 퇴장 애니메이션
        scale.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        setTimeout(onComplete, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Lottie 애니메이션 */}
          <LottieView
            source={getLottieAnimation(type)}
            autoPlay
            loop={false}
            style={styles.lottie}
          />

          {/* 메시지 */}
          <Text style={styles.message}>
            {message || getDefaultMessage(type)}
          </Text>

          {/* 점수 증가 */}
          {scoreGained && (
            <Text style={styles.scoreGained}>
              +{scoreGained}점
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

function getLottieAnimation(type: string) {
  switch (type) {
    case 'task_completed':
      return require('@/assets/animations/confetti.json');
    case 'level_up':
      return require('@/assets/animations/star.json');
    case 'streak':
      return require('@/assets/animations/fire.json');
    default:
      return require('@/assets/animations/confetti.json');
  }
}

function getDefaultMessage(type: string): string {
  switch (type) {
    case 'task_completed':
      return '완료했어요! 👏';
    case 'level_up':
      return '레벨업! 🎉';
    case 'streak':
      return '연속 달성! 🔥';
    default:
      return '잘했어요!';
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    minWidth: 280
  },
  lottie: {
    width: 200,
    height: 200
  },
  message: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center'
  },
  scoreGained: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.score.excellent,
    marginTop: 8
  }
});
```

---

## 🎯 Swipe Actions (스와이프 액션)

### SwipeableTaskRow

```typescript
import { Swipeable } from 'react-native-gesture-handler';

const SwipeableTaskRow = ({ task, onComplete, onPostpone, onDelete }) => {
  // 오른쪽 스와이프: 완료
  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.swipeAction, { backgroundColor: Colors.success }]}
      onPress={onComplete}
    >
      <Text style={styles.swipeText}>✓ 완료</Text>
    </TouchableOpacity>
  );

  // 왼쪽 스와이프: 미루기/삭제
  const renderLeftActions = () => (
    <View style={styles.leftActions}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: Colors.warning }]}
        onPress={onPostpone}
      >
        <Text style={styles.swipeText}>⏰ 미루기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: Colors.error }]}
        onPress={onDelete}
      >
        <Text style={styles.swipeText}>🗑️ 삭제</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      <TaskRow task={task} />
    </Swipeable>
  );
};
```

---

## ♿ 접근성

### 접근성 지원

```typescript
// ScoreCircle 접근성
<View
  accessible
  accessibilityRole="progressbar"
  accessibilityValue={{
    min: 0,
    max: 100,
    now: score
  }}
  accessibilityLabel={`점수 ${score}점`}
>
  <ScoreCircle score={score} />
</View>

// 버튼 접근성
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel="냉장고 청소 완료하기"
  accessibilityHint="두 번 탭하면 완료 처리됩니다"
  onPress={onComplete}
>
  <Text>완료</Text>
</TouchableOpacity>
```

---

## 🌙 다크 모드

### 다크 모드 지원

```typescript
import { useColorScheme } from 'react-native';

const HomeScreen = () => {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : Colors;

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      <Text style={{ color: colors.text.primary }}>
        다정한
      </Text>
    </View>
  );
};
```

---

## ✅ 테스트 체크리스트

- [ ] ScoreCircle 애니메이션
- [ ] RoomCard 상태별 색상
- [ ] 축하 애니메이션 (Task 완료 시)
- [ ] 스와이프 액션 (완료/미루기/삭제)
- [ ] 드래그 앤 드롭 (방 순서 변경)
- [ ] VoiceOver/TalkBack 지원
- [ ] 다크 모드 대응
- [ ] 로딩 스켈레톤

---

## 🚀 다음 단계

- **12-growth.md**: 사용자 리텐션 전략
- **14-notifications-v2.md**: 알림 최적화

---

**시각적으로 만족스러운 UX 완성! 🎨✨**

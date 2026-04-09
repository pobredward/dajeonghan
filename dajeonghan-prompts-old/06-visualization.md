# 06. 시각화 및 피드백 시스템

> **🎯 목표**: 공간과 아이템의 상태를 직관적이고 동기부여가 되는 방식으로 시각화

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 점수 기반 색상/필터 시스템 작동
- ✅ 상태별 애니메이션 적용
- ✅ 프로그레스 게이지 및 배지 시스템
- ✅ 사용자 설정으로 피드백 스타일 변경 가능
- ✅ 완료 시 축하 애니메이션 표시

**예상 소요 시간**: 1.5-2일

---

## 🎨 핵심 개념

### 시각화 전략: 당근 90% + 채찍 10%

```typescript
// 기본 원칙
const FeedbackStrategy = {
  // 긍정적 피드백 (90%)
  positive: {
    showScore: true,          // 점수 표시 (게임화)
    showBadges: true,         // 배지 적극 지급
    showProgress: true,       // 개선 추세 강조
    celebration: 'high',      // 완료 시 축하
    tone: '격려'
  },
  
  // 부정적 피드백 (10%)
  negative: {
    showDirty: 'optional',    // 옵션, 기본 OFF
    maxLevel: 2,              // 최대 2단계 (3단계 X)
    showGently: true,         // 부드럽게 표현
    alwaysWithAction: true,   // 항상 해결책 제시
    tone: '중립'
  }
};
```

---

## 💯 점수 계산 시스템

### ScoreCalculator 엔진

`src/core/engines/ScoreCalculator.ts`:

```typescript
import { Room, RoomItem } from '@/types/home-layout.types';
import { Task } from '@/types/task.types';
import { differenceInDays } from 'date-fns';

export class ScoreCalculator {
  /**
   * 아이템 점수 계산
   * 
   * 공식: 100 - (경과 페널티) + (완료 보너스)
   */
  static calculateItemScore(
    item: RoomItem,
    tasks: Task[]
  ): number {
    if (!item.isEnabled) return 100;

    const itemTasks = tasks.filter(t => t.objectId === item.id);
    if (itemTasks.length === 0) return 100;

    let score = 100;

    // 1. 경과 페널티 계산
    for (const task of itemTasks) {
      const daysSince = differenceInDays(
        new Date(),
        task.recurrence.lastCompleted || task.createdAt
      );
      const intervalDays = this.getIntervalInDays(task.recurrence);
      const elapsedRatio = daysSince / intervalDays;

      // 페널티 계산 (최대 -40점)
      if (elapsedRatio >= 1.5) {
        score -= 40; // 예정 시간의 150% 지남
      } else if (elapsedRatio >= 1.2) {
        score -= 30; // 120% 지남
      } else if (elapsedRatio >= 1.0) {
        score -= 20; // 100% 지남 (기한)
      } else if (elapsedRatio >= 0.8) {
        score -= 10; // 80% 지남
      }
    }

    // 2. 완료 보너스 (최근 완료 시)
    const recentCompletions = itemTasks.filter(t => {
      const daysSince = differenceInDays(
        new Date(),
        t.recurrence.lastCompleted || new Date(0)
      );
      return daysSince <= 1;
    });

    score += recentCompletions.length * 5; // 완료당 +5점

    // 3. 범위 제한 (0-100)
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 방 점수 계산 (아이템 점수의 평균)
   */
  static calculateRoomScore(
    room: Room,
    allTasks: Task[]
  ): number {
    const enabledItems = room.items.filter(item => item.isEnabled);
    if (enabledItems.length === 0) return 100;

    const itemScores = enabledItems.map(item =>
      this.calculateItemScore(item, allTasks)
    );

    const average = itemScores.reduce((a, b) => a + b, 0) / itemScores.length;
    return Math.round(average);
  }

  /**
   * 전체 집 점수 계산
   */
  static calculateHomeScore(
    rooms: Room[],
    allTasks: Task[]
  ): number {
    const enabledRooms = rooms.filter(r => r.isEnabled);
    if (enabledRooms.length === 0) return 100;

    const roomScores = enabledRooms.map(room =>
      this.calculateRoomScore(room, allTasks)
    );

    const average = roomScores.reduce((a, b) => a + b, 0) / roomScores.length;
    return Math.round(average);
  }

  /**
   * 점수 → 상태 변환
   */
  static getStatusFromScore(score: number): ScoreStatus {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 40) return 'needs_attention';
    return 'urgent';
  }

  private static getIntervalInDays(recurrence: any): number {
    const { interval, unit } = recurrence;
    switch (unit) {
      case 'day': return interval;
      case 'week': return interval * 7;
      case 'month': return interval * 30;
      default: return interval;
    }
  }
}

export type ScoreStatus = 
  | 'excellent'          // 90-100: 완벽
  | 'good'               // 70-89: 양호
  | 'needs_attention'    // 40-69: 주의
  | 'urgent';            // 0-39: 긴급
```

---

## 🎨 시각적 테마

### 상태별 비주얼 스타일

`src/constants/VisualThemes.ts`:

```typescript
export const VisualThemes = {
  excellent: {
    name: '완벽',
    score: [90, 100],
    color: '#4CAF50',
    gradient: ['#66BB6A', '#4CAF50'],
    filter: 'brightness(1.1) saturate(1.2)',
    glow: {
      color: '#4CAF50',
      intensity: 0.3
    },
    icon: '✨',
    animation: 'sparkle',
    message: {
      room: '완벽해요!',
      item: '깨끗해요'
    }
  },
  
  good: {
    name: '양호',
    score: [70, 89],
    color: '#2196F3',
    gradient: ['#42A5F5', '#2196F3'],
    filter: 'none',
    glow: null,
    icon: '👍',
    animation: 'none',
    message: {
      room: '잘 관리하고 계시네요',
      item: '괜찮아요'
    }
  },
  
  needs_attention: {
    name: '주의',
    score: [40, 69],
    color: '#FF9800',
    gradient: ['#FFA726', '#FF9800'],
    filter: 'grayscale(0.3)',
    glow: {
      color: '#FF9800',
      intensity: 0.2
    },
    icon: '⏰',
    animation: 'pulse-slow',
    message: {
      room: '조금 신경써주세요',
      item: '관리가 필요해요'
    }
  },
  
  urgent: {
    name: '긴급',
    score: [0, 39],
    color: '#F44336',
    gradient: ['#EF5350', '#F44336'],
    filter: 'grayscale(0.5)',
    glow: {
      color: '#F44336',
      intensity: 0.4
    },
    icon: '⚠️',
    animation: 'pulse',
    message: {
      room: '관심이 필요해요',
      item: '빨리 확인하세요'
    },
    actionLabel: '10분 코스 보기'
  }
};
```

---

## 🎭 UI 컴포넌트

### 1. 점수 서클 (Score Circle)

`src/components/ScoreCircle.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { VisualThemes } from '@/constants/VisualThemes';
import { ScoreCalculator } from '@/core/engines/ScoreCalculator';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreCircleProps {
  score: number;
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
  const status = ScoreCalculator.getStatusFromScore(score);
  const theme = VisualThemes[status];
  
  const sizes = {
    small: 60,
    medium: 100,
    large: 140
  };
  
  const containerSize = sizes[size];
  const radius = (containerSize - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: animated ? 1000 : 0
    });
  }, [score]);
  
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return { strokeDashoffset };
  });

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]}>
      <Svg width={containerSize} height={containerSize}>
        {/* Background circle */}
        <Circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          stroke="#E0E0E0"
          strokeWidth={10}
          fill="none"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          stroke={theme.color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.scoreText, { color: theme.color }]}>
          {Math.round(score)}
        </Text>
        {showLabel && (
          <Text style={styles.labelText}>{theme.name}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  labelText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
});
```

---

### 2. 방 카드 (Room Card)

`src/components/RoomCard.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Room } from '@/types/home-layout.types';
import { ScoreCalculator } from '@/core/engines/ScoreCalculator';
import { VisualThemes } from '@/constants/VisualThemes';
import { ScoreCircle } from './ScoreCircle';

interface RoomCardProps {
  room: Room;
  onPress: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress }) => {
  const status = ScoreCalculator.getStatusFromScore(room.score);
  const theme = VisualThemes[status];

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: theme.color }]}
      onPress={onPress}
    >
      {/* Room Image with Filter */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: room.imageUrl || getRoomDefaultImage(room.type) }}
          style={[
            styles.roomImage,
            {
              filter: theme.filter
            }
          ]}
        />
        
        {/* Status Icon */}
        <View style={[styles.statusBadge, { backgroundColor: theme.color }]}>
          <Text style={styles.statusIcon}>{theme.icon}</Text>
        </View>
        
        {/* Score Badge */}
        <View style={styles.scoreBadgeContainer}>
          <ScoreCircle score={room.score} size="small" showLabel={false} />
        </View>
      </View>

      {/* Room Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={[styles.statusMessage, { color: theme.color }]}>
          {theme.message.room}
        </Text>
        
        {/* Item Count */}
        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>
            {room.items.filter(i => i.isEnabled).length}개 아이템
          </Text>
        </View>
      </View>

      {/* Quick Action (if urgent) */}
      {status === 'urgent' && (
        <View style={styles.quickAction}>
          <Text style={styles.quickActionText}>{theme.actionLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 20,
  },
  scoreBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  infoContainer: {
    padding: 16,
  },
  roomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 12,
    color: '#757575',
  },
  quickAction: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
});
```

---

### 3. 완료 축하 애니메이션

`src/components/CelebrationAnimation.tsx`:

```typescript
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

interface CelebrationAnimationProps {
  visible: boolean;
  scoreGain: number;
  onComplete?: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  scoreGain,
  onComplete
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show animation
      scale.value = withSpring(1);
      opacity.value = withSpring(1);

      // Hide after 2 seconds
      setTimeout(() => {
        scale.value = withSpring(0);
        opacity.value = withSpring(0, {}, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, 2000);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Confetti Animation */}
        <LottieView
          source={require('@/assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
        
        {/* Score Gain */}
        <View style={styles.scoreGainContainer}>
          <Text style={styles.scoreGainText}>
            +{scoreGain}점
          </Text>
          <Text style={styles.message}>
            잘하셨어요! 🎉
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
  },
  lottie: {
    width: 300,
    height: 300,
  },
  scoreGainContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreGainText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  message: {
    fontSize: 18,
    color: '#212121',
    marginTop: 8,
  },
});
```

---

## ⚙️ 사용자 설정

### 시각화 설정

`src/screens/settings/VisualizationSettingsScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

type FeedbackStyle = 'score_only' | 'visual_dirty' | 'minimal';

export const VisualizationSettingsScreen = () => {
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>('score_only');
  const [showNegative, setShowNegative] = useState(false);
  const [celebrationLevel, setCelebrationLevel] = useState<'high' | 'medium' | 'low'>('high');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>피드백 스타일</Text>
        
        <SettingRow
          label="점수만 표시 (추천)"
          description="게임처럼 점수로만 관리해요"
          selected={feedbackStyle === 'score_only'}
          onPress={() => setFeedbackStyle('score_only')}
        />
        
        <SettingRow
          label="시각적 더러움 표시"
          description="방이 실제로 더러워 보여요"
          selected={feedbackStyle === 'visual_dirty'}
          onPress={() => setFeedbackStyle('visual_dirty')}
        />
        
        <SettingRow
          label="최소한만 표시"
          description="꼭 필요한 것만 알려줘요"
          selected={feedbackStyle === 'minimal'}
          onPress={() => setFeedbackStyle('minimal')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>부정적 피드백</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchLabelText}>
              경고 표시하기
            </Text>
            <Text style={styles.switchDescription}>
              점수가 낮을 때 경고 메시지를 보여요
            </Text>
          </View>
          <Switch
            value={showNegative}
            onValueChange={setShowNegative}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>완료 축하</Text>
        
        <SettingRow
          label="과하게 (추천)"
          description="애니메이션 + 효과음 + 메시지"
          selected={celebrationLevel === 'high'}
          onPress={() => setCelebrationLevel('high')}
        />
        
        <SettingRow
          label="적당히"
          description="간단한 애니메이션만"
          selected={celebrationLevel === 'medium'}
          onPress={() => setCelebrationLevel('medium')}
        />
        
        <SettingRow
          label="최소한만"
          description="체크 표시만"
          selected={celebrationLevel === 'low'}
          onPress={() => setCelebrationLevel('low')}
        />
      </View>
    </ScrollView>
  );
};
```

---

## ✅ 테스트 체크리스트

- [ ] 점수에 따라 색상이 변경됨 (90+: 초록, 70+: 파랑, 40+: 주황, 0-39: 빨강)
- [ ] ScoreCircle 애니메이션 작동 (0→100 부드럽게)
- [ ] RoomCard 필터 효과 적용
- [ ] 테스크 완료 시 축하 애니메이션 표시
- [ ] 점수 상승 애니메이션 (45→55)
- [ ] 배지 획득 알림
- [ ] 사용자 설정에서 스타일 변경 즉시 반영

---

## 🎯 다음 단계

- **07-cleaning.md**: 청소 모듈 (공간 기반 재구성)
- **11-onboarding.md**: 온보딩 시스템 (집 설정 포함)

---

**시각적 피드백으로 동기부여를 극대화합니다! 🎨✨**

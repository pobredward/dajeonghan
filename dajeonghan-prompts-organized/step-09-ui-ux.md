# Step 09. UI/UX 구현

> **🎯 목표**: 직관적이고 아름다우며 일관된 사용자 인터페이스 구축

## 📌 단계 정보

**순서**: Step 09/13  
**Phase**: Phase 3 - 사용자 경험 (Experience)  
**의존성**: Step 07, 08 완료 권장  
**예상 소요 시간**: 1-2일  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 07 완료: 온보딩 (첫 진입점)
- ✅ Step 08 완료: 알림 (알림 설정 화면 필요)
- ✅ Step 04~06 완료: 모든 모듈 (각 모듈 화면 필요)

### 다음 단계
- **Step 10**: Firebase 설정

### 이 단계가 필요한 이유
- 실제로 앱을 사용하기 위해 필수
- 사용자 경험의 완성
- 이후 단계는 이 UI 위에 기능 추가

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 디자인 시스템 완성 (Colors, Typography, Spacing)
- ✅ 공통 컴포넌트 라이브러리 (Button, Card, Badge 등)
- ✅ 홈 화면 구현 (10분 코스 + 여유 있을 때)
- ✅ 네비게이션 구조 완성 (Tab + Stack)
- ✅ 60fps 성능 유지

**예상 소요 시간**: 1-2일

---

## 🎨 핵심 개념

### 디자인 철학

**다정한의 디자인 DNA**:
1. **명확성 (Clarity)**: 한눈에 이해되는 정보 구조
2. **단순성 (Simplicity)**: 불필요한 요소 과감히 제거
3. **일관성 (Consistency)**: 통일된 디자인 언어
4. **반응성 (Responsiveness)**: 즉각적인 시각적 피드백

### UI 우선순위

```
┌──────────────────────────────┐
│   홈 화면 (Daily Overview)    │ ← 가장 중요
├──────────────────────────────┤
│ • 10분 코스 (Quick Tasks)    │
│ • 여유 있을 때 (Leisure)     │
│ • 긴급 알림 (Urgent)         │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│    모듈별 상세 화면           │ ← 두 번째
├──────────────────────────────┤
│ • 청소 목록                  │
│ • 냉장고 식재료              │
│ • 약 복용 기록               │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│    설정 및 프로필             │ ← 마지막
└──────────────────────────────┘
```

---

## 디자인 시스템

`src/constants/Colors.ts`:

```typescript
export const Colors = {
  // Primary
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#E3F2FD',

  // Secondary
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  secondaryLight: '#E8F5E9',

  // Accent
  accent: '#FF9800',
  accentDark: '#F57C00',
  accentLight: '#FFF3E0',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutrals
  black: '#212121',
  darkGray: '#424242',
  gray: '#757575',
  lightGray: '#BDBDBD',
  veryLightGray: '#E0E0E0',
  white: '#FFFFFF',

  // Background
  background: '#FAFAFA',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textInverse: '#FFFFFF',

  // Module Colors
  cleaning: '#2196F3',
  fridge: '#4CAF50',
  medicine: '#9C27B0'
};

export const Gradients = {
  primary: ['#2196F3', '#1976D2'],
  success: ['#4CAF50', '#388E3C'],
  warning: ['#FF9800', '#F57C00']
};
```

`src/constants/Typography.ts`:

```typescript
export const Typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20
  },

  // Label
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16
  },

  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16
  }
};
```

`src/constants/Spacing.ts`:

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  }
};
```

## 공통 컴포넌트

### Button

`src/components/Button.tsx`:

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows } from '@/constants';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small
  },
  fullWidth: {
    width: '100%'
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary
  },
  secondary: {
    backgroundColor: Colors.secondary
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary
  },
  text: {
    backgroundColor: 'transparent'
  },

  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32
  },

  // Text styles
  primaryText: {
    color: Colors.white,
    ...Typography.label
  },
  secondaryText: {
    color: Colors.white,
    ...Typography.label
  },
  outlineText: {
    color: Colors.primary,
    ...Typography.label
  },
  textText: {
    color: Colors.primary,
    ...Typography.label
  },

  smallText: {
    ...Typography.labelSmall
  },
  mediumText: {
    ...Typography.label
  },
  largeText: {
    fontSize: 16,
    fontWeight: '600'
  },

  // States
  disabled: {
    opacity: 0.5
  },
  disabledText: {
    color: Colors.textDisabled
  }
});
```

### Card

`src/components/Card.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
}

export const Card: React.FC<Props> = ({
  children,
  style,
  padding = 'medium',
  shadow = true
}) => {
  const cardStyle = [
    styles.base,
    styles[`padding_${padding}`],
    shadow && Shadows.medium,
    style
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg
  },
  padding_none: {
    padding: 0
  },
  padding_small: {
    padding: Spacing.sm
  },
  padding_medium: {
    padding: Spacing.md
  },
  padding_large: {
    padding: Spacing.lg
  }
});
```

### Badge

`src/components/Badge.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '@/constants';

interface Props {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
}

export const Badge: React.FC<Props> = ({
  text,
  variant = 'primary',
  size = 'medium'
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[size]]}>
      <Text style={[styles.text, styles[`${size}Text`]]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Variants
  primary: {
    backgroundColor: Colors.primaryLight
  },
  success: {
    backgroundColor: Colors.secondaryLight
  },
  warning: {
    backgroundColor: Colors.accentLight
  },
  error: {
    backgroundColor: '#FFEBEE'
  },

  // Sizes
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 4
  },

  // Text
  text: {
    fontWeight: '600'
  },
  smallText: {
    fontSize: 10,
    color: Colors.primary
  },
  mediumText: {
    fontSize: 12,
    color: Colors.primary
  }
});
```

## 네비게이션 구조

`src/navigation/RootNavigator.tsx`:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { TabNavigator } from './TabNavigator';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const [isOnboarded, setIsOnboarded] = React.useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingFlow
                {...props}
                userId="test-user"
                onComplete={() => setIsOnboarded(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

`src/navigation/TabNavigator.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { CleaningHomeScreen } from '@/modules/cleaning/screens/CleaningHomeScreen';
import { FridgeHomeScreen } from '@/modules/fridge/screens/FridgeHomeScreen';
import { MedicineHomeScreen } from '@/modules/medicine/screens/MedicineHomeScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 8
        },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '오늘',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="Cleaning"
        component={CleaningHomeScreen}
        options={{
          title: '청소',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size }}>🧹</Text>
        }}
      />
      <Tab.Screen
        name="Fridge"
        component={FridgeHomeScreen}
        options={{
          title: '냉장고',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size }}>🥗</Text>
        }}
      />
      <Tab.Screen
        name="Medicine"
        component={MedicineHomeScreen}
        options={{
          title: '약',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size }}>💊</Text>
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size }}>⚙️</Text>
        }}
      />
    </Tab.Navigator>
  );
};
```

## 홈 화면

`src/screens/home/HomeScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { LifeEngineService } from '@/core/LifeEngineService';
import { Task } from '@/types/task.types';
import { Colors, Typography, Spacing } from '@/constants';
import { Card } from '@/components/Card';
import { TaskCard } from '@/components/TaskCard';

export const HomeScreen: React.FC = () => {
  const [quickTasks, setQuickTasks] = useState<Task[]>([]);
  const [leisureTasks, setLeisureTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    // Firestore에서 테스크 로드
    const allTasks: Task[] = []; // 실제로는 FirestoreService.getTodayTasks()
    
    const userProfile = {}; // Context에서 가져오기
    const daily = await LifeEngineService.generateDailyTasks(allTasks, userProfile as any);
    
    setQuickTasks(daily.quickTasks);
    setLeisureTasks(daily.leisureTasks);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleComplete = async (task: Task) => {
    // 완료 처리
    await loadTasks();
  };

  const handlePostpone = async (task: Task) => {
    // 미루기 처리
    await loadTasks();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요 👋</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })}
        </Text>
      </View>

      {/* Quick Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚀 10분 코스</Text>
          <Text style={styles.sectionSubtitle}>
            {quickTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)}분 · {quickTasks.length}개
          </Text>
        </View>

        {quickTasks.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>오늘은 할 일이 없어요!</Text>
          </Card>
        ) : (
          quickTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task)}
              onPostpone={() => handlePostpone(task)}
            />
          ))
        )}
      </View>

      {/* Leisure Tasks */}
      {leisureTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏰ 여유 있을 때</Text>
            <Text style={styles.sectionSubtitle}>
              {leisureTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)}분 · {leisureTasks.length}개
            </Text>
          </View>

          {leisureTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task)}
              onPostpone={() => handlePostpone(task)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface
  },
  greeting: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  date: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  section: {
    padding: Spacing.md
  },
  sectionHeader: {
    marginBottom: Spacing.md
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg
  }
});
```

## TaskCard 컴포넌트

`src/components/TaskCard.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '@/types/task.types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  task: Task;
  onComplete: () => void;
  onPostpone: () => void;
}

export const TaskCard: React.FC<Props> = ({ task, onComplete, onPostpone }) => {
  const getModuleIcon = () => {
    switch (task.type) {
      case 'cleaning': return '🧹';
      case 'food': return '🥗';
      case 'medicine': return '💊';
      default: return '📋';
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{getModuleIcon()}</Text>
          <Text style={styles.title}>{task.title}</Text>
        </View>
        <Badge text={`${task.estimatedMinutes}분`} variant={getPriorityColor() as any} />
      </View>

      {task.description && (
        <Text style={styles.description}>{task.description}</Text>
      )}

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
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.sm
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center'
  },
  completeButton: {
    backgroundColor: Colors.secondary
  },
  postponeButton: {
    backgroundColor: Colors.accent
  },
  buttonText: {
    ...Typography.label,
    color: Colors.white
  }
});
```

## 다음 단계
- 11-privacy.md: 개인정보 및 법적 준수
- 개인정보처리방침, 스토어 정책 준비

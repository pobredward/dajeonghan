# Step 08. 알림 시스템 구현

> **🎯 목표**: 알림 피로를 최소화하면서 필요한 순간에 정확히 알려주는 스마트 알림 시스템 구현

## 📌 단계 정보

**순서**: Step 08/15  
**Phase**: Phase 3 - 사용자 경험 (Experience)  
**의존성**: Step 06 필수, Step 04~05 권장  
**예상 소요 시간**: 1-2일  
**난이도**: ⭐⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 06 완료: 약 모듈 (정확한 시간 알림 필수)
- ✅ Step 07 완료: 온보딩 (알림 설정 포함)

### 다음 단계
- **Step 09**: UI/UX 구현

### 이 단계가 필요한 이유
- 앱의 핵심 가치 (리마인더)
- 사용자 리텐션의 핵심
- 약 복용 알림은 정확한 시간 필수

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 로컬 알림 권한 요청 및 설정
- ✅ 다이제스트 알림 생성 (오전 9시, 저녁 8시)
- ✅ 약 복용 정확한 시간 알림
- ✅ 3가지 알림 모드 구현 (조용한 비서, 강한 루틴, 필요할 때만)
- ✅ 알림 피로 관리 (하루 최대 5개)

**예상 소요 시간**: 1-2일

---

## 🔔 핵심 개념

### 알림 피로 문제

**통계**: 
- 평균 사용자는 하루 46개의 앱 푸시 알림 수신
- 알림이 많은 앱의 삭제율: 78% (2주 내)

**경쟁 앱의 문제**:
- ❌ 모든 테스크마다 개별 알림 → 피로감
- ❌ 사용자 제어 부족 → 스트레스
- ❌ 타이밍 최적화 없음 → 무시

**다정한의 해결책**:
- ✅ **다이제스트 우선**: 하루 2회 배치 알림 (오전/저녁)
- ✅ **선택적 즉시**: 약 복용, D-day만 즉시 푸시
- ✅ **피로 관리**: 하루 최대 5개 자동 제한
- ✅ **사용자 통제**: 3가지 모드 자유 선택

### 핵심 원칙

1. **다이제스트 우선**: 하루 2회 배치 알림 기본
2. **선택적 즉시**: 약 복용, 긴급한 것만 즉시
3. **피로 관리**: 하루 최대 5개 제한
4. **사용자 통제**: 3가지 모드 제공

---

## 알림 아키텍처

```
[로컬 알림] ← MVP 우선
  ↓
[expo-notifications]
  ↓
[사용자 기기]

[푸시 알림] ← 2단계
  ↓
[Cloud Functions (스케줄러)]
  ↓
[Firebase Cloud Messaging]
  ↓
[Expo Push Service]
  ↓
[사용자 기기]
```

## 알림 설정

`src/services/notificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 알림 핸들러 설정 (앱 실행 중일 때)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export class NotificationService {
  /**
   * 알림 권한 요청
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    // Android 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      });

      // 다이제스트 전용 채널
      await Notifications.setNotificationChannelAsync('digest', {
        name: 'digest',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
        vibrationPattern: [0, 100]
      });

      // 약 복용 전용 채널
      await Notifications.setNotificationChannelAsync('medicine', {
        name: 'medicine',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000'
      });
    }

    return true;
  }

  /**
   * 로컬 알림 스케줄링 (즉시)
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date | Notifications.NotificationTriggerInput,
    data?: any,
    channelId: string = 'default'
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId })
      },
      trigger: trigger instanceof Date ? { date: trigger } : trigger
    });

    return notificationId;
  }

  /**
   * 다이제스트 알림 스케줄링 (매일 반복)
   */
  static async scheduleDigestNotification(
    time: string, // '09:00' or '20:00'
    title: string,
    body: string
  ): Promise<string> {
    const [hours, minutes] = time.split(':').map(Number);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: false, // 조용한 알림
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && { channelId: 'digest' })
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
   * 약 복용 알림 (정확한 시간)
   */
  static async scheduleMedicineNotification(
    medicineName: string,
    time: string,
    mealTiming: string
  ): Promise<string> {
    const [hours, minutes] = time.split(':').map(Number);

    const body = mealTiming !== '무관' 
      ? `${medicineName} (${mealTiming})`
      : medicineName;

    return await this.scheduleLocalNotification(
      '💊 약 먹을 시간이에요',
      body,
      {
        hour: hours,
        minute: minutes,
        repeats: true
      },
      { type: 'medicine', medicineName },
      'medicine'
    );
  }

  /**
   * 모든 예약 알림 취소
   */
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * 특정 알림 취소
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * 예약된 알림 조회
   */
  static async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * 배지 숫자 설정
   */
  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * 배지 숫자 초기화
   */
  static async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}
```

## 다이제스트 생성기

`src/services/digestService.ts`:

```typescript
import { Task } from '@/types/task.types';
import { Medicine } from '@/modules/medicine/types';
import { FoodItem } from '@/modules/fridge/types';
import { PriorityCalculator } from '@/core/engines/PriorityCalculator';
import { FridgeService } from '@/modules/fridge/fridgeService';
import { MedicineService } from '@/modules/medicine/medicineService';
import { differenceInDays } from 'date-fns';

export interface DigestContent {
  title: string;
  body: string;
  sections: DigestSection[];
  totalItems: number;
}

export interface DigestSection {
  type: 'cleaning' | 'food' | 'medicine';
  icon: string;
  items: string[];
  count: number;
}

export class DigestService {
  /**
   * 다이제스트 생성 (오전/오후)
   */
  static generateDigest(
    time: 'morning' | 'evening',
    tasks: Task[],
    foods: FoodItem[],
    medicines: Medicine[]
  ): DigestContent {
    const sections: DigestSection[] = [];

    // 1. 청소 테스크
    const cleaningTasks = PriorityCalculator.calculateDailyTasks(
      tasks.filter(t => t.type === 'cleaning'),
      3
    );

    if (cleaningTasks.length > 0) {
      sections.push({
        type: 'cleaning',
        icon: '🧹',
        items: cleaningTasks.map(t => `${t.title} (${t.estimatedMinutes}분)`),
        count: cleaningTasks.length
      });
    }

    // 2. 임박 식재료
    const expiringFoods = FridgeService.getExpiringItems(foods, 3);
    
    if (expiringFoods.length > 0) {
      sections.push({
        type: 'food',
        icon: '🥗',
        items: expiringFoods.map(f => {
          const daysLeft = differenceInDays(
            f.metadata.recommendedConsumption || new Date(),
            new Date()
          );
          return `${f.name} (${daysLeft}일 남음)`;
        }),
        count: expiringFoods.length
      });
    }

    // 3. 약 복용 (오전 다이제스트만)
    if (time === 'morning') {
      const todayMeds = MedicineService.getTodaySchedule(medicines);
      
      if (todayMeds.length > 0) {
        sections.push({
          type: 'medicine',
          icon: '💊',
          items: todayMeds.map(m => `${m.medicine.name} (${m.time})`),
          count: todayMeds.length
        });
      }
    }

    // 4. 제목 및 본문 생성
    const title = time === 'morning' ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일';
    
    const summary: string[] = [];
    sections.forEach(section => {
      const label = {
        cleaning: '청소',
        food: '식재료',
        medicine: '약'
      }[section.type];
      summary.push(`${section.icon} ${label} ${section.count}개`);
    });

    const body = summary.length > 0
      ? summary.join(' · ')
      : time === 'morning' 
        ? '오늘은 할 일이 없어요!'
        : '오늘 할 일을 모두 끝냈어요!';

    return {
      title,
      body,
      sections,
      totalItems: sections.reduce((sum, s) => sum + s.count, 0)
    };
  }

  /**
   * 다이제스트 HTML 렌더링 (앱 내 표시용)
   */
  static renderDigestHTML(digest: DigestContent): string {
    let html = `<h2>${digest.title}</h2>`;
    html += `<p>${digest.body}</p>`;

    digest.sections.forEach(section => {
      html += `<h3>${section.icon} ${section.type}</h3>`;
      html += '<ul>';
      section.items.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    });

    return html;
  }
}
```

## 알림 스케줄러

`src/services/notificationScheduler.ts`:

```typescript
import { NotificationService } from './notificationService';
import { DigestService } from './digestService';
import { UserProfile } from '@/types/user.types';
import { Task } from '@/types/task.types';
import { Medicine } from '@/modules/medicine/types';
import { FoodItem } from '@/modules/fridge/types';

export class NotificationScheduler {
  /**
   * 사용자 알림 초기화 (온보딩 후)
   */
  static async initializeNotifications(
    userId: string,
    profile: UserProfile
  ): Promise<void> {
    // 기존 알림 모두 취소
    await NotificationService.cancelAllNotifications();

    // 모드별 스케줄링
    if (profile.notificationMode === 'digest') {
      await this.setupDigestMode(profile);
    } else if (profile.notificationMode === 'immediate') {
      await this.setupImmediateMode(profile);
    }
    // minimal 모드는 알림 없음
  }

  /**
   * 다이제스트 모드 설정
   */
  private static async setupDigestMode(profile: UserProfile): Promise<void> {
    const times = profile.digestTimes || ['09:00', '20:00'];

    // 각 시간대별 다이제스트 알림 등록
    for (const time of times) {
      await NotificationService.scheduleDigestNotification(
        time,
        time === '09:00' ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일',
        '탭하여 확인하세요'
      );
    }
  }

  /**
   * 즉시 모드 설정
   */
  private static async setupImmediateMode(profile: UserProfile): Promise<void> {
    // 즉시 모드에서도 기본 다이제스트는 유지
    await this.setupDigestMode(profile);
    
    // 추가로 개별 테스크 알림은 동적으로 생성
  }

  /**
   * 약 복용 알림 등록
   */
  static async scheduleMedicineNotifications(medicines: Medicine[]): Promise<void> {
    for (const medicine of medicines) {
      const { schedule } = medicine.metadata;

      for (const time of schedule.times) {
        await NotificationService.scheduleMedicineNotification(
          medicine.name,
          time,
          schedule.mealTiming
        );
      }
    }
  }

  /**
   * 식재료 임박 알림 (D-3, D-1, D-day)
   */
  static async scheduleFoodExpiryNotification(
    food: FoodItem,
    daysBeforeExpiry: number
  ): Promise<void> {
    const expiryDate = food.metadata.recommendedConsumption || food.metadata.expiryDate;
    
    if (!expiryDate) return;

    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - daysBeforeExpiry);
    notificationDate.setHours(20, 0, 0, 0); // 저녁 8시

    if (notificationDate > new Date()) {
      const message = daysBeforeExpiry === 0
        ? '오늘까지입니다!'
        : daysBeforeExpiry === 1
        ? '내일까지입니다!'
        : `${daysBeforeExpiry}일 남았어요`;

      await NotificationService.scheduleLocalNotification(
        `🥗 ${food.name} ${message}`,
        '빨리 먹거나 요리해보세요!',
        notificationDate,
        { type: 'food', foodId: food.id }
      );
    }
  }

  /**
   * 다이제스트 내용 업데이트 (매일 실행)
   */
  static async updateDailyDigest(
    userId: string,
    tasks: Task[],
    foods: FoodItem[],
    medicines: Medicine[]
  ): Promise<void> {
    const morningDigest = DigestService.generateDigest('morning', tasks, foods, medicines);
    const eveningDigest = DigestService.generateDigest('evening', tasks, foods, medicines);

    // 다이제스트 내용을 Firestore에 저장 (푸시 알림 시 사용)
    // await saveDigestContent(userId, { morning: morningDigest, evening: eveningDigest });
  }
}
```

## 알림 리스너 (앱에서 처리)

`src/hooks/useNotificationListener.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

export const useNotificationListener = () => {
  const navigation = useNavigation();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // 알림 수신 리스너 (앱 실행 중)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // 배지 업데이트 등
    });

    // 알림 탭 리스너 (사용자가 알림 탭)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      // 데이터에 따라 화면 이동
      if (data.type === 'medicine') {
        navigation.navigate('Medicine' as never);
      } else if (data.type === 'food') {
        navigation.navigate('Fridge' as never);
      } else if (data.type === 'digest') {
        navigation.navigate('Home' as never);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);
};
```

## Cloud Functions (2단계 - 푸시 알림)

`functions/src/notifications.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// 매일 오전 8:50 실행
export const sendMorningDigest = functions.pubsub
  .schedule('50 8 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('notificationMode', '==', 'digest')
      .get();

    const promises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const profile = userDoc.data();

      // Expo Push Token 가져오기
      const pushToken = profile.expoPushToken;
      if (!pushToken) return;

      // 다이제스트 내용 가져오기
      const digestDoc = await admin.firestore()
        .collection('digests')
        .doc(userId)
        .get();

      const digest = digestDoc.data()?.morning;
      if (!digest) return;

      // Expo Push 발송
      await sendExpoPush(pushToken, {
        title: digest.title,
        body: digest.body,
        data: { type: 'digest', time: 'morning' }
      });
    });

    await Promise.all(promises);
  });

// Expo Push 발송 함수
async function sendExpoPush(
  pushToken: string,
  message: { title: string; body: string; data?: any }
) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: pushToken,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
      priority: 'default'
    })
  });

  return response.json();
}
```

## 알림 설정 화면

`src/screens/settings/NotificationSettingsScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';

export const NotificationSettingsScreen: React.FC = () => {
  const [mode, setMode] = useState<'digest' | 'immediate' | 'minimal'>('digest');
  const [digestTimes, setDigestTimes] = useState(['09:00', '20:00']);

  const modes = [
    {
      id: 'digest',
      title: '조용한 비서',
      description: '하루 2회 다이제스트 알림 (기본)',
      icon: '🔕'
    },
    {
      id: 'immediate',
      title: '강한 루틴',
      description: '모든 테스크 즉시 알림',
      icon: '🔔'
    },
    {
      id: 'minimal',
      title: '필요할 때만',
      description: '앱 내 배지만, 푸시 없음',
      icon: '⭕'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>알림 모드</Text>
      
      {modes.map(m => (
        <TouchableOpacity
          key={m.id}
          style={[styles.modeCard, mode === m.id && styles.modeCardActive]}
          onPress={() => setMode(m.id as any)}
        >
          <Text style={styles.modeIcon}>{m.icon}</Text>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>{m.title}</Text>
            <Text style={styles.modeDescription}>{m.description}</Text>
          </View>
          {mode === m.id && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}

      {mode === 'digest' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>다이제스트 시간</Text>
          <Text style={styles.hint}>
            하루 2회 모아서 알려드려요
          </Text>
          
          <View style={styles.timeSlots}>
            <View style={styles.timeSlot}>
              <Text style={styles.timeLabel}>오전</Text>
              <Text style={styles.timeValue}>{digestTimes[0]}</Text>
            </View>
            <View style={styles.timeSlot}>
              <Text style={styles.timeLabel}>저녁</Text>
              <Text style={styles.timeValue}>{digestTimes[1]}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  modeCardActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD'
  },
  modeIcon: {
    fontSize: 32,
    marginRight: 16
  },
  modeInfo: {
    flex: 1
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  modeDescription: {
    fontSize: 12,
    color: '#666'
  },
  check: {
    fontSize: 24,
    color: '#2196F3'
  },
  section: {
    marginTop: 32
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  timeSlots: {
    flexDirection: 'row',
    gap: 12
  },
  timeSlot: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700'
  }
});
```

## 다음 단계
- 09-firebase.md: Firebase 서비스 설정
- Firestore, Authentication, Cloud Functions 구성

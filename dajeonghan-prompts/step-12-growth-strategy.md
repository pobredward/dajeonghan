# Step 12. 성장 전략 및 수익화

> **🎯 목표**: 장기적 사용자 성장과 지속 가능한 수익 모델 설계

## 📌 단계 정보

**순서**: Step 12/15  
**Phase**: Phase 5 - 출시 (Launch)  
**의존성**: Step 11 완료 필수  
**예상 소요 시간**: 0.5-1일  
**난이도**: ⭐⭐

### 이전 단계 요구사항
- ✅ Step 11 완료: 개인정보 및 법적 준수
- ✅ Step 01~10 완료: 모든 핵심 기능

### 다음 단계
- **Step 14**: 템플릿 마켓플레이스
- **Step 13**: 최종 배포

**⚠️ 중요**: Step 14 (템플릿 마켓플레이스)를 먼저 완료한 후 Step 13 (배포)을 진행합니다.

### 이 단계가 필요한 이유
- 사용자 행동 분석 (개선 방향 파악)
- 수익화 준비 (지속 가능한 운영)
- A/B 테스트 기반 마련

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 습관화 스트릭 시스템 구현 (66일)
  - 검증: 3일 연속 사용 시 "3일 연속!" 배지 표시
- ✅ 주간 리포트 생성 로직 완성
  - 검증: 설정 화면에서 "주간 리포트 보기" 정상 작동
- ✅ 딥링크 기본 설정 완료
  - 검증: `dajeonghan://template/test` 링크 열림
- ✅ 프리미엄 기능 게이트 설정
  - 검증: 무료 한도 초과 시 프리미엄 안내 팝업
- ✅ Firebase Analytics 이벤트 로깅
  - 검증: Firebase Console에서 이벤트 확인

**예상 소요 시간**: 
- 초급: 1-1.5일
- 중급: 0.5-1일
- 고급: 4-6시간

---

## 📈 핵심 개념

### North Star Metric (최우선 지표)

**주간 활성 사용자 (WAU)** = 주 3회 이상 앱 사용

**왜 WAU인가?**
- DAU는 너무 높은 기준 (생활 관리 앱 특성상)
- MAU는 너무 느슨한 기준 (한 달에 한 번?)
- WAU = 습관 형성의 최적 지표

### 핵심 지표 체계

```
North Star Metric: WAU (주 3회 이상 사용)
         ↓
┌─────────────────────────────┐
│    보조 지표 (Pirate Metrics) │
├─────────────────────────────┤
│ Acquisition  │ 온보딩 완료율  │ 70%
│ Activation   │ D1 리텐션     │ 40%
│ Retention    │ D7 리텐션     │ 25%
│ Revenue      │ 프리미엄 전환  │ 5%
│ Referral     │ 템플릿 공유   │ 100회
└─────────────────────────────┘
```

### 습관 형성: 66일 법칙

**연구 결과**: 새로운 습관이 자동화되기까지 평균 66일 소요

다정한의 전략:
- ✅ **연속 일수 표시**: 스트릭 시스템
- ✅ **마일스톤 보상**: 3일, 7일, 14일, 30일, 66일
- ✅ **주간 리포트**: 매주 월요일 성과 요약

---

## 습관화 전략

### 1. 2개월 설계 (66일 법칙)

`src/services/habitService.ts`:

```typescript
import { differenceInDays } from 'date-fns';

export class HabitService {
  /**
   * 연속 사용 일수 계산
   */
  static calculateStreak(userId: string, logs: any[]): number {
    if (logs.length === 0) return 0;

    const sortedLogs = logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    let streak = 1;
    let currentDate = sortedLogs[0].date;

    for (let i = 1; i < sortedLogs.length; i++) {
      const diff = differenceInDays(currentDate, sortedLogs[i].date);
      
      if (diff === 1) {
        streak++;
        currentDate = sortedLogs[i].date;
      } else if (diff > 1) {
        break;
      }
    }

    return streak;
  }

  /**
   * 마일스톤 체크
   */
  static checkMilestones(streak: number): {
    milestone?: number;
    message?: string;
    badge?: string;
  } {
    const milestones = [
      { day: 3, message: '3일 연속! 좋은 시작이에요 🎉', badge: '시작' },
      { day: 7, message: '1주일 달성! 루틴이 생기고 있어요 🔥', badge: '1주' },
      { day: 14, message: '2주 연속! 이미 습관이 되어가고 있어요 💪', badge: '2주' },
      { day: 30, message: '한 달 완성! 대단해요 🏆', badge: '1개월' },
      { day: 66, message: '66일 달성! 완전한 습관화에 성공했어요 ⭐', badge: '마스터' }
    ];

    const achieved = milestones.find(m => m.day === streak);
    return achieved || {};
  }

  /**
   * 습관 점수 계산 (0~100)
   */
  static calculateHabitScore(
    completionRate: number,
    streak: number,
    totalDays: number
  ): number {
    const completionScore = completionRate * 0.5; // 50%
    const streakScore = Math.min(streak / 66, 1) * 0.3; // 30%
    const consistencyScore = Math.min(totalDays / 90, 1) * 0.2; // 20%

    return Math.round((completionScore + streakScore + consistencyScore) * 100);
  }
}
```

### 2. 주간 리포트

`src/components/WeeklyReport.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  weekData: {
    completedTasks: number;
    totalTasks: number;
    streak: number;
    topModule: 'cleaning' | 'fridge' | 'medicine';
  };
}

export const WeeklyReport: React.FC<Props> = ({ weekData }) => {
  const completionRate = Math.round(
    (weekData.completedTasks / weekData.totalTasks) * 100
  );

  const getMessage = () => {
    if (completionRate >= 90) return '완벽해요! 🏆';
    if (completionRate >= 70) return '훌륭해요! 🌟';
    if (completionRate >= 50) return '잘하고 있어요! 👍';
    return '조금만 더 힘내요! 💪';
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>이번 주 리포트</Text>
      
      <View style={styles.mainStat}>
        <Text style={styles.percentage}>{completionRate}%</Text>
        <Text style={styles.message}>{getMessage()}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{weekData.completedTasks}</Text>
          <Text style={styles.statLabel}>완료한 일</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{weekData.streak}일</Text>
          <Text style={styles.statLabel}>연속 사용</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: Spacing.md
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.md
  },
  mainStat: {
    alignItems: 'center',
    paddingVertical: Spacing.lg
  },
  percentage: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm
  },
  message: {
    ...Typography.h4,
    color: Colors.textSecondary
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray
  },
  stat: {
    alignItems: 'center'
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary
  }
});
```

## 템플릿 공유 (바이럴 성장)

**중요**: 템플릿 공유의 전체 구현은 **Step 14 (템플릿 마켓플레이스)**에서 다룹니다.  
여기서는 기본적인 딥링크 설정만 수행합니다.

### 딥링크 설정

`app.json`:

```json
{
  "expo": {
    "scheme": "dajeonghan",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "dajeonghan.app",
              "pathPrefix": "/template"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "associatedDomains": ["applinks:dajeonghan.app"]
    }
  }
}
```

### 템플릿 공유 서비스 (기본)

`src/services/templateSharingService.ts`:

```typescript
import * as Linking from 'expo-linking';

export class TemplateSharingService {
  /**
   * 공유 링크 생성
   */
  static async generateShareLink(templateId: string): Promise<string> {
    // 딥링크 생성
    const url = Linking.createURL(`template/${templateId}`);
    
    return url;
  }

  /**
   * 딥링크 파싱
   */
  static parseDeepLink(url: string): { templateId?: string } {
    const { path, queryParams } = Linking.parse(url);
    
    if (path?.startsWith('template/')) {
      const templateId = path.replace('template/', '');
      return { templateId };
    }
    
    return {};
  }

  /**
   * 공유 텍스트 생성
   */
  static generateShareText(templateName: string): string {
    return `다정한에서 "${templateName}" 템플릿을 공유합니다! 생활 관리가 쉬워져요 ✨`;
  }
}
```

### 딥링크 처리 (App.tsx에 추가)

```tsx
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { TemplateSharingService } from '@/services/templateSharingService';

export default function App() {
  useEffect(() => {
    // 앱 시작 시 딥링크 확인
    const handleInitialURL = async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        handleDeepLink(initialURL);
      }
    };

    // 앱 실행 중 딥링크 수신
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const { templateId } = TemplateSharingService.parseDeepLink(url);
    
    if (templateId) {
      // 템플릿 상세 화면으로 이동
      // navigation.navigate('TemplateDetail', { templateId });
    }
  };

  // ... 나머지 코드
}
```

**참고**: 전체 템플릿 공유 기능은 **Step 14**에서 구현합니다.

---

## Firebase Analytics 설정

### Analytics 이벤트 정의

`src/services/analyticsService.ts`:

```typescript
import analytics from '@react-native-firebase/analytics';

export class AnalyticsService {
  /**
   * 앱 시작
   */
  static async logAppOpen() {
    await analytics().logAppOpen();
  }

  /**
   * 화면 뷰
   */
  static async logScreenView(screenName: string, screenClass?: string) {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
  }

  /**
   * 테스크 완료
   */
  static async logTaskComplete(
    taskType: 'cleaning' | 'fridge' | 'medicine',
    estimatedMinutes: number
  ) {
    await analytics().logEvent('task_complete', {
      task_type: taskType,
      estimated_minutes: estimatedMinutes
    });
  }

  /**
   * 스트릭 달성
   */
  static async logStreakAchieved(days: number) {
    await analytics().logEvent('streak_achieved', {
      days
    });
  }

  /**
   * 온보딩 완료
   */
  static async logOnboardingComplete(persona: string) {
    await analytics().logEvent('onboarding_complete', {
      persona
    });
  }

  /**
   * 프리미엄 화면 보기
   */
  static async logPremiumView(feature: string) {
    await analytics().logEvent('premium_view', {
      feature
    });
  }

  /**
   * 구매 시작
   */
  static async logPurchaseBegin(
    productId: string,
    price: number,
    currency: string = 'KRW'
  ) {
    await analytics().logEvent('begin_checkout', {
      currency,
      value: price,
      items: [{
        item_id: productId,
        item_name: productId,
        price
      }]
    });
  }

  /**
   * 구매 완료
   */
  static async logPurchaseComplete(
    productId: string,
    price: number,
    currency: string = 'KRW'
  ) {
    await analytics().logEvent('purchase', {
      currency,
      value: price,
      items: [{
        item_id: productId,
        item_name: productId,
        price
      }]
    });
  }

  /**
   * 사용자 속성 설정
   */
  static async setUserProperties(properties: {
    persona?: string;
    isPremium?: boolean;
    installDate?: string;
  }) {
    if (properties.persona) {
      await analytics().setUserProperty('persona', properties.persona);
    }
    if (properties.isPremium !== undefined) {
      await analytics().setUserProperty(
        'is_premium', 
        properties.isPremium ? 'true' : 'false'
      );
    }
    if (properties.installDate) {
      await analytics().setUserProperty('install_date', properties.installDate);
    }
  }
}
```

### Analytics 통합 (App.tsx)

```tsx
import { useEffect } from 'react';
import { AnalyticsService } from '@/services/analyticsService';

export default function App() {
  useEffect(() => {
    // 앱 시작 로깅
    AnalyticsService.logAppOpen();

    // 사용자 속성 초기화
    const initializeAnalytics = async () => {
      const user = await getCurrentUser();
      if (user) {
        await AnalyticsService.setUserProperties({
          persona: user.persona,
          isPremium: user.isPremium,
          installDate: user.createdAt.toISOString()
        });
      }
    };

    initializeAnalytics();
  }, []);

  // ... 나머지 코드
}
```

### 화면 추적 (React Navigation)

```tsx
import { useNavigationContainerRef } from '@react-navigation/native';
import { AnalyticsService } from '@/services/analyticsService';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string>();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          // 화면 전환 로깅
          await AnalyticsService.logScreenView(currentRouteName);
        }

        routeNameRef.current = currentRouteName;
      }}
    >
      {/* 네비게이션 */}
    </NavigationContainer>
  );
}
```

---

## 수익화 전략

### 프리미엄 기능 정의

`src/constants/Premium.ts`:

```typescript
export const FREE_LIMITS = {
  tasks: 50,
  foods: 30,
  medicines: 5,
  devices: 1
};

export const PREMIUM_FEATURES = {
  unlimitedTasks: '무제한 테스크',
  unlimitedFoods: '무제한 식재료',
  unlimitedMedicines: '무제한 약',
  multiDevice: '멀티 디바이스 동기화',
  familySharing: '가족 공유 (최대 5명)',
  advancedNotifications: '고급 알림 커스터마이징',
  receiptOCR: '영수증 자동 인식',
  exportData: '데이터 내보내기 (PDF, Excel)',
  prioritySupport: '우선 고객 지원'
};

export const PREMIUM_PRICE = {
  monthly: 4900, // 원
  yearly: 49000, // 원 (2개월 무료)
  lifetime: 99000 // 원
};
```

### 프리미엄 게이트

`src/components/PremiumGate.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { Colors, Typography, Spacing } from '@/constants';
import { PREMIUM_FEATURES, PREMIUM_PRICE } from '@/constants/Premium';

interface Props {
  feature: keyof typeof PREMIUM_FEATURES;
  onUpgrade: () => void;
}

export const PremiumGate: React.FC<Props> = ({ feature, onUpgrade }) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.icon}>⭐</Text>
      <Text style={styles.title}>프리미엄 기능</Text>
      <Text style={styles.feature}>{PREMIUM_FEATURES[feature]}</Text>
      <Text style={styles.description}>
        이 기능은 프리미엄 플랜에서 사용할 수 있습니다.
      </Text>

      <View style={styles.benefits}>
        <Text style={styles.benefitItem}>✓ 무제한 데이터</Text>
        <Text style={styles.benefitItem}>✓ 멀티 디바이스</Text>
        <Text style={styles.benefitItem}>✓ 가족 공유</Text>
        <Text style={styles.benefitItem}>✓ 고급 기능</Text>
      </View>

      <Button
        title={`월 ${PREMIUM_PRICE.monthly.toLocaleString()}원으로 업그레이드`}
        onPress={onUpgrade}
        variant="primary"
        fullWidth
      />

      <Text style={styles.hint}>
        첫 7일 무료 체험
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: Spacing.md,
    alignItems: 'center'
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm
  },
  feature: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.md
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg
  },
  benefits: {
    width: '100%',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg
  },
  benefitItem: {
    ...Typography.body,
    marginBottom: Spacing.sm
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm
  }
});
```

### 인앱 구매 설정 (React Native IAP)

```bash
npm install react-native-iap
```

`src/services/purchaseService.ts`:

```typescript
import * as RNIap from 'react-native-iap';

const PRODUCT_IDS = {
  ios: ['dajeonghan_premium_monthly', 'dajeonghan_premium_yearly'],
  android: ['dajeonghan_premium_monthly', 'dajeonghan_premium_yearly']
};

export class PurchaseService {
  /**
   * IAP 초기화
   */
  static async initialize(): Promise<void> {
    await RNIap.initConnection();
  }

  /**
   * 상품 조회
   */
  static async getProducts() {
    const products = await RNIap.getProducts({
      skus: Platform.OS === 'ios' ? PRODUCT_IDS.ios : PRODUCT_IDS.android
    });
    
    return products;
  }

  /**
   * 구매
   */
  static async purchase(productId: string): Promise<boolean> {
    try {
      const purchase = await RNIap.requestPurchase({ sku: productId });
      
      // 영수증 검증 (서버)
      const verified = await this.verifyPurchase(purchase);
      
      if (verified) {
        // Firestore에 프리미엄 상태 저장
        // await updateUserPremiumStatus(userId, true);
        
        // 구매 완료
        await RNIap.finishTransaction({ purchase });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }

  /**
   * 영수증 검증 (서버)
   */
  private static async verifyPurchase(purchase: any): Promise<boolean> {
    // Cloud Functions에 영수증 검증 요청
    // const response = await fetch('https://us-central1-dajeonghan.cloudfunctions.net/verifyPurchase', {
    //   method: 'POST',
    //   body: JSON.stringify(purchase)
    // });
    
    return true;
  }

  /**
   * 구매 복원
   */
  static async restorePurchases(): Promise<boolean> {
    try {
      const purchases = await RNIap.getAvailablePurchases();
      
      if (purchases.length > 0) {
        // 프리미엄 상태 복원
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }

  /**
   * 연결 종료
   */
  static async endConnection(): Promise<void> {
    await RNIap.endConnection();
  }
}
```

## 리텐션 전략

### 1. 푸시 재참여 캠페인

`functions/src/reengagement.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * 7일 미접속 사용자에게 푸시 발송
 * 매일 오전 10시 실행
 */
export const sendReengagementPush = functions.pubsub
  .schedule('0 10 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await db
      .collection('users')
      .where('lastActiveAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .where('fcmToken', '!=', null)
      .limit(1000)
      .get();

    const messages = [
      {
        title: '다정한이 보고 싶어요 😊',
        body: '그동안 잊고 있던 할 일이 쌓였어요'
      },
      {
        title: '냉장고를 확인하세요 🥗',
        body: '유통기한이 임박한 식재료가 있을 수 있어요'
      },
      {
        title: '당신의 루틴이 기다려요 ✨',
        body: '작은 습관부터 다시 시작해보세요'
      }
    ];

    const tokens: string[] = [];
    users.forEach(doc => {
      const fcmToken = doc.data().fcmToken;
      if (fcmToken) {
        tokens.push(fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log('No users to re-engage');
      return;
    }

    // 랜덤 메시지 선택
    const message = messages[Math.floor(Math.random() * messages.length)];

    // FCM 발송
    await messaging.sendMulticast({
      tokens,
      notification: {
        title: message.title,
        body: message.body
      },
      data: {
        type: 'reengagement'
      },
      android: {
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    });

    console.log(`Sent reengagement push to ${tokens.length} users`);
  });
```

### 2. 주간 리포트 이메일

`functions/src/weeklyReport.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * 주간 리포트 생성 및 발송
 * 매주 월요일 오전 8시 실행
 */
export const sendWeeklyReport = functions.pubsub
  .schedule('0 8 * * 1')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const users = await db
      .collection('users')
      .where('notificationMode', '==', 'digest')
      .get();

    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      
      // 지난주 완료한 테스크 조회
      const completedTasks = await db
        .collection('users')
        .doc(userId)
        .collection('tasks')
        .where('status', '==', 'completed')
        .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .get();

      // 스트릭 계산
      const logs = await db
        .collection('users')
        .doc(userId)
        .collection('activityLogs')
        .orderBy('date', 'desc')
        .limit(30)
        .get();

      const streak = calculateStreak(logs.docs.map(d => d.data()));

      // 리포트 데이터 생성
      const reportData = {
        completedTasks: completedTasks.size,
        streak,
        topModule: getTopModule(completedTasks.docs)
      };

      // Firestore에 저장 (앱에서 조회 가능)
      await db
        .collection('users')
        .doc(userId)
        .collection('weeklyReports')
        .add({
          ...reportData,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

      // 푸시 알림 발송 (선택적)
      const fcmToken = userDoc.data().fcmToken;
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: '이번 주 리포트가 도착했어요 📊',
            body: `${completedTasks.size}개의 일을 완료했어요!`
          },
          data: {
            type: 'weekly_report'
          }
        });
      }
    }

    console.log(`Generated weekly reports for ${users.size} users`);
  });

function calculateStreak(logs: any[]): number {
  // HabitService.calculateStreak 로직과 동일
  // ...
  return 0;
}

function getTopModule(tasks: any[]): string {
  const counts = { cleaning: 0, fridge: 0, medicine: 0 };
  tasks.forEach(doc => {
    const type = doc.data().type;
    if (type in counts) {
      counts[type as keyof typeof counts]++;
    }
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
```

### 3. 스트릭 유지 리마인더

```typescript
/**
 * 스트릭이 끊기기 전 리마인더
 * 매일 오후 9시 실행
 */
export const sendStreakReminder = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 활동 없는 사용자 중 스트릭 3일 이상
    const users = await db
      .collection('users')
      .where('streak', '>=', 3)
      .get();

    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      
      // 오늘 활동 확인
      const todayActivity = await db
        .collection('users')
        .doc(userId)
        .collection('activityLogs')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();

      if (todayActivity.empty) {
        const streak = userDoc.data().streak;
        const fcmToken = userDoc.data().fcmToken;

        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: `${streak}일 연속 기록이 위험해요! 🔥`,
              body: '오늘 하나만 완료해도 기록이 유지돼요'
            },
            data: {
              type: 'streak_reminder'
            }
          });
        }
      }
    }
  });
```

---

## 💡 성장 전략 요약

### 사용자 여정 (User Journey)

```
1일차: 온보딩 완료 → 첫 테스크 완료
   ↓ [Analytics: onboarding_complete]
3일차: 3일 스트릭 달성 → 첫 배지 획득
   ↓ [Analytics: streak_achieved]
7일차: 1주일 스트릭 → 주간 리포트 수신
   ↓ [Push: 주간 리포트]
14일차: 2주 스트릭 → 프리미엄 제안
   ↓ [Analytics: premium_view]
30일차: 1개월 달성 → 템플릿 공유 유도
   ↓ [Feature: 템플릿 생성]
66일차: 완전 습관화 → 충성 고객
   ↓ [Reward: 마스터 배지]
```

### 핵심 전환점 (Critical Moments)

1. **D1 → D3**: 첫 스트릭 달성 (전환율 목표: 60%)
2. **D7 → D14**: 주간 리포트 확인 (전환율 목표: 40%)
3. **D14 → D30**: 프리미엄 고려 (전환율 목표: 10%)
4. **D30 → D66**: 완전 습관화 (전환율 목표: 15%)

### 측정 지표

#### 1차 지표 (Primary Metrics)
- **WAU**: 주간 활성 사용자 (목표: 10,000명)
- **리텐션**: D7 25%, D30 15%
- **ARPU**: 월 평균 사용자당 수익 (목표: 500원)

#### 2차 지표 (Secondary Metrics)
- 온보딩 완료율: 70%
- 스트릭 3일 이상: 40%
- 템플릿 생성: 10%
- 프리미엄 전환: 5%

---

## 🧪 테스트 체크리스트

### Firebase Analytics
- [ ] 앱 시작 이벤트 로깅
- [ ] 화면 전환 자동 추적
- [ ] 테스크 완료 이벤트
- [ ] 스트릭 달성 이벤트
- [ ] 프리미엄 조회 이벤트
- [ ] 구매 이벤트
- [ ] Firebase Console에서 실시간 확인

### 습관화 시스템
- [ ] 스트릭 계산 정확성 (연속 3일)
- [ ] 마일스톤 배지 표시 (3, 7, 14, 30, 66일)
- [ ] 주간 리포트 생성 (월요일 오전)
- [ ] 습관 점수 계산 로직

### 프리미엄 기능
- [ ] 무료 한도 체크 (테스크 50개, 식재료 30개, 약 5개)
- [ ] 프리미엄 게이트 팝업 표시
- [ ] 가격 정보 표시 (월 4,900원)
- [ ] 7일 무료 체험 안내

### 딥링크
- [ ] `dajeonghan://template/{id}` 형식 인식
- [ ] 앱 실행 시 URL 파싱
- [ ] 앱 실행 중 URL 수신
- [ ] 템플릿 상세 화면 이동 (Step 14 이후)

### Cloud Functions (선택적)
- [ ] 재참여 푸시 발송 (7일 미접속)
- [ ] 주간 리포트 생성 (월요일)
- [ ] 스트릭 리마인더 (저녁 9시)

---

## 🚨 주의사항

### 1. Analytics 개인정보
- ❌ **절대 수집 금지**: 이름, 이메일, 전화번호
- ✅ **수집 가능**: 익명 ID, 기기 정보, 행동 패턴
- ✅ **개인정보처리방침에 명시** (Step 11)

### 2. 인앱 구매 테스트
- 개발 단계: Sandbox 계정 사용
- 실제 결제 전 충분한 테스트 필수
- 영수증 검증 서버 구현 권장

### 3. Push 알림 빈도
- 재참여: 주 1회 최대
- 스트릭 리마인더: 하루 1회 최대
- 주간 리포트: 주 1회
- **알림 피로 방지가 최우선**

---

## 📚 참고 자료

- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [React Native IAP](https://github.com/dooboolab/react-native-iap)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [App Store 인앱 구매 가이드](https://developer.apple.com/in-app-purchase/)
- [Google Play 결제](https://developer.android.com/google/play/billing)

---

## 다음 단계

**⚠️ 중요**: 다음은 **Step 14 (템플릿 마켓플레이스)**입니다.

- **Step 14**: [템플릿 마켓플레이스](./step-14-template-marketplace.md)
  - 템플릿 생성/공유 전체 구현
  - 템플릿 마켓플레이스 UI
  - 좋아요/리뷰 시스템

- **Step 13**: [최종 배포](./step-13-deployment.md)
  - Step 14 완료 후 진행
  - 전체 테스트
  - 스토어 제출

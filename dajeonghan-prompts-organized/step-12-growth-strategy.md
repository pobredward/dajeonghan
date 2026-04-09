# Step 12. 성장 전략 및 수익화

> **🎯 목표**: 장기적 사용자 성장과 지속 가능한 수익 모델 설계

## 📌 단계 정보

**순서**: Step 12/13  
**Phase**: Phase 5 - 출시 (Launch)  
**의존성**: Step 11 완료 필수  
**예상 소요 시간**: 0.5-1일  
**난이도**: ⭐⭐

### 이전 단계 요구사항
- ✅ Step 11 완료: 개인정보 및 법적 준수
- ✅ Step 01~10 완료: 모든 핵심 기능

### 다음 단계
- **Step 13**: 테스트 및 배포 (최종 단계)

### 이 단계가 필요한 이유
- 사용자 행동 분석 (개선 방향 파악)
- 수익화 준비 (지속 가능한 운영)
- A/B 테스트 기반 마련

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 습관화 스트릭 시스템 구현 (66일)
- ✅ 주간 리포트 생성 로직 완성
- ✅ 템플릿 공유 기능 작동
- ✅ 프리미엄 기능 게이트 설정
- ✅ Firebase Analytics 이벤트 로깅

**예상 소요 시간**: 0.5-1일

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

### 템플릿 공유 기능

`src/services/templateSharingService.ts`:

```typescript
import * as Linking from 'expo-linking';
import { UserProfile } from '@/types/user.types';

export class TemplateSharingService {
  /**
   * 공유 링크 생성
   */
  static async generateShareLink(
    userProfile: UserProfile,
    templateData: any
  ): Promise<string> {
    // Firestore에 공개 템플릿 저장
    const templateId = await this.savePublicTemplate(templateData);

    // 딥링크 생성
    const url = Linking.createURL(`template/${templateId}`);
    
    return url;
  }

  /**
   * 공개 템플릿 저장
   */
  private static async savePublicTemplate(data: any): Promise<string> {
    // Firestore에 저장
    const templateId = `template_${Date.now()}`;
    
    // await db.collection('templates').doc(templateId).set({
    //   ...data,
    //   createdAt: new Date(),
    //   public: true
    // });

    return templateId;
  }

  /**
   * 링크로부터 템플릿 불러오기
   */
  static async loadTemplateFromLink(templateId: string): Promise<any> {
    // Firestore에서 조회
    // const doc = await db.collection('templates').doc(templateId).get();
    // return doc.data();
    
    return null;
  }

  /**
   * 공유 텍스트 생성
   */
  static generateShareText(templateName: string): string {
    return `다정한에서 "${templateName}" 템플릿을 공유합니다! 생활 관리가 쉬워져요 ✨`;
  }
}
```

### 공유 버튼

`src/components/ShareTemplateButton.tsx`:

```tsx
import React from 'react';
import { Share, Alert } from 'react-native';
import { Button } from './Button';
import { TemplateSharingService } from '@/services/templateSharingService';

interface Props {
  templateName: string;
  templateData: any;
}

export const ShareTemplateButton: React.FC<Props> = ({ 
  templateName, 
  templateData 
}) => {
  const handleShare = async () => {
    try {
      const link = await TemplateSharingService.generateShareLink(
        {} as any, 
        templateData
      );
      
      const message = TemplateSharingService.generateShareText(templateName);

      await Share.share({
        message: `${message}\n\n${link}`,
        url: link
      });
    } catch (error) {
      Alert.alert('오류', '공유 중 오류가 발생했습니다.');
    }
  };

  return (
    <Button
      title="템플릿 공유하기"
      onPress={handleShare}
      variant="outline"
    />
  );
};
```

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

### 푸시 재참여 캠페인

```typescript
// Cloud Functions에서 7일 미접속 사용자에게 푸시 발송
export const sendReengagementPush = functions.pubsub
  .schedule('0 10 * * *')
  .onRun(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await db
      .collection('users')
      .where('lastActiveAt', '<', sevenDaysAgo)
      .get();

    const messages = [
      '그동안 잊고 있던 할 일이 쌓였어요 😅',
      '냉장고에 임박한 식재료가 있어요 🥗',
      '당신의 루틴이 기다리고 있어요 ✨'
    ];

    // 랜덤 메시지 발송
    // ...
  });
```

## 다음 단계
- 13-deployment.md: 테스트 및 배포
- 최종 체크리스트, 스토어 제출

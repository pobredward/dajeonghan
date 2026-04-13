# Step 10: 성장 전략 및 수익화 - 구현 가이드

## 📌 개요

Step 10에서는 장기적 사용자 성장과 지속 가능한 수익 모델을 위한 핵심 기능들을 구현했습니다.

### 구현된 기능
1. **습관화 시스템** (66일 스트릭)
2. **주간 리포트**
3. **Firebase Analytics 통합**
4. **프리미엄 게이트**
5. **딥링크 설정**
6. **인앱 구매 서비스** (Mock)
7. **Cloud Functions** (재참여, 주간 리포트, 스트릭 리마인더)

---

## 🎯 North Star Metric: WAU

**주간 활성 사용자 (WAU)** = 주 3회 이상 앱 사용

### 보조 지표

| 단계 | 지표 | 목표 |
|------|------|------|
| Acquisition | 온보딩 완료율 | 70% |
| Activation | D1 리텐션 | 40% |
| Retention | D7 리텐션 | 25% |
| Revenue | 프리미엄 전환 | 5% |
| Referral | 템플릿 공유 | 100회 |

---

## 🔥 습관화 전략: 66일 법칙

### 마일스톤

```typescript
const milestones = [
  { day: 3, message: '3일 연속! 좋은 시작이에요 🎉', badge: '시작' },
  { day: 7, message: '1주일 달성! 루틴이 생기고 있어요 🔥', badge: '1주' },
  { day: 14, message: '2주 연속! 이미 습관이 되어가고 있어요 💪', badge: '2주' },
  { day: 30, message: '한 달 완성! 대단해요 🏆', badge: '1개월' },
  { day: 66, message: '66일 달성! 완전한 습관화에 성공했어요 ⭐', badge: '마스터' }
];
```

### 사용 예시

```typescript
import { HabitService } from '@/services/habitService';

// 스트릭 계산
const logs = [
  { date: new Date('2026-04-14'), userId: 'user1', type: 'app_open' },
  { date: new Date('2026-04-13'), userId: 'user1', type: 'task_complete' },
  { date: new Date('2026-04-12'), userId: 'user1', type: 'app_open' }
];

const streak = HabitService.calculateStreak('user1', logs);
console.log('Streak:', streak); // 3

// 마일스톤 확인
const milestone = HabitService.checkMilestones(streak);
if (milestone.message) {
  console.log(milestone.message); // "3일 연속! 좋은 시작이에요 🎉"
}

// 습관 점수 계산 (0~100)
const score = HabitService.calculateHabitScore(0.85, 14, 30);
console.log('습관 점수:', score); // 약 76점
```

---

## 📊 주간 리포트

### 컴포넌트 사용

```tsx
import { WeeklyReport } from '@/components';

<WeeklyReport
  weekData={{
    completedTasks: 15,
    totalTasks: 20,
    streak: 7,
    topModule: 'cleaning'
  }}
/>
```

### 주간 통계 계산

```typescript
import { HabitService } from '@/services/habitService';

const weeklyStats = HabitService.calculateWeeklyStats(logs, tasks);
console.log(weeklyStats);
// {
//   completedTasks: 15,
//   totalTasks: 20,
//   streak: 7,
//   topModule: 'cleaning'
// }
```

---

## 📈 Firebase Analytics

### 이벤트 로깅

```typescript
import { AnalyticsService } from '@/services/analyticsService';

// 앱 시작
await AnalyticsService.logAppOpen();

// 화면 뷰
await AnalyticsService.logScreenView('HomeScreen');

// 테스크 완료
await AnalyticsService.logTaskComplete('cleaning', 15);

// 스트릭 달성
await AnalyticsService.logStreakAchieved(7);

// 온보딩 완료
await AnalyticsService.logOnboardingComplete('busy_person');

// 프리미엄 조회
await AnalyticsService.logPremiumView('unlimitedTasks');

// 구매 시작
await AnalyticsService.logPurchaseBegin('premium_monthly', 4900, 'KRW');

// 구매 완료
await AnalyticsService.logPurchaseComplete('premium_monthly', 4900, 'KRW');

// 사용자 속성 설정
await AnalyticsService.setUserProperties({
  persona: 'busy_person',
  isPremium: false,
  installDate: new Date().toISOString()
});
```

### Firebase Console 확인

1. Firebase Console > Analytics > Events
2. 실시간 이벤트 모니터링
3. 커스텀 이벤트 확인

---

## 💰 프리미엄 기능

### 무료 한도

```typescript
import { FREE_LIMITS } from '@/constants/Premium';

if (taskCount >= FREE_LIMITS.tasks) {
  // 프리미엄 게이트 표시
}
```

### 프리미엄 게이트

```tsx
import { PremiumGate } from '@/components';

const [showPremiumGate, setShowPremiumGate] = useState(false);

{showPremiumGate && (
  <PremiumGate
    feature="unlimitedTasks"
    onUpgrade={async () => {
      await AnalyticsService.logPremiumView('unlimitedTasks');
      // 구매 플로우 시작
    }}
    onClose={() => setShowPremiumGate(false)}
  />
)}
```

### 가격 정보

```typescript
import { PREMIUM_PRICE, PREMIUM_FEATURES } from '@/constants/Premium';

console.log('월간:', PREMIUM_PRICE.monthly); // 4,900원
console.log('연간:', PREMIUM_PRICE.yearly); // 49,000원
console.log('평생:', PREMIUM_PRICE.lifetime); // 99,000원

console.log('기능:', PREMIUM_FEATURES.unlimitedTasks); // "무제한 테스크"
```

---

## 🔗 딥링크

### URL Scheme

- **iOS**: `dajeonghan://template/{id}`
- **Android**: `dajeonghan://template/{id}`
- **Universal/App Links**: `https://dajeonghan.app/template/{id}`

### 딥링크 처리

```typescript
import { TemplateSharingService } from '@/services/templateSharingService';

// 초기 URL 확인
await TemplateSharingService.checkInitialURL((templateId) => {
  console.log('템플릿 ID:', templateId);
  // 템플릿 상세 화면으로 이동
});

// URL 리스너 등록
const removeListener = TemplateSharingService.addURLListener((templateId) => {
  console.log('템플릿 ID:', templateId);
});

// 클린업
removeListener();
```

### 공유 링크 생성

```typescript
const { url, text } = await TemplateSharingService.generateShareLink('template123');
console.log('URL:', url);
console.log('Text:', text);

// 공유하기
await Share.share({
  message: text,
  url: url
});
```

### 딥링크 테스트

```bash
# iOS 시뮬레이터
xcrun simctl openurl booted dajeonghan://template/test123

# Android 에뮬레이터
adb shell am start -W -a android.intent.action.VIEW \
  -d "dajeonghan://template/test123" \
  com.onmindlab.dajeonghan
```

---

## 🛒 인앱 구매 (Mock)

### 초기화

```typescript
import { PurchaseService } from '@/services/purchaseService';

await PurchaseService.initialize();
```

### 상품 조회

```typescript
const products = await PurchaseService.getProducts();
console.log(products);
// [
//   { productId: 'dajeonghan_premium_monthly', price: '4,900원', ... },
//   { productId: 'dajeonghan_premium_yearly', price: '49,000원', ... }
// ]
```

### 구매

```typescript
await AnalyticsService.logPurchaseBegin('premium_monthly', 4900);

const success = await PurchaseService.purchase('dajeonghan_premium_monthly');

if (success) {
  await AnalyticsService.logPurchaseComplete('premium_monthly', 4900);
  // 프리미엄 상태 업데이트
}
```

### 구매 복원

```typescript
const restored = await PurchaseService.restorePurchases();
if (restored) {
  // 프리미엄 상태 복원
}
```

### 실제 인앱 구매 구현 시

```bash
npm install react-native-iap
```

`purchaseService.ts`에서 Mock 코드를 실제 `react-native-iap` 코드로 교체하세요.

---

## ☁️ Cloud Functions

### 재참여 캠페인

```typescript
// functions/src/index.ts
export const sendReengagementPush = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 10 * * *') // 매일 10시
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    // 7일 미접속 사용자에게 푸시 발송
  });
```

### 주간 리포트

```typescript
export const sendWeeklyReport = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 8 * * 1') // 월요일 8시
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    // 주간 통계 생성 및 푸시 발송
  });
```

### 스트릭 리마인더

```typescript
export const sendStreakReminder = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 21 * * *') // 매일 21시
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    // 오늘 활동 없는 사용자에게 리마인더
  });
```

### 배포

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 로그 확인

```bash
firebase functions:log --only sendReengagementPush
firebase functions:log --only sendWeeklyReport
firebase functions:log --only sendStreakReminder
```

---

## 🔔 푸시 알림 전략

### 빈도 제한

| 알림 유형 | 빈도 | 시간 | 조건 |
|----------|------|------|------|
| 재참여 | 7일에 1회 | 10:00 | 7일 미접속 |
| 주간 리포트 | 주 1회 | 월요일 08:00 | 다이제스트 모드 |
| 스트릭 리마인더 | 하루 1회 | 21:00 | 오늘 활동 없음 & 스트릭 3일+ |
| 오전 다이제스트 | 하루 1회 | 08:50 | 다이제스트 모드 |
| 저녁 다이제스트 | 하루 1회 | 19:50 | 다이제스트 모드 |

**⚠️ 중요**: 알림 피로 방지를 위해 빈도 제한을 엄격히 준수하세요.

---

## 📱 사용자 여정

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

---

## 📊 측정 및 최적화

### 핵심 전환점

1. **D1 → D3**: 첫 스트릭 달성 (목표: 60%)
2. **D7 → D14**: 주간 리포트 확인 (목표: 40%)
3. **D14 → D30**: 프리미엄 고려 (목표: 10%)
4. **D30 → D66**: 완전 습관화 (목표: 15%)

### Firebase Analytics 대시보드

1. **Engagement**
   - WAU (주간 활성 사용자)
   - 평균 세션 시간
   - 스크린 뷰 수

2. **Retention**
   - D1, D7, D30 리텐션
   - 코호트 분석

3. **Conversion**
   - 온보딩 완료율
   - 프리미엄 전환율
   - 템플릿 공유율

---

## 🚨 주의사항

### 1. 개인정보 보호

- ❌ **절대 수집 금지**: 이름, 이메일, 전화번호
- ✅ **수집 가능**: 익명 ID, 기기 정보, 행동 패턴
- ✅ **개인정보처리방침 필수**

### 2. 인앱 구매

- 현재 Mock 구현 상태
- 실제 결제 전 충분한 테스트 필요
- 영수증 검증 서버 구현 권장

### 3. 푸시 알림

- 알림 피로 방지가 최우선
- 사용자가 알림 설정 제어 가능해야 함
- 너무 자주 보내면 앱 삭제로 이어짐

---

## 📚 참고 자료

- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [React Native IAP](https://github.com/dooboolab/react-native-iap)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Expo Linking](https://docs.expo.dev/guides/linking/)
- [App Store 인앱 구매](https://developer.apple.com/in-app-purchase/)
- [Google Play 결제](https://developer.android.com/google/play/billing)

---

## 🎯 다음 단계

**⚠️ 중요**: Step 12 (템플릿 마켓플레이스)를 먼저 완료한 후 Step 11 (배포)를 진행합니다.

### Step 12: 템플릿 마켓플레이스
- 템플릿 생성/공유 전체 구현
- 템플릿 마켓플레이스 UI
- 좋아요/리뷰 시스템

### Step 11: 최종 배포
- 전체 테스트
- 스토어 제출

---

## ✅ Step 10 완료!

모든 성장 전략 및 수익화 기능이 구현되었습니다! 🎉

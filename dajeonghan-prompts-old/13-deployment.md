# 13. 테스트 및 배포

> **🎯 목표**: 안정적인 MVP를 스토어에 출시하고 지속적인 개선 프로세스를 구축

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 단위 테스트 통과 (핵심 로직 80% 커버리지)
- ✅ 통합 테스트 완료 (Firebase Emulator)
- ✅ 수동 테스트 체크리스트 완료
- ✅ EAS Build 성공 (Android/iOS)
- ✅ 스토어 메타데이터 작성 완료
- ✅ Google Play 또는 App Store 제출 완료

**예상 소요 시간**: 2-3일

---

## 🧪 테스트 전략

### 테스트 피라미드

```
       /\
      /UI\      ← E2E 테스트 (10%) - 중요 플로우만
     /────\
    /통합  \    ← 통합 테스트 (30%) - Firebase 연동
   /────────\
  /  단위    \  ← 단위 테스트 (60%) - 핵심 로직
 /────────────\
```

### 우선순위

1. **단위 테스트** (필수): RecurrenceEngine, PriorityCalculator 등 핵심 로직
2. **통합 테스트** (권장): Firebase CRUD 작동 확인
3. **E2E 테스트** (선택): 온보딩 → 테스크 완료 플로우

---

### 단위 테스트 (Jest)

`package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.0.0",
    "jest-expo": "^49.0.0"
  }
}
```

### 핵심 로직 테스트

`src/core/engines/__tests__/RecurrenceEngine.test.ts`:

```typescript
import { RecurrenceEngine } from '../RecurrenceEngine';
import { Task } from '@/types/task.types';
import { addDays } from 'date-fns';

describe('RecurrenceEngine', () => {
  const baseTask: Task = {
    id: 'test-task',
    userId: 'test-user',
    objectId: 'test-object',
    title: '테스트 테스크',
    type: 'cleaning',
    recurrence: {
      type: 'fixed',
      interval: 7,
      unit: 'day',
      nextDue: new Date('2026-04-15')
    },
    priority: 'medium',
    estimatedMinutes: 20,
    status: 'pending',
    notificationSettings: {
      enabled: true,
      timing: 'digest',
      advanceHours: [24]
    },
    completionHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('calculateNextDue', () => {
    it('should calculate next due date for daily recurrence', () => {
      const task = {
        ...baseTask,
        recurrence: {
          ...baseTask.recurrence,
          interval: 1,
          unit: 'day' as const
        }
      };

      const completedAt = new Date('2026-04-08');
      const nextDue = RecurrenceEngine.calculateNextDue(task, completedAt);

      expect(nextDue).toEqual(new Date('2026-04-09'));
    });

    it('should calculate next due date for weekly recurrence', () => {
      const task = {
        ...baseTask,
        recurrence: {
          ...baseTask.recurrence,
          interval: 1,
          unit: 'week' as const
        }
      };

      const completedAt = new Date('2026-04-08');
      const nextDue = RecurrenceEngine.calculateNextDue(task, completedAt);

      expect(nextDue).toEqual(new Date('2026-04-15'));
    });
  });

  describe('adjustRecurrenceByHistory', () => {
    it('should return null when history is insufficient', () => {
      const task = {
        ...baseTask,
        completionHistory: [
          { date: new Date(), postponed: false }
        ]
      };

      const result = RecurrenceEngine.adjustRecurrenceByHistory(task);

      expect(result).toBeNull();
    });

    it('should calculate average interval from history', () => {
      const task = {
        ...baseTask,
        completionHistory: [
          { date: new Date('2026-04-01'), postponed: false },
          { date: new Date('2026-04-06'), postponed: false },
          { date: new Date('2026-04-11'), postponed: false },
          { date: new Date('2026-04-16'), postponed: false }
        ]
      };

      const result = RecurrenceEngine.adjustRecurrenceByHistory(task);

      expect(result).toBe(5); // 평균 5일 간격
    });
  });

  describe('calculateElapsedRatio', () => {
    it('should calculate elapsed ratio correctly', () => {
      const task = {
        ...baseTask,
        recurrence: {
          ...baseTask.recurrence,
          lastCompleted: new Date('2026-04-01'),
          nextDue: new Date('2026-04-08')
        },
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01')
      };

      // 현재 날짜를 2026-04-05로 가정 (중간 지점)
      const mockNow = new Date('2026-04-05');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow as any);

      const ratio = RecurrenceEngine.calculateElapsedRatio(task);

      expect(ratio).toBeCloseTo(0.57, 1); // 약 57% 경과

      jest.restoreAllMocks();
    });
  });
});
```

`src/core/engines/__tests__/PriorityCalculator.test.ts`:

```typescript
import { PriorityCalculator } from '../PriorityCalculator';
import { Task } from '@/types/task.types';

describe('PriorityCalculator', () => {
  const createMockTask = (overrides: Partial<Task>): Task => ({
    id: 'test-task',
    userId: 'test-user',
    objectId: 'test-object',
    title: '테스트',
    type: 'cleaning',
    recurrence: {
      type: 'fixed',
      interval: 7,
      unit: 'day',
      nextDue: new Date(),
      lastCompleted: new Date()
    },
    priority: 'medium',
    estimatedMinutes: 20,
    status: 'pending',
    notificationSettings: {
      enabled: true,
      timing: 'digest',
      advanceHours: [24]
    },
    completionHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  describe('calculateDailyTasks', () => {
    it('should prioritize urgent tasks', () => {
      const tasks = [
        createMockTask({ 
          id: 'task-1',
          priority: 'low',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
          }
        }),
        createMockTask({ 
          id: 'task-2',
          priority: 'urgent',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: new Date(Date.now() - 24 * 60 * 60 * 1000) // 어제
          }
        })
      ];

      const result = PriorityCalculator.calculateDailyTasks(tasks, 5);

      expect(result[0].id).toBe('task-2'); // 긴급 테스크가 먼저
      expect(result[0].urgencyScore).toBeGreaterThan(result[1].urgencyScore);
    });

    it('should limit results to topN', () => {
      const tasks = Array.from({ length: 10 }, (_, i) => 
        createMockTask({ id: `task-${i}` })
      );

      const result = PriorityCalculator.calculateDailyTasks(tasks, 3);

      expect(result.length).toBe(3);
    });
  });

  describe('categorizeByTime', () => {
    it('should separate quick and leisure tasks', () => {
      const tasks = [
        { estimatedMinutes: 5 } as any,
        { estimatedMinutes: 10 } as any,
        { estimatedMinutes: 30 } as any,
        { estimatedMinutes: 60 } as any
      ];

      const result = PriorityCalculator.categorizeByTime(tasks);

      expect(result.quickTasks.length).toBe(2); // 5분, 10분
      expect(result.leisureTasks.length).toBe(2); // 30분, 60분
    });
  });
});
```

### 통합 테스트

`src/services/__tests__/firestoreService.test.ts`:

```typescript
import { FirestoreService } from '../firestoreService';
import { UserProfile } from '@/types/user.types';

// Firebase 에뮬레이터 사용
describe('FirestoreService', () => {
  beforeAll(async () => {
    // Firebase 에뮬레이터 연결
  });

  afterEach(async () => {
    // 테스트 데이터 정리
  });

  describe('saveUserProfile', () => {
    it('should save user profile to Firestore', async () => {
      const profile: UserProfile = {
        userId: 'test-user',
        persona: 'student_20s_male',
        environment: {
          hasWasher: true,
          hasDryer: false,
          usesCoinLaundry: false,
          cookingFrequency: 'sometimes',
          hasPet: false,
          householdSize: 1
        },
        notificationMode: 'digest',
        digestTimes: ['09:00', '20:00'],
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await FirestoreService.saveUserProfile(profile);

      const loaded = await FirestoreService.getUserProfile('test-user');

      expect(loaded).toBeTruthy();
      expect(loaded?.persona).toBe('student_20s_male');
    });
  });
});
```

## E2E 테스트 (선택)

`e2e/onboarding.test.ts`:

```typescript
import { by, device, element, expect as detoxExpect } from 'detox';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete onboarding successfully', async () => {
    // 페르소나 선택
    await detoxExpect(element(by.text('어떤 분이신가요?'))).toBeVisible();
    await element(by.id('persona-student_20s_male')).tap();

    // 질문 답변
    await detoxExpect(element(by.text('세탁기가 있나요?'))).toBeVisible();
    await element(by.text('있어요')).tap();

    // ... 나머지 질문

    // 첫 할 일 화면
    await detoxExpect(element(by.text('준비 완료!'))).toBeVisible();
    await element(by.text('시작하기')).tap();

    // 홈 화면 도달
    await detoxExpect(element(by.text('오늘'))).toBeVisible();
  });
});
```

## 빌드 및 배포

### EAS Build 설정

`eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "FIREBASE_API_KEY": "",
        "FIREBASE_PROJECT_ID": ""
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "123456789",
        "appleTeamId": "ABCD1234"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 빌드 명령어

```bash
# 개발 빌드 (푸시 알림 테스트용)
eas build --profile development --platform android

# 프리뷰 빌드 (내부 테스트)
eas build --profile preview --platform all

# 프로덕션 빌드
eas build --profile production --platform all

# 로컬 빌드 (선택)
eas build --profile production --platform android --local
```

### 제출 명령어

```bash
# Google Play 제출
eas submit --platform android --latest

# App Store 제출
eas submit --platform ios --latest
```

## 출시 전 체크리스트

### 기능 검증
- [ ] 온보딩 플로우 완료 가능
- [ ] 청소 테스크 생성/완료/미루기
- [ ] 냉장고 식재료 추가/임박 알림
- [ ] 약 복용 알림 정확성
- [ ] 로컬 알림 작동
- [ ] 오프라인 모드 (Firestore persistence)
- [ ] 계정 삭제 기능

### 성능 검증
- [ ] 앱 시작 시간 < 3초
- [ ] 화면 전환 부드러움 (60fps)
- [ ] 메모리 사용량 < 150MB
- [ ] 배터리 소모 정상 범위

### 보안 검증
- [ ] Firestore Rules 프로덕션 배포
- [ ] 사용자 데이터 격리 확인
- [ ] 약 정보 로컬 저장 확인
- [ ] HTTPS 통신만 사용

### 법적/정책 준수
- [ ] 개인정보처리방침 게시
- [ ] 이용약관 게시
- [ ] 건강 앱 면책 문구
- [ ] 앱 스토어 메타데이터 작성
- [ ] 스크린샷 준비 (5개 이상)

### 분석 설정
- [ ] Firebase Analytics 연동
- [ ] Crashlytics 오류 추적
- [ ] 핵심 이벤트 로깅 (온보딩, 완료, 미루기)

## 스토어 메타데이터

### Google Play

**앱 이름:**
```
다정한 - 생활 비서
```

**간단한 설명:**
```
다 정해주는 생활 관리. 청소·냉장고·약을 한 번에.
```

**상세 설명:**
```
🏠 다정한은 당신의 생활 비서입니다

매일 "뭘 해야 하지?"라는 고민에서 벗어나세요.
다정한이 오늘 할 일을 자동으로 추천해드립니다.

✨ 주요 기능

🧹 청소 관리
• 방별 청소 일정 자동 생성
• "10분 코스" 빠른 추천
• 환경에 맞는 맞춤 루틴

🥗 냉장고 관리
• 식재료 유통기한 자동 계산
• 임박 알림 (D-3, D-1)
• 소비기한 체계 반영

💊 약 복용 관리
• 정확한 시간 알림
• 복용 기록 자동 저장
• 리필 리마인더

🔔 스마트 알림
• 하루 2회 다이제스트 (기본)
• 알림 피로 최소화
• 사용자 맞춤 알림

📊 습관 형성
• 연속 사용 스트릭
• 주간 리포트
• 66일 습관화 시스템

🎯 5분 만에 시작
• 복잡한 설정 없음
• 즉시 가치 체감
• 페르소나별 템플릿

---

⚠️ 중요: 본 앱은 의료 기기가 아니며, 의료 조언을 제공하지 않습니다.
약 복용과 관련된 모든 결정은 의사 또는 약사와 상담하십시오.
```

**카테고리:**
```
생산성
```

**태그:**
```
생활관리, 청소, 냉장고, 약알림, 루틴, 습관, 생산성
```

### App Store

**Subtitle:**
```
다 정해주는 생활 관리
```

**Keywords:**
```
생활관리,청소,냉장고,약알림,루틴,습관,생산성,올인원,비서,리마인더
```

**Promotional Text:**
```
🎉 출시 기념! 프리미엄 7일 무료 체험
```

## 모니터링

### Firebase Crashlytics 설정

`App.tsx`:

```tsx
import * as Sentry from 'sentry-expo';
import crashlytics from '@react-native-firebase/crashlytics';

// Sentry 초기화 (선택)
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: true,
  debug: __DEV__
});

// Crashlytics 초기화
crashlytics().log('App started');

export default function App() {
  React.useEffect(() => {
    // 비정상 종료 리포트
    crashlytics().setCrashlyticsCollectionEnabled(true);
  }, []);

  return <RootNavigator />;
}
```

### 핵심 이벤트 로깅

`src/services/analyticsService.ts`:

```typescript
import analytics from '@react-native-firebase/analytics';

export class AnalyticsService {
  static async logOnboardingComplete(persona: string) {
    await analytics().logEvent('onboarding_complete', {
      persona
    });
  }

  static async logTaskComplete(taskType: string) {
    await analytics().logEvent('task_complete', {
      task_type: taskType
    });
  }

  static async logTaskPostpone(taskType: string) {
    await analytics().logEvent('task_postpone', {
      task_type: taskType
    });
  }

  static async logPremiumUpgrade(plan: string) {
    await analytics().logEvent('premium_upgrade', {
      plan
    });
  }
}
```

## 출시 후 1주일 계획

### Day 1-2: 모니터링
- Crashlytics 오류 체크
- 온보딩 완료율 확인
- D1 리텐션 측정

### Day 3-4: 핫픽스
- 치명적 버그 수정
- 긴급 패치 배포

### Day 5-7: 피드백 수집
- 앱 스토어 리뷰 모니터링
- 사용자 인터뷰 (가능 시)
- 다음 업데이트 계획

## 지속적 개선

### 주간 배포 주기
```
월요일: 기획/디자인
화요일-목요일: 개발
금요일: QA 및 빌드
토요일: 배포
일요일: 모니터링
```

### 다음 업데이트 후보
1. 바코드 스캔 (냉장고)
2. 영수증 OCR
3. 가족 공유
4. 위젯
5. Apple Watch 지원

---

## 최종 체크리스트

출시 전 이 체크리스트를 완료하세요:

- [ ] 모든 테스트 통과
- [ ] Firestore Rules 배포
- [ ] Firebase 프로덕션 프로젝트 설정
- [ ] 개인정보처리방침 URL 등록
- [ ] 스토어 메타데이터 작성
- [ ] 스크린샷 업로드 (각 5개)
- [ ] EAS 프로덕션 빌드
- [ ] 내부 테스트 (최소 3명)
- [ ] 앱 스토어 제출

🎉 축하합니다! 다정한 MVP 출시 준비가 완료되었습니다!

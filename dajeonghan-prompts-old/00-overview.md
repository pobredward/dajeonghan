# 00. 다정한(dajeonghan) - 프로젝트 개요

> **"사용자가 기억·결정·추적하지 않아도 되는 완벽한 생활 OS"**

## 📱 프로젝트 소개

### 다정한이란?

**다정한**은 일상생활의 모든 반복 작업을 자동으로 관리해주는 AI 기반 생활 비서 앱입니다. 
청소, 냉장고 관리, 약 복용을 하나의 앱에서 통합 관리하며, 사용자는 단순히 완료/미루기 버튼만 누르면 됩니다.

### 핵심 가치 제안

#### 🎯 사용자 관점
- **5분 안에 시작**: 복잡한 설정 없이 즉시 "오늘 할 일" 제공
- **결정 피로 제거**: 무엇을, 언제 해야 하는지 앱이 자동 판단
- **습관 자동 형성**: 66일 시스템으로 자연스러운 루틴 구축
- **알림 피로 최소화**: 하루 2회 다이제스트로 조용한 관리

#### 💼 비즈니스 관점
- **빠른 MVp**: 2-3주 내 출시 가능
- **명확한 수익 모델**: Freemium (무료 → 프리미엄 ₩4,900/월)
- **바이럴 성장**: 템플릿 공유로 자연스러운 확산
- **데이터 기반 개선**: Firebase Analytics로 사용자 행동 추적

### 경쟁사 대비 차별화

| 특징 | 다정한 | Tody | Sweepy | OurHome |
|------|-------|------|--------|---------|
| **통합 관리** | ✅ 청소+냉장고+약 | ❌ 청소만 | ❌ 청소만 | ✅ 가족 작업 |
| **자동 우선순위** | ✅ AI 기반 | ⚠️ 수동 설정 | ✅ 포인트 기반 | ❌ 없음 |
| **습관화 설계** | ✅ 66일 시스템 | ❌ 없음 | ⚠️ 연속 일수만 | ❌ 없음 |
| **오프라인 작동** | ✅ 완전 지원 | ✅ 지원 | ⚠️ 제한적 | ❌ 온라인 전용 |
| **익명 시작** | ✅ 가능 | ❌ 계정 필수 | ❌ 계정 필수 | ❌ 계정 필수 |
| **알림 피로 관리** | ✅ 다이제스트 | ❌ 개별 알림 | ❌ 개별 알림 | ⚠️ 제한적 |

---

## 🏗️ 아키텍처 개요

### 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                     다정한 앱                            │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer (UI)                                │
│  ├── React Native Components                            │
│  ├── React Navigation                                   │
│  └── Design System (Colors, Typography, Spacing)       │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  ├── Core Engines                                       │
│  │   ├── RecurrenceEngine (주기 자동 계산)              │
│  │   ├── PriorityCalculator (우선순위 정렬)             │
│  │   ├── PostponeEngine (미루기 패턴 분석)              │
│  │   └── NotificationOrchestrator (알림 스케줄링)       │
│  └── Domain Modules                                     │
│      ├── Cleaning Module (청소 관리)                    │
│      ├── Fridge Module (냉장고 관리)                    │
│      └── Medicine Module (약 관리)                      │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  ├── Firestore (클라우드 데이터)                         │
│  ├── Expo Secure Store (로컬 암호화)                    │
│  └── Zustand (상태 관리)                                 │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                   │
│  ├── Firebase Authentication (익명 + 이메일/소셜)        │
│  ├── Firebase Cloud Functions (서버리스)                │
│  ├── Expo Notifications (로컬 + 푸시)                   │
│  └── Firebase Analytics (행동 추적)                     │
└─────────────────────────────────────────────────────────┘
```

### 데이터 흐름

```
사용자 입력 → UI Component → Service Layer → Engine Logic
                                                    ↓
                                             Firestore 저장
                                                    ↓
                                          알림 스케줄링 ← Notification Service
                                                    ↓
                                            사용자에게 알림
```

---

## 🛠️ 기술 스택 상세

### Frontend 스택

#### 핵심 프레임워크
| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| **React Native** | 0.73+ | 크로스 플랫폼 앱 | iOS/Android 동시 개발 |
| **Expo SDK** | 50+ | 개발 환경 | 빠른 반복 개발, EAS Build |
| **TypeScript** | 5.0+ | 타입 안정성 | 대규모 코드베이스 관리 |

#### UI/UX 라이브러리
```bash
# 네비게이션
@react-navigation/native: 6.x
@react-navigation/bottom-tabs: 6.x
@react-navigation/stack: 6.x

# 상태관리
zustand: 4.x               # 경량 상태관리
react-query: 5.x           # 서버 상태 관리 (선택)

# UI 컴포넌트 (택 1)
react-native-paper: 5.x    # Material Design
native-base: 3.x           # 범용 컴포넌트

# 유틸리티
date-fns: 3.x              # 날짜 처리
lodash: 4.x                # 유틸리티 함수
```

### Backend 스택

#### Firebase 서비스
| 서비스 | 용도 | MVP 필수 | 비용 |
|--------|------|----------|------|
| **Authentication** | 사용자 인증 (익명, 이메일, 소셜) | ✅ | 무료 |
| **Firestore** | NoSQL 데이터베이스, 실시간 동기화 | ✅ | 무료 (50K reads/day) |
| **Cloud Functions** | 서버리스 로직 (다이제스트 발송) | ⚠️ 2단계 | 무료 (2M calls/month) |
| **Cloud Messaging** | 푸시 알림 | ⚠️ 2단계 | 무료 |
| **Analytics** | 사용자 행동 추적 | ✅ | 무료 |
| **Crashlytics** | 오류 모니터링 | ✅ | 무료 |
| **Storage** | 이미지 저장 (프로필 사진 등) | ⚠️ 2단계 | 무료 (5GB) |

#### 로컬 스토리지
```typescript
// 민감 정보 (약 데이터)
expo-secure-store          // AES-256 암호화

// 일반 데이터 (설정 등)
@react-native-async-storage/async-storage

// 오프라인 캐시
Firestore enableIndexedDbPersistence()
```

### 알림 스택

```typescript
// MVP: 로컬 알림만
expo-notifications         // 스케줄링 및 표시

// 2단계: 푸시 알림 추가
Firebase Cloud Messaging → Expo Push Service → 사용자 기기
```

### 개발 도구

#### 필수 도구
```bash
# 버전 관리
git: 2.40+

# Node.js 환경
node: 18.x LTS
npm: 9.x 또는 yarn: 1.22.x

# Firebase CLI
firebase-tools: 13.x

# Expo CLI
expo-cli: 6.x (내장)
eas-cli: 5.x (빌드용)
```

#### 추천 도구
```bash
# 코드 품질
eslint: 8.x
prettier: 3.x
typescript-eslint: 6.x

# 테스트
jest: 29.x
@testing-library/react-native: 12.x
firebase-tools (emulators)

# 디버깅
react-devtools: 5.x
reactotron: 3.x (선택)
flipper: 0.212.x (선택)
```

---

## 📂 프로젝트 구조 상세

```
dajeonghan/
├── src/
│   ├── core/                           # 공통 엔진 (도메인 독립적)
│   │   ├── engines/
│   │   │   ├── RecurrenceEngine.ts    # 주기 계산 (완료 → 다음 due)
│   │   │   ├── PostponeEngine.ts      # 미루기 로직 (패턴 분석)
│   │   │   ├── NotificationOrchestrator.ts  # 알림 조율
│   │   │   └── PriorityCalculator.ts  # 우선순위 점수 계산
│   │   ├── utils/
│   │   │   ├── dateUtils.ts           # 날짜 변환, 포맷
│   │   │   ├── storageUtils.ts        # 로컬 저장 헬퍼
│   │   │   └── validationUtils.ts     # 데이터 검증
│   │   └── LifeEngineService.ts       # 엔진 통합 인터페이스
│   │
│   ├── modules/                        # 도메인 모듈 (독립적)
│   │   ├── cleaning/
│   │   │   ├── components/
│   │   │   │   ├── CleaningCard.tsx
│   │   │   │   ├── RoomFilter.tsx
│   │   │   │   └── DirtyScoreBadge.tsx
│   │   │   ├── screens/
│   │   │   │   ├── CleaningHomeScreen.tsx
│   │   │   │   └── CleaningDetailScreen.tsx
│   │   │   ├── services/
│   │   │   │   └── cleaningService.ts  # 청소 로직
│   │   │   ├── templates/
│   │   │   │   └── cleaningTemplates.json
│   │   │   └── types.ts                # 청소 전용 타입
│   │   │
│   │   ├── fridge/
│   │   │   ├── components/
│   │   │   │   ├── FoodItemCard.tsx
│   │   │   │   ├── AddFoodForm.tsx
│   │   │   │   └── ExpiryBadge.tsx
│   │   │   ├── screens/
│   │   │   │   ├── FridgeHomeScreen.tsx
│   │   │   │   └── FoodDetailScreen.tsx
│   │   │   ├── services/
│   │   │   │   └── fridgeService.ts
│   │   │   ├── data/
│   │   │   │   └── foodDatabase.ts     # 300+ 식재료 DB
│   │   │   └── types.ts
│   │   │
│   │   └── medicine/
│   │       ├── components/
│   │       │   ├── MedicineCard.tsx
│   │       │   ├── DoseLog.tsx
│   │       │   └── RefillAlert.tsx
│   │       ├── screens/
│   │       │   ├── MedicineHomeScreen.tsx
│   │       │   └── MedicineDetailScreen.tsx
│   │       ├── services/
│   │       │   └── medicineService.ts
│   │       ├── storage/
│   │       │   └── secureStorage.ts    # 약 데이터 암호화
│   │       └── types.ts
│   │
│   ├── components/                     # 공통 UI 컴포넌트
│   │   ├── Button.tsx                  # 기본 버튼
│   │   ├── Card.tsx                    # 카드 컨테이너
│   │   ├── Badge.tsx                   # 배지 (우선순위 등)
│   │   ├── TaskCard.tsx                # 테스크 카드
│   │   ├── DigestList.tsx              # 다이제스트 목록
│   │   └── ProgressiveForm.tsx         # 단계별 폼
│   │
│   ├── services/                       # 인프라 서비스
│   │   ├── firebase/
│   │   │   ├── firebaseConfig.ts       # Firebase 초기화
│   │   │   ├── authService.ts          # 인증 로직
│   │   │   └── firestoreService.ts     # Firestore CRUD
│   │   ├── notifications/
│   │   │   ├── notificationService.ts  # 알림 스케줄링
│   │   │   ├── digestService.ts        # 다이제스트 생성
│   │   │   └── notificationScheduler.ts
│   │   └── analytics/
│   │       └── analyticsService.ts     # 이벤트 로깅
│   │
│   ├── navigation/                     # 네비게이션
│   │   ├── RootNavigator.tsx           # 루트 (온보딩 vs 메인)
│   │   ├── TabNavigator.tsx            # 하단 탭
│   │   └── types.ts                    # 네비게이션 타입
│   │
│   ├── screens/                        # 메인 화면
│   │   ├── onboarding/
│   │   │   ├── PersonaSelectionScreen.tsx
│   │   │   ├── QuestionScreen.tsx
│   │   │   ├── FirstTasksScreen.tsx
│   │   │   └── OnboardingFlow.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx          # 통합 홈
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── NotificationSettingsScreen.tsx
│   │       └── DeleteAccountScreen.tsx
│   │
│   ├── types/                          # TypeScript 타입
│   │   ├── task.types.ts               # Task, LifeObject
│   │   ├── user.types.ts               # UserProfile
│   │   ├── common.types.ts             # 공통 타입
│   │   └── navigation.types.ts         # 네비게이션 파라미터
│   │
│   ├── templates/                      # 템플릿 데이터
│   │   ├── personas.json               # 6가지 페르소나
│   │   ├── cleaningTemplates.json      # 청소 템플릿
│   │   └── questionFlow.json           # 온보딩 질문
│   │
│   ├── constants/                      # 상수
│   │   ├── Colors.ts                   # 색상 팔레트
│   │   ├── Typography.ts               # 폰트 스타일
│   │   ├── Spacing.ts                  # 간격, 그림자
│   │   ├── Config.ts                   # 앱 설정
│   │   └── Premium.ts                  # 프리미엄 설정
│   │
│   ├── hooks/                          # Custom Hooks
│   │   ├── useAuth.ts                  # 인증 상태
│   │   ├── useTasks.ts                 # 테스크 CRUD
│   │   ├── useNotifications.ts         # 알림 리스너
│   │   └── useTheme.ts                 # 테마 (다크 모드)
│   │
│   └── utils/                          # 범용 유틸리티
│       ├── firestoreUtils.ts           # Timestamp 변환
│       ├── formatters.ts               # 날짜/시간 포맷
│       └── validators.ts               # 입력 검증
│
├── assets/                             # 정적 파일
│   ├── images/
│   │   ├── onboarding/                 # 온보딩 일러스트
│   │   ├── icons/                      # 커스텀 아이콘
│   │   └── splash.png                  # 스플래시 이미지
│   ├── fonts/                          # 커스텀 폰트 (선택)
│   └── data/
│       └── foodDatabase.json           # 식재료 데이터
│
├── __tests__/                          # 테스트
│   ├── unit/
│   │   ├── engines/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   └── e2e/
│
├── functions/                          # Cloud Functions (2단계)
│   ├── src/
│   │   ├── index.ts
│   │   ├── notifications.ts            # 다이제스트 스케줄러
│   │   └── cleanup.ts                  # 데이터 정리
│   └── package.json
│
├── App.tsx                             # 앱 엔트리
├── app.json                            # Expo 설정
├── eas.json                            # EAS Build 설정
├── firebase.json                       # Firebase 설정
├── firestore.rules                     # Security Rules
├── firestore.indexes.json              # Firestore 인덱스
├── package.json
├── tsconfig.json
├── .env.example                        # 환경 변수 템플릿
└── .gitignore
```

### 핵심 디렉토리 설명

- **`/src/core`**: 도메인 독립적인 비즈니스 로직 (재사용성 최대화)
- **`/src/modules`**: 도메인별 독립 모듈 (청소/냉장고/약), 각각 완전 독립적
- **`/src/components`**: 프로젝트 전체에서 사용하는 공통 UI
- **`/src/services`**: 외부 서비스 연동 (Firebase, 알림 등)
- **`/src/screens`**: 페이지 수준 컴포넌트
- **`/src/templates`**: 정적 데이터 (JSON)

---

## 🎯 MVP 범위 정의

### 포함되는 기능 (MVP)

#### 1. 온보딩 시스템 ✅
- 페르소나 선택 (6가지)
- 환경 질문 (5개 이내)
- 템플릿 기반 자동 일정 생성
- "오늘 할 일" 즉시 표시

#### 2. 청소 모듈 ✅
- 방별 청소 관리 (거실, 침실, 화장실, 주방)
- "10분 코스" 빠른 추천
- 테스크 완료/미루기
- 더러움 점수 표시
- 환경 변수 대응 (세탁기 유무)

#### 3. 냉장고 모듈 ✅
- 식재료 추가 (수동 입력)
- 유통기한 자동 계산 (300+ 식재료 DB)
- 임박 알림 (D-3, D-1, D-day)
- 보관 조건별 수명 계산
- 식재료 목록 및 필터

#### 4. 약 모듈 ✅
- 약 정보 입력
- 정확한 시간 알림
- 복용 기록 저장
- 리필 리마인더 (7일치 남을 때)
- 로컬 암호화 저장

#### 5. 알림 시스템 ✅
- 로컬 알림만 (푸시는 2단계)
- 다이제스트 알림 (오전 9시, 저녁 8시)
- 약 복용 정확한 시간 알림
- 알림 모드 3가지 (조용한 비서, 강한 루틴, 필요할 때만)

#### 6. 데이터 관리 ✅
- Firebase 익명 인증
- Firestore 오프라인 지속성
- 실시간 동기화
- 계정 삭제 기능

#### 7. 기본 UI/UX ✅
- 디자인 시스템 (Colors, Typography, Spacing)
- 홈 화면 (10분 코스 + 여유 있을 때)
- 하단 탭 네비게이션 (홈, 청소, 냉장고, 약, 설정)
- 공통 컴포넌트 (Button, Card, Badge)

#### 8. 법적 준수 ✅
- 개인정보처리방침
- 이용약관
- 건강 앱 면책 조항
- 계정 삭제 기능

### 제외되는 기능 (2단계)

#### 푸시 알림
- Firebase Cloud Messaging
- 서버 기반 스케줄링
- 백그라운드 알림

#### 고급 입력
- 바코드 스캔
- 영수증 OCR
- 사진 인식 AI

#### 협업 기능
- 가족 공유
- 룸메이트 모드
- 역할 분담

#### 프리미엄 기능
- 무제한 데이터
- 멀티 디바이스
- 고급 분석
- 우선 지원

#### 통합 연동
- 스마트홈 연동
- 캘린더 동기화
- 위젯

---

## 📊 개발 단계 흐름

### Phase 별 의존성

```
Phase 1 (프로젝트 설정)
    ↓
Phase 2 (데이터 모델 + 공통 엔진)
    ↓
    ├─→ Phase 3a (청소 모듈) ──┐
    ├─→ Phase 3b (냉장고 모듈) ├─→ Phase 4 (온보딩 + 알림)
    └─→ Phase 3c (약 모듈) ────┘         ↓
                              Phase 5 (Firebase + UI)
                                         ↓
                              Phase 6 (법적 + 성장)
                                         ↓
                              Phase 7 (테스트 + 배포)
```

### 병렬 작업 가능 구간

- **Phase 3**: 청소/냉장고/약 모듈은 서로 독립적이므로 병렬 개발 가능
- **Phase 5**: Firebase 설정과 UI 작업은 부분적으로 병렬 가능
- **Phase 6**: 법적 문서는 개발과 독립적으로 진행 가능

---

## 🎨 디자인 철학

### UI/UX 원칙

1. **명확성 (Clarity)**
   - 한눈에 이해되는 정보 구조
   - 불필요한 요소 제거
   - 명확한 행동 유도 (CTA)

2. **일관성 (Consistency)**
   - 동일한 패턴 반복
   - 통일된 색상/타이포그래피
   - 예측 가능한 동작

3. **효율성 (Efficiency)**
   - 최소 탭으로 목표 달성
   - 자동화된 입력 (스마트 기본값)
   - 빠른 완료/미루기 액션

4. **피드백 (Feedback)**
   - 즉각적인 시각적 피드백
   - 명확한 성공/실패 메시지
   - 진행 상황 표시

### 디자인 시스템 미리보기

```typescript
// 색상 팔레트
Primary: #2196F3     // 신뢰감 있는 파란색
Secondary: #4CAF50   // 완료 시 녹색
Accent: #FF9800      // 경고/미루기 주황색
Error: #F44336       // 오류 빨간색

// 타이포그래피
H1: 32px, Bold       // 주요 제목
H2: 28px, Bold       // 섹션 제목
H3: 24px, Semibold   // 카드 제목
Body: 16px, Regular  // 본문

// 간격
XS: 4px, SM: 8px, MD: 16px, LG: 24px, XL: 32px
```

---

## 📖 다음 단계 가이드

### 1단계: 환경 설정
👉 **[01-project-setup.md](./01-project-setup.md)** 파일로 이동
- Expo 프로젝트 생성
- Firebase 연동
- 필수 패키지 설치
- 폴더 구조 생성

**예상 소요 시간**: 2-3시간

### 2단계: 데이터 모델링
👉 **[02-data-models.md](./02-data-models.md)** 파일로 이동
- TypeScript 타입 정의
- Firestore 스키마 설계
- 데이터 변환 유틸리티

**예상 소요 시간**: 3-4시간

### 계속 진행...
각 단계를 완료하면서 체크리스트를 채워나가세요!

---

## 💡 핵심 인사이트

### 왜 이 구조인가?

1. **공통 엔진 분리**: 모든 모듈이 공통 로직 재사용 → 코드 중복 제거
2. **모듈 독립성**: 청소/냉장고/약을 독립적으로 개발/테스트 가능
3. **오프라인 우선**: 인터넷 없이도 완벽한 사용자 경험
4. **점진적 공개**: 복잡한 기능은 사용 후 단계적 노출

### 성공의 핵심

- ⏱️ **빠른 가치 제공**: 온보딩 5분 내 "오늘 할 일" 표시
- 🧠 **인지 부담 최소화**: 완료/미루기 버튼만
- 🔔 **알림 피로 관리**: 하루 2회 다이제스트
- 📱 **오프라인 작동**: 언제 어디서나 사용 가능

---

<p align="center">
  <strong>프로젝트 구조를 이해했다면 01-project-setup.md로 넘어가세요!</strong>
</p>

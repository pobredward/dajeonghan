# 다정한(dajeonghan) - 생활 비서 앱 개발 가이드

> **생활의 모든 것을 기억하고 알려주는 똑똑한 비서**  
> React Native(Expo) + Firebase 기반 올인원 생활 관리 애플리케이션

## 📖 이 문서에 대하여

이 프롬프트 모음은 AI 개발 도구(Cursor, GitHub Copilot 등)와 함께 사용하여 **다정한** 앱을 단계별로 구축하기 위한 완전한 가이드입니다. 각 단계는 독립적으로 실행 가능하며, 순차적으로 진행하면 완전한 MVP를 구축할 수 있습니다.

### 사용 방법
1. 각 `.md` 파일을 순서대로 AI 도구에 제공
2. 파일 내 코드 예제를 그대로 사용하거나 프로젝트에 맞게 수정
3. 체크리스트를 활용하여 진행 상황 추적

### 예상 개발 기간
- **Full-time 개발자**: 2-3주 (MVP)
- **Part-time 개발자**: 4-6주 (MVP)
- **팀 개발**: 1-2주 (MVP)

## 📋 단계별 개발 로드맵

### Phase 1: 프로젝트 기반 구축 (1-2일)
**목표**: 프로젝트 뼈대 완성 및 개발 환경 설정

📄 **01-project-setup.md** 진행
- ✅ Expo 프로젝트 생성 및 TypeScript 설정
- ✅ Firebase 프로젝트 연동 (Authentication, Firestore)
- ✅ 폴더 구조 생성 (src/core, src/modules, src/services)
- ✅ 필수 패키지 설치 (React Navigation, date-fns, zustand)

**완료 기준**: `npx expo start` 실행 시 빈 화면 표시

---

### Phase 2: 데이터 구조 및 핵심 로직 (2-3일)
**목표**: 앱의 두뇌 역할을 하는 공통 엔진 구현

📄 **02-data-models.md** → **03-core-engine.md** 순차 진행
- ✅ TypeScript 타입 정의 (Task, User, LifeObject)
- ✅ Firestore 스키마 설계 및 Security Rules
- ✅ RecurrenceEngine: 주기 자동 계산 로직
- ✅ PriorityCalculator: 우선순위 자동 정렬
- ✅ PostponeEngine: 미루기 패턴 분석
- ✅ NotificationOrchestrator: 알림 스케줄링

**완료 기준**: 단위 테스트 통과 (Jest)

---

### Phase 3: 도메인 모듈 구현 (3-4일)
**목표**: 청소, 냉장고, 약 기능 완성

📄 **04-cleaning.md** → **05-fridge.md** → **06-medicine.md** 순차 진행

**청소 모듈 (1-1.5일)**
- ✅ 방별 청소 관리 (거실, 침실, 화장실, 주방)
- ✅ "10분 코스" 빠른 추천 알고리즘
- ✅ 더러움 점수(dirtyScore) 자동 계산
- ✅ 환경 변수 대응 (세탁기 유무, 코인세탁)

**냉장고 모듈 (1-1.5일)**
- ✅ 식재료 유통기한 자동 계산 (보관 조건별)
- ✅ 임박 알림 (D-3, D-1, D-day)
- ✅ 소비기한 vs 유통기한 체계 반영
- ✅ 식재료 데이터베이스 (300+ 항목)

**약 모듈 (1일)**
- ✅ 정확한 시간 알림 (식전/식후 구분)
- ✅ 복용 기록 자동 저장
- ✅ 리필 리마인더 (7일치 남을 때)
- ✅ 로컬 암호화 저장 (보안)

**완료 기준**: 각 모듈 화면에서 CRUD 작동

---

### Phase 4: 사용자 경험 구축 (2-3일)
**목표**: 온보딩부터 일상 사용까지 완성

📄 **07-onboarding.md** → **08-notifications.md** 순차 진행

**온보딩 시스템 (1일)**
- ✅ 페르소나 선택 (6가지 사전 정의)
- ✅ 5분 내 완료 가능한 질문 플로우
- ✅ 템플릿 기반 자동 일정 생성
- ✅ "오늘 할 일 5개" 즉시 표시

**알림 시스템 (1-2일)**
- ✅ 로컬 알림 설정 (expo-notifications)
- ✅ 다이제스트 생성 로직 (오전/저녁)
- ✅ 알림 모드 3가지 (조용한 비서, 강한 루틴, 필요할 때만)
- ✅ 알림 피로 관리 (하루 최대 5개 제한)

**완료 기준**: 온보딩 완료 후 첫 알림 수신

---

### Phase 5: 백엔드 및 UI 완성 (2-3일)
**목표**: Firebase 연동 및 디자인 시스템 구축

📄 **09-firebase.md** → **10-ui-ux.md** 순차 진행

**Firebase 설정 (1일)**
- ✅ Security Rules 프로덕션 배포
- ✅ Firestore 인덱스 생성
- ✅ 익명 인증 설정
- ✅ 오프라인 지속성 활성화

**UI/UX 구현 (1-2일)**
- ✅ 디자인 시스템 (Colors, Typography, Spacing)
- ✅ 공통 컴포넌트 (Button, Card, Badge)
- ✅ 홈 화면 구현 (10분 코스 + 여유 있을 때)
- ✅ 네비게이션 (Tab + Stack)

**완료 기준**: 홈 화면에서 테스크 완료/미루기 작동

---

### Phase 6: 법적 준수 및 비즈니스 로직 (1-2일)
**목표**: 출시 가능 상태 만들기

📄 **11-privacy.md** → **12-growth.md** 순차 진행

**법적 문서 (0.5일)**
- ✅ 개인정보처리방침 작성
- ✅ 이용약관 작성
- ✅ 건강 앱 면책 안내
- ✅ 계정 삭제 기능 구현

**성장 메커니즘 (0.5-1일)**
- ✅ 습관화 스트릭 시스템
- ✅ 주간 리포트 생성
- ✅ 템플릿 공유 기능
- ✅ 프리미엄 게이트 설정

**완료 기준**: 개인정보처리방침 URL 접근 가능

---

### Phase 7: 테스트 및 출시 (2-3일)
**목표**: 스토어 제출 및 배포

📄 **13-deployment.md** 진행

**테스트 (1일)**
- ✅ 단위 테스트 작성 (Jest)
- ✅ 통합 테스트 (Firebase Emulator)
- ✅ 수동 테스트 체크리스트 완료

**빌드 및 배포 (1-2일)**
- ✅ EAS Build 설정 및 실행
- ✅ 스토어 메타데이터 작성
- ✅ 스크린샷 촬영 (각 5개)
- ✅ Google Play / App Store 제출

**완료 기준**: 스토어에서 "심사 중" 상태

---

## ⏱️ 총 예상 기간
- **최소 (Full-time)**: 12-16일
- **현실적 (Full-time)**: 3-4주
- **여유 있게 (Part-time)**: 6-8주

## 🎯 핵심 원칙 요약

### 제품 철학
1. **즉시 가치 제공**: 온보딩 5분 내 "오늘 할 일" 자동 생성
2. **인지 부담 제로**: 사용자는 완료/미루기 버튼만 누르면 됨
3. **점진적 공개**: 고급 설정은 사용 7일 후 단계적 노출
4. **알림 피로 관리**: 하루 2회 다이제스트 기본, 개별 알림 최소화

### 기술 전략
1. **오프라인 우선**: Firestore persistence로 인터넷 없이도 작동
2. **로컬 알림 우선**: 푸시 알림은 2단계, MVP는 로컬만
3. **익명 시작 가능**: 계정 생성 없이 바로 사용, 나중에 연결 가능
4. **모듈형 아키텍처**: 공통 엔진 + 독립적 도메인 모듈

### 성장 전략
1. **습관화 설계**: 66일 연속 사용 목표, 마일스톤 보상
2. **바이럴 루프**: 템플릿 공유 기능으로 자연스러운 확산
3. **프리미엄 전환**: 데이터가 쌓인 후 업그레이드 제안

## 🚀 빠른 시작 가이드

### 사전 요구사항
```bash
# Node.js 18+ 설치 확인
node --version  # v18.0.0 이상

# npm 또는 yarn 설치 확인
npm --version   # 9.0.0 이상

# Git 설치 확인
git --version
```

### 1단계: 프로젝트 생성
```bash
# Expo 프로젝트 생성
npx create-expo-app@latest dajeonghan --template expo-template-blank-typescript
cd dajeonghan

# Git 초기화 (선택사항)
git init
git add .
git commit -m "Initial commit: Expo TypeScript project"
```

### 2단계: 필수 패키지 설치
```bash
# 네비게이션 및 UI
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# Firebase
npx expo install firebase

# 알림
npx expo install expo-notifications expo-device expo-constants

# 상태관리 및 유틸리티
npm install zustand date-fns

# UI 라이브러리 (선택 - 둘 중 하나)
npx expo install react-native-paper  # Material Design
# 또는
npm install native-base              # NativeBase

# 개발 도구
npm install --save-dev @types/react @types/react-native
npm install --save-dev jest @testing-library/react-native
```

### 3단계: Firebase 설정
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화
firebase init
# 선택: Firestore, Authentication, Functions, Emulators
```

### 4단계: 개발 서버 실행
```bash
# 터미널 1: Expo 개발 서버
npx expo start

# 터미널 2: Firebase 에뮬레이터 (선택)
firebase emulators:start

# Expo Go 앱에서 QR 스캔하여 테스트
```

### 5단계: 테스트 실행
```bash
# 단위 테스트
npm test

# 커버리지 포함
npm test -- --coverage

# 워치 모드
npm test -- --watch
```

### 6단계: 프로덕션 빌드 (나중에)
```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 빌드 설정
eas build:configure

# Android 빌드
eas build --profile production --platform android

# iOS 빌드
eas build --profile production --platform ios
```

## ✅ MVP 개발 체크리스트

### 기능 완성도
- [ ] **온보딩 플로우** (5분 이내 완료 가능)
  - [ ] 페르소나 선택 화면
  - [ ] 환경 설정 질문 (5개 이하)
  - [ ] 템플릿 기반 일정 자동 생성
  - [ ] "오늘 할 일" 즉시 표시
  
- [ ] **청소 모듈**
  - [ ] 방별 청소 목록 관리
  - [ ] "10분 코스" 자동 추천
  - [ ] 테스크 완료/미루기 기능
  - [ ] 더러움 점수 표시
  
- [ ] **냉장고 모듈**
  - [ ] 식재료 추가/수정/삭제
  - [ ] 유통기한 자동 계산
  - [ ] 임박 알림 (D-3, D-1, D-day)
  - [ ] 보관 조건별 필터링
  
- [ ] **약 모듈**
  - [ ] 약 정보 입력
  - [ ] 복용 시간 알림
  - [ ] 복용 기록 저장
  - [ ] 리필 리마인더
  
- [ ] **알림 시스템**
  - [ ] 로컬 알림 권한 요청
  - [ ] 다이제스트 알림 (하루 2회)
  - [ ] 약 복용 정확한 시간 알림
  - [ ] 알림 설정 화면

- [ ] **데이터 관리**
  - [ ] 오프라인 작동 (Firestore persistence)
  - [ ] 자동 동기화
  - [ ] 데이터 백업
  - [ ] 계정 삭제 기능

### 품질 기준
- [ ] **성능**
  - [ ] 앱 시작 시간 < 3초
  - [ ] 화면 전환 60fps 유지
  - [ ] 메모리 사용량 < 150MB
  - [ ] 배터리 소모 정상 범위
  
- [ ] **안정성**
  - [ ] 크래시 없음 (최소 30분 사용)
  - [ ] 오류율 < 1%
  - [ ] 오프라인에서 정상 작동
  - [ ] 네트워크 재연결 시 동기화
  
- [ ] **테스트**
  - [ ] 단위 테스트 통과 (핵심 로직)
  - [ ] 통합 테스트 통과 (Firebase)
  - [ ] 수동 테스트 완료 (전체 플로우)
  - [ ] 실제 기기 테스트 (Android/iOS)

### 법적 요구사항
- [ ] **개인정보 보호**
  - [ ] 개인정보처리방침 작성 및 게시
  - [ ] 이용약관 작성 및 게시
  - [ ] 계정 삭제 기능 구현
  - [ ] 데이터 다운로드 기능 (선택)
  
- [ ] **건강 앱 준수**
  - [ ] 면책 조항 표시
  - [ ] "의료 기기 아님" 명시
  - [ ] 약물 상호작용 경고 없음 안내
  - [ ] 응급상황 대응 불가 안내

### 출시 준비
- [ ] **스토어 메타데이터**
  - [ ] 앱 이름 및 설명 작성
  - [ ] 키워드 선정 (10개)
  - [ ] 스크린샷 준비 (각 플랫폼 5개)
  - [ ] 아이콘 디자인 (1024x1024)
  
- [ ] **빌드 및 배포**
  - [ ] EAS Build 설정 완료
  - [ ] 프로덕션 빌드 성공
  - [ ] 내부 테스트 완료 (최소 3명)
  - [ ] 베타 테스트 (선택, 10-50명)

### 모니터링 설정
- [ ] Firebase Analytics 연동
- [ ] Firebase Crashlytics 설정
- [ ] 핵심 이벤트 로깅
  - [ ] 온보딩 완료
  - [ ] 테스크 완료/미루기
  - [ ] 알림 탭
  - [ ] 모듈 사용 빈도

## 🎓 출시 기준 및 성공 지표

### 출시 가능 기준

#### 기능 완성도
- ✅ 모든 MVP 핵심 기능 작동
- ✅ 온보딩부터 일상 사용까지 완전한 플로우
- ✅ 3가지 모듈 모두 CRUD 가능
- ✅ 알림이 정확한 시간에 발송됨

#### 성능 벤치마크
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 앱 시작 시간 | < 3초 | 스플래시부터 홈 화면까지 |
| 프레임률 | 60fps | React DevTools Profiler |
| 메모리 사용 | < 150MB | Android Studio/Xcode |
| 배터리 소모 | < 5%/hour | 일반 사용 시 |
| 크래시율 | < 1% | Firebase Crashlytics |

#### 법적 준수
- ✅ 개인정보처리방침 URL 접근 가능
- ✅ 이용약관 동의 체크박스 구현
- ✅ 건강 앱 면책 조항 표시
- ✅ 계정 삭제 기능 정상 작동
- ✅ 앱 스토어 정책 준수 확인

### 성공 지표 (KPI)

#### 단기 지표 (출시 1개월)
- **온보딩 완료율**: 목표 70% 이상
- **D1 리텐션**: 목표 40% 이상
- **D7 리텐션**: 목표 25% 이상
- **일 평균 사용 시간**: 목표 3-5분
- **테스크 완료율**: 목표 60% 이상

#### 중기 지표 (출시 3개월)
- **D30 리텐션**: 목표 15% 이상
- **MAU (월 활성 사용자)**: 목표 1,000명
- **주 3회 이상 사용**: 목표 40%
- **평균 리뷰 점수**: 목표 4.0+
- **템플릿 공유 횟수**: 목표 100회

#### 장기 지표 (출시 6개월)
- **66일 연속 사용률**: 목표 10%
- **프리미엄 전환율**: 목표 5%
- **NPS (Net Promoter Score)**: 목표 30+
- **바이럴 계수 (K-factor)**: 목표 0.5+

## 🐛 문제 해결 가이드

### 자주 발생하는 이슈와 해결 방법

#### 1. Firebase 권한 오류
**증상**: "Missing or insufficient permissions" 에러
```
Error: [FirebaseError] PERMISSION_DENIED: Missing or insufficient permissions
```

**해결 방법**:
```bash
# 1. Security Rules 확인
firebase deploy --only firestore:rules

# 2. 익명 인증 활성화 확인
# Firebase Console → Authentication → Sign-in method → Anonymous 활성화

# 3. 로컬 에뮬레이터 사용 시
firebase emulators:start
# firebaseConfig.ts에서 에뮬레이터 연결 확인
```

**예방**:
- 개발 초기에는 테스트 모드 사용
- 프로덕션 전 Security Rules 단위 테스트 작성

---

#### 2. 알림이 안 옴
**증상**: 스케줄링은 되지만 알림이 표시되지 않음

**해결 방법**:
```typescript
// 1. 권한 확인
const { status } = await Notifications.getPermissionsAsync();
console.log('Notification permission:', status);

// 2. 스케줄된 알림 확인
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled);

// 3. Android 채널 확인 (Android만)
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
  });
}
```

**주의사항**:
- iOS 시뮬레이터에서는 푸시 알림 테스트 불가
- 로컬 알림은 실제 기기 권장
- EAS Build 필요 (푸시 알림 테스트 시)

---

#### 3. 오프라인 동작 안 함
**증상**: 인터넷 끊으면 데이터 로드 실패

**해결 방법**:
```typescript
// firebaseConfig.ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db, {
  synchronizeTabs: true
}).catch((err) => {
  console.error('Persistence error:', err.code);
});

// 인덱스 생성 확인
firebase deploy --only firestore:indexes
```

**디버깅**:
```bash
# Chrome DevTools → Application → IndexedDB 확인
# firestore_[project-id]_[user-id] 데이터베이스 존재 여부
```

---

#### 4. TypeScript 타입 오류
**증상**: Firestore Timestamp ↔ Date 변환 오류

**해결 방법**:
```typescript
// src/utils/firestoreUtils.ts 생성
import { Timestamp } from 'firebase/firestore';

export const toDate = (timestamp: Timestamp | Date): Date => {
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
};

export const toTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// 사용 예시
const task: Task = {
  ...data,
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt)
};
```

---

#### 5. Expo Go에서 Firebase 연결 안 됨
**증상**: "Firebase: Error (auth/api-key-not-valid)"

**해결 방법**:
```bash
# 1. .env 파일 확인
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project

# 2. app.json에 환경 변수 주입
{
  "expo": {
    "extra": {
      "firebaseApiKey": process.env.FIREBASE_API_KEY
    }
  }
}

# 3. 개발 빌드 사용 (권장)
npx expo install expo-dev-client
eas build --profile development
```

---

#### 6. 테스트 실패
**증상**: Jest 테스트가 Firebase 모듈에서 실패

**해결 방법**:
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};

// jest.setup.js
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
```

---

### 추가 리소스
- **Firebase 공식 문서**: https://firebase.google.com/docs
- **Expo 공식 문서**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org/docs
- **커뮤니티 포럼**: 
  - Expo Forums: https://forums.expo.dev
  - Stack Overflow: 태그 `expo`, `react-native`, `firebase`

## 🗺️ MVP 이후 로드맵

### Phase 2.0 기능 (출시 후 1-2개월)

#### 사용성 개선
- **위젯 지원**
  - iOS Home Screen Widget
  - Android Home Screen Widget
  - "오늘 할 일" 요약 표시
  
- **Apple Watch / Wear OS**
  - 테스크 완료 체크
  - 약 복용 알림 수신
  - 빠른 미루기 기능

- **음성 인터페이스**
  - Siri Shortcuts 통합
  - Google Assistant Actions
  - "오늘 할 일 알려줘"

#### 데이터 입력 자동화
- **바코드 스캔** (냉장고 모듈)
  - expo-barcode-scanner 사용
  - 식재료 자동 인식 및 추가
  - 유통기한 자동 파싱
  
- **영수증 OCR**
  - Google ML Kit Vision API
  - 구매 날짜 자동 추출
  - 식재료 목록 자동 생성

- **사진 인식**
  - 냉장고 내부 사진 촬영
  - AI가 식재료 자동 감지
  - 수량 추정 및 알림

### Phase 3.0 기능 (출시 후 3-6개월)

#### 협업 기능
- **가족 공유**
  - 최대 5명까지 하나의 집 공유
  - 역할 분담 (청소 담당자 지정)
  - 완료 알림 (누가 했는지 표시)
  
- **룸메이트 모드**
  - 개인/공용 테스크 구분
  - 공용 물품 관리
  - 비용 분담 기능

#### 고급 분석
- **패턴 인사이트**
  - "주말에 청소를 더 잘해요"
  - "채소류를 자주 버려요"
  - "약 복용률이 낮아졌어요"
  
- **맞춤 추천**
  - 식재료 구매 추천
  - 청소 루틴 최적화
  - 비슷한 사용자 템플릿 추천

#### 통합 연동
- **스마트홈 연동**
  - 로봇 청소기 연동 (Roborock, iRobot)
  - 스마트 냉장고 연동 (삼성, LG)
  - 공기청정기 연동 (필터 교체 알림)
  
- **캘린더 동기화**
  - Google Calendar
  - Apple Calendar
  - Microsoft Outlook

### 프리미엄 기능 로드맵

#### Tier 1: Basic (무료)
- 테스크 최대 50개
- 식재료 최대 30개
- 약 최대 5개
- 단일 기기
- 기본 알림

#### Tier 2: Pro (₩4,900/월 or ₩49,000/년)
- **무제한 데이터**
  - 테스크, 식재료, 약 무제한
  
- **멀티 디바이스**
  - 최대 3대 기기 동기화
  
- **고급 알림**
  - 위치 기반 알림
  - 알림 커스터마이징
  
- **데이터 분석**
  - 주간/월간 리포트
  - 패턴 분석
  
- **우선 지원**
  - 24시간 이내 답변

#### Tier 3: Family (₩9,900/월)
- Pro 모든 기능
- **가족 공유** (최대 5명)
- **공용 물품 관리**
- **역할 분담 기능**
- **가족 리포트**

### 기술 부채 정리 (지속적)
- [ ] 코드 리팩토링 (공통 로직 추출)
- [ ] 테스트 커버리지 80% 달성
- [ ] 성능 최적화 (React.memo, useMemo)
- [ ] 접근성 개선 (WCAG 2.1 준수)
- [ ] 다국어 지원 (i18n)

## 📚 프롬프트 파일 가이드

각 프롬프트 파일은 특정 기능 영역을 다루며, 완전한 코드 예제와 설명을 포함합니다.

### 핵심 프롬프트 (필수)

| 파일 | 내용 | 예상 시간 | 난이도 |
|------|------|-----------|--------|
| **00-overview.md** | 프로젝트 전체 개요 및 아키텍처 | 30분 (읽기) | ⭐ |
| **01-project-setup.md** | 프로젝트 생성 및 환경 설정 | 2-3시간 | ⭐⭐ |
| **02-data-models.md** | TypeScript 타입 및 Firestore 스키마 | 3-4시간 | ⭐⭐⭐ |
| **03-core-engine.md** | 주기/미루기/알림/우선순위 엔진 | 1-2일 | ⭐⭐⭐⭐ |
| **04-cleaning.md** | 청소 모듈 구현 | 1-1.5일 | ⭐⭐⭐ |
| **05-fridge.md** | 냉장고 모듈 구현 | 1-1.5일 | ⭐⭐⭐ |
| **06-medicine.md** | 약 모듈 구현 | 1일 | ⭐⭐⭐ |
| **07-onboarding.md** | 온보딩 플로우 및 템플릿 | 1일 | ⭐⭐⭐ |
| **08-notifications.md** | 알림 시스템 구현 | 1-2일 | ⭐⭐⭐⭐ |
| **09-firebase.md** | Firebase 설정 및 Security Rules | 1일 | ⭐⭐⭐ |
| **10-ui-ux.md** | 디자인 시스템 및 UI 컴포넌트 | 1-2일 | ⭐⭐⭐ |
| **11-privacy.md** | 법적 문서 및 개인정보 보호 | 0.5-1일 | ⭐⭐ |
| **12-growth.md** | 습관화 및 수익화 전략 | 0.5-1일 | ⭐⭐ |
| **13-deployment.md** | 테스트 및 스토어 배포 | 2-3일 | ⭐⭐⭐⭐ |

### 학습 리소스 (선택)
- **공식 문서 링크**: 각 프롬프트 파일 하단 참조
- **코드 예제**: 실제 프로덕션 코드 기준으로 작성
- **베스트 프랙티스**: 업계 표준 및 검증된 패턴

### 사용 팁
1. **순차적 진행**: 번호 순서대로 진행 권장
2. **병렬 작업 가능**: 04-06 (모듈)은 병렬 가능
3. **체크포인트**: 각 파일 완료 후 테스트 실행
4. **커밋 전략**: 각 프롬프트 완료 시 Git 커밋

---

## 🤝 기여 및 피드백

### 이슈 리포트
발견한 버그나 개선 사항이 있다면:
1. GitHub Issues에 등록
2. 재현 방법 상세히 기술
3. 환경 정보 포함 (OS, Node 버전, Expo 버전)

### 개선 제안
- 새로운 기능 아이디어
- 프롬프트 개선 사항
- 문서 오타 수정

---

## 📞 지원

### 공식 리소스
- **Firebase 문서**: https://firebase.google.com/docs
- **Expo 문서**: https://docs.expo.dev
- **React Native 문서**: https://reactnative.dev/docs
- **React Navigation**: https://reactnavigation.org

### 커뮤니티
- **Expo Discord**: https://chat.expo.dev
- **React Native Discord**: https://discord.gg/reactnative
- **Stack Overflow**: 태그 `expo`, `react-native`, `firebase`

### 긴급 문의
각 .md 파일에 상세한 트러블슈팅 섹션이 포함되어 있습니다.
막히는 부분이 있으면 해당 파일의 "문제 해결" 섹션을 먼저 확인하세요.

---

## 🎉 시작하기

**준비되셨나요?**

👉 **[00-overview.md](./00-overview.md)** 파일을 열어 프로젝트 개요부터 시작하세요!

각 단계를 완료하면서 체크리스트에 체크하고, 
막히는 부분이 있으면 해당 프롬프트 파일의 트러블슈팅 섹션을 참고하세요.

**Happy Coding! 🚀**

---

<p align="center">
  <sub>Made with ❤️ for developers who want to build life-changing apps</sub>
</p>

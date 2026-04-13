# 다정한 (Dajeonghan) - 생활 관리 앱

> 냉장고, 청소, 약 관리를 한 곳에서. 습관을 만드는 생활 관리 앱.

## 📱 프로젝트 개요

다정한은 바쁜 일상 속에서 놓치기 쉬운 생활 관리를 도와주는 React Native 앱입니다.

### 주요 기능

- 🥗 **냉장고 관리** - 식재료 유통기한 추적
- 🧹 **청소 관리** - 주기적인 청소 루틴
- 💊 **약 관리** - 복용 시간 알림
- 📊 **통계** - 습관 형성 추적 (66일 법칙)
- ⭐ **템플릿** - 다른 사용자의 루틴 공유
- 🔔 **스마트 알림** - 다이제스트 또는 즉시 알림

---

## 🚀 빠른 시작

### 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI
- (선택) iOS Simulator (macOS) 또는 Android Emulator

### 설치

```bash
cd dajeonghan-app
npm install
```

### 실행

```bash
npm start
```

그 다음:
- `i` - iOS 시뮬레이터
- `a` - Android 에뮬레이터
- `w` - 웹 브라우저
- QR 코드 스캔 - Expo Go 앱

---

## 📂 프로젝트 구조

```
dajeonghan-app/
├── src/
│   ├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── constants/        # 색상, 타이포그래피 등
│   ├── modules/          # 기능별 모듈 (fridge, cleaning, medicine)
│   ├── navigation/       # React Navigation 설정
│   ├── screens/          # 화면 컴포넌트
│   ├── services/         # Firebase, API 등
│   ├── types/            # TypeScript 타입 정의
│   ├── utils/            # 유틸리티 함수
│   └── config/           # 설정 파일
├── functions/            # Firebase Cloud Functions
├── docs/                 # 문서
└── assets/              # 이미지, 폰트 등

## 🛠 기술 스택

### 프론트엔드
- **React Native** (0.81.5) + **Expo** (54)
- **TypeScript** (5.9)
- **React Navigation** (6.x)

### 백엔드
- **Firebase**
  - Firestore (데이터베이스)
  - Authentication (Kakao)
  - Storage (파일)
  - Cloud Functions (서버리스)
  - Analytics (분석)

### 상태 관리
- React Hooks
- Context API

### 기타
- date-fns (날짜 처리)
- Expo Notifications (푸시 알림)

---

## 📋 구현 완료 현황

### ✅ 완전히 구현됨 (Step 01-12)

#### Step 01-04: 핵심 기능
- [x] 데이터 모델 설계
- [x] 냉장고 모듈 (CRUD + 유통기한)
- [x] 청소 모듈 (테스크 + 주기 관리)
- [x] 약 모듈 (복용 관리)

#### Step 05-07: 시스템
- [x] 온보딩 (페르소나 기반)
- [x] 알림 시스템 (다이제스트/즉시)
- [x] 네비게이션 (탭 + 스택)

#### Step 08-09: 법적
- [x] 개인정보처리방침
- [x] 법적 고지

#### Step 10: 성장 전략
- [x] Analytics (이벤트 로깅)
- [x] 습관화 시스템 (66일 스트릭)
- [x] 주간 리포트
- [x] 프리미엄 게이트 (Mock)

#### Step 12: 템플릿 마켓플레이스
- [x] 템플릿 CRUD 서비스
- [x] 좋아요 및 리뷰 시스템
- [x] 검색 및 필터링
- [x] UI 컴포넌트 (TemplateCard, ReviewList)

#### Step 11: 배포 준비
- [x] 코드 품질 검증
- [x] 배포 체크리스트
- [x] 테스트 가이드

### ⚠️ 부분 구현

- **템플릿 마켓플레이스 UI**: 백엔드만 완성
- **프리미엄 기능**: Mock 상태
- **테스트**: 20% 커버리지 (목표 80%)

---

## 🧪 테스트

### 단위 테스트

```bash
npm test
```

### 테스트 커버리지

```bash
npm run test:coverage
```

### 수동 테스트

`docs/LOCAL_TESTING_GUIDE.md` 참고

---

## 📊 데이터 모델

### Firestore 컬렉션

```
users/{userId}
  ├─ profile
  ├─ tasks/{taskId}
  ├─ objects/{objectId}
  ├─ logs/{logId}
  ├─ doseLogs/{doseLogId}
  ├─ activityLogs/{activityLogId}
  └─ weeklyReports/{reportId}

sharedTemplates/{templateId}
templateLikes/{likeId}
templateUsages/{usageId}
templateReviews/{reviewId}
```

자세한 내용은 `src/types/*.types.ts` 참고

---

## 🔐 환경 변수

`.env` 파일 생성 필요:

```bash
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=dajeonghan
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
KAKAO_NATIVE_APP_KEY=
```

---

## 📱 앱 정보

- **이름**: 다정한
- **Version**: 1.0.0
- **Bundle ID (iOS)**: com.onmindlab.dajeonghan
- **Package (Android)**: com.onmindlab.dajeonghan

---

## 🚀 배포

### EAS Build

```bash
# 설치
npm install -g eas-cli

# 로그인
eas login

# 개발 빌드
eas build --platform all --profile development

# 프로덕션 빌드
eas build --platform all --profile production
```

### 스토어 제출

```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

자세한 내용은 `docs/STEP_11_DEPLOYMENT_CHECKLIST.md` 참고

---

## 📚 문서

- `docs/STEP_11_COMPLETE.md` - Step 11 완료 보고서
- `docs/STEP_11_DEPLOYMENT_CHECKLIST.md` - 배포 체크리스트
- `docs/LOCAL_TESTING_GUIDE.md` - 로컬 테스트 가이드
- `docs/FIREBASE_SETUP.md` - Firebase 설정
- `docs/privacy-policy.md` - 개인정보처리방침

---

## 🐛 알려진 이슈

1. **템플릿 마켓플레이스 UI 미구현** - v1.1.0에서 추가 예정
2. **프리미엄 기능 Mock** - 실제 결제 미구현
3. **테스트 커버리지 낮음** - 수동 테스트로 보완

---

## 🎯 로드맵

### v1.0.0 (MVP) - 현재
- ✅ 핵심 기능 (냉장고, 청소, 약)
- ✅ 온보딩 및 알림
- ✅ 습관 추적
- ✅ 기본 템플릿

### v1.1.0 - 예정
- [ ] 템플릿 마켓플레이스 UI
- [ ] 실제 인앱 구매
- [ ] 소셜 공유
- [ ] 테스트 80% 커버리지

### v1.2.0 - 미래
- [ ] 이미지 업로드
- [ ] 검색 (Algolia)
- [ ] 다크 모드
- [ ] 위젯

---

## 🤝 기여

이 프로젝트는 현재 비공개 개발 중입니다.

---

## 📄 라이선스

Copyright © 2026 OnMindLab. All rights reserved.

---

## 📞 문의

- Email: contact@onmindlab.com
- Website: https://dajeonghan.app

---

**다정한으로 체계적인 생활 관리를 시작하세요!** 🎉

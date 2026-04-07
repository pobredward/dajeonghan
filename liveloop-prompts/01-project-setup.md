# 01. 프로젝트 초기 설정

## 목표
React Native(Expo) + Firebase 기반의 리브루프 앱 프로젝트를 생성하고 기본 환경을 설정합니다.

## 기술 스택

### Frontend
- React Native with Expo SDK (최신 안정 버전)
- TypeScript
- React Navigation v6
- 상태관리: React Context API 또는 Zustand

### Backend
- Firebase Authentication
- Cloud Firestore
- Cloud Functions
- Firebase Cloud Messaging
- Firebase Storage (2단계)

### 알림
- expo-notifications (로컬 알림)
- Firebase Cloud Messaging (푸시 알림, 2단계)

## 프로젝트 생성

```bash
# Expo 프로젝트 생성 (TypeScript 템플릿)
npx create-expo-app liveloop --template expo-template-blank-typescript

cd liveloop

# 필수 패키지 설치
npx expo install expo-notifications expo-device expo-constants
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install firebase

# 상태관리 (선택: Zustand 사용 시)
npm install zustand

# 날짜/시간 처리
npm install date-fns

# UI 라이브러리 (선택)
npx expo install react-native-paper
# 또는
npm install native-base
```

## 프로젝트 구조

```
liveloop/
├── src/
│   ├── core/                    # 공통 엔진
│   │   ├── engines/
│   │   │   ├── RecurrenceEngine.ts
│   │   │   ├── PostponeEngine.ts
│   │   │   ├── NotificationOrchestrator.ts
│   │   │   └── PriorityCalculator.ts
│   │   └── utils/
│   │       ├── dateUtils.ts
│   │       └── storageUtils.ts
│   ├── modules/                 # 도메인 모듈
│   │   ├── cleaning/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── types.ts
│   │   │   └── cleaningService.ts
│   │   ├── fridge/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── types.ts
│   │   │   ├── foodDatabase.ts
│   │   │   └── fridgeService.ts
│   │   └── medicine/
│   │       ├── components/
│   │       ├── screens/
│   │       ├── types.ts
│   │       └── medicineService.ts
│   ├── components/              # 공통 UI 컴포넌트
│   │   ├── TaskCard.tsx
│   │   ├── DigestList.tsx
│   │   ├── PriorityBadge.tsx
│   │   └── ProgressiveForm.tsx
│   ├── services/                # Firebase 서비스
│   │   ├── firebaseConfig.ts
│   │   ├── authService.ts
│   │   ├── firestoreService.ts
│   │   └── notificationService.ts
│   ├── navigation/              # 네비게이션
│   │   ├── RootNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── types/                   # TypeScript 타입
│   │   ├── task.types.ts
│   │   ├── user.types.ts
│   │   └── common.types.ts
│   ├── templates/               # 템플릿 데이터
│   │   ├── personas.json
│   │   ├── cleaningTemplates.json
│   │   └── questionFlow.json
│   ├── screens/                 # 메인 화면
│   │   ├── onboarding/
│   │   ├── home/
│   │   └── settings/
│   └── constants/               # 상수
│       ├── Colors.ts
│       └── Config.ts
├── assets/                      # 이미지, 폰트
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

## Firebase 프로젝트 생성

### 1. Firebase Console에서 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `liveloop-dev` (개발용)
4. Google Analytics 활성화 (선택)

### 2. iOS 및 Android 앱 등록
- iOS: Bundle ID 설정
- Android: Package name 설정 (예: `com.liveloop.app`)

### 3. Firebase 설정 파일 다운로드
- iOS: `GoogleService-Info.plist`
- Android: `google-services.json`

### 4. Firebase 서비스 활성화
- Authentication → 익명 인증 활성화
- Firestore Database → 데이터베이스 생성 (테스트 모드)
- Cloud Storage → 버킷 생성
- Cloud Messaging → 설정

## Firebase 설정 파일 생성

`src/services/firebaseConfig.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// 오프라인 지속성 활성화
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence');
  }
});
```

## 환경 변수 설정

`.env`:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

`.gitignore`에 추가:
```
.env
.env.local
google-services.json
GoogleService-Info.plist
```

## EAS Build 설정 (2단계 - 푸시 알림용)

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# EAS 프로젝트 설정
eas build:configure
```

`eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 다음 단계
- 02-data-models.md: 데이터 모델 설계
- Firebase 프로젝트 설정 완료 후 진행

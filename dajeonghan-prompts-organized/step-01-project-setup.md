# Step 01. 프로젝트 초기 설정

> **🎯 목표**: 개발 환경을 완벽하게 구축하고 첫 화면이 표시되는 앱 실행까지

## 📌 단계 정보

**순서**: Step 01/13  
**Phase**: Phase 1 - 기초 설정 (Foundation)  
**의존성**: 없음 (첫 번째 단계)  
**예상 소요 시간**: 2-3시간  
**난이도**: ⭐⭐

### 이전 단계 요구사항
- 없음 (시작 단계입니다)

### 다음 단계
- **Step 02**: 데이터 모델 정의

### 이 단계를 건너뛸 수 없는 이유
- 모든 후속 단계가 이 프로젝트 구조를 기반으로 합니다
- Firebase 연결 없이는 데이터 저장 불가능
- 필수 패키지 없이는 코드 작성 불가능

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ `npx expo start` 실행 시 빈 화면 앱이 실행됨
- ✅ Firebase Console에서 프로젝트가 생성됨
- ✅ TypeScript 타입 체크가 정상 작동함
- ✅ 폴더 구조가 완전히 생성됨
- ✅ Git 저장소가 초기화됨

**예상 소요 시간**: 2-3시간 (Firebase 설정 포함)

---

## 🔧 사전 요구사항 확인

### 필수 소프트웨어 설치

```bash
# 1. Node.js 버전 확인 (18.x LTS 필수)
node --version
# 출력 예시: v18.19.0
# 버전이 낮다면: https://nodejs.org 에서 LTS 다운로드

# 2. npm 버전 확인 (9.x 이상)
npm --version
# 출력 예시: 9.6.0

# 3. Git 설치 확인
git --version
# 출력 예시: git version 2.40.0
# 없다면: https://git-scm.com/downloads

# 4. Firebase CLI 설치 (전역)
npm install -g firebase-tools
firebase --version
# 출력 예시: 13.0.0

# 5. EAS CLI 설치 (나중에 빌드용)
npm install -g eas-cli
eas --version
# 출력 예시: eas-cli/5.9.0
```

### 계정 준비

1. **Expo 계정**: https://expo.dev/signup
2. **Firebase 계정**: https://console.firebase.google.com (Google 계정 사용)
3. **GitHub 계정**: https://github.com (코드 저장용, 선택사항)

---

## 🚀 Step 1: Expo 프로젝트 생성

### 1-1. 프로젝트 생성 및 초기화

```bash
# 프로젝트 디렉토리로 이동 (선택사항)
cd ~/Desktop/projects  # 또는 원하는 경로

# Expo 프로젝트 생성
npx create-expo-app@latest dajeonghan --template expo-template-blank-typescript

# 출력 예시:
# ✔ Downloaded and extracted project files.
# ✔ Installed JavaScript dependencies.
#
# ✅ Your project is ready!
```

### 1-2. 프로젝트 확인

```bash
# 프로젝트 폴더로 이동
cd dajeonghan

# 폴더 구조 확인
ls -la
# 출력:
# App.tsx              # 앱 엔트리 포인트
# app.json             # Expo 설정
# package.json         # 의존성 관리
# tsconfig.json        # TypeScript 설정
# node_modules/        # 패키지들

# 개발 서버 실행 (테스트)
npx expo start

# QR 코드가 표시되면 성공!
# Ctrl+C로 종료
```

### 1-3. Git 초기화 (권장)

```bash
# Git 저장소 초기화
git init

# .gitignore 확인 (이미 생성되어 있음)
cat .gitignore
# node_modules/, .expo/, dist/ 등이 포함되어 있어야 함

# 초기 커밋
git add .
git commit -m "Initial commit: Expo TypeScript project"

# GitHub 연결 (선택사항)
# 1. GitHub에서 새 repository 생성
# 2. git remote add origin https://github.com/your-username/dajeonghan.git
# 3. git branch -M main
# 4. git push -u origin main
```

---

## 📦 Step 2: 필수 패키지 설치

### 2-1. 네비게이션 패키지

```bash
# React Navigation 핵심 패키지
npx expo install @react-navigation/native

# 필수 의존성
npx expo install react-native-screens react-native-safe-area-context

# 네비게이터 타입
npx expo install @react-navigation/bottom-tabs @react-navigation/stack

# 설치 확인
npm list @react-navigation/native
# @react-navigation/native@6.x.x 표시되면 성공
```

### 2-2. Firebase 패키지

```bash
# Firebase SDK (v10 모듈러 API)
npx expo install firebase

# 설치 확인
npm list firebase
# firebase@10.x.x 표시되면 성공
```

### 2-3. 알림 패키지

```bash
# Expo Notifications
npx expo install expo-notifications expo-device expo-constants

# 설치 확인
npm list expo-notifications
```

### 2-4. 상태관리 및 유틸리티

```bash
# 상태관리: Zustand (가볍고 강력함)
npm install zustand

# 날짜/시간 처리: date-fns (번들 크기 작음)
npm install date-fns

# 유틸리티 (선택사항)
npm install lodash
npm install --save-dev @types/lodash  # TypeScript 타입
```

### 2-5. UI 라이브러리 (택 1)

```bash
# 옵션 A: React Native Paper (Material Design)
npx expo install react-native-paper react-native-vector-icons
# 추천: 완성도 높은 컴포넌트, 접근성 우수

# 또는

# 옵션 B: Native Base (범용)
npm install native-base
npx expo install react-native-svg
# 추천: 커스터마이징 자유도 높음
```

### 2-6. 개발 도구

```bash
# TypeScript 타입 정의
npm install --save-dev @types/react @types/react-native

# 테스트 도구
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native

# ESLint & Prettier (코드 품질)
npm install --save-dev eslint prettier eslint-config-prettier
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2-7. 설치 확인

```bash
# package.json 확인
cat package.json | grep -A 20 "dependencies"

# 모든 패키지 재설치 (문제 발생 시)
rm -rf node_modules package-lock.json
npm install
```

---

## 🗂️ Step 3: 프로젝트 폴더 구조 생성

### 3-1. 기본 폴더 생성

```bash
# src 폴더 및 하위 구조 생성
mkdir -p src/{core/{engines,utils},modules/{cleaning/{components,screens,services,templates},fridge/{components,screens,services,data},medicine/{components,screens,services,storage}},components,services/{firebase,notifications,analytics},navigation,screens/{onboarding,home,settings},types,templates,constants,hooks,utils}

# assets 폴더 생성
mkdir -p assets/{images/{onboarding,icons},fonts,data}

# 테스트 폴더 생성
mkdir -p __tests__/{unit/{engines,services,utils},integration,e2e}

# functions 폴더 (2단계용)
mkdir -p functions/src

# 폴더 구조 확인
tree -L 3 src  # tree 명령어가 없다면: brew install tree (Mac)
# 또는
ls -R src | grep ":$" | sed -e 's/:$//' -e 's/[^-][^\/]*\//--/g' -e 's/^/   /' -e 's/-/|/'
```

### 3-2. 기본 파일 생성

```bash
# TypeScript 설정 확장
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@modules/*": ["./src/modules/*"],
      "@components/*": ["./src/components/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"],
      "@constants/*": ["./src/constants/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

# .env 파일 생성 (환경 변수)
cat > .env.example << 'EOF'
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Environment
NODE_ENV=development
EOF

# 실제 .env 파일 복사 (나중에 값 입력)
cp .env.example .env

# .gitignore 업데이트
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 3-3. Babel 설정 (Path Alias)

```bash
# babel.config.js 업데이트
cat > babel.config.js << 'EOF'
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@modules': './src/modules',
            '@components': './src/components',
            '@services': './src/services',
            '@types': './src/types',
            '@constants': './src/constants',
            '@utils': './src/utils'
          }
        }
      ]
    ]
  };
};
EOF

# babel-plugin-module-resolver 설치
npm install --save-dev babel-plugin-module-resolver
```

---

---

## 🔥 Step 4: Firebase 프로젝트 생성 및 설정

### 4-1. Firebase Console에서 프로젝트 생성

1. **Firebase Console 접속**
   - 브라우저에서 [https://console.firebase.google.com](https://console.firebase.google.com) 열기
   - Google 계정으로 로그인

2. **프로젝트 생성**
   - "프로젝트 추가" 버튼 클릭
   - 프로젝트 이름: `dajeonghan-dev` (개발용) 입력
   - 프로젝트 ID 확인: `dajeonghan-dev-xxxxx` (자동 생성)
   - Google Analytics 활성화: "예" 선택 (권장)
   - Analytics 계정: 기존 계정 선택 또는 새로 생성
   - "프로젝트 만들기" 클릭 (30초-1분 소요)

3. **프로젝트 생성 완료**
   - 프로젝트 대시보드가 표시되면 성공

### 4-2. Android 앱 등록

1. **Android 앱 추가**
   - 프로젝트 개요 페이지에서 "Android 앱에 Firebase 추가" 클릭 (Android 아이콘)
   - **Android 패키지 이름**: `com.dajeonghan.app` 입력
   - **앱 닉네임**: "다정한 Android" (선택사항)
   - **디버그 서명 인증서 SHA-1**: 건너뛰기 (나중에 추가 가능)
   - "앱 등록" 클릭

2. **google-services.json 다운로드 및 배치**
   ```bash
   # Firebase Console에서 google-services.json 다운로드
   # 프로젝트 루트 디렉토리에 저장
   mv ~/Downloads/google-services.json ./google-services.json
   
   # 파일 확인
   cat google-services.json | head -n 10
   # project_info, client 등이 표시되면 성공
   ```

3. **app.json 업데이트**
   ```bash
   # app.json에 Android 설정 추가
   cat > app.json << 'EOF'
   {
     "expo": {
       "name": "다정한",
       "slug": "dajeonghan",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/icon.png",
       "userInterfaceStyle": "automatic",
       "splash": {
         "image": "./assets/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#ffffff"
       },
       "assetBundlePatterns": ["**/*"],
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.dajeonghan.app",
         "googleServicesFile": "./GoogleService-Info.plist"
       },
       "android": {
         "package": "com.dajeonghan.app",
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#ffffff"
         },
         "googleServicesFile": "./google-services.json",
         "permissions": [
           "NOTIFICATIONS",
           "SCHEDULE_EXACT_ALARM"
         ]
       },
       "web": {
         "favicon": "./assets/favicon.png"
       },
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#ffffff",
             "sounds": []
           }
         ]
       ],
       "extra": {
         "firebaseApiKey": process.env.FIREBASE_API_KEY,
         "firebaseAuthDomain": process.env.FIREBASE_AUTH_DOMAIN,
         "firebaseProjectId": process.env.FIREBASE_PROJECT_ID,
         "firebaseStorageBucket": process.env.FIREBASE_STORAGE_BUCKET,
         "firebaseMessagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
         "firebaseAppId": process.env.FIREBASE_APP_ID
       }
     }
   }
   EOF
   ```

### 4-3. iOS 앱 등록 (iOS 개발 시만 필요)

1. **iOS 앱 추가**
   - Firebase Console → 프로젝트 개요 → "iOS 앱에 Firebase 추가"
   - **iOS 번들 ID**: `com.dajeonghan.app`
   - **앱 닉네임**: "다정한 iOS"
   - **App Store ID**: 건너뛰기 (출시 후 추가)

2. **GoogleService-Info.plist 다운로드**
   ```bash
   # 다운로드 후 프로젝트 루트에 저장
   mv ~/Downloads/GoogleService-Info.plist ./GoogleService-Info.plist
   ```

### 4-4. Firebase 서비스 활성화

#### Authentication 설정
1. Firebase Console → "빌드" → "Authentication" 클릭
2. "시작하기" 버튼 클릭
3. "로그인 제공업체" 탭 선택
4. **"익명"** 항목 찾아서 토글 ON
5. "저장" 클릭

**확인**: 익명 로그인이 "사용 설정됨"으로 표시

#### Firestore Database 생성
1. Firebase Console → "빌드" → "Firestore Database" 클릭
2. "데이터베이스 만들기" 버튼 클릭
3. **위치 선택**: `asia-northeast3 (Seoul)` 선택 (한국 사용자용, 권장)
4. **보안 규칙**: "테스트 모드로 시작" 선택
   ```
   ⚠️ 테스트 모드 경고 표시됨 (30일 후 만료)
   → 괜찮음, 나중에 프로덕션 규칙으로 변경 예정
   ```
5. "사용 설정" 클릭 (1-2분 소요)

**확인**: Firestore Database가 비어있는 상태로 표시

#### Analytics 설정 (자동 활성화됨)
- 프로젝트 생성 시 Google Analytics를 활성화했다면 자동 설정
- Firebase Console → "빌드" → "Analytics"에서 확인

### 4-5. Firebase 설정 파일 생성

**중요**: 이 파일은 Firebase와 앱을 연결하는 핵심 파일입니다.

`src/services/firebase/firebaseConfig.ts` 파일 생성:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence,
  Auth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Firebase 설정
 * .env 파일 또는 app.json의 extra 필드에서 읽어옴
 */
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.FIREBASE_APP_ID
};

// 설정 검증
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase 설정이 누락되었습니다. .env 파일을 확인하세요.');
  throw new Error('Firebase configuration is missing');
}

/**
 * Firebase 앱 초기화 (중복 방지)
 */
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized');
} else {
  app = getApps()[0];
  console.log('🔥 Firebase already initialized');
}

/**
 * Auth 초기화 (React Native 전용 persistence)
 */
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

/**
 * Firestore 초기화
 */
export const db: Firestore = getFirestore(app);

/**
 * Cloud Functions 초기화
 * region: asia-northeast3 (Seoul) - 한국 서버 사용
 */
export const functions: Functions = getFunctions(app, 'asia-northeast3');

/**
 * Firebase 앱 인스턴스 (필요 시 사용)
 */
export { app };

/**
 * 환경 체크
 */
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// 개발 환경에서만 상세 로그
if (isDevelopment) {
  console.log('📱 Environment:', {
    isDevelopment,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
}
```

### 4-6. 환경 변수 설정

```bash
# Firebase 설정 값 가져오기
# Firebase Console → 프로젝트 설정 (⚙️) → 일반 탭
# "내 앱" 섹션에서 "SDK 설정 및 구성" 선택
# firebaseConfig 객체 복사

# .env 파일 업데이트
cat > .env << 'EOF'
# Firebase Configuration (Firebase Console에서 복사)
FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
FIREBASE_AUTH_DOMAIN=dajeonghan-dev.firebaseapp.com
FIREBASE_PROJECT_ID=dajeonghan-dev
FIREBASE_STORAGE_BUCKET=dajeonghan-dev.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:android:abcdef123456

# App Configuration
APP_ENV=development
APP_VERSION=1.0.0
EOF

# .env 파일 보안 (절대 Git에 커밋하지 말 것!)
chmod 600 .env
```

### 4-7. Firebase 로컬 에뮬레이터 설정 (개발용, 권장)

```bash
# Firebase CLI로 로그인
firebase login
# 브라우저가 열리면 Google 계정으로 로그인

# Firebase 프로젝트 초기화
firebase init

# 초기화 옵션 선택:
# ? Which Firebase features do you want to set up?
# ◯ Realtime Database
# ◉ Firestore          (스페이스바로 선택)
# ◯ Functions
# ◉ Emulators          (스페이스바로 선택)
# 엔터 키로 진행

# Firestore 설정:
# ? What file should be used for Firestore Rules? firestore.rules (엔터)
# ? What file should be used for Firestore indexes? firestore.indexes.json (엔터)

# 기존 프로젝트 사용:
# ? Please select an option: Use an existing project
# ? Select a Firebase project: dajeonghan-dev (위아래 화살표로 선택 후 엔터)

# Emulators 설정:
# ? Which Firebase emulators do you want to set up?
# ◉ Authentication Emulator    (포트: 9099)
# ◉ Firestore Emulator          (포트: 8080)
# ◯ Functions Emulator          (2단계, 건너뛰기)
# ◉ Emulator UI                 (포트: 4000)
# 엔터로 진행

# 포트 설정 (기본값 사용)
# ? Which port do you want to use for the auth emulator? 9099 (엔터)
# ? Which port do you want to use for the firestore emulator? 8080 (엔터)
# ? Which port do you want to use for the Emulator UI? 4000 (엔터)
# ? Would you like to enable the Emulator UI? Yes (엔터)
# ? Would you like to download the emulators now? Yes (엔터)
```

**생성된 파일**:
- `firebase.json`: Firebase 설정
- `firestore.rules`: Security Rules
- `firestore.indexes.json`: Firestore 인덱스
- `.firebaserc`: 프로젝트 alias 설정

### 4-8. 에뮬레이터 테스트

```bash
# 에뮬레이터 실행
firebase emulators:start

# 출력 예시:
# ┌─────────────────────────────────────────────────────────┐
# │ ✔  All emulators ready! It's now safe to connect.      │
# ├─────────────────────────────────────────────────────────┤
# │ ┌───────────┬──────────────┬─────────────────────────┐ │
# │ │ Emulator  │ Host:Port    │ View in Emulator UI     │ │
# │ ├───────────┼──────────────┼─────────────────────────┤ │
# │ │ Auth      │ 0.0.0.0:9099 │ http://localhost:4000   │ │
# │ │ Firestore │ 0.0.0.0:8080 │ http://localhost:4000   │ │
# │ └───────────┴──────────────┴─────────────────────────┘ │
# └─────────────────────────────────────────────────────────┘

# 브라우저에서 http://localhost:4000 열기
# Emulator UI가 표시되면 성공!

# Ctrl+C로 종료
```

### 4-9. Firebase 설정 값 복사

```bash
# Firebase Console → 프로젝트 설정 (⚙️ 아이콘) → "일반" 탭
# "내 앱" 섹션 스크롤 다운
# "SDK 설정 및 구성" → "구성" 선택
# firebaseConfig 객체 복사

# .env 파일에 붙여넣기
nano .env
# 또는
code .env  # VS Code 사용 시

# 예시:
FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
FIREBASE_AUTH_DOMAIN=dajeonghan-dev.firebaseapp.com
FIREBASE_PROJECT_ID=dajeonghan-dev
FIREBASE_STORAGE_BUCKET=dajeonghan-dev.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:android:abcdef0123456789
```

---

## 🔌 Step 5: Firebase 연동 확인

### 5-1. 기본 연동 테스트 파일 생성

`src/services/firebase/testConnection.ts` 파일 생성:

```typescript
import { auth, db } from './firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

/**
 * Firebase Authentication 테스트
 */
export async function testAuth(): Promise<boolean> {
  try {
    console.log('🔐 Testing Firebase Authentication...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Auth test passed. User ID:', userCredential.user.uid);
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

/**
 * Firestore 읽기/쓰기 테스트
 */
export async function testFirestore(): Promise<boolean> {
  try {
    console.log('💾 Testing Firestore...');
    
    // 테스트 컬렉션에 문서 추가
    const testRef = collection(db, 'test');
    const docRef = await addDoc(testRef, {
      message: 'Hello from 다정한',
      timestamp: new Date()
    });
    console.log('✅ Firestore write test passed. Doc ID:', docRef.id);
    
    // 테스트 컬렉션 읽기
    const querySnapshot = await getDocs(testRef);
    console.log('✅ Firestore read test passed. Docs count:', querySnapshot.size);
    
    return true;
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return false;
  }
}

/**
 * 전체 Firebase 연결 테스트
 */
export async function runFirebaseTests(): Promise<void> {
  console.log('🔥 Starting Firebase connection tests...\n');
  
  const authResult = await testAuth();
  const firestoreResult = await testFirestore();
  
  console.log('\n📊 Test Results:');
  console.log('  Authentication:', authResult ? '✅ PASS' : '❌ FAIL');
  console.log('  Firestore:', firestoreResult ? '✅ PASS' : '❌ FAIL');
  
  if (authResult && firestoreResult) {
    console.log('\n🎉 All Firebase services are working correctly!');
  } else {
    console.log('\n⚠️ Some Firebase services failed. Check your configuration.');
  }
}
```

### 5-2. App.tsx 수정 (테스트 코드 추가)

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { runFirebaseTests } from './src/services/firebase/testConnection';

export default function App() {
  const [testResult, setTestResult] = useState<string>('테스트 대기 중...');

  const handleTest = async () => {
    setTestResult('테스트 실행 중...');
    await runFirebaseTests();
    setTestResult('테스트 완료! 콘솔 확인');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>다정한 앱</Text>
      <Text style={styles.subtitle}>Firebase 연결 테스트</Text>
      <Button title="Firebase 테스트 실행" onPress={handleTest} />
      <Text style={styles.result}>{testResult}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  result: {
    marginTop: 20,
    fontSize: 14,
    color: '#333'
  }
});
```

### 5-3. 연동 테스트 실행

```bash
# 개발 서버 실행
npx expo start

# Expo Go 앱에서 QR 스캔
# 또는 'a' (Android) / 'i' (iOS) 키 입력

# 앱이 실행되면:
# 1. "Firebase 테스트 실행" 버튼 탭
# 2. 터미널에서 로그 확인
# 3. "All Firebase services are working correctly!" 표시되면 성공!
```

**예상 출력**:
```
🔥 Starting Firebase connection tests...

🔐 Testing Firebase Authentication...
✅ Auth test passed. User ID: aBcDeFg123456

💾 Testing Firestore...
✅ Firestore write test passed. Doc ID: xyz789
✅ Firestore read test passed. Docs count: 1

📊 Test Results:
  Authentication: ✅ PASS
  Firestore: ✅ PASS

🎉 All Firebase services are working correctly!
```

---

## ⚙️ Step 6: 추가 설정 및 최적화

### 6-1. ESLint 설정 (코드 품질)

`.eslintrc.js` 파일 생성:

```javascript
module.exports = {
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn'
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/']
};
```

### 6-2. Prettier 설정 (코드 포맷팅)

`.prettierrc.json` 파일 생성:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

### 6-3. package.json 스크립트 추가

```bash
# package.json에 유용한 스크립트 추가
cat > package.json << 'EOF'
{
  "name": "dajeonghan",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "emulator": "firebase emulators:start",
    "clean": "rm -rf node_modules && npm install"
  },
  "dependencies": {
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "date-fns": "^3.0.0",
    "expo": "~50.0.0",
    "expo-constants": "~15.4.0",
    "expo-device": "~5.9.0",
    "expo-notifications": "~0.27.0",
    "expo-status-bar": "~1.11.0",
    "firebase": "^10.7.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-safe-area-context": "4.8.0",
    "react-native-screens": "~3.29.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@testing-library/jest-native": "^5.4.0",
    "@testing-library/react-native": "^12.4.0",
    "@types/react": "~18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "babel-plugin-module-resolver": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.1.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
EOF

# 의존성 재설치
npm install
```

### 6-4. Jest 설정 (테스트)

`jest.config.js` 파일 생성:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  }
};
```

`jest.setup.js` 파일 생성:

```javascript
import '@testing-library/jest-native/extend-expect';

// Firebase 모킹
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/functions');

// Expo 모듈 모킹
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      firebaseApiKey: 'test-api-key',
      firebaseProjectId: 'test-project'
    }
  }
}));

// 타이머 모킹
jest.useFakeTimers();

// 글로벌 설정
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

---

---

## 🔧 Step 7: EAS Build 설정 (선택사항, 2단계)

> **참고**: MVP 단계에서는 Expo Go로 충분합니다.  
> 푸시 알림 구현 시 EAS Build가 필요합니다.

### 7-1. EAS CLI 설치 및 로그인

```bash
# EAS CLI 전역 설치
npm install -g eas-cli

# 버전 확인
eas --version
# eas-cli/5.9.0

# Expo 계정으로 로그인
eas login
# 이메일과 비밀번호 입력
```

### 7-2. EAS 프로젝트 설정

```bash
# EAS 프로젝트 초기화
eas build:configure

# 질문 응답:
# ? Would you like to automatically create an EAS project for @your-username/dajeonghan? (Y/n)
# Y 입력

# eas.json 파일이 생성됩니다
```

### 7-3. eas.json 설정

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 7-4. 첫 빌드 실행 (나중에)

```bash
# Development 빌드 (개발 중)
eas build --profile development --platform android

# Preview 빌드 (내부 테스트)
eas build --profile preview --platform android

# Production 빌드 (스토어 제출용)
eas build --profile production --platform all
```

---

## ✅ Step 8: 완료 체크리스트

### 필수 항목
- [ ] Node.js 18+ 설치 완료
- [ ] Expo 프로젝트 생성 완료 (`npx expo start` 실행됨)
- [ ] 모든 패키지 설치 완료 (에러 없음)
- [ ] 폴더 구조 생성 완료
- [ ] Firebase 프로젝트 생성 완료
- [ ] Firebase 서비스 활성화 (Auth, Firestore)
- [ ] `.env` 파일에 Firebase 설정 입력
- [ ] Firebase 연결 테스트 성공 ✅
- [ ] Git 저장소 초기화
- [ ] `.gitignore`에 `.env` 추가

### 선택 항목
- [ ] Firebase 에뮬레이터 설정
- [ ] ESLint/Prettier 설정
- [ ] Jest 테스트 설정
- [ ] GitHub 저장소 연결
- [ ] EAS Build 설정

### 확인 명령어

```bash
# 1. 프로젝트 구조 확인
ls -la src/
# core/, modules/, components/, services/ 등이 표시되어야 함

# 2. TypeScript 타입 체크
npm run type-check
# 에러 없이 완료되어야 함

# 3. Firebase 연결 테스트
# App.tsx의 "Firebase 테스트 실행" 버튼 클릭
# 터미널에서 "All Firebase services are working correctly!" 확인

# 4. 개발 서버 실행
npx expo start
# QR 코드가 표시되고 에러 없이 실행되어야 함
```

---

## 🚨 문제 해결

### 자주 발생하는 문제

#### 1. "Cannot find module 'firebase'" 오류
```bash
# 해결: Firebase 재설치
npm uninstall firebase
npx expo install firebase
```

#### 2. "Metro bundler error" 또는 캐시 문제
```bash
# 해결: 캐시 클리어
npx expo start --clear
# 또는
rm -rf node_modules .expo
npm install
```

#### 3. Firebase 연결 실패
```bash
# 1. .env 파일 확인
cat .env
# FIREBASE_API_KEY 등이 정확한지 확인

# 2. Firebase Console에서 설정 복사
# 프로젝트 설정 → 일반 → SDK 설정 및 구성

# 3. 환경 변수 재로드
# 개발 서버 재시작: Ctrl+C 후 npx expo start
```

#### 4. TypeScript 경로 오류 ("Cannot find module '@/...'")
```bash
# babel-plugin-module-resolver 재설치
npm install --save-dev babel-plugin-module-resolver

# 캐시 클리어 후 재시작
npx expo start --clear
```

#### 5. Android 에뮬레이터가 연결 안 됨
```bash
# Android Studio에서 에뮬레이터 실행 확인
adb devices
# List of devices attached
# emulator-5554    device

# Expo에서 'a' 키 입력하여 Android 실행
```

---

## 📚 다음 단계

### 환경 설정이 완료되었습니다! 🎉

이제 데이터 모델을 설계할 차례입니다.

👉 **[02-data-models.md](./02-data-models.md)** 파일로 이동하여 계속 진행하세요.

**다음 단계에서 배울 내용**:
- TypeScript 타입 정의 (Task, LifeObject, User)
- Firestore 스키마 설계
- 데이터 변환 유틸리티
- Firestore Security Rules 기본

---

## 💾 체크포인트: Git 커밋

```bash
# 첫 번째 체크포인트 커밋
git add .
git commit -m "chore: complete project setup

- Created Expo TypeScript project
- Installed all dependencies
- Set up Firebase configuration
- Created folder structure
- Added development tools (ESLint, Prettier, Jest)
- Tested Firebase connection successfully"

# GitHub에 푸시 (저장소 연결한 경우)
git push origin main
```

---

<p align="center">
  <strong>프로젝트 설정 완료!</strong><br>
  <sub>다음: 02-data-models.md에서 데이터 구조 설계</sub>
</p>

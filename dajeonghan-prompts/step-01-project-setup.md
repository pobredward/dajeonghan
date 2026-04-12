# Step 01. 프로젝트 초기 설정 (실전 검증 완료)

> **🎯 목표**: Expo + Firebase + TypeScript 프로젝트 초기 설정 및 개발 환경 구축

## 📌 단계 정보

**순서**: Step 01/15  
**Phase**: Phase 1 - 기초 설정 (Foundation)  
**의존성**: 없음 (첫 번째 단계)  
**예상 소요 시간**: 2-3시간  
**난이도**: ⭐⭐

**✅ 실전 검증 완료**: 이 가이드는 실제 프로젝트에서 발생한 모든 오류를 해결하고 검증되었습니다.

## 🔧 권장 기술 스택 버전 (2026년 4월 기준, 실전 검증)

### 코어 프레임워크
- **Expo SDK**: `~54.0.33` (실전 검증 완료)
- **React Native**: `0.81.5` (SDK 54에 포함)
- **React**: `19.1.0` (SDK 54에 포함)
- **TypeScript**: `~5.9.2` (안정 버전)
- **Node.js**: `18.x` 이상 권장 (23.x 테스트 완료)

### 주요 라이브러리 (실제 설치 버전)
- **Firebase JS SDK**: `^11.10.0` (실전 검증)
- **React Navigation**: `^6.x`
  - `@react-navigation/native`: `^6.1.18`
  - `@react-navigation/bottom-tabs`: `^6.6.1`
  - `@react-navigation/stack`: `^6.4.1`
- **date-fns**: `^3.6.0`
- **React Native Reanimated**: `~4.1.7` (SDK 54 자동 설치)
- **React Native Gesture Handler**: `~2.28.0`
- **react-native-dotenv**: 환경 변수 관리

### 주요 특징
- ✅ **Expo Go 완벽 지원**: 별도 빌드 없이 테스트 가능
- ✅ **TypeScript 완전 지원**: 엄격한 타입 체크
- ✅ **환경 변수 관리**: react-native-dotenv로 안전한 키 관리
- ✅ **Path Alias**: `@/` 경로로 깔끔한 import

---

## 🚀 프로젝트 구조 결정

### 모노레포 vs 단일 프로젝트

**권장: 모노레포 스타일 (프로젝트 폴더 분리)**

```
your-project/              # 루트 디렉토리
├── your-app/             # Expo 앱 (★ 여기에 앱 코드)
│   ├── src/
│   ├── app.json
│   └── package.json
├── your-prompts/         # 개발 가이드 문서
├── .git/
└── README.md
```

**장점**:
1. 확장성: 백엔드, 관리자 페이지 추가 용이
2. 깔끔한 구조: 문서, 앱, 자산 명확히 분리
3. 현업 표준: 대부분의 프로덕션 프로젝트 구조

---

## 1. 환경 확인

### 1-1. 필수 도구 버전 확인

```bash
# Node.js 버전 확인 (18.x 이상 필수)
node --version
# 출력 예: v23.10.0 (18.x 이상이면 OK)

# npm 버전 확인
npm --version
# 출력 예: 10.9.2 (9.x 이상 권장)

# Git 확인
git --version

# Expo CLI 확인 (설치 불필요, npx 사용)
npx expo --version
```

**버전 요구사항**:
- ✅ Node.js: `18.x` 이상 필수
- ✅ npm: `9.x` 이상 권장
- ⚠️ Expo CLI: 전역 설치 불필요 (npx 사용)

---

## 2. 프로젝트 생성

### 2-1. 프로젝트 디렉토리 생성

```bash
# 루트 디렉토리 생성 및 이동
mkdir your-project
cd your-project

# 앱 폴더에 Expo 프로젝트 생성
npx create-expo-app@latest your-app --template blank-typescript

# 프로젝트로 이동
cd your-app
```

**⚠️ 중요**: 
- `create-expo-app`을 실행하면 자동으로 `npm install`이 실행됩니다
- TypeScript 템플릿 (`blank-typescript`) 사용 권장

### 2-2. 생성된 기본 구조 확인

```bash
ls -la
```

**생성된 파일**:
```
your-app/
├── .gitignore
├── app.json
├── App.tsx
├── assets/
├── index.ts
├── package.json
├── tsconfig.json
└── node_modules/
```

---

## 3. 프로젝트 구조 생성

### 3-1. src 폴더 구조 생성

```bash
# 프로젝트 루트에서 실행
mkdir -p src/config
mkdir -p src/types
mkdir -p src/services
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/constants
mkdir -p src/core/engines
mkdir -p src/modules/cleaning
mkdir -p src/modules/fridge
mkdir -p src/modules/medicine
mkdir -p src/templates
mkdir -p types  # 환경 변수 타입 정의용
```

**최종 구조**:
```
your-app/
├── src/
│   ├── config/              # 설정 파일 (Firebase, 소셜 로그인)
│   ├── types/               # TypeScript 타입 정의
│   ├── core/                # 공통 엔진
│   │   └── engines/         # 순환 알고리즘 등
│   ├── modules/             # 기능 모듈
│   │   ├── cleaning/        # 청소 관리
│   │   ├── fridge/          # 냉장고 관리
│   │   └── medicine/        # 약 복용 관리
│   ├── screens/             # 화면 컴포넌트
│   ├── components/          # 공통 UI 컴포넌트
│   ├── services/            # 비즈니스 로직
│   ├── hooks/               # 커스텀 훅
│   ├── utils/               # 유틸리티 함수
│   ├── constants/           # 상수
│   └── templates/           # 온보딩 템플릿
└── types/                   # 루트 레벨 타입 (환경 변수 등)
```

---

## 4. Firebase SDK 연동

### 4-1. Firebase 패키지 설치

```bash
# Firebase SDK 설치
npm install firebase@^11.0.0

# AsyncStorage (Firebase Auth persistence용)
npx expo install @react-native-async-storage/async-storage

# Expo 관련 패키지
npx expo install expo-application expo-constants
```

**⚠️ 중요 이슈 해결**:
- Firebase v11에서 `getReactNativePersistence`가 제거됨
- 아래 설정 파일에서 커스텀 persistence 구현 필요

### 4-2. Firebase 설정 파일 생성 (환경 변수 사용 안함 버전)

**임시 테스트용** - `src/config/firebase.ts`:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  Auth,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase 설정 (임시 - 나중에 환경 변수로 이동)
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

/**
 * React Native용 커스텀 Persistence 구현
 * ⚠️ Firebase v11에서 getReactNativePersistence 제거로 인한 해결책
 */
const reactNativePersistence = {
  ...browserLocalPersistence,
  async _get(key: string) {
    return AsyncStorage.getItem(key);
  },
  async _set(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  },
  async _remove(key: string) {
    return AsyncStorage.removeItem(key);
  }
};

/**
 * Firebase 앱 초기화 (중복 방지)
 */
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase 초기화 완료');
} else {
  app = getApps()[0];
  console.log('🔥 Firebase 이미 초기화됨');
}

/**
 * Auth 초기화 (React Native persistence 사용)
 */
let auth: Auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: reactNativePersistence as any
  });
}

/**
 * Firestore 초기화
 */
export const db: Firestore = getFirestore(app);

/**
 * Storage 초기화
 */
export const storage: FirebaseStorage = getStorage(app);

export { app, auth };

/**
 * 개발 환경 체크
 */
export const isDevelopment = __DEV__;

if (isDevelopment) {
  console.log('📱 Environment:', {
    projectId: firebaseConfig.projectId,
    isDevelopment
  });
}
```

---

## 5. 환경 변수 설정 (react-native-dotenv)

### 5-1. react-native-dotenv 설치

```bash
npm install --save-dev react-native-dotenv
```

### 5-2. babel-preset-expo 설치 (필수!)

**⚠️ 실전 오류 해결**: `babel-preset-expo`가 없으면 Metro 번들러가 실패합니다.

```bash
# SDK 54 호환 버전 설치
npx expo install babel-preset-expo
```

### 5-3. TypeScript 타입 정의 생성

`types/env.d.ts`:

```typescript
declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;
  
  export const KAKAO_NATIVE_APP_KEY: string;
  export const KAKAO_REST_API_KEY: string;
  export const KAKAO_JAVASCRIPT_KEY: string;
  
  export const NAVER_CLIENT_ID: string;
  export const NAVER_CLIENT_SECRET: string;
  
  export const APPLE_TEAM_ID: string;
  export const APPLE_APP_ID: string;
}
```

### 5-4. .env 파일 생성

`.env`:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_actual_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Kakao Login
KAKAO_NATIVE_APP_KEY=your_kakao_native_key
KAKAO_REST_API_KEY=your_kakao_rest_key
KAKAO_JAVASCRIPT_KEY=your_kakao_js_key

# Naver Login
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Apple Developer
APPLE_TEAM_ID=your_team_id
APPLE_APP_ID=your_app_id
```

### 5-5. .env.example 생성 (템플릿)

`.env.example`:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Kakao Login
KAKAO_NATIVE_APP_KEY=your_kakao_native_app_key
KAKAO_REST_API_KEY=your_kakao_rest_api_key
KAKAO_JAVASCRIPT_KEY=your_kakao_javascript_key

# Naver Login
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Apple Developer
APPLE_TEAM_ID=your_apple_team_id
APPLE_APP_ID=your_apple_app_id
```

### 5-6. Firebase 설정 파일 업데이트 (환경 변수 사용)

`src/config/firebase.ts`:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  Auth,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';

/**
 * Firebase 설정 (환경 변수에서 로드)
 */
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// ... 나머지 코드는 동일
```

### 5-7. 소셜 로그인 설정 파일

`src/config/kakao.ts`:

```typescript
import {
  KAKAO_NATIVE_APP_KEY,
  KAKAO_REST_API_KEY,
  KAKAO_JAVASCRIPT_KEY
} from '@env';

export const KAKAO_CONFIG = {
  nativeAppKey: KAKAO_NATIVE_APP_KEY,
  restApiKey: KAKAO_REST_API_KEY,
  javascriptKey: KAKAO_JAVASCRIPT_KEY,
  
  redirectUri: 'your-app://oauth',
  
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  tokenUrl: 'https://kauth.kakao.com/oauth/token',
  logoutUrl: 'https://kapi.kakao.com/v1/user/logout',
};
```

`src/config/naver.ts`:

```typescript
import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '@env';

export const NAVER_CONFIG = {
  clientId: NAVER_CLIENT_ID,
  clientSecret: NAVER_CLIENT_SECRET,
  
  redirectUri: 'your-app://oauth/naver',
  
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
};
```

---

## 6. TypeScript 및 Babel 설정

### 6-1. tsconfig.json 업데이트

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/config/*": ["src/config/*"],
      "@/services/*": ["src/services/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"],
      "@/constants/*": ["src/constants/*"],
      "@/core/*": ["src/core/*"],
      "@/modules/*": ["src/modules/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "types/env.d.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### 6-2. Babel 설정

**⚠️ 실전 오류 해결**: 플러그인 순서가 매우 중요합니다!

`babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/types': './src/types',
            '@/config': './src/config',
            '@/services': './src/services',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/core': './src/core',
            '@/modules': './src/modules'
          }
        }
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true
        }
      ],
      'react-native-reanimated/plugin' // ⚠️ 반드시 마지막!
    ]
  };
};
```

### 6-3. Babel 관련 패키지 설치

```bash
# babel-plugin-module-resolver 설치
npm install --save-dev babel-plugin-module-resolver
```

---

## 7. 필수 패키지 설치

### 7-1. React Navigation 설치

```bash
# React Navigation 코어
npm install @react-navigation/native@^6.1.0
npm install @react-navigation/bottom-tabs@^6.6.0
npm install @react-navigation/stack@^6.4.0

# React Navigation 의존성 (Expo 호환 버전)
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler
npx expo install react-native-reanimated
```

### 7-2. 기타 필수 라이브러리

```bash
# 날짜 처리
npm install date-fns@^3.6.0

# 알림
npx expo install expo-notifications

# 소셜 로그인
npx expo install expo-auth-session expo-web-browser expo-crypto

# UUID 생성
npm install uuid@^10.0.0
npm install --save-dev @types/uuid

# TypeScript 타입
npm install --save-dev @types/react
```

### 7-3. 설치 확인

```bash
# 패키지 목록 확인
npm list --depth=0

# TypeScript 컴파일 체크
npx tsc --noEmit
```

---

## 8. app.json 설정

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["your-app"]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.yourapp",
      "versionCode": 1,
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "your-app",
    "extra": {
      "firebaseProjectId": "your-firebase-project",
      "appleTeamId": "YOUR_TEAM_ID",
      "kakaoNativeAppKey": "KAKAO_KEY"
    },
    "plugins": []
  }
}
```

---

## 9. Firebase 연결 테스트

### 9-1. App.tsx 업데이트

`App.tsx`:

```tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from './src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      await getDocs(collection(db, '_test'));
      setConnected(true);
      console.log('✅ Firebase 연결 성공');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setConnected(true);
        console.log('✅ Firebase 연결 성공 (권한 확인됨)');
      } else {
        console.error('❌ Firebase 연결 실패:', error);
        setConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Firebase 연결 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your App</Text>
      <Text style={styles.subtitle}>your-app</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Firebase 상태:</Text>
        <Text style={[
          styles.statusValue,
          { color: connected ? '#4CAF50' : '#F44336' }
        ]}>
          {connected ? '✅ 연결됨' : '❌ 연결 실패'}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>프로젝트 ID: your-project</Text>
        <Text style={styles.infoText}>번들 ID: com.yourcompany.yourapp</Text>
        <Text style={styles.infoText}>버전: 1.0.0</Text>
      </View>
      
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
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
```

### 9-2. 앱 실행 및 테스트

```bash
# 캐시 클리어 후 실행 (중요!)
npx expo start -c
```

**예상 로그**:
```
env: load .env
env: export FIREBASE_API_KEY ...
Starting Metro Bundler
🔥 Firebase 초기화 완료
📱 Environment: {"projectId": "your-project", "isDevelopment": true}
✅ Firebase 연결 성공
```

### 9-3. Expo Go에서 테스트

1. 스마트폰에 Expo Go 앱 설치
2. 터미널에 표시된 QR 코드 스캔
3. 앱 실행 확인
4. "Firebase 상태: ✅ 연결됨" 표시 확인

---

## 10. .gitignore 업데이트

`.gitignore`:

```gitignore
# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# Native
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# 환경 변수 (중요!)
.env
.env*.local
.env.production

# TypeScript
*.tsbuildinfo

# Generated folders
/ios
/android

# Node
node_modules/
```

---

## 11. 최종 검증 체크리스트

### ✅ 환경 설정
- [ ] Node.js 18.x 이상 설치
- [ ] npm 9.x 이상 설치
- [ ] Git 설치

### ✅ 프로젝트 생성
- [ ] Expo 프로젝트 생성 완료
- [ ] src 폴더 구조 생성
- [ ] types 폴더 생성

### ✅ Firebase 설정
- [ ] Firebase 패키지 설치
- [ ] firebase.ts 생성
- [ ] 환경 변수 설정
- [ ] Firebase 연결 테스트 통과

### ✅ 환경 변수
- [ ] react-native-dotenv 설치
- [ ] types/env.d.ts 생성
- [ ] .env 파일 생성
- [ ] .env.example 생성
- [ ] babel.config.js에 dotenv 설정

### ✅ TypeScript 설정
- [ ] tsconfig.json 업데이트
- [ ] Path alias 설정
- [ ] npx tsc --noEmit 성공

### ✅ Babel 설정
- [ ] babel-preset-expo 설치
- [ ] babel-plugin-module-resolver 설치
- [ ] react-native-reanimated/plugin 마지막 위치

### ✅ 필수 패키지
- [ ] React Navigation 설치
- [ ] date-fns 설치
- [ ] expo-notifications 설치
- [ ] expo-auth-session 설치
- [ ] uuid 설치

### ✅ 앱 실행
- [ ] npx expo start -c 실행
- [ ] Metro 번들러 정상 작동
- [ ] Expo Go에서 앱 실행
- [ ] Firebase 연결 성공 확인

---

## 12. 실전 오류 해결 가이드

### 🔴 오류 1: babel-preset-expo를 찾을 수 없음

**증상**:
```
Error: Cannot find module 'babel-preset-expo'
```

**해결**:
```bash
npx expo install babel-preset-expo
npx expo start -c
```

### 🔴 오류 2: getReactNativePersistence가 없음

**증상**:
```typescript
Module '"firebase/auth"' has no exported member 'getReactNativePersistence'
```

**해결**: Firebase v11에서 제거됨. 위의 커스텀 persistence 사용

### 🔴 오류 3: Port 8081이 이미 사용 중

**증상**:
```
Port 8081 is running this app in another window
```

**해결**:
```bash
# 모든 Expo 프로세스 종료
pkill -f "expo start"
pkill -f "node.*8081"

# 또는 포트 직접 종료
lsof -ti:8081 | xargs kill -9

# 재시작
npx expo start
```

### 🔴 오류 4: 환경 변수가 undefined

**증상**:
```
FIREBASE_API_KEY is undefined
```

**해결**:
```bash
# 1. .env 파일 존재 확인
ls -la | grep .env

# 2. babel.config.js에 dotenv 설정 확인

# 3. Metro 캐시 클리어 (필수!)
npx expo start -c
```

### 🔴 오류 5: Reanimated plugin 순서 오류

**증상**:
```
Reanimated plugin must be listed last in the Babel plugins
```

**해결**: babel.config.js에서 `react-native-reanimated/plugin`을 **반드시 마지막**에 배치

### 🔴 오류 6: AsyncStorage 버전 경고

**증상**:
```
@firebase/auth: Auth (11.10.0): You are initializing Firebase Auth for React Native without providing AsyncStorage
```

**해결**: 무시해도 됩니다. 커스텀 persistence가 작동하고 있으며, 경고만 표시됩니다.

---

## 13. 최종 프로젝트 구조

```
your-project/
├── your-app/
│   ├── .env                          # 환경 변수 (Git 무시)
│   ├── .env.example                  # 환경 변수 템플릿
│   ├── .gitignore
│   ├── app.json
│   ├── App.tsx
│   ├── babel.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── assets/
│   ├── node_modules/
│   ├── types/
│   │   └── env.d.ts                  # 환경 변수 타입
│   └── src/
│       ├── config/
│       │   ├── firebase.ts           # Firebase 설정
│       │   ├── kakao.ts              # 카카오 로그인
│       │   └── naver.ts              # 네이버 로그인
│       ├── types/                    # TypeScript 타입
│       ├── core/engines/             # 공통 엔진
│       ├── modules/                  # 기능 모듈
│       │   ├── cleaning/
│       │   ├── fridge/
│       │   └── medicine/
│       ├── screens/                  # 화면
│       ├── components/               # 컴포넌트
│       ├── services/                 # 비즈니스 로직
│       ├── hooks/                    # 커스텀 훅
│       ├── utils/                    # 유틸리티
│       ├── constants/                # 상수
│       └── templates/                # 템플릿
└── your-prompts/                     # 개발 가이드
```

---

## 14. 다음 단계

**Step 02: 데이터 모델 정의**로 진행하세요.

### 준비 완료 사항
- ✅ Firebase 연결 완료
- ✅ 프로젝트 구조 완성
- ✅ 환경 변수 설정
- ✅ TypeScript 설정
- ✅ Babel 설정
- ✅ 필수 패키지 설치

### Step 02에서 할 일
- TypeScript 타입 정의 (Task, LifeObject, User)
- Firestore 스키마 설계
- 데이터 변환 유틸리티

---

## 📚 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [React Navigation 문서](https://reactnavigation.org/)
- [react-native-dotenv](https://github.com/goatandsheep/react-native-dotenv)

---

## 🎉 완료!

**축하합니다!** Step 01이 완료되었습니다.

이제 `npx expo start` 명령어로 앱을 실행하고, Expo Go에서 테스트할 수 있습니다.

**중요 명령어**:
```bash
# 개발 서버 시작
npx expo start

# 캐시 클리어 후 시작
npx expo start -c

# TypeScript 체크
npx tsc --noEmit
```

---

<p align="center">
  <sub>✅ Step 01 완료 | 실전 검증 완료 | 다음: Step 02</sub>
</p>

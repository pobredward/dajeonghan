# Step 01. 프로젝트 초기 설정 (이미 완료된 작업 기반)

> **🎯 목표**: 이미 완료된 Firebase 설정을 Expo 프로젝트에 연동하고 개발 환경 완성

## 📌 단계 정보

**순서**: Step 01/15  
**Phase**: Phase 1 - 기초 설정 (Foundation)  
**의존성**: 없음 (첫 번째 단계)  
**예상 소요 시간**: 1-2시간 (사전 작업 완료됨)  
**난이도**: ⭐⭐

## 🔧 권장 기술 스택 버전 (2026년 4월 기준)

이 프로젝트는 **Expo SDK 54**를 기반으로 시작합니다.

### 코어 프레임워크
- **Expo SDK**: `~54.0.0` (안정 버전, 프로덕션 검증 완료)
- **React Native**: `0.81.5` (SDK 54에 포함)
- **React**: `19.1.0` (SDK 54에 포함)
- **TypeScript**: `~5.9.2` (안정 버전)
- **Node.js**: `18.x` 이상 권장 (20.x 호환)

### 주요 라이브러리
- **Firebase JS SDK**: `^11.0.0` (안정 버전)
- **React Navigation**: `^6.x` (안정 버전)
  - `@react-navigation/native`: `^6.1.0`
  - `@react-navigation/bottom-tabs`: `^6.6.0`
  - `@react-navigation/stack`: `^6.4.0`
- **date-fns**: `^3.6.0` (날짜 처리)
- **React Native Reanimated**: `~3.16.0` (SDK 54 기본 포함)
- **React Native Gesture Handler**: `~2.20.0`

### 주요 특징
- ✅ **New Architecture 옵션**: 선택적 활성화 가능
- ✅ **안정적인 Expo Go 지원**: 프로덕션 검증 완료
- ✅ **개선된 프로젝트 구조**: `/src` 폴더 기반 구조 권장
- ✅ **React 19 지원**: 최신 React 기능 사용 가능

### SDK 54의 장점
- Expo Go 완벽 호환 (추가 설정 불필요)
- 대부분의 서드파티 라이브러리 안정적 지원
- 프로덕션 환경에서 검증된 버전

### 이전 단계 요구사항
- 없음 (시작 단계입니다)

### 다음 단계
- **Step 02**: 데이터 모델 정의

### 이 단계를 건너뛸 수 없는 이유
- 모든 후속 단계가 이 프로젝트 구조를 기반으로 합니다
- Firebase 연결 없이는 데이터 저장 불가능
- 필수 패키지 없이는 코드 작성 불가능

---

## ✅ 이미 완료된 사전 작업

**축하합니다!** 다음 항목들은 이미 완료되었습니다:

### 1. 프로젝트 정보
- ✅ 서비스 이름: **다정한** (dajeonghan)
- ✅ 번들 ID: `com.onmindlab.dajeonghan`
- ✅ 팀 ID: `3V8G7Y74HY`
- ✅ Google Cloud 프로젝트 번호: `593802522640`

### 2. Firebase 프로젝트
- ✅ 프로젝트 ID: `dajeonghan`
- ✅ 프로젝트 번호: `593802522640`
- ✅ Web 앱 등록 완료
  - App ID: `1:382190683951:web:14c575b5995c7e0264c3da`
  - Measurement ID: `G-MLJ4X6W3X0`
- ✅ iOS 앱 등록: `com.onmindlab.dajeonghan`
- ✅ Android 앱 등록: `com.onmindlab.dajeonghan`
- ✅ Authentication, Firestore, Storage 활성화

### 3. Apple Developer 설정
- ✅ Identifier 등록: `com.onmindlab.dajeonghan`
- ✅ Provisioning Profile 생성 완료
- ✅ 파일: `[expo]_comonmindlabdajeonghan.mobileprovision`

### 4. App Store Connect
- ✅ 앱 등록 완료
- ✅ Apple ID: `6761916450`

### 5. 소셜 로그인 앱 등록
- ✅ **카카오 로그인**
  - Native App Key: `d4ae3ad0839632cbaa36546e1b88bcc5`
  - REST API Key: `9bebc45782963a60e4deb7ce197ba491`
  - JavaScript Key: `ebb242165424f3b7edd1351efb814cb8`
- ✅ **네이버 로그인** 앱 등록 완료

### 6. 법적 문서
- ✅ [메인 웹사이트](https://edwardshin.notion.site/33d4e01da07780369ccefcec15a16969)
- ✅ [개인정보처리방침](https://edwardshin.notion.site/33d4e01da07780b78d6af6dc7c283311)
- ✅ [서비스 이용약관](https://edwardshin.notion.site/33d4e01da077800391afc77db04a18e8)

### 7. Expo 프로젝트 초기 설정
- ✅ 프로젝트 생성 완료
- ✅ 로고 설정 완료
- ✅ iOS Credentials 설정 완료

### 8. Firebase 설정 파일
- ✅ `GoogleService-Info.plist` (iOS) 다운로드 완료
- ✅ `google-services.json` (Android) 다운로드 완료

---

## 📋 Step 01에서 수행할 작업

이번 단계에서는 기존 설정을 프로젝트에 통합하고 개발 환경을 완성합니다.

### 완료 기준
- ✅ 프로젝트 폴더 구조 확인
- ✅ Firebase 설정 파일 위치 확인
- ✅ Firebase SDK 연동 및 테스트
- ✅ 필수 패키지 설치
- ✅ `npx expo start` 실행 시 앱 정상 작동
- ✅ Firebase 연결 테스트 통과

**예상 소요 시간**: 1-2시간

---

## 1. 환경 확인

### 환경 확인

```bash
# 1. Node.js 버전 확인 (18.x 이상 권장 - Expo SDK 54 요구사항)
node --version
# 출력 예: v18.x.x 또는 v20.x.x

# 2. npm 버전 확인
npm --version
# 출력 예: 9.x.x 이상

# 3. Git 확인
git --version

# 4. EAS CLI 설치 (없으면)
npm install -g eas-cli
eas --version

# 5. Expo CLI 최신 버전 확인
npx expo --version
```

**버전 요구사항**:
- ✅ Node.js: `18.x` 이상 (Expo SDK 54 권장)
- ✅ npm: `9.x` 이상 권장
- ✅ EAS CLI: `5.x` 이상

---

## 2. 프로젝트 폴더 확인

### 새 프로젝트 생성 (필요한 경우)

기존 프로젝트가 없거나 SDK 54로 새로 시작하는 경우:

```bash
# Expo SDK 54 프로젝트 생성
npx create-expo-app@latest dajeonghan --template blank

# 또는 TypeScript 템플릿으로 시작
npx create-expo-app@latest dajeonghan --template blank-typescript

# 프로젝트 폴더로 이동
cd dajeonghan
```

### 현재 프로젝트 구조

```bash
# 프로젝트 디렉토리로 이동
cd ~/Desktop/dev/dajeonghan

# 프로젝트 구조 확인
ls -la
```

**필수 파일 확인**:
- ✅ `GoogleService-Info.plist` (iOS Firebase 설정)
- ✅ `google-services.json` (Android Firebase 설정)  
- ✅ `[expo]_comonmindlabdajeonghan.mobileprovision` (iOS Provisioning)
- ✅ `app.json` (Expo 설정)
- ✅ `package.json` (의존성)

### node_modules 설치

```bash
# 의존성이 설치되지 않았다면
npm install
```

---

## 3. Firebase SDK 연동

### 3-1. 프로젝트 구조 먼저 생성

```bash
# src 폴더 및 하위 구조 생성
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
```

### 3-2. Firebase 패키지 설치

```bash
# Firebase SDK 설치 (버전 11.x - 안정 버전)
npm install firebase@^11.0.0

# AsyncStorage (Firebase Auth persistence용)
npx expo install @react-native-async-storage/async-storage

# Expo 관련 패키지
npx expo install expo-application expo-constants
```

**설치되는 버전**:
- `firebase`: `^11.0.0` (안정 버전, 프로덕션 검증)
- `@react-native-async-storage/async-storage`: Expo SDK 54 호환 버전 자동 선택
- `expo-application`: SDK 54 호환
- `expo-constants`: SDK 54 호환

### 3-3. Firebase 설정 파일 생성

`src/config/firebase.ts`:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence,
  Auth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase 설정 (실제 프로젝트 값)
 */
const firebaseConfig = {
  apiKey: "AIzaSyBAqHSREpEhXUMkuJnZ2bKSHwjaBp6ebrs",
  authDomain: "dajeonghan.firebaseapp.com",
  projectId: "dajeonghan",
  storageBucket: "dajeonghan.firebasestorage.app",
  messagingSenderId: "382190683951",
  appId: "1:382190683951:web:14c575b5995c7e0264c3da",
  measurementId: "G-MLJ4X6W3X0"
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
    persistence: getReactNativePersistence(AsyncStorage)
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

**⚠️ 중요**: 
- `projectId`, `authDomain`, `storageBucket`이 모두 **"dajeonghan"**으로 일치해야 합니다
- Firebase Console에서 직접 확인한 값을 사용하세요

### 3-4. Firebase 연결 테스트

`App.tsx` 수정:

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
      // Firestore 연결 테스트 (빈 컬렉션 조회)
      await getDocs(collection(db, '_test'));
      setConnected(true);
      console.log('✅ Firebase 연결 성공');
    } catch (error: any) {
      // 권한 오류는 정상 (테스트 모드에서 발생 가능)
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
      <Text style={styles.title}>다정한</Text>
      <Text style={styles.subtitle}>dajeonghan</Text>
      
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
        <Text style={styles.infoText}>프로젝트 ID: dajeonghan</Text>
        <Text style={styles.infoText}>번들 ID: com.onmindlab.dajeonghan</Text>
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

### 3-4. Firebase 연결 테스트

```bash
# 캐시 클리어 후 실행
npx expo start -c
```

**성공 확인**:
1. 콘솔에 `✅ Firebase 연결 성공` 출력
2. 화면에 "Firebase 상태: ✅ 연결됨" 표시
3. 프로젝트 정보가 정확히 표시됨

---

## 4. app.json 설정 확인 및 업데이트

기존 `app.json`을 확인하고 Firebase 관련 설정을 추가합니다:

```json
{
  "expo": {
    "name": "다정한",
    "slug": "dajeonghan",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.onmindlab.dajeonghan",
      "buildNumber": "1",
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["dajeonghan"]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.onmindlab.dajeonghan",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "dajeonghan",
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      },
      "firebaseProjectId": "dajeonghan",
      "appleTeamId": "3V8G7Y74HY",
      "kakaoNativeAppKey": "d4ae3ad0839632cbaa36546e1b88bcc5"
    },
    "plugins": []
  }
}
```

**중요 설정 항목**:
- ✅ `bundleIdentifier`: `com.onmindlab.dajeonghan` (Apple Developer와 일치)
- ✅ `package`: `com.onmindlab.dajeonghan` (Google Play와 일치)
- ✅ `googleServicesFile`: Firebase 설정 파일 경로
- ✅ `scheme`: `dajeonghan` (딥링크용, Step 12/14에서 사용)
- ✅ `extra`: 추가 환경 변수 (카카오 앱 키 등)
- ✅ `plugins`: 빈 배열 (필요시 나중에 추가)

**⚠️ 주의**: 
- `expo-build-properties`는 SDK 54에서는 선택사항입니다
- iOS에서 Firebase 네이티브 모듈이 필요한 경우에만 추가

---

## 5. 필수 패키지 설치

### 5-0. package.json 권장 버전 참고

아래는 Expo SDK 54 기반 프로젝트의 권장 `package.json` 구조입니다:

```json
{
  "name": "dajeonghan",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~54.0.0",
    "expo-status-bar": "~3.0.0",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "firebase": "^11.0.0",
    "@react-native-async-storage/async-storage": "2.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.6.0",
    "@react-navigation/stack": "^6.4.0",
    "react-native-screens": "~4.3.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "date-fns": "^3.6.0",
    "expo-notifications": "~0.29.0",
    "expo-auth-session": "~6.0.0",
    "expo-web-browser": "~14.0.0",
    "expo-crypto": "~14.0.0",
    "expo-application": "~6.0.0",
    "expo-constants": "~17.0.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~19.1.0",
    "@types/uuid": "^10.0.0",
    "typescript": "~5.9.2",
    "babel-plugin-module-resolver": "^5.0.0"
  }
}
```

**버전 규칙**:
- `~`: 패치 버전만 업데이트 (예: `~54.0.0` → `54.0.x`)
- `^`: 마이너 버전까지 업데이트 (예: `^11.0.0` → `11.x.x`)
- Expo 관련 패키지는 `npx expo install`로 자동 버전 매칭

### 5-1. 의존성 확인

```bash
# 현재 설치된 패키지 확인
npm list --depth=0
```

### 5-2. 추가 필수 패키지 설치

```bash
# React Navigation (v6 - Expo SDK 54 호환)
npm install @react-navigation/native@^6.1.0
npm install @react-navigation/bottom-tabs@^6.6.0
npm install @react-navigation/stack@^6.4.0

# React Navigation 의존성 (Expo SDK 54 버전)
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler@~2.20.0
npx expo install react-native-reanimated@~3.16.0

# 날짜 처리
npm install date-fns@^3.6.0

# 알림 (Expo SDK 54 호환)
npx expo install expo-notifications

# 소셜 로그인 (Expo SDK 54 호환)
npx expo install expo-auth-session expo-web-browser expo-crypto

# UUID 생성
npm install uuid@^10.0.0
npm install --save-dev @types/uuid

# TypeScript 타입 정의
npm install --save-dev @types/react
npm install --save-dev typescript@~5.9.2

# Babel module resolver
npm install --save-dev babel-plugin-module-resolver
```

**주요 버전 요약**:
- React Navigation v6: Expo SDK 54 완전 호환
- React Native Reanimated v3: 안정적인 성능
- date-fns v3: 안정 버전
- Firebase v11: 프로덕션 검증된 안정 버전
- TypeScript v5.9: 안정 타입 기능 지원

### 5-3. 설치 확인

```bash
# 패키지 목록 확인
npm list --depth=0
```

**확인 항목**:
- ✅ `firebase@^11.0.0` (안정적인 프로덕션 버전)
- ✅ `@react-navigation/native@^6.1.0` (안정 버전)
- ✅ `react-native-reanimated@~3.16.0` (SDK 54 호환)
- ✅ `date-fns@^3.6.0` (안정 버전)
- ✅ `expo-notifications` (Expo SDK 54 버전)
- ✅ `@react-native-async-storage/async-storage` (Auth persistence)
- ✅ `expo-auth-session` (소셜 로그인용)
- ✅ `typescript@~5.9.2` (안정 타입 지원)

**최종 프로젝트 구조**:
```
dajeonghan/
├── GoogleService-Info.plist          (iOS Firebase)
├── google-services.json              (Android Firebase)
├── [expo]_comonmindlabdajeonghan.mobileprovision
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── eas.json
├── App.tsx
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── src/
    ├── config/                       (Firebase, 소셜 로그인 설정)
    │   ├── firebase.ts
    │   ├── kakao.ts
    │   └── naver.ts
    ├── types/                        (TypeScript 타입 - Step 02)
    ├── core/                         (공통 엔진 - Step 03)
    │   └── engines/
    ├── modules/                      (기능 모듈 - Step 04~06)
    │   ├── cleaning/
    │   ├── fridge/
    │   └── medicine/
    ├── screens/                      (화면 - Step 07~09)
    ├── components/                   (공통 컴포넌트 - Step 09)
    ├── services/                     (서비스 - Step 08, 10, 14)
    ├── hooks/                        (커스텀 훅)
    ├── utils/                        (유틸리티)
    ├── constants/                    (상수 - Step 09)
    └── templates/                    (온보딩 템플릿 - Step 07)
```

---

## 6. TypeScript 설정

### 6-1. tsconfig.json 확인

기존 `tsconfig.json` 파일에 path alias 추가:

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
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

**TypeScript 5.7 주요 설정**:
- `target: "ES2022"`: React Native 0.83과 Hermes 호환
- `strict: true`: 엄격한 타입 체크
- `lib: ["ES2022"]`: 최신 JavaScript 기능 사용

### 6-2. Babel 설정

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
      'react-native-reanimated/plugin' // ⚠️ 반드시 마지막에 추가
    ]
  };
};
```

**babel-plugin-module-resolver 설치**:
```bash
npm install --save-dev babel-plugin-module-resolver
```

**중요**: `react-native-reanimated/plugin`은 반드시 plugins 배열의 **마지막**에 위치해야 합니다 (Expo SDK 54 / Reanimated v3 요구사항).

---

## 7. 소셜 로그인 설정 파일

### 7-1. 카카오 로그인 설정

`src/config/kakao.ts`:

```typescript
export const KAKAO_CONFIG = {
  nativeAppKey: 'd4ae3ad0839632cbaa36546e1b88bcc5',
  restApiKey: '9bebc45782963a60e4deb7ce197ba491',
  javascriptKey: 'ebb242165424f3b7edd1351efb814cb8',
  
  redirectUri: 'dajeonghan://oauth',
  
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  tokenUrl: 'https://kauth.kakao.com/oauth/token',
  logoutUrl: 'https://kapi.kakao.com/v1/user/logout',
};
```

### 7-2. 네이버 로그인 설정

`src/config/naver.ts`:

```typescript
export const NAVER_CONFIG = {
  // TODO: 네이버 개발자 센터에서 값 가져오기
  clientId: 'YOUR_NAVER_CLIENT_ID',
  clientSecret: 'YOUR_NAVER_CLIENT_SECRET',
  
  redirectUri: 'dajeonghan://oauth/naver',
  
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
};
```

---

## 8. 환경 변수 설정 (선택적)

### 8-1. .env 파일 생성 (개발용)

```.env
# Firebase (이미 코드에 하드코딩되어 있으므로 선택사항)
FIREBASE_PROJECT_ID=dajeonghan
FIREBASE_PROJECT_NUMBER=593802522640

# API Keys (민감한 정보는 여기에)
KAKAO_NATIVE_APP_KEY=d4ae3ad0839632cbaa36546e1b88bcc5
KAKAO_REST_API_KEY=9bebc45782963a60e4deb7ce197ba491

# Apple
APPLE_TEAM_ID=3V8G7Y74HY

# App Store Connect
APPLE_ID=6761916450
```

### 8-2. .gitignore 확인

```.gitignore
# Expo
.expo/
dist/
web-build/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# 환경 변수 (중요!)
.env
.env.local
.env.production

# Firebase 설정 파일은 커밋 가능 (이미 공개된 정보)
# GoogleService-Info.plist
# google-services.json

# 민감한 파일
*.mobileprovision
```

---

## 9. Git 커밋

### 9-1. 현재 상태 확인

```bash
git status
```

### 9-2. 변경사항 커밋

```bash
# 모든 파일 스테이징
git add .

# 커밋
git commit -m "Setup: Add Firebase integration and project structure

- Add Firebase SDK configuration
- Add project folder structure (src/)
- Add path aliases (@/ imports)
- Add Kakao/Naver login configs
- Update app.json with bundle IDs
- Add Firebase connection test in App.tsx"

# (선택) 원격 저장소 푸시
git push
```

---

## 10. EAS 프로젝트 초기화

### 10-1. EAS 로그인

```bash
# EAS에 로그인 (Expo 계정)
eas login
```

### 10-2. EAS 프로젝트 설정

```bash
# EAS Build 설정 초기화
eas build:configure

# iOS Credentials 업로드 (Provisioning Profile)
eas credentials

# 출력에서 Project ID 복사
```

### 10-3. app.json에 EAS Project ID 추가

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_COPIED_PROJECT_ID"
      }
    }
  }
}
```

### 10-4. eas.json 생성

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
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.onmindlab.dajeonghan"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "pobredward@icloud.com",
        "ascAppId": "6761916450",
        "appleTeamId": "3V8G7Y74HY"
      },
      "android": {
        "track": "production"
      }
    }
  }
}
```

**⚠️ 중요**: 
- Android의 `serviceAccountKeyPath`는 별도의 Google Play Service Account JSON 키 파일이 필요합니다
- `google-services.json`은 Firebase 설정 파일이며, Play Store 업로드용이 아닙니다
- Service Account 키는 [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)에서 생성해야 합니다

---

## 11. 최종 체크리스트

### ✅ 사전 작업 (이미 완료됨)
- [x] Google Cloud 프로젝트 생성
- [x] Firebase 프로젝트 생성 및 연동
- [x] iOS 앱 등록
- [x] Android 앱 등록
- [x] Web 앱 등록
- [x] Authentication, Firestore, Storage 활성화
- [x] Apple Developer 설정 (Identifier, Provisioning Profile)
- [x] App Store Connect 앱 등록
- [x] 카카오/네이버 로그인 앱 등록
- [x] 법적 문서 작성 및 게시

### 📋 Step 01 작업 항목

#### 환경 설정
- [ ] Node.js 18.x 이상 확인 (Expo SDK 54 요구사항)
- [ ] npm 9.x 이상 확인
- [ ] EAS CLI 5.x 이상 설치 확인
- [ ] Git 설치 확인
- [ ] TypeScript 5.9.x 설치 확인

#### 프로젝트 파일
- [ ] 프로젝트 폴더로 이동 (`~/Desktop/dev/dajeonghan`)
- [ ] `GoogleService-Info.plist` 루트에 있는지 확인
- [ ] `google-services.json` 루트에 있는지 확인
- [ ] `[expo]_comonmindlabdajeonghan.mobileprovision` 확인

#### Firebase 연동
- [ ] `src/config/firebase.ts` 파일 생성
- [ ] Firebase config 값 입력 (실제 프로젝트 값)
- [ ] `App.tsx` 연결 테스트 코드 추가
- [ ] `npx expo start -c` 실행
- [ ] 콘솔에서 `✅ Firebase 연결 성공` 확인
- [ ] 화면에 "Firebase 상태: ✅ 연결됨" 표시

#### 패키지 설치
- [ ] Firebase SDK 11.x 설치
- [ ] React Navigation v6 패키지 설치
- [ ] React Native Reanimated v3 설치 (SDK 54 호환)
- [ ] date-fns v3 설치
- [ ] 알림 패키지 설치 (expo-notifications)
- [ ] 소셜 로그인 패키지 설치
- [ ] babel-plugin-module-resolver 설치
- [ ] `npm install` 오류 없음
- [ ] `npx expo install --check` 호환성 확인

#### 프로젝트 구조
- [ ] `src/` 폴더 생성
- [ ] 하위 폴더 구조 완성 (config, types, services 등)
- [ ] TypeScript path aliases 설정 (`@/`)
- [ ] Babel 설정 (module-resolver + reanimated/plugin)
- [ ] `babel.config.js`에 Reanimated plugin 마지막에 추가 확인

#### app.json 설정
- [ ] 번들 ID 확인: `com.onmindlab.dajeonghan`
- [ ] Firebase 설정 파일 경로 추가
- [ ] 딥링크 scheme 설정: `dajeonghan`
- [ ] extra 필드에 환경 변수 추가
- [ ] plugins에 expo-build-properties 추가 확인
- [ ] iOS useFrameworks: "static" 설정 확인

#### Git
- [ ] 현재 상태 확인 (`git status`)
- [ ] 변경사항 커밋
- [ ] (선택) 원격 저장소 푸시

#### EAS 설정
- [ ] EAS 로그인
- [ ] EAS Build 설정 초기화
- [ ] eas.json 생성
- [ ] app.json에 EAS Project ID 추가

---

## 12. 문제 해결

### Q1: Node.js 버전 오류

**증상**: `Expo SDK 54 requires Node.js 18.x or higher`

**해결**:
```bash
# Node.js 버전 확인
node --version

# 18.x 미만인 경우, nvm으로 업그레이드
nvm install 18
nvm use 18

# 또는 Node.js 공식 사이트에서 다운로드
# https://nodejs.org/
```

### Q2: Expo Go SDK 54 사용

**증상**: Expo Go 앱 버전 확인 필요

**해결**:
- **iOS/Android**: App Store/Play Store에서 최신 Expo Go 설치
- SDK 54는 Expo Go에서 완벽하게 지원됩니다
- 별도 설정 불필요

**대안**: 개발 빌드 사용 (선택사항)
```bash
npx expo install expo-dev-client
eas build --profile development --platform ios
```

### Q3: Reanimated 오류

**증상**: `Reanimated plugin must be listed last in the Babel plugins`

**해결**:
`babel.config.js`에서 `react-native-reanimated/plugin`이 **반드시 마지막**에 있는지 확인:
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module-resolver', { /* ... */ }],
    'react-native-reanimated/plugin' // ⚠️ 마지막!
  ]
};
```

그 후 캐시 클리어:
```bash
npx expo start -c
```

### Q4: Firebase 연결 실패

**증상**: `❌ Firebase 연결 실패` 표시

**원인 및 해결**:
1. **firebase.ts의 config 확인**
   - `projectId`: **"dajeonghan"** (정확히 일치해야 함)
   - `authDomain`: **"dajeonghan.firebaseapp.com"**
   - `storageBucket`: **"dajeonghan.firebasestorage.app"**
   - `apiKey`: Firebase Console에서 복사한 값과 일치하는지 확인

2. **Firebase Console에서 직접 확인**
   - Firebase Console > 프로젝트 설정 > 일반 탭
   - "내 앱" 섹션에서 웹 앱 선택
   - Firebase SDK 스니펫에서 config 값 복사
   - Firestore Database가 생성되어 있는지 확인
   - 데이터베이스 위치: `asia-northeast3` (서울)

3. **네트워크 확인**
   - 인터넷 연결 확인
   - 방화벽/VPN 설정 확인
   - 회사/학교 네트워크의 경우 Firebase 도메인 차단 여부 확인

**올바른 설정 예시**:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBAqHSREpEhXUMkuJnZ2bKSHwjaBp6ebrs",
  authDomain: "dajeonghan.firebaseapp.com",
  projectId: "dajeonghan",
  storageBucket: "dajeonghan.firebasestorage.app",
  messagingSenderId: "382190683951",
  appId: "1:382190683951:web:14c575b5995c7e0264c3da",
  measurementId: "G-MLJ4X6W3X0"
};
```

### Q5: TypeScript path alias 작동 안 함

**증상**: `Cannot find module '@/config/firebase'`

**해결**:
```bash
# 1. babel-plugin-module-resolver 설치 확인
npm list babel-plugin-module-resolver

# 없으면 설치
npm install --save-dev babel-plugin-module-resolver

# 2. Metro 캐시 클리어
npx expo start -c
```

### Q6: EAS CLI 명령어 오류

**증상**: `command not found: eas`

**해결**:
```bash
# 전역 설치 확인
npm list -g eas-cli

# 재설치
npm install -g eas-cli

# 터미널 재시작
```

### Q7: iOS/Android 빌드 파일 인식 안 됨

**증상**: Firebase 설정 파일을 찾을 수 없음

**해결**:
```bash
# 파일 위치 확인
ls -la | grep GoogleService
ls -la | grep google-services

# 파일이 루트 폴더에 있어야 함
# app.json의 googleServicesFile 경로 확인
```

### Q8: New Architecture 관련 오류

**증상**: New Architecture 관련 경고

**해결**:
SDK 54는 New Architecture가 선택사항입니다. 기본 설정으로 진행하면 됩니다.

필요시 활성화:
```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "ios": {
          "newArchEnabled": true
        },
        "android": {
          "newArchEnabled": true
        }
      }]
    ]
  }
}
```

필요한 패키지:
```bash
npx expo install expo-build-properties
```

---

## 13. 검증 테스트

### 13-1. 앱 실행 테스트

```bash
# 캐시 클리어 후 실행
npx expo start -c
```

**성공 기준**:
1. ✅ QR 코드 표시
2. ✅ 콘솔에 `🔥 Firebase 초기화 완료` 출력
3. ✅ 콘솔에 `✅ Firebase 연결 성공` 출력
4. ✅ 화면에 "다정한" 제목 표시
5. ✅ "Firebase 상태: ✅ 연결됨" 표시
6. ✅ 프로젝트 정보 정확히 표시

### 13-2. TypeScript 컴파일 테스트

```bash
# TypeScript 타입 체크
npx tsc --noEmit
```

**성공 시**: 오류 메시지 없음

### 13-3. Import 테스트

임시 테스트 파일 생성:

`src/test-imports.ts`:
```typescript
// path alias 테스트
import { db, auth } from '@/config/firebase';

console.log('✅ Firebase imports working');
```

`App.tsx`에 임시로 import:
```tsx
import './src/test-imports';
```

앱 실행 후 콘솔에서 확인:
- ✅ `✅ Firebase imports working` 출력

테스트 완료 후 삭제:
```bash
rm src/test-imports.ts
```

---

## 14. 다음 단계 준비

### Step 02 준비사항

**Step 02 (데이터 모델 정의)**에서는 다음을 수행합니다:
- TypeScript 타입 정의 (Task, LifeObject, User 등)
- Firestore 스키마 설계
- 템플릿 시스템 타입 추가
- 데이터 변환 유틸리티

**현재 준비 완료**:
- ✅ `src/types/` 폴더 생성됨
- ✅ Firebase SDK 연동됨
- ✅ TypeScript 환경 설정됨

---

## 🎉 Step 01 완료!

**축하합니다!** Firebase 연결 및 기본 환경 설정이 완료되었습니다.

### 현재 상태 요약

```
✅ 기술 스택: Expo SDK 54 (React Native 0.81, React 19.1)
✅ New Architecture: 선택적 활성화 가능
✅ Firebase SDK: 11.0.0 (안정 프로덕션 버전)
✅ React Navigation: v6 (완전 안정 버전)
✅ TypeScript: 5.9.x (안정 타입 기능)
✅ Node.js: 18.x 이상 (20.x 호환)
✅ Google Cloud 프로젝트: dajeonghan (593802522640)
✅ Firebase 프로젝트: dajeonghan
✅ Firebase Config: 올바른 projectId/authDomain 설정
✅ iOS 앱: com.onmindlab.dajeonghan
✅ Android 앱: com.onmindlab.dajeonghan
✅ Apple Developer 설정 완료
✅ App Store Connect 등록 (ID: 6761916450)
✅ 소셜 로그인 준비 (카카오, 네이버)
✅ 법적 문서 준비
✅ Expo 프로젝트 생성
✅ Firebase SDK 연동 및 테스트 성공
✅ 프로젝트 폴더 구조 생성 (14개 디렉토리)
✅ TypeScript 설정 완료 (path aliases)
✅ Babel 설정 완료 (Reanimated plugin)
✅ Expo Go 완벽 지원
```

### 다음 단계

👉 **[Step 02: 데이터 모델 정의](./step-02-data-models.md)**

Step 02에서는:
- Task, LifeObject, User 등의 TypeScript 타입 정의
- Firestore 컬렉션 구조 설계
- 템플릿 시스템 타입 추가 (Step 14용)
- 데이터 변환 및 검증 유틸리티

**준비 완료율**: 100%  
**예상 소요 시간**: 3-4시간

---

<p align="center">
  <sub>🎯 Step 01 완료 | 다음: Step 02</sub>
</p>

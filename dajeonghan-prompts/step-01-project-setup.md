# Step 01. 프로젝트 초기 설정 (이미 완료된 작업 기반)

> **🎯 목표**: 이미 완료된 Firebase 설정을 Expo 프로젝트에 연동하고 개발 환경 완성

## 📌 단계 정보

**순서**: Step 01/15  
**Phase**: Phase 1 - 기초 설정 (Foundation)  
**의존성**: 없음 (첫 번째 단계)  
**예상 소요 시간**: 1-2시간 (사전 작업 완료됨)  
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

### Node.js 및 도구 확인

```bash
# 1. Node.js 버전 확인 (18.x LTS 권장)
node --version

# 2. npm 버전 확인
npm --version

# 3. Git 확인
git --version

# 4. EAS CLI 설치 (없으면)
npm install -g eas-cli
eas --version
```

---

## 2. 프로젝트 폴더 확인

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

### 3-1. Firebase 패키지 설치

```bash
# Firebase SDK 설치
npm install firebase

# AsyncStorage (Firebase Auth persistence용)
npm install @react-native-async-storage/async-storage

# Expo 관련
npm install expo-application expo-constants
```

### 3-2. 프로젝트 구조 생성

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
```

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
  authDomain: "smis-mentor.firebaseapp.com",
  projectId: "smis-mentor",
  storageBucket: "smis-mentor.firebasestorage.app",
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

### 3-5. 앱 실행 및 테스트

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
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

**중요 설정 항목**:
- ✅ `bundleIdentifier`: `com.onmindlab.dajeonghan` (Apple Developer와 일치)
- ✅ `package`: `com.onmindlab.dajeonghan` (Google Play와 일치)
- ✅ `googleServicesFile`: Firebase 설정 파일 경로
- ✅ `scheme`: `dajeonghan` (딥링크용, Step 12/14에서 사용)
- ✅ `extra`: 추가 환경 변수 (카카오 앱 키 등)

---

## 5. 필수 패키지 설치

### 5-1. 의존성 확인

```bash
# 현재 설치된 패키지 확인
npm list --depth=0
```

### 5-2. 추가 필수 패키지 설치

```bash
# 네비게이션
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
npm install @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# 날짜 처리
npm install date-fns

# 알림
npx expo install expo-notifications

# 소셜 로그인 (카카오, 네이버)
npx expo install expo-auth-session expo-web-browser expo-crypto

# UUID 생성
npm install uuid
npm install --save-dev @types/uuid

# 개발 도구
npm install --save-dev @types/react @types/react-native
```

### 5-3. 설치 확인

```bash
# 패키지 목록 확인
npm list --depth=0
```

**확인 항목**:
- ✅ `firebase`
- ✅ `@react-navigation/native`
- ✅ `date-fns`
- ✅ `expo-notifications`
- ✅ `@react-native-async-storage/async-storage`
- ✅ `expo-auth-session` (소셜 로그인용)

---

## 6. 프로젝트 폴더 구조 생성

### 6-1. 기본 폴더 구조

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

**최종 구조**:
```
dajeonghan/
├── GoogleService-Info.plist          (iOS Firebase)
├── google-services.json              (Android Firebase)
├── [expo]_comonmindlabdajeonghan.mobileprovision
├── app.json
├── package.json
├── tsconfig.json
├── App.tsx
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── src/
    ├── config/                       (Firebase 설정)
    │   └── firebase.ts
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

## 7. TypeScript 설정

### 7-1. tsconfig.json 확인

기존 `tsconfig.json` 파일에 path alias 추가:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
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

### 7-2. Babel 설정

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
      ]
    ]
  };
};
```

**babel-plugin-module-resolver 설치**:
```bash
npm install --save-dev babel-plugin-module-resolver
```

---

## 8. 소셜 로그인 설정 파일

### 8-1. 카카오 로그인 설정

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

### 8-2. 네이버 로그인 설정

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

## 9. 환경 변수 설정 (선택적)

### 9-1. .env 파일 생성 (개발용)

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

### 9-2. .gitignore 확인

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

## 10. Git 커밋

### 10-1. 현재 상태 확인

```bash
git status
```

### 10-2. 변경사항 커밋

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

## 11. EAS 프로젝트 초기화

### 11-1. EAS 로그인

```bash
# EAS에 로그인 (Expo 계정)
eas login
```

### 11-2. EAS 프로젝트 설정

```bash
# EAS Build 설정 초기화
eas build:configure

# iOS Credentials 업로드 (Provisioning Profile)
eas credentials

# 출력에서 Project ID 복사
```

### 11-3. app.json에 EAS Project ID 추가

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

### 11-4. eas.json 생성

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
        "serviceAccountKeyPath": "./google-services.json"
      }
    }
  }
}
```

---

## 12. 최종 체크리스트

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
- [ ] Node.js 18.x 이상 확인
- [ ] EAS CLI 설치 확인
- [ ] Git 설치 확인

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
- [ ] Firebase SDK 설치
- [ ] 네비게이션 패키지 설치
- [ ] 날짜 처리 패키지 설치
- [ ] 알림 패키지 설치
- [ ] 소셜 로그인 패키지 설치
- [ ] `npm install` 오류 없음

#### 프로젝트 구조
- [ ] `src/` 폴더 생성
- [ ] 하위 폴더 구조 완성 (config, types, services 등)
- [ ] TypeScript path aliases 설정 (`@/`)
- [ ] Babel 설정 (module-resolver)

#### app.json 설정
- [ ] 번들 ID 확인: `com.onmindlab.dajeonghan`
- [ ] Firebase 설정 파일 경로 추가
- [ ] 딥링크 scheme 설정: `dajeonghan`
- [ ] extra 필드에 환경 변수 추가

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

## 13. 문제 해결

### Q1: Firebase 연결 실패

**증상**: `❌ Firebase 연결 실패` 표시

**원인 및 해결**:
1. **firebase.ts의 config 확인**
   - `projectId` 오타 확인
   - `apiKey` 정확한지 확인

2. **Firebase Console 확인**
   - Firestore Database가 생성되어 있는지
   - 위치: `asia-northeast3` (서울)

3. **네트워크 확인**
   - 인터넷 연결 확인
   - 방화벽/VPN 설정 확인

### Q2: TypeScript path alias 작동 안 함

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

### Q3: EAS CLI 명령어 오류

**증상**: `command not found: eas`

**해결**:
```bash
# 전역 설치 확인
npm list -g eas-cli

# 재설치
npm install -g eas-cli

# 터미널 재시작
```

### Q4: iOS/Android 빌드 파일 인식 안 됨

**증상**: Firebase 설정 파일을 찾을 수 없음

**해결**:
```bash
# 파일 위치 확인
ls -la | grep GoogleService
ls -la | grep google-services

# 파일이 루트 폴더에 있어야 함
# app.json의 googleServicesFile 경로 확인
```

---

## 14. 검증 테스트

### 14-1. 앱 실행 테스트

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

### 14-2. TypeScript 컴파일 테스트

```bash
# TypeScript 타입 체크
npx tsc --noEmit
```

**성공 시**: 오류 메시지 없음

### 14-3. Import 테스트

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

## 15. 다음 단계 준비

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
✅ Google Cloud 프로젝트: dajeonghan (593802522640)
✅ Firebase 프로젝트: dajeonghan
✅ iOS 앱: com.onmindlab.dajeonghan
✅ Android 앱: com.onmindlab.dajeonghan
✅ Apple Developer 설정 완료
✅ App Store Connect 등록 (ID: 6761916450)
✅ 소셜 로그인 준비 (카카오, 네이버)
✅ 법적 문서 준비
✅ Expo 프로젝트 생성
✅ Firebase SDK 연동 및 테스트 성공
✅ 프로젝트 폴더 구조 생성
✅ TypeScript 설정 완료
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

# 다정한 - Firebase 설정 가이드

## 📋 개요

이 문서는 다정한 앱의 Firebase 설정 및 배포 방법을 안내합니다.

## 🔥 사전 준비

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인

```bash
firebase login
```

### 3. Firebase 프로젝트 초기화 (최초 1회)

```bash
# 프로젝트 루트에서 실행
firebase init

# 선택 사항:
# - Firestore (Rules and Indexes)
# - Functions
# - Storage
```

### 4. Firebase 프로젝트 연결

```bash
# 기존 프로젝트 사용
firebase use --add

# 프로젝트 ID 입력 (예: dajeonghan-app)
# Alias 설정 (예: production)
```

## 📁 파일 구조

```
dajeonghan/
├── firebase.json              # Firebase 설정 파일
├── .firebaserc                # 프로젝트 설정 (자동 생성)
├── .firebaseignore            # 배포 제외 파일
├── storage.rules              # Storage 보안 규칙
├── dajeonghan-app/
│   ├── firestore.rules        # Firestore 보안 규칙
│   └── firestore.indexes.json # Firestore 인덱스
└── functions/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts           # Cloud Functions 코드
```

## 🚀 배포

### 1. Firestore Rules 배포

```bash
firebase deploy --only firestore:rules
```

### 2. Firestore Indexes 배포

```bash
firebase deploy --only firestore:indexes
```

### 3. Storage Rules 배포

```bash
firebase deploy --only storage
```

### 4. Cloud Functions 배포 (2단계에서 사용)

```bash
# Functions 디렉토리에서 의존성 설치
cd functions
npm install
cd ..

# 배포
firebase deploy --only functions
```

### 5. 전체 배포

```bash
firebase deploy
```

## 🧪 로컬 테스트 (Emulator)

### 1. Emulator 시작

```bash
firebase emulators:start
```

### 2. Emulator UI 접속

```
http://localhost:4000
```

### 3. 앱에서 Emulator 연결

`src/config/firebase.ts`에서 다음 코드를 추가:

```typescript
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { connectStorageEmulator } from 'firebase/storage';

if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## 🔧 환경 변수 설정

### 1. 앱 환경 변수 (`.env`)

```bash
# Firebase 설정
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-ABCDEFGH
```

### 2. Firebase Console에서 가져오기

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 프로젝트 설정 → 일반 → 내 앱
4. "구성" 또는 "Config" 클릭하여 값 복사

### 3. Cloud Functions 환경 변수 (2단계)

```bash
firebase functions:config:set expo.push.url="https://exp.host/--/api/v2/push/send"
firebase functions:config:get
```

## 📊 Firestore 인덱스 생성

### 자동 생성

앱에서 쿼리 실행 시 Firebase가 자동으로 인덱스 생성 링크를 제공합니다.

### 수동 생성

```bash
firebase deploy --only firestore:indexes
```

또는 [Firebase Console](https://console.firebase.google.com/) → Firestore → 색인에서 수동 생성

## 🔒 보안 규칙 테스트

### 1. Emulator에서 테스트

```bash
firebase emulators:start
```

### 2. Rules Playground 사용

[Firebase Console](https://console.firebase.google.com/) → Firestore → 규칙 → Rules Playground

## 📈 모니터링

### 1. Functions 로그 확인

```bash
firebase functions:log
```

### 2. Firebase Console에서 확인

- [Firebase Console](https://console.firebase.google.com/) → Functions → 로그
- [Firebase Console](https://console.firebase.google.com/) → Firestore → 데이터

## 🐛 트러블슈팅

### 1. Firestore 인덱스 오류

```
The query requires an index. You can create it here: https://...
```

→ 링크를 클릭하여 인덱스 생성하거나 `firestore.indexes.json` 배포

### 2. Functions 배포 오류

```
Error: Build failed
```

→ `functions/` 디렉토리에서 `npm install` 실행 후 재시도

### 3. Storage 권한 오류

```
FirebaseError: storage/unauthorized
```

→ `storage.rules` 확인 및 배포

## 🎯 다음 단계

1. **Step 09**: 개인정보 및 법적 준수
2. **Step 10**: UI/UX 구현
3. **2단계**: Cloud Functions 실제 구현
   - 다이제스트 스케줄러
   - 주기 재조정
   - 푸시 알림

## 📚 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

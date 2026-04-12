# 다정한 (dajeonghan)

> 가족의 일상을 따뜻하게 돌보는 생활 관리 앱

## 📱 프로젝트 정보

- **서비스명**: 다정한
- **번들 ID**: `com.onmindlab.dajeonghan`
- **버전**: 1.0.0
- **개발 단계**: Phase 1 - 기초 설정 완료

## 🚀 기술 스택

### 코어 프레임워크
- **Expo SDK**: 54.0.33
- **React Native**: 0.81.5
- **React**: 19.1.0
- **TypeScript**: 5.9.2
- **Node.js**: 23.10.0

### 주요 라이브러리
- **Firebase SDK**: 11.0.2
- **React Navigation**: 6.x
- **date-fns**: 3.6.0
- **React Native Reanimated**: 3.16.7
- **React Native Gesture Handler**: 2.20.4

### 백엔드 서비스
- **Firebase Authentication**: 소셜 로그인 (카카오, 네이버)
- **Cloud Firestore**: 데이터베이스
- **Firebase Storage**: 파일 저장소

## 📁 프로젝트 구조

```
dajeonghan-app/
├── src/
│   ├── config/              # 설정 파일
│   │   ├── firebase.ts      # Firebase 설정
│   │   ├── kakao.ts         # 카카오 로그인
│   │   └── naver.ts         # 네이버 로그인
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
├── assets/                  # 이미지, 폰트 등
├── App.tsx                  # 루트 컴포넌트
├── app.json                 # Expo 설정
├── tsconfig.json            # TypeScript 설정
├── babel.config.js          # Babel 설정
└── package.json             # 의존성 관리
```

## 🛠 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 시작

```bash
npm start
# 또는
npx expo start
```

### 3. 플랫폼별 실행

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📝 주요 기능 (계획)

### Phase 1: 기초 설정 (완료)
- ✅ Firebase 연동
- ✅ 프로젝트 구조 설정
- ✅ TypeScript 설정
- ✅ 소셜 로그인 준비

### Phase 2: 코어 기능 (진행 예정)
- [ ] 데이터 모델 정의
- [ ] 순환 알고리즘 엔진
- [ ] 청소 관리 모듈
- [ ] 냉장고 관리 모듈
- [ ] 약 복용 관리 모듈

### Phase 3: UI/UX (진행 예정)
- [ ] 온보딩 화면
- [ ] 홈 화면
- [ ] 작업 관리 화면
- [ ] 알림 시스템

### Phase 4: 고급 기능 (진행 예정)
- [ ] 가족 공유 기능
- [ ] 데이터 동기화
- [ ] 푸시 알림
- [ ] 앱 배포

## 🔐 환경 변수

이 프로젝트는 `react-native-dotenv`를 사용하여 환경 변수를 관리합니다.

### 설정 방법

1. `.env.example` 파일을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

2. `.env` 파일에 실제 값 입력:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_actual_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
# ... 기타 설정
```

3. 환경 변수 사용 예시:

```typescript
import { FIREBASE_API_KEY } from '@env';

console.log(FIREBASE_API_KEY);
```

### 주의사항

- `.env` 파일은 Git에 커밋되지 않습니다 (.gitignore에 포함)
- 환경 변수 변경 후에는 Metro 캐시를 클리어해야 합니다:
  ```bash
  npx expo start -c
  ```
- TypeScript 타입 정의는 `types/env.d.ts`에 있습니다

## 📱 지원 플랫폼

- iOS 13.0 이상
- Android 5.0 이상
- Web (반응형)

## 🔧 유용한 명령어

```bash
# TypeScript 타입 체크
npx tsc --noEmit

# 캐시 클리어 후 시작
npx expo start -c

# 패키지 호환성 확인
npx expo install --check

# EAS 빌드 (프로덕션)
eas build --platform ios
eas build --platform android
```

## 📄 라이선스

MIT License

## 👥 팀

- **개발**: OnMindLab
- **Apple Team ID**: 3V8G7Y74HY
- **Firebase Project**: dajeonghan

---

<p align="center">
  Made with ❤️ by OnMindLab
</p>

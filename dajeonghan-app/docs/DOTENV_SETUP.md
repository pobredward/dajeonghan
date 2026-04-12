# react-native-dotenv 설정 완료

## ✅ 설치 및 설정 완료

### 1. 패키지 설치
- ✅ `react-native-dotenv` 설치 완료

### 2. Babel 설정
- ✅ `babel.config.js`에 `module:react-native-dotenv` 플러그인 추가
- ✅ 모듈 이름: `@env`
- ✅ 경로: `.env`
- ✅ `react-native-reanimated/plugin` 이전에 위치 (순서 중요)

### 3. TypeScript 설정
- ✅ `types/env.d.ts` 생성 (환경 변수 타입 정의)
- ✅ `tsconfig.json`에 타입 파일 포함

### 4. 환경 변수 파일
- ✅ `.env` 생성 (실제 값 포함)
- ✅ `.env.example` 생성 (템플릿)
- ✅ `.gitignore`에 `.env` 추가 (이미 포함됨)

### 5. 소스 코드 업데이트
- ✅ `src/config/firebase.ts` - 환경 변수 사용
- ✅ `src/config/kakao.ts` - 환경 변수 사용
- ✅ `src/config/naver.ts` - 환경 변수 사용

## 📋 환경 변수 목록

### Firebase
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

### 카카오 로그인
- `KAKAO_NATIVE_APP_KEY`
- `KAKAO_REST_API_KEY`
- `KAKAO_JAVASCRIPT_KEY`

### 네이버 로그인
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

### Apple Developer
- `APPLE_TEAM_ID`
- `APPLE_APP_ID`

## 📝 사용 방법

### 환경 변수 import

```typescript
import {
  FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID,
  KAKAO_NATIVE_APP_KEY
} from '@env';
```

### TypeScript 타입 정의

`types/env.d.ts`에 새로운 환경 변수를 추가하세요:

```typescript
declare module '@env' {
  export const YOUR_NEW_VAR: string;
}
```

## ⚠️ 주의사항

1. **캐시 클리어 필수**
   - 환경 변수 변경 후 반드시 Metro 캐시를 클리어해야 합니다
   ```bash
   npx expo start -c
   ```

2. **Git 커밋 주의**
   - `.env` 파일은 절대 커밋하지 마세요
   - `.env.example`만 커밋하세요

3. **빌드 시 주의**
   - EAS Build 시 `eas.json`에서 환경 변수를 설정해야 합니다
   - 또는 EAS Secrets를 사용하세요

4. **타입 정의 업데이트**
   - 새로운 환경 변수 추가 시 `types/env.d.ts`도 업데이트하세요

## 🔧 문제 해결

### 환경 변수가 undefined로 표시됨

```bash
# 1. Metro 캐시 클리어
npx expo start -c

# 2. node_modules 재설치
rm -rf node_modules
npm install

# 3. watchman 캐시 클리어 (macOS)
watchman watch-del-all
```

### TypeScript 에러

```bash
# tsconfig.json이 types/env.d.ts를 포함하는지 확인
# "include" 배열에 "types/env.d.ts" 추가
```

## 📚 참고

- [react-native-dotenv 공식 문서](https://github.com/goatandsheep/react-native-dotenv)
- [Expo 환경 변수 가이드](https://docs.expo.dev/guides/environment-variables/)

---

**생성일**: 2026-04-12
**작성자**: AI Assistant
**프로젝트**: 다정한 (dajeonghan)

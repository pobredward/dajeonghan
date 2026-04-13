# Step 11: 배포 준비 체크리스트

## ✅ 완료된 항목

### 1. 코드 품질
- [x] 린트 오류 없음
- [x] TypeScript 컴파일 오류 없음
- [x] 모든 핵심 서비스 구현 완료
- [x] Step 10 (성장 전략) 완료
- [x] Step 12 (템플릿 마켓플레이스) 핵심 로직 완료

### 2. 앱 정보
- [x] 앱 이름: 다정한
- [x] Bundle ID (iOS): com.onmindlab.dajeonghan
- [x] Package (Android): com.onmindlab.dajeonghan
- [x] Version: 1.0.0
- [x] Build Number: 1 (iOS) / Version Code: 1 (Android)

### 3. 딥링크 설정
- [x] URL Scheme: `dajeonghan://`
- [x] iOS Associated Domains: `applinks:dajeonghan.app`
- [x] Android Intent Filters: `https://dajeonghan.app/template`

---

## 📋 배포 전 필수 체크리스트

### A. 환경 변수 확인

#### Firebase 설정
```bash
# .env 파일에 다음 변수들이 설정되어 있는지 확인
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=dajeonghan
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

#### Kakao 설정
```bash
KAKAO_NATIVE_APP_KEY=d4ae3ad0839632cbaa36546e1b88bcc5
```

**⚠️ 중요**: 실제 배포 시 `.env.production` 파일을 별도로 관리하세요.

---

### B. 수동 테스트 체크리스트

#### 온보딩 플로우
- [ ] 앱 첫 실행 시 온보딩 화면 표시
- [ ] Kakao 로그인 정상 작동
- [ ] 페르소나 선택 가능
- [ ] 템플릿 선택 (선택 사항)
- [ ] 온보딩 완료 후 홈 화면 이동

#### 핵심 기능
- [ ] 냉장고 모듈: 식재료 추가/수정/삭제
- [ ] 청소 모듈: 테스크 생성/완료/미루기
- [ ] 약 모듈: 약 추가/복용 기록
- [ ] 알림: 푸시 알림 수신
- [ ] 설정: 프로필 수정, 개인정보처리방침 확인

#### 데이터 동기화
- [ ] Firebase 저장 정상 작동
- [ ] 오프라인 모드에서 데이터 접근 가능
- [ ] 네트워크 복구 시 동기화

#### UI/UX
- [ ] 모든 화면에서 스크롤 정상 작동
- [ ] 버튼 터치 피드백
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시
- [ ] 빈 상태 메시지 표시

#### 성능
- [ ] 앱 시작 시간 3초 이내
- [ ] 화면 전환 부드러움 (60fps)
- [ ] 메모리 사용량 적정
- [ ] 배터리 소모 정상

---

### C. Firebase 배포 확인

#### Firestore
- [ ] Security Rules 배포됨
- [ ] 필요한 인덱스 생성됨
- [ ] 컬렉션 구조 확인

#### Storage
- [ ] Security Rules 배포됨
- [ ] 폴더 구조 설정

#### Cloud Functions (선택 사항)
- [ ] Functions 배포됨
- [ ] 스케줄러 작동 확인

#### Hosting (개인정보처리방침)
- [ ] `https://dajeonghan.app/privacy-policy` 접근 가능

---

### D. 스토어 제출 준비

#### 스크린샷 (필요 시 캡처)
**iOS (iPhone 6.7")**:
- [ ] 홈 화면
- [ ] 냉장고 화면
- [ ] 청소 화면
- [ ] 약 관리 화면
- [ ] 설정 화면

**Android**:
- [ ] 홈 화면
- [ ] 냉장고 화면
- [ ] 청소 화면
- [ ] 약 관리 화면
- [ ] 설정 화면

#### 앱 설명 (Store Listing)
```
제목: 다정한 - 생활 관리의 시작

짧은 설명:
냉장고, 청소, 약 관리를 한 곳에서. 습관을 만드는 생활 관리 앱.

전체 설명:
다정한은 바쁜 일상 속에서 놓치기 쉬운 생활 관리를 도와드립니다.

주요 기능:
🥗 냉장고 관리 - 식재료 유통기한 관리
🧹 청소 관리 - 주기적인 청소 루틴
💊 약 관리 - 복용 시간 알림
📊 통계 - 습관 형성 추적
⭐ 템플릿 - 다른 사용자의 루틴 공유

특징:
✓ 간편한 사용성
✓ 스마트 알림
✓ 66일 습관 형성 시스템
✓ 오프라인 지원
✓ 개인정보 보호

다정한과 함께 체계적인 생활 관리를 시작하세요!
```

#### 키워드 (ASO)
```
생활관리, 냉장고, 청소, 약관리, 습관, 루틴, 유통기한, 알림, 일정관리, 가사
```

#### 카테고리
- Primary: Lifestyle (생활)
- Secondary: Productivity (생산성)

---

## 🚀 EAS Build 명령어 (실제 배포 시 사용)

### 1. EAS 설정

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# EAS 프로젝트 초기화
eas build:configure
```

### 2. 개발 빌드 (내부 테스트용)

```bash
# iOS 개발 빌드
eas build --platform ios --profile development

# Android 개발 빌드
eas build --platform android --profile development
```

### 3. 프로덕션 빌드 (스토어 제출용)

```bash
# iOS 프로덕션 빌드
eas build --platform ios --profile production

# Android 프로덕션 빌드
eas build --platform android --profile production

# 양쪽 동시 빌드
eas build --platform all --profile production
```

### 4. 제출

```bash
# iOS App Store 제출
eas submit --platform ios

# Android Play Store 제출
eas submit --platform android
```

---

## ⚠️ 배포 전 주의사항

### 1. 환경 변수
- `.env` 파일은 절대 커밋하지 마세요
- `.env.production` 파일을 별도로 관리하세요
- Firebase API Key는 보안 설정을 확인하세요

### 2. 개인정보
- 개인정보처리방침 URL이 접근 가능한지 확인
- 약관 동의 플로우 확인
- 데이터 삭제 기능 작동 확인

### 3. 결제 (프리미엄 기능)
- 현재는 Mock 상태
- 실제 결제 구현 전까지 프리미엄 기능 숨김 권장

### 4. 템플릿 마켓플레이스
- 핵심 로직은 완성
- UI 화면은 프로덕션 단계에서 구현
- MVP는 기본 템플릿만 제공 가능

---

## 📊 품질 지표

### 코드 품질
- ✅ TypeScript 사용
- ✅ 린트 오류 없음
- ⚠️ 테스트 커버리지: 20% (목표: 80%)
- ✅ 타입 안정성

### 성능
- 목표 앱 시작 시간: < 3초
- 목표 화면 전환: 60fps
- 목표 메모리 사용: < 200MB

### 사용자 경험
- ✅ 오프라인 지원
- ✅ 에러 핸들링
- ✅ 로딩 상태
- ✅ 빈 상태 처리

---

## 📝 배포 후 할 일

### 모니터링
1. Firebase Crashlytics 설정
2. Firebase Analytics 대시보드 확인
3. 사용자 피드백 수집

### 지속적 개선
1. 버그 수정
2. 성능 최적화
3. 새로운 기능 추가

---

## 🎯 다음 배포 계획 (v1.1.0)

### 우선순위 높음
1. 템플릿 마켓플레이스 UI 완성
2. 테스트 커버리지 80% 달성
3. 실제 인앱 구매 구현

### 우선순위 중간
1. 소셜 공유 기능
2. 이미지 업로드
3. 다크 모드

### 우선순위 낮음
1. 위젯
2. Apple Watch/Wear OS 앱
3. 웹 버전

---

## ✅ Step 11 체크리스트 요약

- [x] 코드 품질 검증 완료
- [x] 린트 오류 없음
- [x] 앱 메타데이터 확인
- [x] Firebase 설정 확인
- [x] 배포 준비 문서 작성
- [ ] 수동 테스트 완료 (사용자가 직접 수행)
- [ ] 실제 빌드 (사용자가 필요 시 수행)
- [ ] 스토어 제출 (사용자가 준비되면 수행)

**Step 11 배포 준비 완료!** 🎉

이제 앱을 로컬에서 실행하고 테스트할 수 있습니다:
```bash
npm start
# 또는
npx expo start
```

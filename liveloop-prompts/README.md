# 리브루프(liveloop) - 최종 통합 프롬프트

## 시작 방법

이 프롬프트를 AI 개발 도구에 단계별로 제공하여 리브루프 앱을 구축하세요.

## 단계별 개발 순서

### Phase 1: 기본 설정 (1-2일)
```
01-project-setup.md를 따라:
- Expo 프로젝트 생성
- Firebase 설정
- 기본 폴더 구조
```

### Phase 2: 데이터 및 엔진 (2-3일)
```
02-data-models.md → 03-core-engine.md를 따라:
- TypeScript 타입 정의
- Firestore 스키마
- 공통 엔진 (주기, 미루기, 알림, 우선순위)
```

### Phase 3: 모듈 구현 (3-4일)
```
04-cleaning.md → 05-fridge.md → 06-medicine.md를 따라:
- 청소 모듈 (방별 관리, 10분 코스)
- 냉장고 모듈 (임박 알림, 보관 조건별 계산)
- 약 모듈 (정확한 알림, 로컬 저장)
```

### Phase 4: 온보딩 및 알림 (2-3일)
```
07-onboarding.md → 08-notifications.md를 따라:
- 5분 온보딩 플로우
- 템플릿 시스템
- 다이제스트 알림
```

### Phase 5: Firebase 및 UI (2-3일)
```
09-firebase.md → 10-ui-ux.md를 따라:
- Security Rules
- 오프라인 지속성
- 디자인 시스템
- 홈 화면 구현
```

### Phase 6: 법적 준수 및 성장 (1-2일)
```
11-privacy.md → 12-growth.md를 따라:
- 개인정보처리방침
- 건강 앱 면책
- 습관화 시스템
- 프리미엄 기능
```

### Phase 7: 테스트 및 출시 (2-3일)
```
13-deployment.md를 따라:
- 단위 테스트
- EAS Build
- 스토어 제출
```

## 핵심 원칙 요약

### 제품 철학
1. **즉시 가치**: 5분 내 "오늘 할 일" 생성
2. **인지 부담 감소**: 사용자는 완료/미루기만
3. **점진적 공개**: 고급 설정은 7일 후
4. **알림 피로 관리**: 다이제스트 우선

### 기술 전략
1. **오프라인 우선**: Firestore persistence
2. **로컬 알림 우선**: 푸시는 2단계
3. **익명 시작**: 계정 연결은 선택
4. **모듈형 설계**: 공통 엔진 + 도메인 모듈

### 성장 전략
1. **습관화**: 66일 연속 사용 유도
2. **템플릿 공유**: 바이럴 성장
3. **프리미엄**: 데이터 쌓인 후 과금

## 빠른 시작 명령어

```bash
# 1. 프로젝트 생성
npx create-expo-app liveloop --template expo-template-blank-typescript
cd liveloop

# 2. 필수 패키지 설치
npx expo install expo-notifications firebase @react-navigation/native @react-navigation/bottom-tabs
npm install date-fns zustand

# 3. 개발 서버 실행
npx expo start

# 4. Firebase 에뮬레이터 실행 (별도 터미널)
firebase emulators:start

# 5. 테스트 실행
npm test

# 6. 프로덕션 빌드
eas build --profile production --platform all
```

## MVP 핵심 기능 체크리스트

- [ ] 온보딩 (5분 이내)
- [ ] 청소 모듈 (오늘 추천)
- [ ] 냉장고 모듈 (임박 알림)
- [ ] 약 모듈 (정확한 알림)
- [ ] 로컬 알림 (다이제스트)
- [ ] 오프라인 작동
- [ ] 계정 삭제
- [ ] 개인정보처리방침

## 출시 기준

### 기능
- 모든 MVP 기능 작동
- 오류율 < 1%
- 앱 시작 시간 < 3초

### 법적
- 개인정보처리방침 게시
- 건강 앱 면책 문구
- 스토어 메타데이터 완료

### 성능
- 60fps 유지
- 메모리 < 150MB
- 배터리 소모 정상

## 문제 해결

### 자주 발생하는 이슈

1. **Firestore 권한 오류**
   - Security Rules 확인
   - 익명 인증 활성화 확인

2. **알림이 안 옴**
   - 권한 요청 확인
   - 로컬 알림부터 테스트
   - 푸시는 EAS Build 필요

3. **오프라인 동작 안 함**
   - enableIndexedDbPersistence 호출 확인
   - Firestore 쿼리 인덱스 생성

4. **타입 오류**
   - Timestamp ↔ Date 변환 유틸 사용
   - 02-data-models.md 참고

## 다음 단계

MVP 출시 후:

1. **1주차**: 모니터링 + 긴급 수정
2. **2-4주차**: 사용자 피드백 수집
3. **2개월차**: 바코드 스캔 추가
4. **3개월차**: 가족 공유 기능
5. **6개월차**: 프리미엄 출시

## 지원

각 .md 파일에는 상세한 코드 예제와 설명이 포함되어 있습니다.
단계별로 진행하며 막히는 부분이 있으면 해당 파일을 다시 참고하세요.

---

**준비되셨나요? 00-overview.md부터 시작하세요!** 🚀

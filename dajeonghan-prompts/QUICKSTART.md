# 프롬프트 실행 가이드 (빠른 참조용)

> **한 번에 하나씩 순서대로 실행하세요**

## 📋 실행 체크리스트

### Phase 1: 기초 설정 (1-3일)

- [ ] **Step 01 - 프로젝트 초기 설정** (2-3시간)
  - 완료 기준: `npx expo start` 실행 성공
  - 다음: Step 02

- [ ] **Step 02 - 데이터 모델 정의** (3-4시간)
  - 완료 기준: TypeScript 컴파일 오류 없음
  - 다음: Step 03

- [ ] **Step 03 - 공통 엔진 구현** (1-2일)
  - 완료 기준: Jest 테스트 통과
  - 다음: Step 04, 05, 06 (병렬 가능)

---

### Phase 2: 기능 모듈 (3-4일, 병렬 가능)

- [ ] **Step 04 - 청소 모듈** (1-1.5일)
  - 완료 기준: 청소 테스크 CRUD 작동
  - 병렬: Step 05, 06과 동시 가능

- [ ] **Step 05 - 냉장고 모듈** (1-1.5일)
  - 완료 기준: 유통기한 자동 계산
  - 병렬: Step 04, 06과 동시 가능

- [ ] **Step 06 - 약 모듈** (1일)
  - 완료 기준: 약 복용 알림 스케줄링
  - 병렬: Step 04, 05와 동시 가능

---

### Phase 3: 사용자 경험 (2-3일)

- [ ] **Step 07 - 온보딩 시스템** (1일)
  - 완료 기준: 온보딩 → "오늘 할 일" 표시
  - 다음: Step 08

- [ ] **Step 08 - 알림 시스템** (1-2일)
  - 완료 기준: 다이제스트 알림 예약 확인
  - 다음: Step 09

- [ ] **Step 09 - UI/UX 구현** (1-2일)
  - 완료 기준: 홈 화면 작동, 60fps
  - 다음: Step 10

---

### Phase 4: 인프라 (1-2일)

- [ ] **Step 10 - Firebase 설정** (1일)
  - 완료 기준: Security Rules 테스트 통과
  - 다음: Step 11

- [ ] **Step 11 - 개인정보 및 법적 준수** (0.5-1일)
  - 완료 기준: 개인정보처리방침 URL 접근
  - 다음: Step 12

---

### Phase 5: 출시 (2-3일)

- [ ] **Step 12 - 성장 전략** (0.5-1일)
  - 완료 기준: Analytics 이벤트 로깅
  - 다음: Step 13

- [ ] **Step 13 - 테스트 및 배포** (2-3일)
  - 완료 기준: 스토어 "심사 중" 상태
  - 다음: 없음 (완료!)

---

## 🎯 각 단계별 핵심 명령어

### Step 01
```bash
npx create-expo-app@latest dajeonghan --template expo-template-blank-typescript
cd dajeonghan
npx expo install firebase @react-navigation/native
npx expo start
```

### Step 02
```bash
# 타입 정의 후
npm run type-check
```

### Step 03
```bash
# 엔진 구현 후
npm test
```

### Step 04~06
```bash
# 각 모듈 구현 후
npm test
npx expo start
# 실제 기기에서 CRUD 테스트
```

### Step 07
```bash
# 온보딩 완료 후
npx expo start
# 온보딩 플로우 완주 테스트
```

### Step 08
```bash
# 알림 구현 후
# Expo Go에서 알림 권한 허용
# 다이제스트 알림 예약 확인
```

### Step 09
```bash
# UI 완성 후
npx expo start
# 모든 화면 이동 테스트
```

### Step 10
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Step 11
```bash
# 개인정보처리방침 웹페이지 퍼블리싱
# 앱에서 URL 접근 테스트
```

### Step 12
```bash
# Firebase Analytics 연동
# 이벤트 로깅 테스트
```

### Step 13
```bash
eas build:configure
eas build --profile production --platform android
eas build --profile production --platform ios
```

---

## ⚠️ 주의사항

### 1. 순서 엄수
- **절대 건너뛰지 마세요**
- 이전 단계 완료 기준 충족 확인
- Git 커밋으로 롤백 지점 확보

### 2. 단계별 검증
- 각 단계 완료 후 테스트 실행
- 완료 기준 미충족 시 다음 단계 진행 금지
- 문제 발생 시 즉시 해결

### 3. 병렬 진행
- Step 04, 05, 06만 병렬 가능
- 팀 개발 시에만 권장
- 1인 개발은 순차 진행 권장

---

## 💡 팁

### 효율적인 진행
1. **하루 시작**: 이전 단계 완료 기준 재확인
2. **코드 작성**: AI에게 프롬프트 제공
3. **테스트**: `npm test` 및 실제 기기 테스트
4. **커밋**: `git commit -m "Complete Step XX"`
5. **다음 단계**: 다음 프롬프트 파일 열기

### 막힐 때
1. 해당 Step 프롬프트 파일의 "문제 해결" 섹션
2. `step-00-dependencies-guide.md` 참고
3. 이전 단계 완료 기준 재확인
4. Firebase Emulator로 로컬 테스트

---

## 📞 긴급 체크포인트

### Step 03 완료 후
- [ ] RecurrenceEngine 단위 테스트 통과
- [ ] Task 생성 → 완료 → 다음 due 계산 확인
- [ ] Firestore에 저장/읽기 성공

### Step 06 완료 후
- [ ] 청소/냉장고/약 CRUD 모두 작동
- [ ] 각 모듈 화면 표시 확인
- [ ] 테스크 완료 시 점수 반영 확인

### Step 09 완료 후
- [ ] 전체 앱 플로우 테스트 (온보딩 → 홈 → 모듈)
- [ ] 모든 네비게이션 경로 작동
- [ ] 60fps 유지 확인

### Step 13 제출 전
- [ ] 개인정보처리방침 URL 접근 가능
- [ ] Firebase Security Rules 프로덕션 배포
- [ ] 실제 기기 30분 이상 테스트
- [ ] 크래시 없음 확인

---

**시작**: [README.md](./README.md) → [Step 00](./step-00-dependencies-guide.md) → [Step 01](./step-01-project-setup.md)

**Happy Coding! 🚀**

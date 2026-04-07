# 리브루프(liveloop) - 생활 비서 앱 개발 가이드

## 개요

리브루프는 React Native(Expo) + Firebase 기반의 생활 관리 올인원 앱입니다.

### 핵심 철학
"사용자가 기억·결정·추적하지 않아도 되는 생활 OS"

### 핵심 차별화
- **공통 엔진**: 주기·미루기·알림을 하나의 엔진으로 통합
- **템플릿 온보딩**: 5분 이내 즉시 가치 체감
- **인지 부담 감소**: 결정 피로 최소화, 자동 우선순위화
- **모듈 통합**: 청소·냉장고·약을 하나의 생활 OS로

### 기술 스택
- **Frontend**: React Native with Expo SDK (TypeScript)
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions, FCM)
- **상태관리**: React Context API 또는 Zustand
- **알림**: expo-notifications + Firebase Cloud Messaging

### 프로젝트 구조
```
/src
  /core           # 공통 엔진 (주기 관리, 알림, 미루기 로직)
  /modules        # 청소, 냉장고, 약 모듈
  /components     # 공통 UI 컴포넌트
  /services       # Firebase 서비스 레이어
  /types          # TypeScript 타입 정의
  /templates      # 페르소나별 템플릿 데이터
```

### 개발 단계
1. 프로젝트 초기 설정 (01-project-setup.md)
2. 데이터 모델 설계 (02-data-models.md)
3. 공통 엔진 구현 (03-core-engine.md)
4. 모듈 구현 (04-cleaning.md, 05-fridge.md, 06-medicine.md)
5. 템플릿 온보딩 (07-onboarding.md)
6. 알림 시스템 (08-notifications.md)
7. Firebase 설정 (09-firebase.md)
8. UI/UX 구현 (10-ui-ux.md)
9. 개인정보 및 법적 준수 (11-privacy.md)
10. 성장 전략 (12-growth.md)
11. 테스트 및 배포 (13-deployment.md)

### MVP 범위
- **공통 엔진**: 완전 구현
- **청소 모듈**: 방별 관리, 오늘 추천
- **냉장고 모듈**: 임박 알림, 수동 입력 (스캔은 2단계)
- **약 모듈**: 리마인더, 기록, 리필
- **알림**: 로컬 알림 + 다이제스트
- **배포**: Android 우선

### 다음 단계
각 단계별 .md 파일을 순서대로 참고하여 개발을 진행하세요.

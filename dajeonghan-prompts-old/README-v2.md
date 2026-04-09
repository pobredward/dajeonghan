# 다정한(dajeonghan) v2 - 공간 기반 생활 OS 개발 가이드

> **"당신의 집이 스스로 말합니다"**  
> 공간 중심의 직관적 생활 관리 애플리케이션

## 📖 v2 주요 변경사항

### 🆕 새로운 기능
1. **집 배치도 시스템**: 실제 집 구조를 디지털로 재현
2. **공간 기반 탐색**: 지도 뷰로 직관적 관리
3. **시각적 상태 피드백**: 점수 시스템 + 게이미피케이션
4. **무한 확장 구조**: 사용자가 자유롭게 공간/아이템 추가

### 🔄 개선사항
- 청소/냉장고/약 → 공간의 아이템으로 재구성
- 리스트 중심 → 지도/리스트/오늘 3가지 뷰
- 부정적 피드백 최소화 (옵션화)
- 점수 기반 게이미피케이션 강화

---

## 🗺️ 새로운 프롬프트 구조 (17개)

### Foundation Layer (기반) - 3개
```
00. 프로젝트 개요 v2 🆕
01. 프로젝트 초기 설정
02. 데이터 모델 v2 🆕
03. 공통 엔진 + 점수 계산 🆕
```

### Space Layer (공간) - 3개 🆕
```
04. 집 배치도 시스템 NEW
05. 공간 기반 아이템 관리 NEW
06. 시각화 및 피드백 시스템 NEW
```

### Feature Layer (기능) - 4개
```
07. 청소 관리 모듈 (공간 기반 재구성)
08. 냉장고 재고 모듈 (아이템 기반)
09. 약 복용 모듈 (아이템 기반)
10. 확장 모듈 가이드 NEW
```

### Experience Layer (경험) - 3개
```
11. 온보딩 시스템 v2 (집 설정 통합) 🆕
12. 알림 시스템
13. UI/UX 구현 v2 (3가지 뷰) 🆕
```

### Infrastructure Layer (인프라) - 2개
```
14. Firebase 설정
15. 개인정보 및 법적 준수
```

### Launch Layer (출시) - 2개
```
16. 성장 전략 및 수익화
17. 테스트 및 배포
```

---

## 📋 단계별 개발 로드맵 v2

### Phase 0: 이해 및 준비 (0.5일)
**목표**: v2 아키텍처 이해

📄 **00-overview-v2.md** 정독
- ✅ 공간 기반 아키텍처 이해
- ✅ 기존 v1과의 차이점 파악
- ✅ MVP 범위 확인 (어디까지 만들 것인가)
- ✅ 기술 스택 확인

**완료 기준**: "왜 공간 기반인지" 설명 가능

---

### Phase 1: 프로젝트 기반 구축 (1-2일)
**목표**: 개발 환경 + 데이터 구조 완성

📄 **01-project-setup.md** → **02-data-models-v2.md** → **03-core-engine-v2.md**

**Day 1: 환경 설정**
- ✅ Expo 프로젝트 생성
- ✅ Firebase 연동
- ✅ 필수 패키지 설치
- ✅ 추가 라이브러리 (Drag&Drop, SVG, Animations)

**Day 2: 데이터 및 엔진**
- ✅ v2 데이터 모델 (HomeLayout → Room → Item)
- ✅ ScoreCalculator 엔진 추가
- ✅ 기존 엔진 (Recurrence, Priority, Postpone)
- ✅ Jest 단위 테스트

**완료 기준**: 
- `npx expo start` 실행됨
- 테스트 통과
- Firestore에 HomeLayout 저장/읽기 가능

---

### Phase 2: 공간 시스템 구축 (2-3일) 🆕
**목표**: 집 배치도 및 시각화 완성

📄 **04-home-layout.md** → **05-space-items.md** → **06-visualization.md**

**Day 1: 집 배치도 (04)**
- ✅ 집 유형 선택 화면
- ✅ Drag & Drop 방 배치
- ✅ 아이템 팔레트
- ✅ HomeLayout 저장

**Day 2: 아이템 관리 (05)**
- ✅ 아이템별 기능 설정
- ✅ 프리셋 시스템
- ✅ 냉장고/싱크대/세탁기 등 10개 아이템
- ✅ CRUD 작동

**Day 3: 시각화 (06)**
- ✅ ScoreCircle 컴포넌트
- ✅ RoomCard 상태별 스타일
- ✅ 완료 축하 애니메이션
- ✅ 사용자 설정 (피드백 스타일)

**완료 기준**:
- 집 지도 뷰에서 방 클릭 → 아이템 목록 표시
- 점수에 따라 색상 변경
- 테스크 완료 → 점수 상승 → 축하 애니메이션

---

### Phase 3: 기능 모듈 구현 (3-4일)
**목표**: 청소, 냉장고, 약 기능 완성

📄 **07-cleaning-v2.md** → **08-fridge-v2.md** → **09-medicine-v2.md** → **10-extension-guide.md**

**Day 1: 청소 모듈 (07)**
- ✅ 공간 기반으로 재구성
- ✅ 아이템(냉장고, 싱크대 등)별 청소 테스크
- ✅ 10분 코스 알고리즘
- ✅ 더러움 점수 계산

**Day 2: 냉장고 모듈 (08)**
- ✅ 아이템 중심 재구성
- ✅ 식재료 프리셋 (300+)
- ✅ 유통기한 계산
- ✅ 임박 알림

**Day 3: 약 모듈 (09)**
- ✅ 아이템(약 보관함) 기반
- ✅ 복용 스케줄
- ✅ 로컬 암호화
- ✅ 리필 알림

**Day 4: 확장 가이드 (10) 🆕**
- ✅ 새 아이템 추가 방법
- ✅ 커스텀 기능 만들기
- ✅ 반려동물/차량 예시
- ✅ 프리셋 생성 가이드

**완료 기준**: 각 모듈 화면에서 CRUD + 점수 반영 작동

---

### Phase 4: 사용자 경험 완성 (2-3일)
**목표**: 온보딩부터 일상 사용까지 매끄럽게

📄 **11-onboarding-v2.md** → **12-notifications.md** → **13-ui-ux-v2.md**

**Day 1: 온보딩 v2 (11)**
- ✅ Step 1: 집 유형 선택
- ✅ Step 2: 방 배치
- ✅ Step 3: 아이템 선택 (방별)
- ✅ Step 4: 기능 활성화
- ✅ Step 5: 첫 할 일 생성
- ✅ 5분 내 완료 가능

**Day 2: 알림 시스템 (12)**
- ✅ 로컬 알림
- ✅ 다이제스트 (오전/저녁)
- ✅ 약 정확한 시간 알림
- ✅ 알림 피로 관리

**Day 3: UI/UX v2 (13)**
- ✅ 3가지 뷰 모드 (오늘/지도/리스트)
- ✅ 홈 화면 (지도 뷰 기본)
- ✅ 네비게이션 (Tab + Stack)
- ✅ 공통 컴포넌트
- ✅ 60fps 성능

**완료 기준**:
- 온보딩 → 홈 화면 → 지도 뷰 → 방 클릭 → 테스크 완료
- 전체 플로우 5분 내 완주 가능

---

### Phase 5: 인프라 및 법적 준수 (1-2일)
**목표**: 프로덕션 준비

📄 **14-firebase.md** → **15-privacy.md**

**Day 1: Firebase (14)**
- ✅ Security Rules 프로덕션 배포
- ✅ Firestore 인덱스
- ✅ 익명 인증
- ✅ 오프라인 지속성

**Day 2: 법적 문서 (15)**
- ✅ 개인정보처리방침
- ✅ 이용약관
- ✅ 건강 앱 면책
- ✅ 계정 삭제 기능

**완료 기준**: Security Rules 배포 + 개인정보처리방침 URL 접근 가능

---

### Phase 6: 성장 및 출시 (2-3일)
**목표**: 스토어 제출

📄 **16-growth.md** → **17-deployment.md**

**Day 1: 성장 전략 (16)**
- ✅ Firebase Analytics 이벤트
- ✅ 습관화 스트릭 시스템
- ✅ 주간 리포트
- ✅ 프리미엄 게이트

**Day 2-3: 배포 (17)**
- ✅ 단위/통합 테스트
- ✅ EAS Build
- ✅ 스토어 메타데이터
- ✅ 스크린샷 촬영
- ✅ 제출

**완료 기준**: Google Play/App Store "심사 중" 상태

---

## ⏱️ 총 예상 기간

| 구분 | 예상 기간 |
|------|-----------|
| **Full-time 개발자** | 3-4주 (v2는 +1주) |
| **Part-time 개발자** | 6-8주 |
| **팀 개발 (2-3명)** | 2-3주 |

v2는 v1 대비 약 30% 더 소요 (공간 시스템 추가)

---

## 🎯 핵심 원칙 v2

### 제품 철학 (변경 없음)
1. **즉시 가치 제공**: 온보딩 5분 내 "오늘 할 일" 생성
2. **인지 부담 제로**: 완료/미루기 버튼만
3. **점진적 공개**: 고급 설정은 사용 7일 후
4. **알림 피로 관리**: 다이제스트 우선

### v2 추가 원칙 🆕
5. **공간 중심 사고**: 현실 세계와 1:1 매핑
6. **긍정적 피드백 우선**: 당근 90% + 채찍 10%
7. **무한 확장 가능**: 사용자가 자유롭게 커스터마이징
8. **게이미피케이션**: RPG처럼 점수, 레벨, 퀘스트

---

## ✅ MVP 체크리스트 v2

### 기능 완성도

#### 공간 시스템 🆕
- [ ] 집 유형 선택 (5가지)
- [ ] Drag & Drop 방 배치
- [ ] 아이템 팔레트 (필수/선택)
- [ ] 방/아이템 활성화/비활성화
- [ ] HomeLayout Firestore 저장

#### 시각화 시스템 🆕
- [ ] 점수 기반 색상 변경 (4단계)
- [ ] ScoreCircle 애니메이션
- [ ] 상태별 필터 효과
- [ ] 완료 축하 애니메이션
- [ ] 사용자 설정 (피드백 스타일)

#### 뷰 모드 🆕
- [ ] 오늘 할 일 뷰 (10분 코스 + 여유)
- [ ] 집 지도 뷰 (공간 중심 탐색)
- [ ] 리스트 뷰 (모듈별 필터)

#### 기본 공간 및 아이템
- [ ] 주방 (냉장고, 싱크대, 가스레인지)
- [ ] 화장실 (변기, 세면대, 세탁기)
- [ ] 침실 (침대, 약 보관함)
- [ ] 거실 (소파, TV)

#### 기존 기능 (v1 유지)
- [ ] 온보딩 (5분 이내)
- [ ] 공통 엔진 (주기, 우선순위, 미루기)
- [ ] 식재료 DB (300+)
- [ ] 알림 시스템 (다이제스트)
- [ ] 오프라인 작동
- [ ] 계정 삭제
- [ ] 개인정보처리방침

### 품질 기준 (변경 없음)
- [ ] 앱 시작 < 3초
- [ ] 60fps 유지
- [ ] 메모리 < 150MB
- [ ] 크래시율 < 1%
- [ ] 단위 테스트 통과

---

## 🚀 빠른 시작 가이드 v2

### Step 1: 프로젝트 생성
```bash
npx create-expo-app@latest dajeonghan --template expo-template-blank-typescript
cd dajeonghan
```

### Step 2: 필수 패키지 설치
```bash
# 기존 패키지
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install firebase
npx expo install expo-notifications expo-device expo-constants
npm install zustand date-fns

# v2 추가 패키지 🆕
npm install react-native-draggable-flatlist
npx expo install react-native-svg
npx expo install react-native-reanimated
npx expo install react-native-gesture-handler
npm install lottie-react-native
```

### Step 3: Firebase 설정
```bash
firebase init
# Firestore, Emulators 선택
```

### Step 4: 개발 서버 실행
```bash
# 터미널 1
npx expo start

# 터미널 2 (선택)
firebase emulators:start
```

---

## 🐛 v2 추가 문제 해결

### 1. Drag & Drop 작동 안 함
```bash
# GestureHandler 재설치
npx expo install react-native-gesture-handler

# babel.config.js 확인
plugins: ['react-native-reanimated/plugin']
```

### 2. SVG 렌더링 오류
```bash
npx expo install react-native-svg
# 캐시 클리어 후 재시작
npx expo start --clear
```

### 3. Lottie 애니메이션 안 보임
```bash
# Lottie 파일 위치 확인
assets/animations/confetti.json

# require 경로 확인
require('@/assets/animations/confetti.json')
```

---

## 📚 프롬프트 파일 가이드 v2

| 번호 | 파일 | 내용 | 시간 | 난이도 | 변경 |
|------|------|------|------|--------|------|
| **00** | overview-v2 | 프로젝트 개요 v2 | 30분 | ⭐ | 🆕 |
| **01** | project-setup | 초기 설정 | 2-3h | ⭐⭐ | - |
| **02** | data-models-v2 | 데이터 모델 v2 | 3-4h | ⭐⭐⭐ | 🔄 |
| **03** | core-engine-v2 | 엔진 + 점수 | 1-2일 | ⭐⭐⭐⭐ | 🔄 |
| **04** | home-layout | 집 배치도 | 1.5-2일 | ⭐⭐⭐ | 🆕 |
| **05** | space-items | 아이템 관리 | 1-1.5일 | ⭐⭐⭐ | 🆕 |
| **06** | visualization | 시각화 시스템 | 1.5-2일 | ⭐⭐⭐⭐ | 🆕 |
| **07** | cleaning-v2 | 청소 모듈 v2 | 1-1.5일 | ⭐⭐⭐ | 🔄 |
| **08** | fridge-v2 | 냉장고 모듈 v2 | 1-1.5일 | ⭐⭐⭐ | 🔄 |
| **09** | medicine-v2 | 약 모듈 v2 | 1일 | ⭐⭐⭐ | 🔄 |
| **10** | extension-guide | 확장 가이드 | 0.5일 | ⭐⭐ | 🆕 |
| **11** | onboarding-v2 | 온보딩 v2 | 1일 | ⭐⭐⭐ | 🔄 |
| **12** | notifications | 알림 시스템 | 1-2일 | ⭐⭐⭐⭐ | - |
| **13** | ui-ux-v2 | UI/UX v2 | 1-2일 | ⭐⭐⭐ | 🔄 |
| **14** | firebase | Firebase 설정 | 1일 | ⭐⭐⭐ | - |
| **15** | privacy | 법적 준수 | 0.5-1일 | ⭐⭐ | - |
| **16** | growth | 성장 전략 | 0.5-1일 | ⭐⭐ | - |
| **17** | deployment | 배포 | 2-3일 | ⭐⭐⭐⭐ | - |

**아이콘 설명**:
- 🆕 = 새로 추가
- 🔄 = v2로 업데이트
- `-` = 변경 없음

---

## 🎉 시작하기

**준비되셨나요?**

👉 **[00-overview-v2.md](./00-overview-v2.md)** 파일을 열어 v2 아키텍처를 이해하고 시작하세요!

공간 기반 설계로 사용자 경험을 혁신합니다! 🏠✨

---

<p align="center">
  <sub>Made with ❤️ for developers who want to build the future of home management</sub>
</p>

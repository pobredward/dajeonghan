# Step 04-00. 기능 모듈 개요

> **🎯 목표**: 다정한의 5개 핵심 모듈 구조 이해 및 구현 순서 확인

## 📌 단계 정보

**순서**: Step 04-00/12  
**Phase**: Phase 2 - 기능 모듈 (Features)  
**의존성**: Step 03 완료 필수  
**예상 소요 시간**: 10분 (개요 파악)  
**난이도**: ⭐

### 이전 단계 요구사항
- ✅ Step 03 완료: 공통 엔진 (RecurrenceEngine, PriorityCalculator 등)

### 다음 단계
- **Step 04-01**: 청소 모듈
- **Step 04-02**: 냉장고 모듈
- **Step 04-03**: 약 모듈
- **Step 04-04**: 자기관리 모듈
- **Step 04-05**: 자기계발 모듈

---

## 🗂️ 모듈 구조

다정한은 **5개의 독립적인 기능 모듈**로 구성됩니다:

```
┌─────────────────────────────────────────┐
│         공통 엔진 (Step 03)              │
│  RecurrenceEngine, PriorityCalculator   │
└─────────────────────────────────────────┘
         ↓           ↓           ↓
    [04-01]     [04-02]     [04-03]     [04-04]     [04-05]
    청소 모듈   냉장고 모듈   약 모듈   자기관리    자기계발
```

### 모듈 독립성

각 모듈은 **독립적으로 구현 가능**하며, 병렬 개발이 가능합니다:
- ✅ 청소만 쓰는 유저
- ✅ 냉장고만 쓰는 유저
- ✅ 약+자기관리만 쓰는 유저

온보딩 시 유저가 원하는 모듈만 활성화할 수 있습니다.

---

## 📋 모듈별 개요

### 04-01. 청소 모듈 🧹
**목표**: "오늘 할 청소"를 자동으로 추천

**핵심 기능**:
- 방/공간 기반 청소 테스크
- 더러움 점수 자동 계산
- 10분 코스 추천
- 환경 변수 반영 (세탁기 유무 등)

**주요 데이터**:
- CleaningObject (방, 난이도, 건강 우선순위)
- CleaningTask (완료/미루기)
- CleaningSession (10분 코스, 여유 코스)

**예상 소요 시간**: 1-1.5일

---

### 04-02. 냉장고 모듈 🥗
**목표**: 식재료 유통기한을 자동 관리하여 버리는 음식 최소화

**핵심 기능**:
- 보관 조건별 유통기한 자동 계산
- 임박 알림 (D-3, D-1, D-day)
- 300+ 식재료 데이터베이스
- 한국 소비기한 표시제 반영

**주요 데이터**:
- FoodItem (카테고리, 보관 조건, 상태)
- FoodStorageRule (식재료별 보관 기간)
- 권장 소진일 자동 계산

**예상 소요 시간**: 1-1.5일

---

### 04-03. 약 모듈 💊
**목표**: 정확한 복용 시간 알림과 리필 관리

**핵심 기능**:
- 정확한 시간 복용 알림
- 복용 기록 자동 저장 (로컬 암호화)
- 리필 리마인더 (7일치 남을 때)
- 약 화면에서 복용 확인/건너뛰기

**주요 데이터**:
- Medicine (종류, 용량, 스케줄)
- DoseLog (복용 기록)
- RefillReminder (리필 알림)

**법적 제한사항**:
- ❌ 약물 상호작용 경고 (의료 면허 필요)
- ❌ 복용 지침 제공
- ✅ 단순 리마인더만

**예상 소요 시간**: 1일

---

### 04-04. 자기관리 모듈 🧖
**목표**: 개인 그루밍 루틴을 자동화하여 외모 관리 부담 감소

**핵심 기능**:
- 5개 카테고리: 피부관리, 신체관리, 제모, 헤어관리, 도구관리
- 성별 맞춤형 템플릿 (남성/여성/논바이너리)
- 외부 서비스 예약 관리 (미용실, 네일샵)
- 부위별 제모 관리

**주요 데이터**:
- SelfCareObject (카테고리, 부위, 서비스 정보)
- 40+ 세부 항목 (세안, 각질제거, 손톱정리, 제모 등)
- 주기별 분류 (일일/주간/격주/월간)

**예상 소요 시간**: 1.5-2일

---

### 04-05. 자기계발 모듈 📚
**목표**: 습관 형성과 목표 달성을 위한 트래킹 시스템

**핵심 기능** (예정):
- 독서 트래커
- 운동 기록
- 습관 형성 배지
- 진행률 시각화
- 7일 연속 달성 체크

**주요 데이터**:
- SelfDevelopmentObject (카테고리, 목표, 진행률)
- 배지 시스템
- 성취 기록

**상태**: 추후 설계 예정

**예상 소요 시간**: TBD

---

## 🔄 구현 순서 권장

### Phase 1: MVP 모듈 (필수)
1. **Step 04-01**: 청소 모듈 ⭐⭐⭐
2. **Step 04-02**: 냉장고 모듈 ⭐⭐⭐
3. **Step 04-03**: 약 모듈 ⭐⭐⭐

→ 이 3개만 있어도 **출시 가능**

### Phase 2: 확장 모듈 (차별화)
4. **Step 04-04**: 자기관리 모듈 ⭐⭐
5. **Step 04-05**: 자기계발 모듈 ⭐

→ 경쟁 우위 확보

### 병렬 개발 가능

04-01, 04-02, 04-03은 서로 독립적이므로 **동시에 개발 가능**합니다:
- 개발자 A: 청소 모듈
- 개발자 B: 냉장고 모듈
- 개발자 C: 약 모듈

---

## 📊 모듈별 데이터 모델 비교

| 모듈 | LifeObject | Task | 특수 데이터 |
|------|-----------|------|------------|
| 청소 | CleaningObject | CleaningTask | dirtyScore |
| 냉장고 | FoodItem | - | recommendedConsumption |
| 약 | Medicine | - | DoseLog, RefillReminder |
| 자기관리 | SelfCareObject | SelfCareTask | serviceInfo |
| 자기계발 | SelfDevObject | SelfDevTask | progressTracking |

### 공통 필드

모든 모듈은 동일한 기본 구조를 공유합니다:

```typescript
interface BaseLifeObject {
  id: string;
  userId: string;
  type: ModuleType; // 'cleaning' | 'food' | 'medicine' | 'self_care' | 'self_development'
  name: string;
  metadata: any; // 모듈별로 다름
  createdAt: Date;
  updatedAt: Date;
}

interface BaseTask {
  id: string;
  userId: string;
  objectId: string; // LifeObject 참조
  type: ModuleType;
  recurrence: Recurrence;
  priority: PriorityLevel;
  status: TaskStatus;
  // ...
}
```

---

## 🎯 각 모듈의 차별화 포인트

### 청소 모듈
- ✨ **Tody + Sweepy 결합**: 긴급도 기반 + 포인트 기반
- ✨ **환경 반영**: 세탁기 유무, 반려동물 등
- ✨ **10분 코스**: 빠르게 끝낼 수 있는 작업만

### 냉장고 모듈
- ✨ **스마트 계산**: 보관 조건 × 보관 방식 × 상태
- ✨ **한국 표준**: 소비기한 vs 유통기한
- ✨ **300+ 식재료 DB**: 양파, 감자, 고기 등

### 약 모듈
- ✨ **정확한 시간**: 약 복용은 시간 엄수
- ✨ **개인정보 보호**: 로컬 암호화 우선
- ✨ **리필 관리**: 7일치 남으면 자동 알림

### 자기관리 모듈
- ✨ **성별 맞춤**: 남성/여성 그루밍 차이 반영
- ✨ **외부 서비스**: 미용실, 네일샵 예약 관리
- ✨ **한국 문화**: 2026년 그루밍 트렌드 반영

### 자기계발 모듈
- ✨ **습관 형성**: 7일 연속 배지
- ✨ **진행률**: 시각적 피드백
- ✨ **목표 추적**: 구체적인 성취 기록

---

## 🔗 모듈 간 연계

### 알림 통합
모든 모듈의 알림은 **NotificationOrchestrator**를 통해 통합 관리:
- 다이제스트 알림: 하루 2회 모아서
- 즉시 알림: 약 복용, 식재료 임박
- 알림 피로 관리: 하루 최대 5개

### UI 통합
모든 모듈은 동일한 디자인 시스템 사용:
- Colors: 모듈별 색상 (청소=파랑, 냉장고=초록, 약=보라 등)
- Typography: 일관된 폰트 스타일
- Components: Card, Badge, Button 재사용

### 온보딩 통합
Step 05 온보딩에서 유저가 원하는 모듈만 선택:
- "어떤 기능을 사용하고 싶으세요?"
- 다중 선택 가능
- 나중에 추가/제거 가능

---

## 📂 파일 구조

```
src/
├── modules/
│   ├── cleaning/           # 04-01
│   │   ├── types.ts
│   │   ├── cleaningService.ts
│   │   ├── templates/
│   │   ├── screens/
│   │   └── components/
│   │
│   ├── fridge/             # 04-02
│   │   ├── types.ts
│   │   ├── fridgeService.ts
│   │   ├── data/foodDatabase.ts
│   │   ├── screens/
│   │   └── components/
│   │
│   ├── medicine/           # 04-03
│   │   ├── types.ts
│   │   ├── medicineService.ts
│   │   ├── storage/secureStorage.ts
│   │   ├── screens/
│   │   └── components/
│   │
│   ├── self-care/          # 04-04
│   │   ├── types.ts
│   │   ├── selfCareService.ts
│   │   ├── templates/
│   │   ├── screens/
│   │   └── components/
│   │
│   └── self-development/   # 04-05
│       ├── types.ts
│       ├── selfDevService.ts
│       ├── screens/
│       └── components/
│
└── core/                   # Step 03
    └── engines/
        ├── RecurrenceEngine.ts
        ├── PostponeEngine.ts
        ├── PriorityCalculator.ts
        └── NotificationOrchestrator.ts
```

---

## ✅ 체크리스트

각 모듈 구현 시 확인할 사항:

### 데이터 모델
- [ ] `types.ts` 작성 완료
- [ ] `LifeObject` 확장 구현
- [ ] `Task` 확장 구현 (필요시)
- [ ] Firestore 호환 변환 함수

### 비즈니스 로직
- [ ] Service 클래스 구현
- [ ] 템플릿 데이터 작성
- [ ] 공통 엔진 활용 (RecurrenceEngine 등)
- [ ] 모듈별 특수 로직

### UI 컴포넌트
- [ ] HomeScreen 구현
- [ ] Card 컴포넌트
- [ ] 완료/미루기 버튼
- [ ] 빈 상태 처리

### 통합
- [ ] 온보딩 연동
- [ ] 알림 연동
- [ ] 네비게이션 탭 추가
- [ ] 홈 화면 통합

---

## 🚀 시작하기

1. **Step 03 완료 확인**: 공통 엔진이 구현되어 있어야 합니다
2. **모듈 선택**: 04-01부터 순서대로 또는 병렬로 진행
3. **데이터 모델 먼저**: types.ts → Service → UI 순서 권장
4. **테스트**: 각 모듈 완료 시 단위 테스트

---

## 다음 단계

- **04-01-cleaning-module.md**: 청소 모듈 상세 구현
- **04-02-fridge-module.md**: 냉장고 모듈 상세 구현
- **04-03-medicine-module.md**: 약 모듈 상세 구현
- **04-04-self-care-module.md**: 자기관리 모듈 상세 구현
- **04-05-self-development-module.md**: 자기계발 모듈 상세 구현

**선택하여 진행하세요!** 🎯

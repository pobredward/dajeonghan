# 온보딩 버전 관리 가이드

## 개요

온보딩 질문과 프로필 스키마가 변경될 수 있으므로, 버전 관리를 통해 기존 사용자와 신규 사용자를 모두 지원합니다.

## 데이터 구조

### UserProfile 저장 방식

```typescript
{
  userId: "user-123",
  persona: "worker_single",
  environment: {
    hasWasher: true,
    hasDryer: false,
    // ... 구조화된 데이터
  },
  onboardingResponse: {
    version: "v1",                    // 온보딩 버전
    timestamp: "2026-04-14T...",
    rawAnswers: {                     // 원본 답변 보관
      washer: true,
      dryer: false,
      cooking: "sometimes",
      medicine: true,
      // ...
    },
    questionFlowId: "default_v1"      // 사용된 질문 템플릿
  },
  profileVersion: "1.0",              // 프로필 스키마 버전
  // ...
}
```

## 핵심 전략

### 1. 이중 저장 방식

- **구조화된 데이터**: `environment`, `notificationMode` 등
  - 앱 로직에서 직접 사용
  - 타입 안정성 보장
  
- **원본 답변**: `onboardingResponse.rawAnswers`
  - 나중에 재분석 가능
  - 마이그레이션 시 참조

### 2. 버전 정보

- `onboardingResponse.version`: 온보딩 질문 버전 (v1, v2, ...)
- `profileVersion`: 프로필 스키마 버전 (1.0, 2.0, ...)
- `questionFlowId`: 사용된 질문 템플릿 ID

## 온보딩 질문 변경 시나리오

### 시나리오 1: 새로운 질문 추가

**예**: "반려동물이 있나요?" 질문 추가

#### 1단계: 질문 파일 업데이트
```json
// src/templates/questionFlow.json
{
  "questions": [
    // 기존 질문들...
    {
      "id": "has_pet",
      "question": "반려동물을 키우고 있나요?",
      "type": "boolean",
      "options": [
        { "id": "yes", "label": "네", "value": true },
        { "id": "no", "label": "아니요", "value": false }
      ]
    }
  ]
}
```

#### 2단계: OnboardingAnswers 인터페이스 업데이트
```typescript
export interface OnboardingAnswers {
  washer?: boolean;
  dryer?: boolean;
  cooking?: 'rarely' | 'sometimes' | 'often' | 'daily';
  medicine?: boolean;
  has_pet?: boolean;  // 새로 추가 (optional로!)
  // ...
}
```

#### 3단계: 온보딩 버전 업데이트
```typescript
// OnboardingService.ts
const ONBOARDING_VERSION = 'v2';  // v1 -> v2
```

#### 4단계: 기존 사용자 처리
```typescript
// 프로필 생성 시 기본값 제공
const environment: UserEnvironment = {
  // ...
  hasPet: answers.has_pet ?? false,  // 기존 사용자는 false
  petType: answers.has_pet ? answers.pet_type : undefined,
};
```

### 시나리오 2: 질문 삭제

**예**: "건조기가 있나요?" 질문 삭제

#### 1단계: 질문은 남기되 조건부로 숨김
```json
{
  "id": "dryer",
  "question": "건조기가 있나요?",
  "deprecated": true,  // 표시
  "condition": { "washer": true, "_force_hide": true },  // 숨김
  // ...
}
```

#### 2단계: 프로필 생성 시 기본값 사용
```typescript
const environment: UserEnvironment = {
  // ...
  hasDryer: answers.dryer ?? false,  // 신규 사용자는 false
};
```

### 시나리오 3: 질문 내용 변경

**예**: "요리는 얼마나 자주 하나요?" → "집에서 식사를 얼마나 자주 하나요?"

#### 1단계: 새 질문 ID 생성
```json
{
  "id": "home_dining_frequency",  // 새 ID
  "question": "집에서 식사를 얼마나 자주 하나요?",
  "replaces": "cooking",  // 이전 질문 표시
  // ...
}
```

#### 2단계: 마이그레이션 로직 추가
```typescript
static migrateProfile(profile: UserProfile): UserProfile {
  if (profile.profileVersion === '1.0') {
    // cooking -> home_dining_frequency 변환
    if (profile.onboardingResponse?.rawAnswers.cooking) {
      profile.onboardingResponse.rawAnswers.home_dining_frequency = 
        profile.onboardingResponse.rawAnswers.cooking;
    }
    profile.profileVersion = '2.0';
  }
  return profile;
}
```

## 프로필 스키마 변경

### 예: UserEnvironment에 새 필드 추가

#### 1단계: 타입 업데이트
```typescript
export interface UserEnvironment {
  hasWasher: boolean;
  hasDryer: boolean;
  // ...
  hasGarden?: boolean;  // 새로 추가 (optional!)
}
```

#### 2단계: 프로필 버전 업데이트
```typescript
const PROFILE_VERSION = '2.0';  // 1.0 -> 2.0
```

#### 3단계: 마이그레이션 함수 구현
```typescript
static migrateProfile(profile: UserProfile): UserProfile {
  let migrated = { ...profile };
  
  if (migrated.profileVersion === '1.0') {
    // 기본값 설정
    if (!migrated.environment.hasGarden) {
      migrated.environment.hasGarden = false;
    }
    migrated.profileVersion = '2.0';
  }
  
  return migrated;
}
```

## 앱 로드 시 마이그레이션

### RootNavigator에서 자동 마이그레이션

```typescript
const loadUserProfile = async (userId: string) => {
  let profile = await getUserProfile(userId);
  
  if (profile && OnboardingService.needsMigration(profile)) {
    console.log(`마이그레이션 필요: ${profile.profileVersion} -> ${PROFILE_VERSION}`);
    profile = OnboardingService.migrateProfile(profile);
    await saveUserProfile(profile);
    console.log('✅ 마이그레이션 완료');
  }
  
  return profile;
};
```

## 체크리스트

### 온보딩 질문 변경 시

- [ ] `questionFlow.json` 업데이트
- [ ] `OnboardingAnswers` 인터페이스 업데이트 (optional로!)
- [ ] `ONBOARDING_VERSION` 증가
- [ ] 기존 사용자 기본값 처리
- [ ] 테스트: 신규 사용자 온보딩
- [ ] 테스트: 기존 사용자 앱 실행

### 프로필 스키마 변경 시

- [ ] `UserProfile` / `UserEnvironment` 타입 업데이트
- [ ] `PROFILE_VERSION` 증가
- [ ] `migrateProfile` 함수 업데이트
- [ ] 마이그레이션 테스트
- [ ] Firestore 인덱스 업데이트 (필요시)

## 주의사항

1. **절대 삭제하지 말 것**
   - 기존 필드는 optional로 변경만 가능
   - 완전히 없애려면 마이그레이션으로 제거

2. **타입 변경 금지**
   - `boolean` → `string` 같은 변경 불가
   - 새 필드로 추가 후 마이그레이션

3. **원본 답변 보관**
   - `onboardingResponse.rawAnswers`는 항상 보관
   - 재분석이나 버그 수정 시 유용

4. **마이그레이션은 단방향**
   - 1.0 → 2.0 → 3.0 순차적으로만
   - 롤백은 지원하지 않음

## 예시: v1 → v2 전체 과정

### 변경 내용
- "반려동물이 있나요?" 질문 추가
- `UserEnvironment`에 `hasPet: boolean` 추가

### 코드 변경

```typescript
// 1. OnboardingService.ts
const ONBOARDING_VERSION = 'v2';
const PROFILE_VERSION = '2.0';

export interface OnboardingAnswers {
  // ...
  has_pet?: boolean;  // 추가
}

static createProfileFromPersona(...): UserProfile {
  const environment: UserEnvironment = {
    // ...
    hasPet: answers.has_pet ?? false,  // 추가
  };
  // ...
}

static migrateProfile(profile: UserProfile): UserProfile {
  let migrated = { ...profile };
  
  // v1 -> v2 마이그레이션
  if (migrated.profileVersion === '1.0') {
    if (migrated.environment.hasPet === undefined) {
      migrated.environment.hasPet = false;
    }
    migrated.profileVersion = '2.0';
  }
  
  return migrated;
}
```

```typescript
// 2. user.types.ts
export interface UserEnvironment {
  // ...
  hasPet?: boolean;  // 추가 (optional!)
}
```

```json
// 3. questionFlow.json
{
  "questions": [
    // ...
    {
      "id": "has_pet",
      "question": "반려동물을 키우고 있나요?",
      "type": "boolean",
      "options": [
        { "id": "yes", "label": "네", "value": true },
        { "id": "no", "label": "아니요", "value": false }
      ]
    }
  ]
}
```

## 트러블슈팅

### Q: 기존 사용자가 새 질문을 보려면?

A: 온보딩을 다시 하도록 유도하거나, 설정에서 해당 항목만 수정 가능하게 제공

### Q: 대규모 마이그레이션이 필요하면?

A: Cloud Functions로 배치 마이그레이션 스크립트 작성

```typescript
// functions/src/migrations/v2.ts
export const migrateToV2 = functions.https.onRequest(async (req, res) => {
  const usersSnapshot = await admin.firestore().collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const profile = doc.data() as UserProfile;
    if (profile.profileVersion === '1.0') {
      const migrated = OnboardingService.migrateProfile(profile);
      await doc.ref.update(migrated);
    }
  }
  
  res.send('Migration complete');
});
```

### Q: 마이그레이션 실패하면?

A: `onboardingResponse.rawAnswers`로 원본 복구 가능

```typescript
// 긴급 복구 함수
static rollbackToRawAnswers(profile: UserProfile): UserProfile {
  if (!profile.onboardingResponse) {
    throw new Error('No raw answers to rollback to');
  }
  
  // 원본 답변으로 프로필 재생성
  return OnboardingService.createProfileFromPersona(
    profile.userId,
    profile.persona,
    profile.onboardingResponse.rawAnswers as OnboardingAnswers
  );
}
```

## 요약

✅ **이중 저장**: 구조화된 데이터 + 원본 답변  
✅ **버전 관리**: 온보딩 버전 + 프로필 버전  
✅ **안전한 변경**: Optional 필드 + 마이그레이션  
✅ **복구 가능**: 원본 답변 보관으로 언제든 재생성 가능

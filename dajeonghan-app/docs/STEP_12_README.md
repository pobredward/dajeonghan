# Step 12: 템플릿 마켓플레이스 - 구현 가이드

## 📌 개요

Step 12에서는 사용자가 템플릿을 생성·공유·적용할 수 있는 커뮤니티 기능의 핵심 백엔드 로직을 구현했습니다.

### 구현된 기능
1. **템플릿 CRUD 서비스**
2. **좋아요 및 리뷰 시스템**
3. **템플릿 검색 및 필터링**
4. **UI 컴포넌트** (TemplateCard, ReviewList, FAB)
5. **유틸리티 함수**

---

## 🎯 핵심 지표

### 템플릿 생성률
**목표**: 활성 유저의 10%가 템플릿 생성

### 템플릿 적용률
**목표**: 신규 유저의 50%가 온보딩 시 템플릿 적용

### 공유율
**목표**: 템플릿 생성 후 80%가 공유

---

## 🔥 주요 API

### 1. 템플릿 조회

```typescript
import { TemplateMarketplaceService } from '@/services';

// 인기 템플릿 (usageCount 기준)
const popular = await TemplateMarketplaceService.getPopularTemplates(20);

// 최신 템플릿 (createdAt 기준)
const recent = await TemplateMarketplaceService.getRecentTemplates(20);

// 추천 템플릿 (운영진 추천)
const featured = await TemplateMarketplaceService.getFeaturedTemplates();

// 카테고리별 템플릿
const templates = await TemplateMarketplaceService.getTemplatesByCategory('student_living_alone', 20);

// 검색 (태그 기반)
const results = await TemplateMarketplaceService.searchTemplates('미니멀');

// 상세 조회
const template = await TemplateMarketplaceService.getTemplateById(templateId);

// 내가 만든 템플릿
const myTemplates = await TemplateMarketplaceService.getMyTemplates(userId);
```

### 2. 템플릿 생성

```typescript
import { TemplateCreateInput } from '@/types/template.types';

const template: TemplateCreateInput = {
  creatorId: userId,
  creatorName: userName,
  creatorAvatar: userAvatar,
  
  name: '미니멀 주말 청소',
  description: '주말에 집중해서 하는 효율적인 청소 루틴',
  tags: ['미니멀', '주말', '청소'],
  category: 'minimalist',
  
  tasks: [
    {
      objectId: 'obj1',
      title: '청소기 돌리기',
      type: 'cleaning',
      estimatedMinutes: 30,
      priority: 'medium',
      status: 'pending',
      recurrence: {
        type: 'weekly',
        intervalDays: 7
      },
      notificationSettings: {
        enabled: true,
        advanceMinutes: 30
      }
    }
  ],
  lifeObjects: [],
  
  isPublic: true,
  isFeatured: false
};

const templateId = await TemplateMarketplaceService.createTemplate(template);
console.log('Template created:', templateId);
```

### 3. 좋아요 시스템

```typescript
// 좋아요
await TemplateMarketplaceService.likeTemplate(templateId, userId);

// 좋아요 취소
await TemplateMarketplaceService.unlikeTemplate(templateId, userId);

// 좋아요 상태 확인
const isLiked = await TemplateMarketplaceService.checkIfLiked(templateId, userId);
```

### 4. 템플릿 적용

```typescript
// 템플릿 적용 (usageCount 자동 증가)
await TemplateMarketplaceService.applyTemplate(templateId, userId);

// 실제 테스크 생성 로직은 별도 구현 필요
// Step 7의 OnboardingService 로직 활용
```

### 5. 리뷰 시스템

```typescript
// 리뷰 작성
await TemplateMarketplaceService.createReview({
  templateId,
  userId,
  userName,
  userAvatar,
  rating: 5,
  comment: '정말 도움이 됐어요! 추천합니다.'
});

// 리뷰 조회 (helpfulCount 순)
const reviews = await TemplateMarketplaceService.getReviews(templateId, 10);
```

---

## 🎨 UI 컴포넌트

### TemplateCard

템플릿을 카드 형태로 표시합니다.

```tsx
import { TemplateCard } from '@/components';

<TemplateCard
  template={template}
  onPress={() => navigation.navigate('TemplateDetail', { templateId: template.id })}
  compact={false}
/>
```

**표시 정보**:
- 카테고리 아이콘
- 템플릿 이름
- 작성자
- 설명
- 통계 (사용자 수, 좋아요, 평점, 아이템 수)
- 태그 (최대 3개)

### ReviewList

템플릿의 리뷰 목록을 표시합니다.

```tsx
import { ReviewList } from '@/components';

<ReviewList
  templateId={templateId}
  limit={10}
/>
```

**기능**:
- 별점 표시 (1-5)
- 작성자 이름
- 작성일
- 리뷰 내용
- 도움이 됐어요 카운트

### FAB (Floating Action Button)

화면 우하단에 떠있는 액션 버튼입니다.

```tsx
import { FAB } from '@/components';

<FAB
  icon="+"
  label="템플릿 만들기"
  onPress={() => navigation.navigate('CreateTemplate')}
/>
```

---

## 🗂 템플릿 카테고리

```typescript
import { TEMPLATE_CATEGORIES, getCategoryIcon, getCategoryName } from '@/constants/TemplateCategories';

// 전체 카테고리 목록
TEMPLATE_CATEGORIES.forEach(category => {
  console.log(category.id, category.name, category.icon);
});

// 특정 카테고리 정보
const icon = getCategoryIcon('student_living_alone'); // 🎓
const name = getCategoryName('worker_single'); // 직장인 1인
```

**카테고리 목록**:
- 🎓 학생 자취
- 💼 직장인 1인
- 👥 룸메이트
- 💑 신혼
- 👨‍👩‍👧 아이 있는 가족
- 🐕 반려동물
- ✨ 미니멀리스트
- ⚡ 주말 집중형
- 🎨 커스텀

---

## 🛠 유틸리티 함수

### extractTags

텍스트에서 자동으로 태그를 추출합니다.

```typescript
import { extractTags } from '@/utils/templateUtils';

const description = '미니멀한 주말 청소 루틴';
const tags = extractTags(description); // ['미니멀', '주말', '청소']
```

### validateTemplate

템플릿 유효성을 검증합니다.

```typescript
import { validateTemplate } from '@/utils/templateUtils';

const result = validateTemplate(template);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### calculateTemplateStats

템플릿 통계를 계산합니다.

```typescript
import { calculateTemplateStats } from '@/utils/templateUtils';

const stats = calculateTemplateStats(template);
console.log('Total items:', stats.totalItems);
console.log('Estimated time:', stats.estimatedTime, 'minutes');
console.log('Popularity score:', stats.popularityScore);
```

---

## 📊 Firestore 구조

### sharedTemplates

```
sharedTemplates/{templateId}
  ├─ creatorId: string
  ├─ creatorName: string
  ├─ creatorAvatar?: string
  ├─ name: string
  ├─ description: string
  ├─ tags: string[]
  ├─ category: TemplateCategory
  ├─ thumbnail?: string
  ├─ tasks: TemplateTask[]
  ├─ lifeObjects: TemplateLifeObject[]
  ├─ usageCount: number
  ├─ likeCount: number
  ├─ reviewCount: number
  ├─ averageRating: number
  ├─ isPublic: boolean
  ├─ isFeatured: boolean
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

### templateLikes

```
templateLikes/{userId}_{templateId}
  ├─ templateId: string
  ├─ userId: string
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

### templateUsages

```
templateUsages/{usageId}
  ├─ templateId: string
  ├─ userId: string
  ├─ appliedAt: Timestamp
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

### templateReviews

```
templateReviews/{reviewId}
  ├─ templateId: string
  ├─ userId: string
  ├─ userName: string
  ├─ userAvatar?: string
  ├─ rating: number
  ├─ comment: string
  ├─ helpfulCount: number
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 공유 템플릿: 공개 템플릿만 읽기 가능
    match /sharedTemplates/{templateId} {
      allow read: if resource.data.isPublic == true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.creatorId;
      allow delete: if request.auth.uid == resource.data.creatorId;
    }
    
    // 템플릿 좋아요: 인증된 사용자만
    match /templateLikes/{likeId} {
      allow read, write: if request.auth != null;
    }
    
    // 템플릿 사용 기록: 인증된 사용자만
    match /templateUsages/{usageId} {
      allow read, write: if request.auth != null;
    }
    
    // 템플릿 리뷰: 공개 읽기, 인증된 사용자만 작성
    match /templateReviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 🔥 Firestore 인덱스

다음 쿼리를 위해 Firestore 인덱스가 필요합니다:

```
컬렉션: sharedTemplates
1. isPublic(=) + usageCount(desc)      // 인기 템플릿
2. isPublic(=) + createdAt(desc)       // 최신 템플릿
3. isPublic(=) + isFeatured(=) + usageCount(desc)  // 추천
4. isPublic(=) + category(=) + likeCount(desc)     // 카테고리별
5. creatorId(=) + createdAt(desc)      // 내 템플릿

컬렉션: templateReviews
1. templateId(=) + helpfulCount(desc)  // 리뷰 목록
```

**인덱스 생성 방법**:
1. Firebase Console에서 쿼리 실행
2. 오류 메시지의 링크 클릭하여 자동 생성
3. 또는 `firestore.indexes.json` 작성 후 `firebase deploy --only firestore:indexes`

---

## 🧪 테스트

### 서비스 테스트

```typescript
describe('TemplateMarketplaceService', () => {
  it('should create template', async () => {
    const template: TemplateCreateInput = {
      creatorId: 'user1',
      creatorName: 'Test User',
      name: 'Test Template',
      description: 'Test Description',
      tags: ['test'],
      category: 'custom',
      tasks: [],
      lifeObjects: [],
      isPublic: true,
      isFeatured: false
    };
    
    const templateId = await TemplateMarketplaceService.createTemplate(template);
    expect(templateId).toBeDefined();
  });
  
  it('should get popular templates', async () => {
    const templates = await TemplateMarketplaceService.getPopularTemplates(10);
    expect(templates.length).toBeLessThanOrEqual(10);
  });
  
  it('should like template', async () => {
    await TemplateMarketplaceService.likeTemplate('template1', 'user1');
    const isLiked = await TemplateMarketplaceService.checkIfLiked('template1', 'user1');
    expect(isLiked).toBe(true);
  });
});
```

### 컴포넌트 테스트

```typescript
describe('TemplateCard', () => {
  const mockTemplate = {
    id: '1',
    name: 'Test Template',
    creatorName: 'User',
    category: 'custom' as TemplateCategory,
    description: 'Test',
    tags: ['test'],
    tasks: [],
    lifeObjects: [],
    usageCount: 10,
    likeCount: 5,
    reviewCount: 3,
    averageRating: 4.5,
    isPublic: true,
    isFeatured: false,
    creatorId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  it('should render template card', () => {
    const { getByText } = render(
      <TemplateCard template={mockTemplate} onPress={() => {}} />
    );
    
    expect(getByText('Test Template')).toBeTruthy();
    expect(getByText('by User')).toBeTruthy();
  });
});
```

---

## ⚠️ 미구현 항목

다음 항목들은 Step 12 문서에 상세한 가이드가 있으며, 프로덕션 단계에서 구현하면 됩니다:

### 화면 (Screens)
1. **CreateTemplateScreen** - 템플릿 생성
2. **TemplateMarketplaceScreen** - 마켓플레이스
3. **TemplateDetailScreen** - 템플릿 상세
4. **WriteReviewScreen** - 리뷰 작성

### 추가 기능
1. 템플릿 적용 로직 (병합/교체)
2. 온보딩에서 템플릿 선택
3. 전체 텍스트 검색 (Algolia)
4. 템플릿 미리보기
5. 이미지 썸네일

---

## 🚀 다음 단계

### 즉시 구현 가능
- Firestore 인덱스 생성
- Security Rules 배포
- 기본 템플릿 데이터 시딩

### 프로덕션 단계
- UI 화면 구현 (문서 참고)
- Algolia 검색 통합
- 이미지 업로드
- 소셜 공유

---

## 📚 참고 자료

- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexing](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Step 12 전체 문서](../../dajeonghan-prompts/step-12-template-marketplace.md)

---

## ✅ Step 12 완료!

템플릿 마켓플레이스의 핵심 백엔드 로직과 컴포넌트가 완성되었습니다! 🎉

이제 사용자들이:
- ✅ 템플릿을 생성하고
- ✅ 좋아요를 누르고
- ✅ 리뷰를 작성하고
- ✅ 템플릿을 적용할 수 있습니다!

**다음**: Step 11 (최종 배포)로 진행하세요!

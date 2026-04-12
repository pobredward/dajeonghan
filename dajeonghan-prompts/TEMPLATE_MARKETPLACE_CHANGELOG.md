# 템플릿 마켓플레이스 기능 도입 - 변경사항 요약

> 유저가 직접 템플릿을 생성·공유하고, 다른 유저가 본인의 루틴에 적용할 수 있는 커뮤니티 기능 추가

날짜: 2026-04-12

---

## 📌 변경 개요

다정한 앱에 **템플릿 마켓플레이스** 기능을 추가하여:
- 유저가 자신의 루틴을 템플릿으로 저장하고 공유
- 다른 유저의 검증된 템플릿을 탐색하고 적용
- 커뮤니티 형성 및 바이럴 성장 촉진

---

## 🆕 신규 파일

### 1. `step-14-template-marketplace.md` (신규)
**내용**: 템플릿 마켓플레이스 전체 구현 가이드
- 데이터 모델 (SharedTemplate, TemplateReview, TemplateLike, TemplateUsage)
- TemplateMarketplaceService (CRUD, 검색, 정렬)
- 템플릿 생성 화면
- 템플릿 브라우징 화면 (추천/인기/최신)
- 템플릿 상세 화면 (좋아요, 리뷰, 적용)
- 필수 컴포넌트 (TemplateCard, TaskSelector, FAB, ReviewList)
- 네비게이션 설정
- Analytics 이벤트
- 테스트 체크리스트

---

## ✏️ 수정된 파일

### 1. `step-02-data-models.md`
**변경사항**:
- Step 순서: `02/13` → `02/15`
- **템플릿 시스템 타입 추가** (새로운 섹션)
  - `SharedTemplate` 타입 정의
  - `TemplateReview` 타입 정의
  - `TemplateLike`, `TemplateUsage` 타입 정의
  - `TemplateCategory` enum 정의
  - Firestore 컬렉션 구조 (sharedTemplates, templateReviews, templateLikes, templateUsages)
  - Firestore 인덱스 요구사항 (4개 복합 인덱스)

### 2. `step-07-onboarding.md`
**변경사항**:
- **온보딩 플로우 확장**
  - 기존: 페르소나 선택 → 질문 → 완료
  - 신규: 페르소나 선택 → 질문 → **템플릿 선택** → 완료
  - 딥링크 진입: 공유 링크 → 템플릿 미리보기 → 적용 → 완료
- **TemplateSelectionScreen 추가** (새 화면)
  - 페르소나에 맞는 추천 템플릿 3개 표시
  - 기본 템플릿 선택 옵션
  - 템플릿 마켓플레이스로 이동 링크
- **OnboardingFlow 수정**
  - `template` 단계 추가
  - `createTasksFromTemplate` 메서드 추가
  - 템플릿 선택 시 사용 기록 저장
- **OnboardingService 확장**
  - `createTasksFromTemplate()` 메서드 추가

### 3. `step-10-firebase.md`
**변경사항**:
- Step 순서: `10/13` → `10/15`
- **Firestore Security Rules 확장**
  - `sharedTemplates` 컬렉션 규칙 추가
    - 공개 템플릿 누구나 읽기 가능
    - 작성자만 생성/수정/삭제 가능
  - `templateReviews` 컬렉션 규칙 추가
  - `templateLikes` 컬렉션 규칙 추가
  - `templateUsages` 컬렉션 규칙 추가
- **Firestore 인덱스 추가**
  - `sharedTemplates` 인덱스 5개 추가
    - isPublic + usageCount (인기순)
    - isPublic + likeCount (좋아요순)
    - isPublic + category + usageCount (카테고리별 인기순)
    - isPublic + isFeatured + usageCount (추천순)
    - isPublic + createdAt (최신순)
  - `templateReviews` 인덱스 1개 추가
    - templateId + helpfulCount (도움 순)

### 4. `step-12-growth-strategy.md`
**변경사항**:
- **템플릿 공유 섹션 간소화**
  - 기존: 전체 구현 (TemplateCard, 공유 버튼 등)
  - 변경: 기본 딥링크 설정만 (Step 14로 이동)
- **TemplateSharingService 간소화**
  - `generateShareLink()`: 딥링크 생성
  - `parseDeepLink()`: 딥링크 파싱
  - `generateShareText()`: 공유 텍스트
- **딥링크 처리 추가** (App.tsx)
  - 앱 시작 시 초기 URL 확인
  - 실행 중 딥링크 수신 처리
- "다음 단계" 수정
  - Step 14 (템플릿 마켓플레이스) 먼저
  - Step 13 (배포) 나중

### 5. `README.md`
**변경사항**:
- **프롬프트 파일 목록 업데이트**
  - Step 14 추가: `step-14-template-marketplace.md` (1-2일, ⭐⭐⭐)
  - Step 13 유지: `step-13-deployment.md`
- **총 예상 기간**: 12-18일 → **14-21일**
- **Phase 5 플로우 다이어그램 수정**
  - Step 11 → Step 12 → **Step 14 (신규)** → Step 13

### 6. `FLOWCHART.md`
**변경사항**:
- **Phase 5 플로우차트 업데이트**
  - Step 14 추가: 템플릿 마켓플레이스 (1-2일, ⭐⭐⭐)
    - 템플릿 생성/공유
    - 템플릿 탐색/검색
    - 좋아요/리뷰 시스템
    - 완료: 템플릿 적용 가능
  - Phase 5 총 기간: 2-3일 → **3-4일**
- **단계별 의존성 매트릭스 업데이트**
  - Step 14 추가: 선행 단계 (02, 07, 12), 예상 시간 1-2일
  - Step 13 의존성: 01~12 → **01~12, 14**
- **총 예상 기간**: 12-18일 → **14-21일**

---

## 📊 새로운 데이터 구조

### Firestore 컬렉션

```
sharedTemplates/{templateId}
  - creatorId, creatorName, creatorAvatar
  - name, description, tags, category
  - cleaningTasks (array)
  - usageCount, likeCount, reviewCount, averageRating
  - isPublic, isFeatured
  - createdAt, updatedAt

templateReviews/{reviewId}
  - templateId, userId, userName
  - rating (1-5), comment
  - helpfulCount
  - createdAt, updatedAt

templateLikes/{likeId}
  - templateId, userId
  - createdAt

templateUsages/{usageId}
  - templateId, userId
  - appliedAt
```

### TypeScript 타입

- `SharedTemplate`
- `TemplateReview`
- `TemplateLike`
- `TemplateUsage`
- `TemplateCategory` (enum)

---

## 🎯 핵심 기능

### 1. 템플릿 생성
- 현재 루틴에서 테스크 선택
- 이름, 설명, 카테고리, 태그 입력
- 공개/비공개 설정
- 공유 링크 자동 생성

### 2. 템플릿 마켓플레이스
- **탭별 정렬**
  - 추천 (운영진 추천)
  - 인기 (사용 횟수순)
  - 최신 (생성일순)
- **검색 기능**
  - 이름, 설명, 태그 검색
- **카테고리 필터**
  - 학생, 직장인, 가족, 반려동물 등 9개

### 3. 템플릿 상세
- 포함된 테스크 목록
- 작성자 정보
- 통계 (사용자 수, 좋아요, 평점)
- 좋아요 기능
- 리뷰 작성/조회
- 공유 버튼
- **내 루틴에 적용**
  - 병합 모드: 기존 루틴 + 템플릿
  - 교체 모드: 기존 루틴 삭제 후 템플릿

### 4. 온보딩 통합
- 페르소나 선택 후 추천 템플릿 표시
- 템플릿 선택 시 자동 적용
- 기본 템플릿 선택 옵션

### 5. 딥링크 공유
- `dajeonghan://template/{templateId}` 형식
- 앱 외부에서 링크 클릭 시 자동 실행
- 템플릿 상세 화면으로 이동

---

## 🔐 보안

### Firestore Security Rules

```javascript
// 공개 템플릿은 누구나 읽기 가능
match /sharedTemplates/{templateId} {
  allow read: if resource.data.isPublic == true;
  allow create: if isAuthenticated() && 
    request.resource.data.creatorId == request.auth.uid;
  allow update, delete: if isAuthenticated() && 
    resource.data.creatorId == request.auth.uid;
}

// 리뷰는 누구나 읽기, 작성자만 수정/삭제
match /templateReviews/{reviewId} {
  allow read: if true;
  allow create: if isAuthenticated() && 
    request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
}
```

---

## 📈 성장 전략

### 바이럴 루프

```
신규 유저
  ↓
공유 링크로 앱 다운로드
  ↓
템플릿 적용 (온보딩)
  ↓
앱 사용
  ↓
본인 템플릿 생성
  ↓
공유 → 신규 유저 유입
```

### 핵심 지표

- **템플릿 생성률**: 활성 유저 중 10% 목표
- **템플릿 적용률**: 신규 유저 중 50% 목표
- **공유율**: 템플릿 생성 시 80% 목표

---

## ✅ 테스트 체크리스트

### 기능 테스트
- [ ] 템플릿 생성 → 공유 링크 생성
- [ ] 템플릿 마켓플레이스 탭 전환
- [ ] 검색 기능 작동
- [ ] 템플릿 상세 좋아요
- [ ] 템플릿 적용 (병합/교체)
- [ ] 리뷰 작성
- [ ] 온보딩 템플릿 선택
- [ ] 딥링크 처리

### 데이터 검증
- [ ] Firestore 컬렉션 생성
- [ ] Security Rules 작동
- [ ] 인덱스 생성
- [ ] usageCount/likeCount 증가

---

## 🚀 배포 순서

1. **Step 01~13 완료** (기존 프롬프트)
2. **Step 02 재방문**: 템플릿 타입 추가
3. **Step 07 재방문**: 온보딩 템플릿 선택 추가
4. **Step 10 재방문**: Security Rules 및 인덱스 추가
5. **Step 12 재방문**: 딥링크 설정
6. **Step 14 실행**: 템플릿 마켓플레이스 전체 구현
7. **Step 13 실행**: 최종 배포

---

## 📚 참고 자료

- [Step 14 전체 프롬프트](./step-14-template-marketplace.md)
- [Step 02 데이터 모델 확장](./step-02-data-models.md#템플릿-시스템-타입-step-14용)
- [Step 07 온보딩 확장](./step-07-onboarding.md#온보딩-질문-플로우)
- [Step 10 Firebase 설정](./step-10-firebase.md#firestore-security-rules)
- [Step 12 딥링크](./step-12-growth-strategy.md#템플릿-공유-바이럴-성장)

---

## 💡 추가 개선 아이디어 (Phase 2)

1. **크리에이터 프로필**
   - 템플릿 작성자 전용 페이지
   - 작성한 템플릿 목록
   - 팔로워 수

2. **템플릿 큐레이션**
   - 매주 "이주의 템플릿" 선정
   - 카테고리별 Top 10

3. **고급 검색**
   - Algolia/Meilisearch 통합
   - 태그 필터
   - 평점 필터

4. **템플릿 버전 관리**
   - 템플릿 수정 시 버전 저장
   - 사용자가 원하는 버전 선택

5. **프리미엄 템플릿**
   - 유료 템플릿 판매
   - 수익 배분 (70% 크리에이터, 30% 플랫폼)

---

**작성자**: AI Assistant  
**날짜**: 2026-04-12  
**버전**: 1.0

이 문서는 다정한 앱에 템플릿 마켓플레이스 기능을 도입하기 위한 전체 변경사항을 요약합니다.

# 개선안: FSIS FoodKeeper 데이터 활용

## 📊 현재 vs 개선안

### 현재 (하드코딩)
- ❌ 30개 식재료만 지원
- ❌ 수동 데이터 입력 필요
- ❌ 업데이트 어려움
- ❌ 한국 식재료만 커버

### 개선안 (FSIS FoodKeeper)
- ✅ **500+ 식재료** 자동 지원
- ✅ USDA 공식 데이터 (신뢰성 높음)
- ✅ JSON 다운로드로 자동 업데이트
- ✅ 영어/스페인어/포르투갈어 지원
- ✅ Public Domain (라이센스 걱정 없음)

## 🔧 구현 전략

### 1단계: FoodKeeper 데이터 다운로드

```bash
# 앱 빌드 시 자동 다운로드
curl -o foodkeeper.json http://www.fsis.usda.gov/shared/data/EN/foodkeeper.json
```

### 2단계: 데이터 구조 변환

```typescript
// FSIS FoodKeeper 원본 구조
interface FoodKeeperItem {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  
  // 보관 기간 (일수)
  pantryMin?: number;
  pantryMax?: number;
  refrigerateMin?: number;
  refrigerateMax?: number;
  freezeMin?: number;
  freezeMax?: number;
  
  // 팁
  pantryTips?: string;
  refrigerateTips?: string;
  freezeTips?: string;
  
  // 기타
  keywords?: string;
}

// 다정한 형식으로 변환
function convertToFoodStorageRule(item: FoodKeeperItem): FoodStorageRule {
  return {
    category: mapCategory(item.category),
    baseShelfLife: {
      refrigerated: item.refrigerateMax || 7,
      frozen: item.freezeMax || 90,
      roomTemp: item.pantryMax || 3
    },
    stateModifier: {
      통: 1.0,
      손질: 0.7,
      조리: 0.5
    },
    storageTypeModifier: {
      밀폐용기: 1.2,
      비닐: 0.9,
      원래포장: 1.0,
      랩: 1.0
    }
  };
}
```

### 3단계: 하이브리드 접근 (추천)

```typescript
// 한국 식재료는 수동 유지 (정확도)
const KOREAN_FOODS = {
  '김치': { ... },
  '된장': { ... },
  '고추장': { ... },
  '배추': { ... }
};

// FSIS 데이터는 자동 로드
const FOODKEEPER_DATA = loadFoodKeeperData();

// 조합
export function getFoodStorageRule(name: string): FoodStorageRule {
  // 1. 한국 식재료 우선
  if (KOREAN_FOODS[name]) {
    return KOREAN_FOODS[name];
  }
  
  // 2. FoodKeeper 검색 (영어/한글 매핑)
  const englishName = translateToEnglish(name);
  if (FOODKEEPER_DATA[englishName]) {
    return convertToFoodStorageRule(FOODKEEPER_DATA[englishName]);
  }
  
  // 3. 카테고리 기본값
  return getCategoryDefault(category);
}
```

### 4단계: 검색 및 자동완성

```typescript
// 사용자가 "to" 입력 → "토마토" + "Tomato" 모두 검색
function searchFood(query: string): FoodItem[] {
  const koreanResults = searchKorean(query);
  const englishResults = searchFoodKeeper(query);
  
  return [...koreanResults, ...englishResults];
}
```

## 📦 구현 파일 구조

```
src/modules/fridge/
├── data/
│   ├── foodDatabase.ts              # 기존 (한국 식재료)
│   ├── foodKeeperLoader.ts          # 새로 추가
│   ├── foodKeeperData.json          # 다운로드된 데이터
│   └── foodNameMapping.ts           # 한영 매핑
├── services/
│   └── FoodSearchService.ts         # 검색 로직
└── utils/
    └── dataSync.ts                  # 주기적 업데이트
```

## 🌐 FoodKeeper API 정보

### 데이터 소스
- **URL**: `http://www.fsis.usda.gov/shared/data/EN/foodkeeper.json`
- **형식**: JSON
- **라이센스**: CC0 (Public Domain)
- **업데이트**: 2025-01-22 (최근)
- **언어**: EN, ES, PT

### 데이터 예시
```json
{
  "sheets": [
    {
      "id": 1,
      "name": "Tomatoes",
      "category": "Vegetables",
      "subcategory": "Fresh",
      "pantryMin": null,
      "pantryMax": null,
      "refrigerateMin": 5,
      "refrigerateMax": 7,
      "freezeMin": 2,
      "freezeMax": 2,
      "refrigerateTips": "Store at room temperature until ripe...",
      "freezeTips": "Freeze for smoothies or cooking..."
    }
  ]
}
```

## 🚀 구현 우선순위

### Phase 1 (즉시) - MVP
- [x] 30개 한국 식재료 하드코딩 (완료)
- [ ] FoodKeeper JSON 다운로드 스크립트
- [ ] 기본 검색 기능

### Phase 2 (Step 05 이후) - 확장
- [ ] FoodKeeper 전체 데이터 통합
- [ ] 한영 매핑 테이블 구축
- [ ] 자동완성 UI

### Phase 3 (Step 07 이후) - 고도화
- [ ] 주기적 데이터 동기화
- [ ] 사용자 커스텀 식재료
- [ ] 커뮤니티 데이터 공유

## 💡 사용자 경험 개선

### Before (현재)
```
사용자: "피망" 입력
시스템: "데이터 없음, 카테고리 기본값 사용"
```

### After (FoodKeeper 통합)
```
사용자: "피망" 입력
시스템: 
  1. "피망" → "Bell Pepper" 매핑
  2. FoodKeeper 검색 → 냉장 7-10일
  3. 정확한 소진일 제공
```

## 📊 데이터 커버리지 비교

| 항목 | 현재 | FoodKeeper 통합 |
|------|------|-----------------|
| 식재료 수 | 30개 | **500+개** |
| 한국 식재료 | ✅ 30개 | ✅ 30개 |
| 서양 식재료 | ❌ 일부 | ✅ 전체 |
| 데이터 출처 | 수동 입력 | USDA 공식 |
| 업데이트 | 수동 | 자동 가능 |

## 🔒 한국 특화 유지

FoodKeeper를 사용하되, 한국 특화 데이터는 우선순위 유지:

```typescript
const PRIORITY_ORDER = [
  'KOREAN_MANUAL',      // 김치, 된장 등 (최우선)
  'FOODKEEPER_USDA',    // 토마토, 사과 등
  'CATEGORY_DEFAULT'    // 마지막 폴백
];
```

## 📝 다음 단계 제안

1. **지금 당장 변경 안 함**
   - Step 04-02는 완료됨
   - 30개 데이터로 기능 검증 완료

2. **Step 07 (UI/UX) 때 통합**
   - 검색 UI 구현 시 FoodKeeper 추가
   - 사용자 경험 개선

3. **점진적 전환**
   ```
   Phase 1: 한국 30개 (현재) ✅
   Phase 2: FoodKeeper 500+ (Step 07)
   Phase 3: 커뮤니티 데이터 (Step 10+)
   ```

## 🎯 결론

**지금**: 30개 하드코딩으로 MVP 완성 ✅  
**나중**: FoodKeeper 통합으로 500+ 식재료 지원 🚀

현재 구조는 나중에 FoodKeeper로 쉽게 확장 가능하도록 설계되어 있습니다!

---

**작성일**: 2026-04-12  
**상태**: 제안서 (Step 07에서 구현 예정)

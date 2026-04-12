import { FoodStorageRule, FoodCategory } from '../types';

/**
 * 식재료별 보관 규칙 데이터베이스
 * 
 * 한국에서 흔히 사용하는 식재료들의 보관 기간을 정의합니다.
 */
export const FOOD_STORAGE_RULES: Record<string, FoodStorageRule> = {
  // 채소류
  '양파': {
    category: '채소',
    baseShelfLife: { refrigerated: 14, frozen: 180, roomTemp: 30 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  },
  '감자': {
    category: '채소',
    baseShelfLife: { refrigerated: 30, frozen: 180, roomTemp: 60 },
    stateModifier: { 통: 1.0, 손질: 0.3, 조리: 0.2 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '토마토': {
    category: '채소',
    baseShelfLife: { refrigerated: 7, frozen: 180, roomTemp: 5 },
    stateModifier: { 통: 1.0, 손질: 0.4, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  },
  '당근': {
    category: '채소',
    baseShelfLife: { refrigerated: 21, frozen: 180, roomTemp: 7 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '배추': {
    category: '채소',
    baseShelfLife: { refrigerated: 14, frozen: 90, roomTemp: 3 },
    stateModifier: { 통: 1.0, 손질: 0.4, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.1, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '무': {
    category: '채소',
    baseShelfLife: { refrigerated: 21, frozen: 180, roomTemp: 7 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '상추': {
    category: '채소',
    baseShelfLife: { refrigerated: 5, frozen: 0, roomTemp: 1 },
    stateModifier: { 통: 1.0, 손질: 0.6, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.3, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  },
  '오이': {
    category: '채소',
    baseShelfLife: { refrigerated: 7, frozen: 90, roomTemp: 3 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  },
  '파': {
    category: '채소',
    baseShelfLife: { refrigerated: 10, frozen: 180, roomTemp: 3 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '마늘': {
    category: '채소',
    baseShelfLife: { refrigerated: 90, frozen: 365, roomTemp: 30 },
    stateModifier: { 통: 1.0, 손질: 0.4, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.8 }
  },

  // 과일류
  '사과': {
    category: '과일',
    baseShelfLife: { refrigerated: 30, frozen: 180, roomTemp: 7 },
    stateModifier: { 통: 1.0, 손질: 0.3, 조리: 0.2 },
    storageTypeModifier: { 밀폐용기: 1.1, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '바나나': {
    category: '과일',
    baseShelfLife: { refrigerated: 7, frozen: 90, roomTemp: 5 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '포도': {
    category: '과일',
    baseShelfLife: { refrigerated: 7, frozen: 180, roomTemp: 2 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  },
  '딸기': {
    category: '과일',
    baseShelfLife: { refrigerated: 5, frozen: 180, roomTemp: 1 },
    stateModifier: { 통: 1.0, 손질: 0.6, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.7, 원래포장: 1.0, 랩: 0.8 }
  },

  // 육류
  '돼지고기': {
    category: '육류',
    baseShelfLife: { refrigerated: 3, frozen: 180, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.8, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '소고기': {
    category: '육류',
    baseShelfLife: { refrigerated: 4, frozen: 270, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.8, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '닭고기': {
    category: '육류',
    baseShelfLife: { refrigerated: 2, frozen: 180, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.7, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },

  // 해산물
  '생선': {
    category: '해산물',
    baseShelfLife: { refrigerated: 2, frozen: 90, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.8, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '새우': {
    category: '해산물',
    baseShelfLife: { refrigerated: 2, frozen: 180, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.7, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '오징어': {
    category: '해산물',
    baseShelfLife: { refrigerated: 2, frozen: 180, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.7, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },

  // 유제품
  '우유': {
    category: '유제품',
    baseShelfLife: { refrigerated: 7, frozen: 90, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '요거트': {
    category: '유제품',
    baseShelfLife: { refrigerated: 14, frozen: 60, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '치즈': {
    category: '유제품',
    baseShelfLife: { refrigerated: 30, frozen: 180, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.7, 조리: 0.8 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 1.0 }
  },
  '계란': {
    category: '유제품',
    baseShelfLife: { refrigerated: 30, frozen: 0, roomTemp: 7 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },

  // 조미료
  '간장': {
    category: '조미료',
    baseShelfLife: { refrigerated: 365, frozen: 365, roomTemp: 180 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '고추장': {
    category: '조미료',
    baseShelfLife: { refrigerated: 365, frozen: 365, roomTemp: 90 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },

  // 가공식품
  '두부': {
    category: '가공식품',
    baseShelfLife: { refrigerated: 7, frozen: 90, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '김치': {
    category: '가공식품',
    baseShelfLife: { refrigerated: 30, frozen: 180, roomTemp: 3 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  },
  '햄': {
    category: '가공식품',
    baseShelfLife: { refrigerated: 14, frozen: 60, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.7, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.1, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },

  // 곡물
  '쌀': {
    category: '곡물',
    baseShelfLife: { refrigerated: 180, frozen: 365, roomTemp: 90 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 0.3 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.8 }
  },
  '밀가루': {
    category: '곡물',
    baseShelfLife: { refrigerated: 180, frozen: 365, roomTemp: 90 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.8, 원래포장: 1.0, 랩: 0.9 }
  }
};

/**
 * 카테고리별 기본 보관 규칙
 * 
 * 데이터베이스에 없는 식재료는 카테고리 기본값을 사용합니다.
 */
export const CATEGORY_DEFAULTS: Record<FoodCategory, Partial<FoodStorageRule>> = {
  '채소': {
    category: '채소',
    baseShelfLife: { refrigerated: 7, frozen: 180, roomTemp: 3 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '과일': {
    category: '과일',
    baseShelfLife: { refrigerated: 10, frozen: 180, roomTemp: 5 },
    stateModifier: { 통: 1.0, 손질: 0.5, 조리: 0.4 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '육류': {
    category: '육류',
    baseShelfLife: { refrigerated: 3, frozen: 180, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.8, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '해산물': {
    category: '해산물',
    baseShelfLife: { refrigerated: 2, frozen: 90, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 0.8, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '유제품': {
    category: '유제품',
    baseShelfLife: { refrigerated: 7, frozen: 90, roomTemp: 0 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '조미료': {
    category: '조미료',
    baseShelfLife: { refrigerated: 365, frozen: 365, roomTemp: 180 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 1.0 },
    storageTypeModifier: { 밀폐용기: 1.0, 비닐: 1.0, 원래포장: 1.0, 랩: 1.0 }
  },
  '가공식품': {
    category: '가공식품',
    baseShelfLife: { refrigerated: 30, frozen: 180, roomTemp: 90 },
    stateModifier: { 통: 1.0, 손질: 0.8, 조리: 0.6 },
    storageTypeModifier: { 밀폐용기: 1.1, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  },
  '곡물': {
    category: '곡물',
    baseShelfLife: { refrigerated: 180, frozen: 365, roomTemp: 90 },
    stateModifier: { 통: 1.0, 손질: 1.0, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.2, 비닐: 0.9, 원래포장: 1.0, 랩: 0.8 }
  },
  '기타': {
    category: '기타',
    baseShelfLife: { refrigerated: 7, frozen: 90, roomTemp: 3 },
    stateModifier: { 통: 1.0, 손질: 0.7, 조리: 0.5 },
    storageTypeModifier: { 밀폐용기: 1.1, 비닐: 0.9, 원래포장: 1.0, 랩: 0.9 }
  }
};

/**
 * 식재료 자동 완성용 목록
 */
export const COMMON_FOODS = Object.keys(FOOD_STORAGE_RULES).sort();

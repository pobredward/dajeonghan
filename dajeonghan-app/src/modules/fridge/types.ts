/**
 * 식재료 아이템
 * 
 * 냉장고에 보관 중인 식재료를 나타냅니다.
 */
export interface FoodItem {
  id: string;
  userId: string;
  type: 'food';
  name: string;
  metadata: FoodMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 식재료 메타데이터
 */
export interface FoodMetadata {
  /** 식재료 카테고리 */
  category: FoodCategory;
  
  /** 구매일 */
  purchaseDate: Date;
  
  /** 표기된 유통기한/소비기한 (있는 경우) */
  expiryDate?: Date;
  
  /** 기한 타입 */
  expiryType?: 'sell_by' | 'consume_by';
  
  /** 보관 조건 (냉장/냉동/실온) */
  storageCondition: StorageCondition;
  
  /** 보관 방식 (밀폐용기/비닐/랩 등) */
  storageType: StorageType;
  
  /** 식재료 상태 (통/손질/조리) */
  state: FoodState;
  
  /** 자동 계산된 권장 소진일 */
  recommendedConsumption?: Date;
  
  /** 수량 (선택) */
  quantity?: string;
  
  /** 이미지 URL (선택) */
  imageUrl?: string;
  
  /** 메모 */
  memo?: string;
}

/**
 * 식재료 카테고리
 */
export type FoodCategory = 
  | '채소'
  | '과일'
  | '육류'
  | '해산물'
  | '유제품'
  | '조미료'
  | '가공식품'
  | '곡물'
  | '기타';

/**
 * 보관 조건
 */
export type StorageCondition = '냉장' | '냉동' | '실온';

/**
 * 보관 방식
 */
export type StorageType = '밀폐용기' | '비닐' | '원래포장' | '랩';

/**
 * 식재료 상태
 */
export type FoodState = '통' | '손질' | '조리';

/**
 * 식재료 보관 규칙
 * 
 * 각 식재료별 기본 보관 기간과 보정 계수를 정의합니다.
 */
export interface FoodStorageRule {
  /** 카테고리 */
  category: FoodCategory;
  
  /** 기본 보관 기간 (일수) */
  baseShelfLife: {
    refrigerated: number;  // 냉장
    frozen: number;        // 냉동
    roomTemp: number;      // 실온
  };
  
  /** 상태별 보정 계수 */
  stateModifier: {
    통: number;
    손질: number;
    조리: number;
  };
  
  /** 보관 방식별 보정 계수 */
  storageTypeModifier: {
    밀폐용기: number;
    비닐: number;
    원래포장: number;
    랩: number;
  };
}

/**
 * 임박 레벨
 */
export type UrgencyLevel = 'safe' | 'warning' | 'urgent' | 'expired';

/**
 * 식재료 그룹화 (임박 순)
 */
export interface FoodItemsGroup {
  expired: FoodItem[];      // 만료됨
  urgent: FoodItem[];       // D-day, D-1
  warning: FoodItem[];      // D-2, D-3
  safe: FoodItem[];         // D-4 이상
}

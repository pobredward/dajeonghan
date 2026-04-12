/**
 * FSIS FoodKeeper 데이터 타입
 */

export interface FoodKeeperData {
  fileName: string;
  sheets: FoodKeeperSheet[];
}

export interface FoodKeeperSheet {
  name: string;
  data: any[][];
}

/**
 * FoodKeeper Product 구조
 */
export interface FoodKeeperProduct {
  ID: number;
  Category_ID: number;
  Name: string;
  Name_subtitle?: string;
  Keywords?: string;
  
  // 냉장 보관
  DOP_Refrigerate?: string;
  DOP_Refrigerate_Min?: number;
  DOP_Refrigerate_Max?: number;
  DOP_Refrigerate_Metric?: string;
  Refrigerate_After_Opening?: string;
  Refrigerate_After_Thawing?: string;
  
  // 냉동 보관
  DOP_Freeze?: string;
  DOP_Freeze_Min?: number;
  DOP_Freeze_Max?: number;
  DOP_Freeze_Metric?: string;
  
  // 실온 보관 (Pantry)
  DOP_Pantry?: string;
  DOP_Pantry_Min?: number;
  DOP_Pantry_Max?: number;
  DOP_Pantry_Metric?: string;
  Pantry_After_Opening?: string;
  
  // 팁
  Tips?: string;
}

/**
 * FoodKeeper Category
 */
export interface FoodKeeperCategory {
  ID: number;
  Name: string;
  Color?: string;
}

/**
 * 변환된 Product (사용 편의성)
 */
export interface ParsedFoodKeeperProduct {
  id: number;
  categoryId: number;
  name: string;
  nameSubtitle?: string;
  keywords?: string;
  
  storage: {
    refrigerate?: {
      min?: number;
      max?: number;
      metric?: string;
      description?: string;
    };
    freeze?: {
      min?: number;
      max?: number;
      metric?: string;
      description?: string;
    };
    pantry?: {
      min?: number;
      max?: number;
      metric?: string;
      description?: string;
    };
  };
  
  tips?: string;
}

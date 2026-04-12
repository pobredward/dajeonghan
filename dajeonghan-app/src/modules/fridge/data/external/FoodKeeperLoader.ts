import foodKeeperData from './foodkeeper.json';
import { FoodKeeperData, FoodKeeperProduct, ParsedFoodKeeperProduct, FoodKeeperCategory } from './types';
import { FoodStorageRule, FoodCategory } from '../../types';

/**
 * FoodKeeper 데이터 로더
 * 
 * USDA FSIS FoodKeeper 데이터를 로드하고 변환합니다.
 */
export class FoodKeeperLoader {
  private static instance: FoodKeeperLoader;
  private products: Map<string, ParsedFoodKeeperProduct> = new Map();
  private categories: Map<number, FoodKeeperCategory> = new Map();
  private loaded: boolean = false;

  private constructor() {}

  static getInstance(): FoodKeeperLoader {
    if (!FoodKeeperLoader.instance) {
      FoodKeeperLoader.instance = new FoodKeeperLoader();
    }
    return FoodKeeperLoader.instance;
  }

  /**
   * 데이터 로드
   */
  load(): void {
    if (this.loaded) return;

    const data = foodKeeperData as FoodKeeperData;

    // Category 로드
    const categorySheet = data.sheets.find(s => s.name === 'Category');
    if (categorySheet) {
      this.loadCategories(categorySheet.data);
    }

    // Product 로드
    const productSheet = data.sheets.find(s => s.name === 'Product');
    if (productSheet) {
      this.loadProducts(productSheet.data);
    }

    this.loaded = true;
    console.log(`✅ FoodKeeper loaded: ${this.products.size} products`);
  }

  /**
   * Category 로드
   */
  private loadCategories(data: any[][]): void {
    data.forEach(row => {
      const category: any = {};
      row.forEach(col => {
        Object.assign(category, col);
      });

      if (category.ID && category.Name) {
        this.categories.set(category.ID, {
          ID: category.ID,
          Name: category.Name,
          Color: category.Color
        });
      }
    });
  }

  /**
   * Product 로드
   */
  private loadProducts(data: any[][]): void {
    data.forEach(row => {
      const product: any = {};
      row.forEach(col => {
        Object.assign(product, col);
      });

      if (!product.ID || !product.Name) return;

      const parsed = this.parseProduct(product);
      const key = product.Name.toLowerCase().trim();
      this.products.set(key, parsed);

      // Keywords도 인덱싱
      if (product.Keywords) {
        const keywords = product.Keywords.split(',').map((k: string) => k.trim().toLowerCase());
        keywords.forEach((keyword: string) => {
          if (keyword && keyword !== key) {
            this.products.set(keyword, parsed);
          }
        });
      }
    });
  }

  /**
   * Product 파싱
   */
  private parseProduct(product: any): ParsedFoodKeeperProduct {
    return {
      id: product.ID,
      categoryId: product.Category_ID,
      name: product.Name,
      nameSubtitle: product.Name_subtitle,
      keywords: product.Keywords,
      storage: {
        refrigerate: product.DOP_Refrigerate_Max ? {
          min: product.DOP_Refrigerate_Min,
          max: product.DOP_Refrigerate_Max,
          metric: product.DOP_Refrigerate_Metric || 'Days',
          description: product.DOP_Refrigerate
        } : undefined,
        freeze: product.DOP_Freeze_Max ? {
          min: product.DOP_Freeze_Min,
          max: product.DOP_Freeze_Max,
          metric: product.DOP_Freeze_Metric || 'Months',
          description: product.DOP_Freeze
        } : undefined,
        pantry: product.DOP_Pantry_Max ? {
          min: product.DOP_Pantry_Min,
          max: product.DOP_Pantry_Max,
          metric: product.DOP_Pantry_Metric || 'Days',
          description: product.DOP_Pantry
        } : undefined
      },
      tips: product.Tips
    };
  }

  /**
   * 제품 검색 (영어)
   */
  searchByName(name: string): ParsedFoodKeeperProduct | null {
    if (!this.loaded) this.load();
    
    const key = name.toLowerCase().trim();
    return this.products.get(key) || null;
  }

  /**
   * 모든 제품 이름 가져오기 (자동완성용)
   */
  getAllProductNames(): string[] {
    if (!this.loaded) this.load();
    
    const names = new Set<string>();
    this.products.forEach((product, key) => {
      names.add(product.name);
    });
    
    return Array.from(names).sort();
  }

  /**
   * FoodKeeper → FoodStorageRule 변환
   */
  convertToStorageRule(product: ParsedFoodKeeperProduct): FoodStorageRule {
    // 메트릭 변환 (Days/Months → 일수)
    const convertToDays = (value: number, metric: string): number => {
      if (metric === 'Months' || metric === 'Month') {
        return value * 30;
      }
      if (metric === 'Weeks' || metric === 'Week') {
        return value * 7;
      }
      return value; // Days
    };

    const categoryName = this.getCategoryName(product.categoryId);

    return {
      category: this.mapToKoreanCategory(categoryName),
      baseShelfLife: {
        refrigerated: product.storage.refrigerate?.max 
          ? convertToDays(product.storage.refrigerate.max, product.storage.refrigerate.metric || 'Days')
          : 7,
        frozen: product.storage.freeze?.max
          ? convertToDays(product.storage.freeze.max, product.storage.freeze.metric || 'Months')
          : 90,
        roomTemp: product.storage.pantry?.max
          ? convertToDays(product.storage.pantry.max, product.storage.pantry.metric || 'Days')
          : 3
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

  /**
   * Category ID → Name
   */
  private getCategoryName(categoryId: number): string {
    return this.categories.get(categoryId)?.Name || 'Other';
  }

  /**
   * 영어 카테고리 → 한국 카테고리 매핑
   */
  private mapToKoreanCategory(englishCategory: string): FoodCategory {
    const mapping: Record<string, FoodCategory> = {
      'Vegetables': '채소',
      'Fruits': '과일',
      'Meat': '육류',
      'Poultry': '육류',
      'Seafood': '해산물',
      'Dairy': '유제품',
      'Dairy & Eggs': '유제품',
      'Condiments & Sauces': '조미료',
      'Grains': '곡물',
      'Baked Goods': '가공식품',
      'Prepared Foods': '가공식품',
      'Beverages': '기타'
    };

    return mapping[englishCategory] || '기타';
  }

  /**
   * 제품 통계
   */
  getStats(): { totalProducts: number; totalCategories: number } {
    if (!this.loaded) this.load();
    
    const uniqueProducts = new Set<number>();
    this.products.forEach(p => uniqueProducts.add(p.id));

    return {
      totalProducts: uniqueProducts.size,
      totalCategories: this.categories.size
    };
  }
}

// 싱글톤 인스턴스 export
export const foodKeeperLoader = FoodKeeperLoader.getInstance();

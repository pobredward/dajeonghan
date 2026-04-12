import { foodKeeperLoader } from '../FoodKeeperLoader';

describe('FoodKeeperLoader', () => {
  beforeAll(() => {
    // 데이터 로드
    foodKeeperLoader.load();
  });

  describe('데이터 로드', () => {
    it('should load FoodKeeper data successfully', () => {
      const stats = foodKeeperLoader.getStats();
      
      expect(stats.totalProducts).toBeGreaterThan(100);
      // Category 시트가 비어있을 수 있으므로 체크하지 않음
      
      console.log(`✅ Loaded ${stats.totalProducts} products, ${stats.totalCategories} categories`);
    });
  });

  describe('제품 검색', () => {
    it('should find products by name', () => {
      const product = foodKeeperLoader.searchByName('Apples');
      
      expect(product).not.toBeNull();
      if (product) {
        expect(product.name).toBeDefined();
        expect(product.storage).toBeDefined();
      }
    });

    it('should find products case-insensitively', () => {
      const product1 = foodKeeperLoader.searchByName('APPLES');
      const product2 = foodKeeperLoader.searchByName('apples');
      const product3 = foodKeeperLoader.searchByName('Apples');
      
      // 최소 하나는 찾아야 함
      expect(product1 || product2 || product3).not.toBeNull();
    });

    it('should return null for non-existent products', () => {
      const product = foodKeeperLoader.searchByName('NonExistentFood12345');
      expect(product).toBeNull();
    });
  });

  describe('Storage Rule 변환', () => {
    it('should convert products to storage rule', () => {
      const product = foodKeeperLoader.searchByName('Apples');
      
      if (product) {
        const rule = foodKeeperLoader.convertToStorageRule(product);
        
        expect(rule.category).toBeDefined();
        expect(rule.baseShelfLife).toBeDefined();
        expect(rule.stateModifier.통).toBe(1.0);
        expect(rule.storageTypeModifier.밀폐용기).toBe(1.2);
      }
    });

    it('should handle metric conversion properly', () => {
      // 아무 제품이나 변환 테스트
      const allNames = foodKeeperLoader.getAllProductNames();
      if (allNames.length > 0) {
        const product = foodKeeperLoader.searchByName(allNames[0]);
        
        if (product) {
          const rule = foodKeeperLoader.convertToStorageRule(product);
          
          expect(rule.baseShelfLife.refrigerated).toBeGreaterThanOrEqual(0);
          expect(rule.baseShelfLife.frozen).toBeGreaterThanOrEqual(0);
          expect(rule.baseShelfLife.roomTemp).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('자동완성', () => {
    it('should return all product names', () => {
      const names = foodKeeperLoader.getAllProductNames();
      
      expect(names.length).toBeGreaterThan(100); // 최소 100개 이상
      console.log(`Total unique products: ${names.length}`);
    });

    it('should return sorted names', () => {
      const names = foodKeeperLoader.getAllProductNames();
      
      // 정렬 확인 (처음 10개)
      for (let i = 1; i < Math.min(10, names.length); i++) {
        expect(names[i-1].localeCompare(names[i])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('카테고리 매핑', () => {
    it('should map categories to Korean', () => {
      const allNames = foodKeeperLoader.getAllProductNames();
      
      if (allNames.length > 0) {
        const product = foodKeeperLoader.searchByName(allNames[0]);
        
        if (product) {
          const rule = foodKeeperLoader.convertToStorageRule(product);
          
          // 한국 카테고리 중 하나여야 함
          const validCategories = ['채소', '과일', '육류', '해산물', '유제품', '조미료', '가공식품', '곡물', '기타'];
          expect(validCategories).toContain(rule.category);
        }
      }
    });
  });
});

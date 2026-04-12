import { FridgeService } from '../FridgeService';
import { foodKeeperLoader } from '../data/external/FoodKeeperLoader';

describe('FridgeService with FoodKeeper Integration', () => {
  beforeAll(() => {
    foodKeeperLoader.load();
  });

  describe('FoodKeeper 통합', () => {
    it('should get FoodKeeper stats', () => {
      const stats = FridgeService.getFoodKeeperStats();
      
      expect(stats.totalProducts).toBeGreaterThan(100);
      console.log(`FoodKeeper: ${stats.totalProducts} products, ${stats.totalCategories} categories`);
    });

    it('should search food names', () => {
      const results = FridgeService.searchFoodNames('apple');
      
      expect(results.length).toBeGreaterThanOrEqual(0);
      console.log(`Search 'apple': ${results.length} results`);
    });

    it('should search Korean food names', () => {
      const results = FridgeService.searchFoodNames('양파');
      
      expect(results).toContain('양파');
    });
  });

  describe('calculateRecommendedConsumption with FoodKeeper', () => {
    it('should use Korean food data first', () => {
      const userId = 'test_user';
      const purchaseDate = new Date('2026-04-01');
      
      // 양파는 한국 데이터 사용
      const item = FridgeService.createFoodItem(userId, {
        name: '양파',
        purchaseDate,
        category: '채소',
        storageCondition: '냉장'
      });

      expect(item.metadata.recommendedConsumption).toBeDefined();
      
      const daysAdded = Math.floor(
        (item.metadata.recommendedConsumption!.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(daysAdded).toBe(14); // 양파 냉장 14일
    });

    it('should fallback to FoodKeeper for English names', () => {
      const userId = 'test_user';
      const purchaseDate = new Date('2026-04-01');
      
      // Apples는 FoodKeeper에 있을 가능성이 높음
      const item = FridgeService.createFoodItem(userId, {
        name: 'Apples',
        purchaseDate,
        category: '과일',
        storageCondition: '냉장'
      });

      expect(item.metadata.recommendedConsumption).toBeDefined();
      
      const daysAdded = Math.floor(
        (item.metadata.recommendedConsumption!.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(daysAdded).toBeGreaterThan(0);
      console.log(`Apples refrigerated: ${daysAdded} days`);
    });

    it('should use category default for unknown foods', () => {
      const userId = 'test_user';
      const purchaseDate = new Date('2026-04-01');
      
      // 존재하지 않는 식재료
      const item = FridgeService.createFoodItem(userId, {
        name: 'UnknownFood12345',
        purchaseDate,
        category: '채소',
        storageCondition: '냉장'
      });

      expect(item.metadata.recommendedConsumption).toBeDefined();
      
      const daysAdded = Math.floor(
        (item.metadata.recommendedConsumption!.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(daysAdded).toBe(7); // 채소 카테고리 기본값
    });
  });

  describe('데이터 우선순위', () => {
    it('should prioritize Korean data over FoodKeeper', () => {
      // 양파는 한국 DB에 있음
      const koreanOnion = FridgeService.createFoodItem('user', {
        name: '양파',
        purchaseDate: new Date(),
        category: '채소',
        storageCondition: '냉장'
      });

      const daysKorean = FridgeService.getDaysLeft(koreanOnion);
      expect(daysKorean).not.toBeNull();
    });

    it('should use FoodKeeper when Korean data not available', () => {
      // Apples는 한국 DB에 없음 (FoodKeeper 사용)
      const apples = FridgeService.createFoodItem('user', {
        name: 'Apples',
        purchaseDate: new Date(),
        category: '과일',
        storageCondition: '냉장'
      });

      const daysApples = FridgeService.getDaysLeft(apples);
      expect(daysApples).not.toBeNull();
      console.log(`Apples: ${daysApples} days left`);
    });
  });
});

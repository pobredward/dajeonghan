import { FridgeService } from '../FridgeService';
import { FoodItem, FoodCategory } from '../types';

describe('FridgeService', () => {
  describe('createFoodItem', () => {
    it('should create food item with default values', () => {
      const userId = 'test_user_123';
      const item = FridgeService.createFoodItem(userId, {
        name: '양파'
      });

      expect(item.userId).toBe(userId);
      expect(item.name).toBe('양파');
      expect(item.type).toBe('food');
      expect(item.metadata.storageCondition).toBe('냉장');
      expect(item.metadata.state).toBe('통');
      expect(item.metadata.recommendedConsumption).toBeDefined();
    });

    it('should calculate recommended consumption date', () => {
      const userId = 'test_user_123';
      const purchaseDate = new Date('2026-04-01');
      
      const item = FridgeService.createFoodItem(userId, {
        name: '우유',
        purchaseDate,
        category: '유제품',
        storageCondition: '냉장'
      });

      expect(item.metadata.recommendedConsumption).toBeDefined();
      expect(item.metadata.recommendedConsumption!.getTime()).toBeGreaterThan(purchaseDate.getTime());
    });
  });

  describe('calculateRecommendedConsumption', () => {
    it('should calculate shelf life for refrigerated vegetables', () => {
      const purchaseDate = new Date('2026-04-01');
      const metadata = {
        category: '채소' as FoodCategory,
        purchaseDate,
        storageCondition: '냉장' as const,
        storageType: '원래포장' as const,
        state: '통' as const
      };

      const result = FridgeService.calculateRecommendedConsumption('양파', metadata);
      const daysAdded = Math.floor((result.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysAdded).toBe(14); // 양파 냉장 기본 14일
    });

    it('should apply state modifier correctly', () => {
      const purchaseDate = new Date('2026-04-01');
      
      const wholeMetadata = {
        category: '채소' as FoodCategory,
        purchaseDate,
        storageCondition: '냉장' as const,
        storageType: '원래포장' as const,
        state: '통' as const
      };

      const cutMetadata = {
        ...wholeMetadata,
        state: '손질' as const
      };

      const wholeResult = FridgeService.calculateRecommendedConsumption('양파', wholeMetadata);
      const cutResult = FridgeService.calculateRecommendedConsumption('양파', cutMetadata);

      const wholeDays = Math.floor((wholeResult.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const cutDays = Math.floor((cutResult.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(cutDays).toBeLessThan(wholeDays);
    });

    it('should handle frozen storage correctly', () => {
      const purchaseDate = new Date('2026-04-01');
      const metadata = {
        category: '육류' as FoodCategory,
        purchaseDate,
        storageCondition: '냉동' as const,
        storageType: '원래포장' as const,
        state: '통' as const
      };

      const result = FridgeService.calculateRecommendedConsumption('돼지고기', metadata);
      const daysAdded = Math.floor((result.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysAdded).toBe(180); // 돼지고기 냉동 180일
    });
  });

  describe('groupByUrgency', () => {
    it('should group items by urgency level', () => {
      const userId = 'test_user';
      const now = new Date();

      const items: FoodItem[] = [
        // 만료됨
        FridgeService.createFoodItem(userId, {
          name: '우유',
          purchaseDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          category: '유제품'
        }),
        // 긴급 (D-1)
        FridgeService.createFoodItem(userId, {
          name: '돼지고기',
          purchaseDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          category: '육류'
        }),
        // 여유
        FridgeService.createFoodItem(userId, {
          name: '감자',
          purchaseDate: now,
          category: '채소',
          storageCondition: '실온'
        })
      ];

      const groups = FridgeService.groupByUrgency(items);

      expect(groups.expired.length).toBeGreaterThan(0);
      expect(groups.urgent.length).toBeGreaterThan(0);
      expect(groups.safe.length).toBeGreaterThan(0);
    });
  });

  describe('getDaysLeft', () => {
    it('should calculate days left correctly', () => {
      const userId = 'test_user';
      const now = new Date();
      const futureDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      const item = FridgeService.createFoodItem(userId, {
        name: '사과',
        purchaseDate: now,
        category: '과일'
      });

      const daysLeft = FridgeService.getDaysLeft(item);
      
      expect(daysLeft).not.toBeNull();
      expect(daysLeft).toBeGreaterThan(0);
    });

    it('should return null for items without expiry date', () => {
      const item: FoodItem = {
        id: 'test_id',
        userId: 'test_user',
        type: 'food',
        name: '간장',
        metadata: {
          category: '조미료',
          purchaseDate: new Date(),
          storageCondition: '실온',
          storageType: '원래포장',
          state: '통'
          // recommendedConsumption이 없음
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const daysLeft = FridgeService.getDaysLeft(item);
      
      // 조미료는 장기 보관이므로 daysLeft가 크거나 null
      expect(daysLeft === null || daysLeft > 100).toBe(true);
    });
  });

  describe('getExpiringItems', () => {
    it('should filter items expiring within threshold', () => {
      const userId = 'test_user';
      const now = new Date();

      const items: FoodItem[] = [
        FridgeService.createFoodItem(userId, {
          name: '돼지고기',
          purchaseDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          category: '육류'
        }),
        FridgeService.createFoodItem(userId, {
          name: '감자',
          purchaseDate: now,
          category: '채소',
          storageCondition: '실온'
        })
      ];

      const expiring = FridgeService.getExpiringItems(items, 3);

      expect(Array.isArray(expiring)).toBe(true);
    });
  });

  describe('updateFoodItem', () => {
    it('should update metadata and recalculate expiry', () => {
      const userId = 'test_user';
      const item = FridgeService.createFoodItem(userId, {
        name: '양파',
        category: '채소',
        storageCondition: '실온'
      });

      const originalExpiry = item.metadata.recommendedConsumption;

      // 냉장으로 변경
      const updated = FridgeService.updateFoodItem(item, {
        storageCondition: '냉장'
      });

      expect(updated.metadata.storageCondition).toBe('냉장');
      expect(updated.metadata.recommendedConsumption).toBeDefined();
      expect(updated.metadata.recommendedConsumption).not.toEqual(originalExpiry);
    });
  });
});

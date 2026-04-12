import { FoodItem, FoodMetadata, StorageCondition, FoodItemsGroup, FoodCategory } from './types';
import { FOOD_STORAGE_RULES, CATEGORY_DEFAULTS } from './data/foodDatabase';
import { foodKeeperLoader } from './data/external/FoodKeeperLoader';
import { addDays, differenceInDays } from 'date-fns';
import * as Crypto from 'expo-crypto';

/**
 * 냉장고 서비스
 * 
 * 식재료 유통기한 관리의 핵심 비즈니스 로직을 담당합니다.
 * - 권장 소진일 자동 계산
 * - 임박 알림 관리
 * - 보관 조건별 수명 계산
 */
export class FridgeService {
  /**
   * 권장 소진일 계산
   * 
   * 보관 조건 × 보관 방식 × 상태를 모두 고려한 스마트 계산
   * 
   * @param foodName 식재료 이름
   * @param metadata 메타데이터
   * @returns 권장 소진일
   */
  static calculateRecommendedConsumption(
    foodName: string,
    metadata: Partial<FoodMetadata>
  ): Date {
    const purchaseDate = metadata.purchaseDate || new Date();
    const storageCondition = metadata.storageCondition || '냉장';
    const state = metadata.state || '통';
    const storageType = metadata.storageType || '원래포장';

    // 1. 식재료별 룰 가져오기 (3단계 폴백)
    let rule = FOOD_STORAGE_RULES[foodName]; // 1순위: 한국 식재료
    
    if (!rule) {
      // 2순위: FoodKeeper 검색
      const foodKeeperProduct = foodKeeperLoader.searchByName(foodName);
      if (foodKeeperProduct) {
        rule = foodKeeperLoader.convertToStorageRule(foodKeeperProduct);
      }
    }
    
    if (!rule) {
      // 3순위: 카테고리 기본값
      rule = this.getCategoryDefault(metadata.category);
    }

    if (!rule || !rule.baseShelfLife) {
      // 최종 폴백: 냉장 7일
      return addDays(purchaseDate, 7);
    }

    // 2. 기본 보관 기간
    let baseShelfLife: number;
    switch (storageCondition) {
      case '냉장':
        baseShelfLife = rule.baseShelfLife.refrigerated;
        break;
      case '냉동':
        baseShelfLife = rule.baseShelfLife.frozen;
        break;
      case '실온':
        baseShelfLife = rule.baseShelfLife.roomTemp;
        break;
      default:
        baseShelfLife = 7;
    }

    // 3. 상태 보정
    const stateModifier = rule.stateModifier?.[state] || 1.0;

    // 4. 보관 방식 보정
    const storageModifier = rule.storageTypeModifier?.[storageType] || 1.0;

    // 5. 최종 계산
    const adjustedShelfLife = Math.round(baseShelfLife * stateModifier * storageModifier);

    return addDays(purchaseDate, adjustedShelfLife);
  }

  /**
   * 카테고리 기본값 가져오기
   */
  private static getCategoryDefault(category?: FoodCategory): any {
    if (!category) return null;
    return CATEGORY_DEFAULTS[category];
  }

  /**
   * 임박 식재료 필터링
   * 
   * @param items 모든 식재료
   * @param daysThreshold 임박 기준 (일수)
   * @returns 임박한 식재료 목록 (날짜순 정렬)
   */
  static getExpiringItems(
    items: FoodItem[],
    daysThreshold: number = 3
  ): FoodItem[] {
    const now = new Date();
    
    return items.filter(item => {
      const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
      if (!expiryDate) return false;

      const daysLeft = differenceInDays(expiryDate, now);
      return daysLeft <= daysThreshold && daysLeft >= 0;
    }).sort((a, b) => {
      const dateA = a.metadata.recommendedConsumption || a.metadata.expiryDate || new Date();
      const dateB = b.metadata.recommendedConsumption || b.metadata.expiryDate || new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * 만료된 식재료 필터링
   * 
   * @param items 모든 식재료
   * @returns 만료된 식재료 목록
   */
  static getExpiredItems(items: FoodItem[]): FoodItem[] {
    const now = new Date();
    
    return items.filter(item => {
      const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
      if (!expiryDate) return false;

      return expiryDate < now;
    }).sort((a, b) => {
      const dateA = a.metadata.recommendedConsumption || a.metadata.expiryDate || new Date();
      const dateB = b.metadata.recommendedConsumption || b.metadata.expiryDate || new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * 식재료 그룹화 (임박 레벨별)
   * 
   * @param items 모든 식재료
   * @returns 임박 레벨별로 그룹화된 식재료
   */
  static groupByUrgency(items: FoodItem[]): FoodItemsGroup {
    const now = new Date();
    const groups: FoodItemsGroup = {
      expired: [],
      urgent: [],
      warning: [],
      safe: []
    };

    items.forEach(item => {
      const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
      if (!expiryDate) {
        groups.safe.push(item);
        return;
      }

      const daysLeft = differenceInDays(expiryDate, now);

      if (daysLeft < 0) {
        groups.expired.push(item);
      } else if (daysLeft <= 1) {
        groups.urgent.push(item);
      } else if (daysLeft <= 3) {
        groups.warning.push(item);
      } else {
        groups.safe.push(item);
      }
    });

    // 각 그룹 내에서 날짜순 정렬
    const sortByDate = (a: FoodItem, b: FoodItem) => {
      const dateA = a.metadata.recommendedConsumption || a.metadata.expiryDate || new Date();
      const dateB = b.metadata.recommendedConsumption || b.metadata.expiryDate || new Date();
      return dateA.getTime() - dateB.getTime();
    };

    groups.expired.sort(sortByDate);
    groups.urgent.sort(sortByDate);
    groups.warning.sort(sortByDate);
    groups.safe.sort(sortByDate);

    return groups;
  }

  /**
   * 식재료 추가 (점진적 공개)
   * 
   * 최소 정보만으로 식재료를 추가하고, 나머지는 기본값 사용
   * 
   * @param userId 사용자 ID
   * @param basicInfo 기본 정보 (이름만 필수)
   * @returns 생성된 식재료 아이템
   */
  static createFoodItem(
    userId: string,
    basicInfo: {
      name: string;
      purchaseDate?: Date;
      expiryDate?: Date;
      category?: FoodCategory;
      storageCondition?: StorageCondition;
    }
  ): FoodItem {
    const now = new Date();
    const purchaseDate = basicInfo.purchaseDate || now;
    const itemId = Crypto.randomUUID();

    // 기본값으로 시작 (나중에 사용자가 수정 가능)
    const metadata: FoodMetadata = {
      category: basicInfo.category || '기타',
      purchaseDate,
      expiryDate: basicInfo.expiryDate,
      expiryType: 'consume_by',
      storageCondition: basicInfo.storageCondition || '냉장',
      storageType: '원래포장',
      state: '통',
      quantity: '1개'
    };

    // 권장 소진일 자동 계산
    metadata.recommendedConsumption = this.calculateRecommendedConsumption(
      basicInfo.name,
      metadata
    );

    return {
      id: itemId,
      userId,
      type: 'food',
      name: basicInfo.name,
      metadata,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 식재료 수정
   * 
   * 메타데이터 변경 시 권장 소진일 재계산
   * 
   * @param item 기존 식재료
   * @param updates 업데이트할 메타데이터
   * @returns 업데이트된 식재료
   */
  static updateFoodItem(
    item: FoodItem,
    updates: Partial<FoodMetadata>
  ): FoodItem {
    const updatedMetadata = {
      ...item.metadata,
      ...updates
    };

    // 보관 조건/방식/상태가 변경되면 권장 소진일 재계산
    if (
      updates.storageCondition ||
      updates.storageType ||
      updates.state ||
      updates.purchaseDate
    ) {
      updatedMetadata.recommendedConsumption = this.calculateRecommendedConsumption(
        item.name,
        updatedMetadata
      );
    }

    return {
      ...item,
      metadata: updatedMetadata,
      updatedAt: new Date()
    };
  }

  /**
   * D-day 계산
   * 
   * @param item 식재료
   * @returns 남은 일수 (음수면 만료)
   */
  static getDaysLeft(item: FoodItem): number | null {
    const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
    if (!expiryDate) return null;

    return differenceInDays(expiryDate, new Date());
  }

  /**
   * 소비기한 vs 유통기한 설명
   * 
   * @param type 기한 타입
   * @returns 설명 텍스트
   */
  static getExpiryTypeExplanation(type: 'sell_by' | 'consume_by'): string {
    if (type === 'sell_by') {
      return '유통기한(판매기한): 이 날짜까지 판매 가능합니다. 보관조건을 지키면 더 오래 먹을 수 있어요.';
    } else {
      return '소비기한(안전섭취기한): 이 날짜까지 안전하게 먹을 수 있습니다. 보관조건을 꼭 지켜주세요!';
    }
  }

  /**
   * 간단한 레시피 제안
   * 
   * @param items 임박한 식재료 목록
   * @returns 레시피 제안
   */
  static suggestRecipes(items: FoodItem[]): string[] {
    if (items.length === 0) return [];

    const itemNames = items.map(i => i.name).slice(0, 3).join(', ');
    
    // 실제로는 레시피 API 연동 또는 간단한 룰 기반
    const suggestions = [
      `${itemNames}로 볶음 요리 어떠세요?`,
      `${itemNames}를 넣은 찌개 추천!`,
      `${itemNames} 샐러드로 간단하게!`
    ];

    return suggestions.slice(0, 2);
  }

  /**
   * 카테고리별 식재료 수 집계
   * 
   * @param items 모든 식재료
   * @returns 카테고리별 개수
   */
  static getCategoryStats(items: FoodItem[]): Record<FoodCategory, number> {
    const stats: Record<string, number> = {};
    
    items.forEach(item => {
      const category = item.metadata.category;
      stats[category] = (stats[category] || 0) + 1;
    });

    return stats as Record<FoodCategory, number>;
  }

  /**
   * FoodKeeper 데이터베이스 통계
   */
  static getFoodKeeperStats(): { totalProducts: number; totalCategories: number } {
    return foodKeeperLoader.getStats();
  }

  /**
   * 식재료 이름 검색 (자동완성용)
   * 
   * @param query 검색어
   * @returns 매칭되는 식재료 이름 목록
   */
  static searchFoodNames(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const results: string[] = [];

    // 한국 식재료 검색
    Object.keys(FOOD_STORAGE_RULES).forEach(name => {
      if (name.includes(lowerQuery)) {
        results.push(name);
      }
    });

    // FoodKeeper 검색 (영어)
    const allNames = foodKeeperLoader.getAllProductNames();
    allNames.forEach(name => {
      if (name.toLowerCase().includes(lowerQuery)) {
        results.push(name);
      }
    });

    return results.slice(0, 10); // 상위 10개
  }
}

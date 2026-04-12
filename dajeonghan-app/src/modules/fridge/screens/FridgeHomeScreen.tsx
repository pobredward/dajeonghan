import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { FridgeService } from '../FridgeService';
import { FoodItemCard } from '../components/FoodItemCard';
import { FoodItem, FoodItemsGroup } from '../types';

/**
 * 냉장고 홈 화면
 * 
 * 식재료를 임박 레벨별로 그룹화하여 표시합니다.
 * - 만료됨
 * - 긴급 (D-day, D-1)
 * - 주의 (D-2, D-3)
 * - 여유
 */
export const FridgeHomeScreen: React.FC = () => {
  const [foodGroups, setFoodGroups] = useState<FoodItemsGroup>({
    expired: [],
    urgent: [],
    warning: [],
    safe: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showFoodKeeperStats, setShowFoodKeeperStats] = useState(false);

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      // TODO: Firestore에서 식재료 로드
      // 현재는 FoodKeeper 기반 목업 데이터
      const mockItems = await loadMockFoodItems();
      
      const groups = FridgeService.groupByUrgency(mockItems);
      setFoodGroups(groups);
    } catch (error) {
      console.error('Failed to load food items:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFoodItems();
    setRefreshing(false);
  };

  const handleItemPress = (item: FoodItem) => {
    // TODO: 상세 화면으로 이동
    console.log('Food item pressed:', item.name);
  };

  const handleStatsPress = () => {
    setShowFoodKeeperStats(!showFoodKeeperStats);
  };

  const renderSection = (
    title: string,
    items: FoodItem[],
    emoji: string,
    color: string
  ) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {emoji} {title}
          </Text>
          <Text style={[styles.sectionCount, { color }]}>
            {items.length}개
          </Text>
        </View>

        {items.map(item => (
          <FoodItemCard
            key={item.id}
            item={item}
            onPress={() => handleItemPress(item)}
          />
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🥗</Text>
      <Text style={styles.emptyTitle}>냉장고가 비어있어요</Text>
      <Text style={styles.emptySubtitle}>
        식재료를 추가해서 유통기한을 관리해보세요!
      </Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ 식재료 추가</Text>
      </TouchableOpacity>
    </View>
  );

  const totalItems = 
    foodGroups.expired.length +
    foodGroups.urgent.length +
    foodGroups.warning.length +
    foodGroups.safe.length;

  const foodKeeperStats = FridgeService.getFoodKeeperStats();

  if (totalItems === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderEmptyState()}
        
        {/* FoodKeeper 정보 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🌐 FoodKeeper 데이터베이스</Text>
          <Text style={styles.infoText}>
            USDA 공식 데이터로 {foodKeeperStats.totalProducts}개 이상의 식재료를 지원합니다!
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 요약 */}
      <View style={styles.summary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>냉장고 현황</Text>
          <TouchableOpacity onPress={handleStatsPress}>
            <Text style={styles.statsButton}>📊 통계</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalItems}</Text>
            <Text style={styles.statLabel}>전체</Text>
          </View>
          <View style={[styles.statItem, styles.statDanger]}>
            <Text style={[styles.statNumber, styles.statNumberDanger]}>
              {foodGroups.expired.length + foodGroups.urgent.length}
            </Text>
            <Text style={styles.statLabel}>긴급</Text>
          </View>
          <View style={[styles.statItem, styles.statWarning]}>
            <Text style={[styles.statNumber, styles.statNumberWarning]}>
              {foodGroups.warning.length}
            </Text>
            <Text style={styles.statLabel}>주의</Text>
          </View>
        </View>

        {/* FoodKeeper 통계 */}
        {showFoodKeeperStats && (
          <View style={styles.foodKeeperStats}>
            <Text style={styles.foodKeeperTitle}>🌐 FoodKeeper 데이터베이스</Text>
            <Text style={styles.foodKeeperText}>
              • 총 {foodKeeperStats.totalProducts}개 식재료 지원{'\n'}
              • USDA 공식 데이터{'\n'}
              • 한국 식재료 30개 + 서양 식재료 537개
            </Text>
          </View>
        )}
      </View>

      {/* 만료됨 */}
      {renderSection('만료됨', foodGroups.expired, '🚨', '#F44336')}

      {/* 긴급 (D-day, D-1) */}
      {renderSection('긴급', foodGroups.urgent, '⚠️', '#FF5722')}

      {/* 주의 (D-2, D-3) */}
      {renderSection('주의', foodGroups.warning, '⏰', '#FFC107')}

      {/* 여유 */}
      {renderSection('여유', foodGroups.safe, '✅', '#4CAF50')}
    </ScrollView>
  );
};

/**
 * 목업 식재료 로드 (개발용)
 * FoodKeeper 데이터 기반으로 다양한 식재료 생성
 * TODO: Firestore 연동 시 제거
 */
async function loadMockFoodItems(): Promise<FoodItem[]> {
  const userId = 'mock_user_id';
  const now = new Date();

  // 한국 식재료 + FoodKeeper 식재료 혼합
  const mockItems = [
    // 한국 식재료 (긴급)
    FridgeService.createFoodItem(userId, {
      name: '우유',
      purchaseDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      category: '유제품',
      storageCondition: '냉장'
    }),
    FridgeService.createFoodItem(userId, {
      name: '돼지고기',
      purchaseDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      category: '육류',
      storageCondition: '냉장'
    }),
    
    // 한국 식재료 (주의)
    FridgeService.createFoodItem(userId, {
      name: '토마토',
      purchaseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      category: '채소',
      storageCondition: '냉장'
    }),
    FridgeService.createFoodItem(userId, {
      name: '양파',
      purchaseDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      category: '채소',
      storageCondition: '냉장'
    }),
    
    // FoodKeeper 식재료 (여유)
    FridgeService.createFoodItem(userId, {
      name: 'Apples',
      purchaseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      category: '과일',
      storageCondition: '냉장'
    }),
    FridgeService.createFoodItem(userId, {
      name: 'Butter',
      purchaseDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      category: '유제품',
      storageCondition: '냉장'
    }),
    FridgeService.createFoodItem(userId, {
      name: 'Carrots',
      purchaseDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      category: '채소',
      storageCondition: '냉장'
    }),
    
    // 만료된 항목
    FridgeService.createFoodItem(userId, {
      name: '상추',
      purchaseDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      category: '채소',
      storageCondition: '냉장'
    }),
  ];

  console.log(`📦 Mock data loaded: ${mockItems.length} items`);
  mockItems.forEach(item => {
    const daysLeft = FridgeService.getDaysLeft(item);
    console.log(`  - ${item.name}: ${daysLeft}일 남음`);
  });

  return mockItems;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121'
  },
  statsButton: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600'
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 80
  },
  statDanger: {
    backgroundColor: '#FFEBEE'
  },
  statWarning: {
    backgroundColor: '#FFF3E0'
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4
  },
  statNumberDanger: {
    color: '#F44336'
  },
  statNumberWarning: {
    color: '#FF9800'
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  foodKeeperStats: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12
  },
  foodKeeperTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 8
  },
  foodKeeperText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 20
  },
  section: {
    padding: 16,
    paddingTop: 8
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121'
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 60
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
});

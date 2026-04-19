import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { Room, Furniture } from '@/types/house.types';
import { LifeObject } from '@/types/lifeobject.types';
import { FoodItem } from '@/modules/fridge/types';
import { FridgeService } from '@/modules/fridge/FridgeService';
import { FoodItemCard } from '@/modules/fridge/components/FoodItemCard';
import { getLifeObjects } from '@/services/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { foodKeeperLoader } from '@/modules/fridge/data/external/FoodKeeperLoader';

interface FridgeTabProps {
  furniture: Furniture;
  room: Room;
  onDataUpdate: () => void;
}

interface FridgeInventorySummary {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  categoryStats: { [key: string]: number };
}

export const FridgeTab: React.FC<FridgeTabProps> = ({
  furniture,
  room,
  onDataUpdate,
}) => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fridgeItems, setFridgeItems] = useState<FoodItem[]>([]);
  const [summary, setSummary] = useState<FridgeInventorySummary>({
    totalItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    categoryStats: {},
  });
  
  // 식재료 추가 관련 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  
  useEffect(() => {
    loadFridgeData();
  }, [furniture.id, userId]);

  const loadFridgeData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // 이 냉장고에 연결된 LifeObject들 가져오기
      const allObjects = await getLifeObjects(userId, 'food');
      const linkedFoodObjects = allObjects.filter((obj) =>
        furniture.linkedObjectIds.includes(obj.id)
      );

      // LifeObject를 FoodItem으로 변환 (타입 체크)
      const foodItems: FoodItem[] = linkedFoodObjects
        .filter(obj => obj.type === 'food')
        .map(obj => ({
          ...obj,
          type: 'food' as const,
          metadata: obj.metadata as any, // FoodMetadata로 캐스팅
        }));

      // 요약 정보 계산
      const expiringItems = FridgeService.getExpiringItems(foodItems, 3);
      const expiredItems = FridgeService.getExpiredItems(foodItems);
      const categoryStats = FridgeService.getCategoryStats(foodItems);

      setFridgeItems(foodItems);
      setSummary({
        totalItems: foodItems.length,
        expiringItems: expiringItems.length,
        expiredItems: expiredItems.length,
        categoryStats,
      });
    } catch (error) {
      console.error('Failed to load fridge data:', error);
      Alert.alert('오류', '냉장고 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // FoodKeeper 데이터에서 검색
      await foodKeeperLoader.load();
      const results = FridgeService.searchFoodNames(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const handleSelectFood = (foodData: any) => {
    setSelectedFood(foodData);
    setSearchResults([]);
    setSearchQuery(foodData.name || foodData);
  };

  const handleAddFood = async () => {
    if (!selectedFood || !userId) return;

    try {
      setLoading(true);
      
      // FoodItem 생성
      const foodName = typeof selectedFood === 'string' ? selectedFood : selectedFood.name;
      const newFoodItem = FridgeService.createFoodItem(userId, {
        name: foodName,
      });

      // TODO: LifeObject로 저장하고 가구에 연결하는 로직 추가
      // 현재는 임시로 상태만 업데이트
      setFridgeItems(prev => [...prev, newFoodItem]);
      
      // 모달 닫기
      setShowAddModal(false);
      setSearchQuery('');
      setSelectedFood(null);
      
      Alert.alert('완료', '식재료가 추가되었습니다.');
      
      // 데이터 새로고침
      onDataUpdate();
    } catch (error) {
      console.error('Failed to add food:', error);
      Alert.alert('오류', '식재료 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFood = async (updatedFood: FoodItem) => {
    try {
      // TODO: 실제 LifeObject 업데이트 로직 추가
      setFridgeItems(prev => 
        prev.map(item => item.id === updatedFood.id ? updatedFood : item)
      );
      
      // 요약 정보 재계산
      const expiringItems = FridgeService.getExpiringItems(fridgeItems, 3);
      const expiredItems = FridgeService.getExpiredItems(fridgeItems);
      const categoryStats = FridgeService.getCategoryStats(fridgeItems);
      
      setSummary({
        totalItems: fridgeItems.length,
        expiringItems: expiringItems.length,
        expiredItems: expiredItems.length,
        categoryStats,
      });
    } catch (error) {
      console.error('Failed to update food:', error);
      Alert.alert('오류', '식재료 업데이트에 실패했습니다.');
    }
  };

  const handleRemoveFood = async (foodId: string) => {
    try {
      // TODO: 실제 LifeObject 삭제 로직 추가
      setFridgeItems(prev => prev.filter(item => item.id !== foodId));
      Alert.alert('완료', '식재료가 삭제되었습니다.');
      onDataUpdate();
    } catch (error) {
      console.error('Failed to remove food:', error);
      Alert.alert('오류', '식재료 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>냉장고 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  const groupedItems = FridgeService.groupByUrgency(fridgeItems);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 재고 현황 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>재고 현황</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.totalItems}</Text>
              <Text style={styles.summaryLabel}>전체</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.warning }]}>
                {summary.expiringItems}
              </Text>
              <Text style={styles.summaryLabel}>임박</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.error }]}>
                {summary.expiredItems}
              </Text>
              <Text style={styles.summaryLabel}>만료</Text>
            </View>
          </View>
        </View>

        {/* 유통기한 임박 알림 */}
        {summary.expiringItems > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ 유통기한 임박</Text>
            <Text style={styles.warningText}>
              {summary.expiringItems}개 식재료의 유통기한이 3일 이내입니다.
            </Text>
          </View>
        )}

        {/* 식재료 목록 */}
        {Object.entries(groupedItems).map(([urgency, items]) => {
          if (items.length === 0) return null;
          
          const urgencyColors = {
            expired: Colors.error,
            urgent: Colors.warning,
            warning: Colors.warning + '80',
            safe: Colors.success,
          };
          
          const urgencyLabels = {
            expired: '만료됨',
            urgent: '긴급 (1-2일)',
            warning: '주의 (3-7일)',
            safe: '안전',
          };
          
          return (
            <View key={urgency} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {urgencyLabels[urgency as keyof typeof urgencyLabels]} ({items.length})
                </Text>
                <View 
                  style={[
                    styles.urgencyIndicator, 
                    { backgroundColor: urgencyColors[urgency as keyof typeof urgencyColors] }
                  ]} 
                />
              </View>
              {items.map((item: any) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                />
              ))}
            </View>
          );
        })}

        {/* 빈 상태 */}
        {fridgeItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🧊</Text>
            <Text style={styles.emptyTitle}>냉장고가 비어있습니다</Text>
            <Text style={styles.emptySubtext}>
              아래 버튼을 눌러 식재료를 추가해보세요.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 식재료 추가 버튼 */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ 식재료 추가</Text>
      </TouchableOpacity>

      {/* 식재료 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>식재료 추가</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.searchLabel}>식재료 검색</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="식재료 이름을 입력하세요"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />

            <ScrollView style={styles.searchResults}>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectFood(result)}
                >
                  <Text style={styles.searchResultText}>
                    {typeof result === 'string' ? result : result.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedFood && (
              <View style={styles.selectedFoodContainer}>
                <Text style={styles.selectedFoodLabel}>선택된 식재료:</Text>
                <Text style={styles.selectedFoodText}>
                  {typeof selectedFood === 'string' ? selectedFood : selectedFood.name}
                </Text>
                
                <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={handleAddFood}
                >
                  <Text style={styles.confirmButtonText}>냉장고에 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  summaryTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  warningCard: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningTitle: {
    ...Typography.h4,
    color: Colors.warning,
    marginBottom: Spacing.sm,
  },
  warningText: {
    ...Typography.body,
    color: Colors.warning,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1,
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalCloseText: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  searchLabel: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.veryLightGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  searchResults: {
    flex: 1,
    maxHeight: 200,
  },
  searchResultItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  searchResultText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  selectedFoodContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedFoodLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  selectedFoodText: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.label,
    color: Colors.white,
  },
});
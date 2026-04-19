import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing } from '@/constants';
import { HouseStackParamList } from '@/navigation/HouseNavigator';
import { HouseLayout, Room, Furniture, FurnitureType } from '@/types/house.types';
import { getHouseLayout } from '@/services/houseService';
import { useAuth } from '@/contexts/AuthContext';
import { FurnitureTasksTab } from './tabs/FurnitureTasksTab';
import { FridgeTab } from './tabs/FridgeTab';
import { BedTab } from './tabs/BedTab';
import { DeskTab } from './tabs/DeskTab';

type NavigationProp = StackNavigationProp<HouseStackParamList, 'FurnitureDetail'>;
type RouteProps = RNRouteProp<HouseStackParamList, 'FurnitureDetail'>;

interface FurnitureDetailScreenProps {
  route: RouteProps;
}

export const FurnitureDetailScreen: React.FC<FurnitureDetailScreenProps> = ({ route }) => {
  const { userId } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { roomId, furnitureId, furnitureType } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<HouseLayout | null>(null);
  const [furniture, setFurniture] = useState<Furniture | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  type TabType = 'task-info' | 'task-add' | 'fridge-inventory' | 'bed-overview' | 'bed-sleep' | 'bed-maintenance' | 'desk-overview' | 'desk-focus' | 'desk-equipment';
  const [activeTab, setActiveTab] = useState<TabType>('task-info');

  useEffect(() => {
    loadFurnitureData();
  }, [userId, furnitureId, roomId]);

  // 헤더 제목을 동적으로 설정
  useEffect(() => {
    if (furniture) {
      navigation.setOptions({
        title: `${furniture.emoji} ${furniture.name}`,
      });
    }
  }, [furniture, navigation]);

  const loadFurnitureData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const houseLayout = await getHouseLayout(userId);
      
      if (!houseLayout) {
        Alert.alert('오류', '집 구조를 찾을 수 없습니다.');
        navigation.goBack();
        return;
      }

      const targetRoom = houseLayout.rooms.find(r => r.id === roomId);
      if (!targetRoom) {
        Alert.alert('오류', '방을 찾을 수 없습니다.');
        navigation.goBack();
        return;
      }

      const targetFurniture = targetRoom.furnitures.find(f => f.id === furnitureId);
      if (!targetFurniture) {
        Alert.alert('오류', '가구를 찾을 수 없습니다.');
        navigation.goBack();
        return;
      }

      setLayout(houseLayout);
      setRoom(targetRoom);
      setFurniture(targetFurniture);
    } catch (error) {
      console.error('Failed to load furniture data:', error);
      Alert.alert('오류', '가구 정보를 불러오는데 실패했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // 가구 타입에 따른 탭 구조 생성
  const getTabs = (furnitureType: FurnitureType): { key: TabType; title: string }[] => {
    const baseTabs = [
      { key: 'task-info' as TabType, title: 'Task 확인' },
      { key: 'task-add' as TabType, title: 'Task 추가' },
    ];

    switch (furnitureType) {
      case 'fridge':
        return [
          ...baseTabs,
          { key: 'fridge-inventory' as TabType, title: '재고 관리' },
        ];
      
      case 'bed':
        return [
          ...baseTabs,
          { key: 'bed-overview' as TabType, title: '침대 정보' },
          { key: 'bed-sleep' as TabType, title: '수면 기록' },
          { key: 'bed-maintenance' as TabType, title: '관리' },
        ];
      
      case 'desk':
        return [
          ...baseTabs,
          { key: 'desk-overview' as TabType, title: '책상 정보' },
          { key: 'desk-focus' as TabType, title: '집중 세션' },
          { key: 'desk-equipment' as TabType, title: '장비 관리' },
        ];
      
      default:
        return baseTabs;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>가구 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!furniture || !room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>가구 정보를 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = getTabs(furnitureType);
  const shouldScroll = tabs.length > 4; // 4개 이상이면 스크롤

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab Bar */}
      <View style={styles.tabScrollView}>
        {shouldScroll ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScrollable}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabScrollable, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        <TabContentRenderer 
          activeTab={activeTab}
          furniture={furniture}
          room={room}
          furnitureType={furnitureType}
          onDataUpdate={loadFurnitureData}
        />
      </View>
    </SafeAreaView>
  );
};

// TabContentRenderer: 활성 탭에 따라 적절한 컨텐츠 렌더링
const TabContentRenderer: React.FC<{
  activeTab: TabType;
  furniture: Furniture;
  room: Room;
  furnitureType: FurnitureType;
  onDataUpdate: () => void;
}> = ({ activeTab, furniture, room, furnitureType, onDataUpdate }) => {
  switch (activeTab) {
    case 'task-info':
    case 'task-add':
      return (
        <FurnitureTasksTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
          initialTab={activeTab === 'task-info' ? 'info' : 'add'}
        />
      );
    
    case 'fridge-inventory':
      return (
        <FridgeTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
        />
      );
    
    case 'bed-overview':
    case 'bed-sleep':
    case 'bed-maintenance':
      const bedSection = activeTab.replace('bed-', '') as 'overview' | 'sleep' | 'maintenance';
      return (
        <BedTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
          initialSection={bedSection}
        />
      );
    
    case 'desk-overview':
    case 'desk-focus':
    case 'desk-equipment':
      const deskSection = activeTab.replace('desk-', '') as 'overview' | 'focus' | 'equipment';
      return (
        <DeskTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
          initialSection={deskSection}
        />
      );
    
    default:
      return (
        <ScrollView style={styles.tabContainer}>
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              해당 기능이 준비 중입니다
            </Text>
            <Text style={styles.placeholderSubtext}>
              {`${furniture.name} 관련 기능이 곧 추가될 예정입니다.`}
            </Text>
          </View>
        </ScrollView>
      );
  }
};

const FurnitureFeaturesTab: React.FC<{
  furniture: Furniture;
  room: Room;
  furnitureType: FurnitureType;
  onDataUpdate: () => void;
}> = ({ furniture, room, furnitureType, onDataUpdate }) => {
  // 가구 타입에 따라 적절한 탭 컴포넌트 렌더링
  switch (furnitureType) {
    case 'fridge':
      return (
        <FridgeTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
        />
      );
    
    case 'bed':
      return (
        <BedTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
        />
      );
    
    case 'desk':
      return (
        <DeskTab 
          furniture={furniture} 
          room={room} 
          onDataUpdate={onDataUpdate}
        />
      );
    
    default:
      return (
        <ScrollView style={styles.tabContainer}>
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              {getFurnitureFeatureTabName(furnitureType)}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {`${furniture.name} 전용 관리 기능이 곧 추가됩니다.`}
            </Text>
          </View>
        </ScrollView>
      );
  }
};

const getFurnitureFeatureTabName = (furnitureType: FurnitureType): string => {
  switch (furnitureType) {
    case 'fridge':
      return '재고 관리';
    case 'bed':
      return '수면 관리';
    case 'desk':
      return '학습/업무';
    case 'toilet':
    case 'bathtub':
    case 'shower':
      return '청소 관리';
    case 'washing_machine':
      return '세탁 관리';
    case 'closet':
      return '의류 관리';
    case 'plant':
      return '식물 관리';
    case 'tv':
    case 'sofa':
      return '사용 관리';
    default:
      return '기본 관리';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.label,
    color: Colors.white,
  },
  tabScrollView: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
    height: 44,
  },
  tabBar: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tab: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarScrollable: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xs,
  },
  tabScrollable: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  placeholderText: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  placeholderSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
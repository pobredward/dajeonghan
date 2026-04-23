import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '@/constants';
import { HouseLayout, Room, Furniture } from '@/types/house.types';
import { Task } from '@/types/task.types';
import { getHouseLayout } from '@/services/houseService';
import { getTasks } from '@/services/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { PulseEffect } from '@/components/AnimationEffects';
import { HouseStackParamList } from '@/navigation/HouseNavigator';

// furnitureId별 오늘/연체 task 개수
interface FurnitureTaskCounts {
  [furnitureId: string]: { today: number; overdue: number };
}

type NavigationProp = StackNavigationProp<HouseStackParamList, 'HouseMain'>;

interface ModalData {
  visible: boolean;
  item: { type: 'room'; room: Room } | null;
}


interface HouseMapScreenProps {
  layout?: HouseLayout;
}

export const HouseMapScreen: React.FC<HouseMapScreenProps> = ({ layout: propsLayout }) => {
  const { userId } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [layout, setLayout] = useState<HouseLayout | null>(propsLayout || null);
  const [modalData, setModalData] = useState<ModalData>({
    visible: false,
    item: null,
  });
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [furnitureTaskCounts, setFurnitureTaskCounts] = useState<FurnitureTaskCounts>({});

  
  
  // 캔버스 스케일 계산 (화면에 맞게)
  const canvasScale = React.useMemo(() => {
    if (!layout || !layout.canvasSize || containerSize.width === 0 || containerSize.height === 0) {
      return 1;
    }
    
    const padding = 40;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    
    const scaleX = availableWidth / layout.canvasSize.width;
    const scaleY = availableHeight / layout.canvasSize.height;
    
    return Math.min(scaleX, scaleY, 1);
  }, [containerSize, layout]);

  // 초기 로딩 및 userId 변경 시에만 로딩 표시
  useEffect(() => {
    if (propsLayout) {
      setLayout(propsLayout);
      setLoading(false);
    } else {
      loadHouseLayout(true);
    }
  }, [userId, propsLayout]);

  // 화면 포커스 시 task 카운트 로드
  useFocusEffect(
    React.useCallback(() => {
      if (userId && layout) {
        loadTaskCounts();
      }
    }, [userId, layout])
  );

  const loadTaskCounts = async () => {
    if (!userId) return;
    try {
      // 인덱스 없이 전체 pending task를 가져와 클라이언트에서 분류
      const allTasks = await getTasks(userId, { filter: { status: 'pending' } });

      // objectId → furnitureId 역방향 매핑 빌드 (layout의 linkedObjectIds 기반)
      const objectToFurniture: Record<string, string> = {};
      layout?.rooms?.forEach(room => {
        room.furnitures?.forEach(furniture => {
          furniture.linkedObjectIds?.forEach(objectId => {
            objectToFurniture[objectId] = furniture.id;
          });
        });
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const counts: FurnitureTaskCounts = {};
      allTasks.forEach((task: Task) => {
        const furnitureId = objectToFurniture[task.objectId];
        if (!furnitureId) return;

        if (!counts[furnitureId]) counts[furnitureId] = { today: 0, overdue: 0 };

        const nextDue = task.recurrence?.nextDue
          ? new Date(task.recurrence.nextDue)
          : null;

        if (nextDue) {
          if (nextDue < today) {
            counts[furnitureId].overdue += 1;
          } else if (nextDue < tomorrow) {
            counts[furnitureId].today += 1;
          }
        }
      });

      setFurnitureTaskCounts(counts);
    } catch (error) {
      console.error('Failed to load task counts:', error);
    }
  };

  const loadHouseLayout = async (forceReload = false) => {
    if (!userId) return;

    try {
      // 이미 레이아웃이 있고 강제 새로고침이 아니면 로딩 스킵
      if (layout && !forceReload) {
        return;
      }
      
      setLoading(true);
      const existingLayout = await getHouseLayout(userId);
      
      if (existingLayout) {
        setLayout(existingLayout);
      } else {
        navigation.navigate('HouseLayoutSelection');
      }
    } catch (error) {
      console.error('Failed to load house layout:', error);
      Alert.alert('오류', '집 구조를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  const handleRoomPress = (room: Room) => {
    setModalData({ visible: true, item: { type: 'room', room } });
  };

  const handleFurniturePress = (room: Room, furniture: Furniture) => {
    // 세부 페이지로 네비게이션
    navigation.navigate('FurnitureDetail', {
      roomId: room.id,
      furnitureId: furniture.id,
      furnitureType: furniture.type,
    });
  };

  const closeModal = () => {
    setModalData({ visible: false, item: null });
  };


  const renderRoom = (room: Room) => {
    if (!room || !layout) return null;
    
    return (
      <G key={room.id}>
        <Rect
          x={room.position.x}
          y={room.position.y}
          width={room.size.width}
          height={room.size.height}
          fill={room.color}
          stroke={Colors.darkGray}
          strokeWidth={2}
          rx={8}
          onPress={() => handleRoomPress(room)}
        />
        <SvgText
          x={room.position.x + room.size.width / 2}
          y={room.position.y + 20}
          fontSize="14"
          fill={Colors.textSecondary}
          textAnchor="middle"
          fontWeight="bold"
        >
          {room.name}
        </SvgText>

        {room.furnitures.map((furniture) => renderFurniture(room, furniture))}
      </G>
    );
  };

  const renderFurniture = (room: Room, furniture: Furniture) => {
    const hasDirt = furniture.dirtyScore > 30;
    const dirtOpacity = Math.min(furniture.dirtyScore / 100, 0.6);
    const counts = furnitureTaskCounts[furniture.id] ?? { today: 0, overdue: 0 };
    const hasOverdueTasks = counts.overdue > 0;

    const absoluteX = room.position.x + furniture.position.x;
    const absoluteY = room.position.y + furniture.position.y;
    const centerX = absoluteX + furniture.size.width / 2;
    const centerY = absoluteY + furniture.size.height / 2;

    return (
      <G key={furniture.id}>
        {/* 가구 배경 사각형 */}
        <Rect
          x={absoluteX}
          y={absoluteY}
          width={furniture.size.width}
          height={furniture.size.height}
          fill={Colors.surface}
          stroke={hasOverdueTasks ? Colors.error : Colors.primary}
          strokeWidth={hasOverdueTasks ? 3 : 2}
          rx={8}
          opacity={0.9}
          onPress={() => handleFurniturePress(room, furniture)}
        />

        {/* 먼지 효과 */}
        {hasDirt && (
          <Rect
            x={absoluteX}
            y={absoluteY}
            width={furniture.size.width}
            height={furniture.size.height}
            fill="#8B7355"
            rx={8}
            opacity={dirtOpacity}
          />
        )}

        {/* 연체 펄스 효과 */}
        {hasOverdueTasks && (
          <PulseEffect
            x={centerX}
            y={centerY}
            r={25}
            color={Colors.error}
            show={hasOverdueTasks}
          />
        )}

        {/* 연체 뱃지 (빨간 — 오른쪽 상단) */}
        {counts.overdue > 0 && (
          <>
            <Circle
              cx={absoluteX + furniture.size.width - 10}
              cy={absoluteY + 10}
              r={10}
              fill={Colors.error}
            />
            <SvgText
              x={absoluteX + furniture.size.width - 10}
              y={absoluteY + 14}
              fontSize="11"
              fill="white"
              textAnchor="middle"
              fontWeight="bold"
            >
              {counts.overdue}
            </SvgText>
          </>
        )}

        {/* 오늘 뱃지 (주황 — 연체 뱃지 아래 or 단독 오른쪽 상단) */}
        {counts.today > 0 && (
          <>
            <Circle
              cx={absoluteX + furniture.size.width - 10}
              cy={counts.overdue > 0 ? absoluteY + 28 : absoluteY + 10}
              r={10}
              fill="#FF8C00"
            />
            <SvgText
              x={absoluteX + furniture.size.width - 10}
              y={counts.overdue > 0 ? absoluteY + 32 : absoluteY + 14}
              fontSize="11"
              fill="white"
              textAnchor="middle"
              fontWeight="bold"
            >
              {counts.today}
            </SvgText>
          </>
        )}
      </G>
    );
  };

  const renderCharacter = () => {
    if (!layout) return null;
    
    const charX = layout.character.position.x;
    const charY = layout.character.position.y;
    return (
      <G onPress={() => Alert.alert('알림', '캐릭터 클릭!')}>
        <Circle
          cx={charX}
          cy={charY}
          r={30}
          fill="transparent"
          stroke="transparent"
          strokeWidth={0}
        />
      </G>
    );
  };

  const getModalContent = () => {
    if (!modalData.item) return null;

    // furniture 모달 제거 - FurnitureDetailScreen으로 대체됨

    if (modalData.item.type === 'room') {
      const { room } = modalData.item;
      const totalTasks = room.furnitures.reduce(
        (sum, f) => sum + f.linkedObjectIds.length,
        0
      );

      return (
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>{room.name}</Text>
              <Text style={styles.modalSubtitle}>
                가구 {room.furnitures.length}개 · 할 일 {totalTasks}개
              </Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.taskList}>
            {room.furnitures.map((furniture) => (
              <TouchableOpacity
                key={furniture.id}
                style={styles.taskItem}
                onPress={() => handleFurniturePress(room, furniture)}
              >
                <Text style={styles.furnitureEmoji}>{furniture.emoji}</Text>
                <Text style={styles.taskText}>{furniture.name}</Text>
                {furniture.linkedObjectIds.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {furniture.linkedObjectIds.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    return null;
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>집 구조 불러오는 중...</Text>
      </View>
    );
  }

  if (!layout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>집 구조가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View 
        style={styles.mapContainer}
        onLayout={(e) => {
          setContainerSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          });
        }}
      >
        <View style={styles.mapWrapper}>
          {layout ? (
            <View style={{ 
              transform: [{ scale: canvasScale }],
              alignSelf: 'center',
            }}>
              <Svg
                width={layout.canvasSize.width}
                height={layout.canvasSize.height}
                viewBox={`0 0 ${layout.canvasSize.width} ${layout.canvasSize.height}`}
              >
                <Rect
                  x={0}
                  y={0}
                  width={layout.canvasSize.width}
                  height={layout.canvasSize.height}
                  fill="#F5F5DC"
                  stroke={Colors.lightGray}
                  strokeWidth={2}
                />

                {layout?.rooms?.map(renderRoom) || null}
                {renderCharacter()}
              </Svg>

              {/* 가구 레이블 - Animated.View 내부로 이동 */}
              {layout?.rooms?.map((room) =>
                room?.furnitures?.map((furniture) => {
                  if (!room?.position || !furniture?.position || !furniture?.size) return null;
                  
                  const absX = room.position.x + furniture.position.x + furniture.size.width / 2;
                  const absY = room.position.y + furniture.position.y + furniture.size.height / 2;
                  return (
                    <View
                      key={`label-${furniture.id}`}
                      style={[
                        styles.furnitureLabel,
                        { left: absX - 15, top: absY - 15 },
                      ]}
                    >
                      <TouchableOpacity onPress={() => handleFurniturePress(room, furniture)}>
                        <Text style={styles.furnitureEmojiLabel}>{furniture.emoji}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }) || []
              )?.flat() || []}

              {/* 캐릭터 레이블 */}
              {layout?.character?.position && (
                <View
                  key="character-label"
                  style={[
                    styles.furnitureLabel,
                    { 
                      left: layout.character.position.x - 20, 
                      top: layout.character.position.y - 20 
                    },
                  ]}
                >
                  <TouchableOpacity onPress={() => Alert.alert('알림', '캐릭터 클릭!')}>
                    <Text style={styles.furnitureEmojiLabel}>🧑</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noLayoutContainer}>
              <Text style={styles.noLayoutText}>집 구조를 설정해주세요</Text>
              <TouchableOpacity 
                style={styles.setupButton}
                onPress={() => navigation.navigate('HouseLayoutSelection')}
              >
                <Text style={styles.setupButtonText}>집 구조 설정하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={modalData.visible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {getModalContent()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  editButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  furnitureLabel: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  furnitureEmojiLabel: {
    fontSize: 24,
    pointerEvents: 'auto',
  },
  characterLabel: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  characterEmoji: {
    fontSize: 40,
    pointerEvents: 'auto',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '90%',
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalContent: {
    padding: Spacing.md,
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalEmoji: {
    fontSize: 36,
    marginRight: Spacing.sm,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.veryLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  warningBox: {
    backgroundColor: Colors.secondaryLight,
    padding: Spacing.sm,
    borderRadius: 6,
    marginBottom: Spacing.sm,
  },
  warningText: {
    fontSize: 12,
    color: Colors.secondaryDark,
    fontWeight: '600',
  },
  taskList: {
    flex: 1,
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  taskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: Spacing.xs,
  },
  furnitureEmoji: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  taskText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  overdueText: {
    color: Colors.error,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 6,
    backgroundColor: Colors.veryLightGray,
    alignItems: 'center',
  },
  largeButton: {
    paddingVertical: Spacing.md,
  },
  actionButtonText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  customizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  // 탭 스타일
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: Colors.veryLightGray,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Task 템플릿 모달 스타일
  templateItem: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  templateItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  templateItemCategory: {
    fontSize: 10,
    color: Colors.accent,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  templateItemDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  templateItemFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  templateItemMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  // Task 커스터마이징 모달 스타일
  formSection: {
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  formValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    padding: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
  },
  recurrenceOption: {
    padding: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recurrenceOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  recurrenceOptionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  // 새로운 주기 설정 스타일
  recurrenceTypeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  recurrenceTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
    backgroundColor: Colors.veryLightGray,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recurrenceTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  recurrenceTypeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  recurrenceTypeTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
  },
  intervalLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  intervalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  intervalButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalButtonText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '700',
  },
  intervalInput: {
    width: 50,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
  },
  timeInput: {
    width: 60,
    height: 36,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeColon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  // 날짜 선택 스타일
  dateAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dateAdjustButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
    alignItems: 'center',
  },
  dateAdjustButtonText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dateDisplay: {
    flex: 1.5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  dateDisplaySubtext: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.9,
  },
  // 요일 선택 스타일
  dayPickerRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: Colors.veryLightGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  dayButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dayPickerHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // 미리보기 스타일
  previewBox: {
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
    padding: Spacing.sm,
  },
  previewText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  // 집 구조 없을 때 스타일
  noLayoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noLayoutText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  setupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  setupButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});

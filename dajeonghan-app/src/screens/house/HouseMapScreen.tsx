import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  PanResponder,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '@/constants';
import { HouseLayout, Room, Furniture } from '@/types/house.types';
import { LifeObject } from '@/types/lifeobject.types';
import { Task } from '@/types/task.types';
import { getLifeObjects, getTasks } from '@/services/firestoreService';
import { getHouseLayout } from '@/services/houseService';
import { useAuth } from '@/contexts/AuthContext';
import { DustParticles, PulseEffect } from '@/components/AnimationEffects';
import { HouseStackParamList } from '@/navigation/HouseNavigator';

type NavigationProp = StackNavigationProp<HouseStackParamList, 'HouseMain'>;

interface ModalData {
  visible: boolean;
  item: { type: 'room'; room: Room } | null;
}

interface FurnitureWithData extends Furniture {
  linkedObjects: LifeObject[];
  linkedTasks: Task[];
  calculatedDirtyScore: number;
}

export const HouseMapScreen: React.FC = () => {
  const { userId } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [layout, setLayout] = useState<HouseLayout | null>(null);
  const [modalData, setModalData] = useState<ModalData>({
    visible: false,
    item: null,
  });
  const [furnitureDataMap, setFurnitureDataMap] = useState<Map<string, FurnitureWithData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  
  // 캔버스 스케일 계산 (화면에 맞게)
  const canvasScale = React.useMemo(() => {
    if (!layout || containerSize.width === 0 || containerSize.height === 0) return 1;
    
    const padding = 40;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    
    const scaleX = availableWidth / layout.canvasSize.width;
    const scaleY = availableHeight / layout.canvasSize.height;
    
    return Math.min(scaleX, scaleY, 1);
  }, [containerSize, layout]);

  // 초기 로딩 및 userId 변경 시에만 로딩 표시
  useEffect(() => {
    loadHouseLayout(true);
  }, [userId]);

  // 화면이 포커스될 때 가구 데이터만 조용히 새로고침
  useFocusEffect(
    React.useCallback(() => {
      if (layout) {
        loadFurnitureData(false); // 로딩 없이 가구 데이터만 업데이트
      }
    }, [layout])
  );

  useEffect(() => {
    if (layout) {
      loadFurnitureData(true); // 첫 로드 시에만 로딩 표시
    }
  }, [layout, userId]);

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

  const loadFurnitureData = async (showLoading = false) => {
    if (!userId || !layout) return;

    try {
      console.log('loadFurnitureData 호출됨');
      if (showLoading) {
        setLoading(true);
      }
      const dataMap = new Map<string, FurnitureWithData>();

      // 모든 LifeObject와 Task 가져오기
      const allObjects = await getLifeObjects(userId);
      const allTasks = await getTasks(userId);
      console.log('전체 Task 개수:', allTasks.length);

      // 각 가구에 대해 데이터 연결
      for (const room of layout.rooms) {
        for (const furniture of room.furnitures) {
          const linkedObjects = allObjects.filter((obj) =>
            furniture.linkedObjectIds.includes(obj.id)
          );

          const linkedTasks = allTasks.filter((task) =>
            furniture.linkedObjectIds.includes(task.objectId)
          );
          
          console.log(`가구 ${furniture.name} (${furniture.id}):`, {
            linkedObjectIds: furniture.linkedObjectIds,
            linkedTasksCount: linkedTasks.length
          });

          // dirtyScore 계산
          const now = new Date();
          const overdueTasks = linkedTasks.filter(
            (task) => task.recurrence.nextDue && new Date(task.recurrence.nextDue) < now
          );

          let calculatedDirtyScore = 0;
          overdueTasks.forEach((task) => {
            if (task.recurrence.nextDue) {
              const daysOverdue = Math.floor(
                (now.getTime() - new Date(task.recurrence.nextDue).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              calculatedDirtyScore += Math.min(daysOverdue * 10, 50);
            }
          });

          dataMap.set(furniture.id, {
            ...furniture,
            linkedObjects,
            linkedTasks,
            calculatedDirtyScore: Math.min(calculatedDirtyScore, 100),
          });
        }
      }

      setFurnitureDataMap(dataMap);
    } catch (error) {
      console.error('Failed to load furniture data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
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
    const furnitureData = furnitureDataMap.get(furniture.id);
    const hasDirt = (furnitureData?.calculatedDirtyScore || furniture.dirtyScore) > 30;
    const dirtOpacity = Math.min((furnitureData?.calculatedDirtyScore || furniture.dirtyScore) / 100, 0.6);
    const taskCount = furnitureData?.linkedTasks.length || furniture.linkedObjectIds.length;
    const hasOverdueTasks = furnitureData?.linkedTasks.some(
      (task) => task.recurrence.nextDue && new Date(task.recurrence.nextDue) < new Date()
    ) || false;

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
          <>
            <Rect
              x={absoluteX}
              y={absoluteY}
              width={furniture.size.width}
              height={furniture.size.height}
              fill="#8B7355"
              rx={8}
              opacity={dirtOpacity}
            />
            <DustParticles x={centerX} y={centerY} show={hasDirt} />
          </>
        )}

        {/* 연체 작업 펄스 효과 */}
        {hasOverdueTasks && (
          <PulseEffect
            x={centerX}
            y={centerY}
            r={25}
            color={Colors.error}
            show={hasOverdueTasks}
          />
        )}

        {/* 작업 개수 뱃지 */}
        {taskCount > 0 && (
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
              fontSize="12"
              fill="white"
              textAnchor="middle"
              fontWeight="bold"
            >
              {taskCount}
            </SvgText>
          </>
        )}
      </G>
    );
  };

  const renderCharacter = () => {
    const charX = layout.character.position.x;
    const charY = layout.character.position.y;
    return (
      <G onPress={() => alert('캐릭터 클릭!')}>
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

    if (modalData.item.type === 'furniture') {
      const { furniture, room } = modalData.item;
      const furnitureData = furnitureDataMap.get(furniture.id);
      const linkedTasks = furnitureData?.linkedTasks || [];
      const linkedObjects = furnitureData?.linkedObjects || [];
      const dirtyScore = furnitureData?.calculatedDirtyScore || furniture.dirtyScore;

      return (
        <View style={styles.modalContent}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalEmoji}>{furniture.emoji}</Text>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>{furniture.name}</Text>
              <Text style={styles.modalSubtitle}>
                {room.name} · {linkedTasks.length > 0 ? `할 일 ${linkedTasks.length}개` : '할 일 없음'}
              </Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 탭 바 */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.tabActive]}
              onPress={() => {
                setActiveTab('info');
                setTaskAddState({ step: null, selectedTemplate: null });
              }}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
                Task 확인
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'add' && styles.tabActive]}
              onPress={handleShowTaskTemplates}
            >
              <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>
                Task 추가
              </Text>
            </TouchableOpacity>
          </View>

          {/* 탭 컨텐츠 */}
          {activeTab === 'info' ? (
            // Task 확인 탭
            <>
              {dirtyScore > 30 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    🧹 청소가 필요해요 (더러움 {Math.round(dirtyScore)}%)
                  </Text>
                </View>
              )}

              <ScrollView style={styles.taskList}>
                {linkedObjects.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>연결된 항목 ({linkedObjects.length})</Text>
                    {linkedObjects.map((obj) => (
                      <View key={obj.id} style={styles.taskItem}>
                        <Text style={styles.furnitureEmoji}>
                          {obj.type === 'food' ? '🥗' : obj.type === 'cleaning' ? '🧹' : '💊'}
                        </Text>
                        <Text style={styles.taskText}>{obj.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {linkedTasks.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>할 일 ({linkedTasks.length})</Text>
                    {linkedTasks.map((task) => (
                      <View key={task.id} style={styles.taskItem}>
                        <View style={styles.taskCheckbox} />
                        <Text style={styles.taskText}>
                          {task.title}
                          {task.recurrence.nextDue && new Date(task.recurrence.nextDue) < new Date() && (
                            <Text style={styles.overdueText}> (연체)</Text>
                          )}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {linkedTasks.length === 0 && linkedObjects.length === 0 && (
                  <Text style={styles.emptyText}>연결된 항목이 없어요. Task 추가 탭에서 추가해보세요!</Text>
                )}
              </ScrollView>
            </>
          ) : (
            // Task 추가 탭
            <>
              {taskAddState.step === 'customize' ? (
                // 커스터마이징 화면
                <>
                  <View style={styles.customizeHeader}>
                    <TouchableOpacity 
                      onPress={handleBackToTemplates}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>← </Text>
                    </TouchableOpacity>
                    <View style={styles.modalHeaderText}>
                      <Text style={styles.modalTitle}>{taskAddState.selectedTemplate?.title}</Text>
                      <Text style={styles.modalSubtitle}>주기 설정</Text>
                    </View>
                  </View>

                  <ScrollView style={styles.taskList}>
                    {/* 시작일 선택 */}
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>📅 시작일</Text>
                      
                      {/* 날짜 조정 버튼 */}
                      <View style={styles.dateAdjustRow}>
                        <TouchableOpacity
                          style={styles.dateAdjustButton}
                          onPress={() => {
                            const newDate = new Date(startDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setStartDate(newDate);
                          }}
                        >
                          <Text style={styles.dateAdjustButtonText}>◀ 하루 전</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.dateDisplay}>
                          <Text style={styles.dateDisplayText}>
                            {startDate.toLocaleDateString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric',
                            })}
                          </Text>
                          <Text style={styles.dateDisplaySubtext}>
                            {startDate.toLocaleDateString('ko-KR', { weekday: 'short' })}
                            {startDate.toDateString() === new Date().toDateString() && '(오늘)'}
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.dateAdjustButton}
                          onPress={() => {
                            const newDate = new Date(startDate);
                            newDate.setDate(newDate.getDate() + 1);
                            setStartDate(newDate);
                          }}
                        >
                          <Text style={styles.dateAdjustButtonText}>하루 후 ▶</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 시간 설정 */}
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>⏰ 알림 시간 (선택)</Text>
                      <View style={styles.timeRow}>
                        <TextInput
                          style={styles.timeInput}
                          placeholder="09"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <Text style={styles.timeColon}>:</Text>
                        <TextInput
                          style={styles.timeInput}
                          placeholder="00"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                      </View>
                    </View>

                    {/* 주기 타입 선택 */}
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>🔄 반복 주기</Text>
                      <View style={styles.recurrenceTypeRow}>
                        <TouchableOpacity
                          style={[
                            styles.recurrenceTypeButton,
                            taskCustomization.recurrenceType === 'daily' && styles.recurrenceTypeButtonActive
                          ]}
                          onPress={() => {
                            setTaskCustomization({ ...taskCustomization, recurrenceType: 'daily', interval: 1 });
                            setSelectedDays([]);
                          }}
                        >
                          <Text style={[
                            styles.recurrenceTypeText,
                            taskCustomization.recurrenceType === 'daily' && styles.recurrenceTypeTextActive
                          ]}>매일</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.recurrenceTypeButton,
                            taskCustomization.recurrenceType === 'weekly' && styles.recurrenceTypeButtonActive
                          ]}
                          onPress={() => setTaskCustomization({ ...taskCustomization, recurrenceType: 'weekly', interval: 1 })}
                        >
                          <Text style={[
                            styles.recurrenceTypeText,
                            taskCustomization.recurrenceType === 'weekly' && styles.recurrenceTypeTextActive
                          ]}>매주</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.recurrenceTypeButton,
                            taskCustomization.recurrenceType === 'monthly' && styles.recurrenceTypeButtonActive
                          ]}
                          onPress={() => {
                            setTaskCustomization({ ...taskCustomization, recurrenceType: 'monthly', interval: 1 });
                            setSelectedDays([]);
                          }}
                        >
                          <Text style={[
                            styles.recurrenceTypeText,
                            taskCustomization.recurrenceType === 'monthly' && styles.recurrenceTypeTextActive
                          ]}>매월</Text>
                        </TouchableOpacity>
                      </View>

                      {/* 간격 설정 */}
                      {taskCustomization.recurrenceType !== 'custom' && (
                        <View style={styles.intervalRow}>
                          <Text style={styles.intervalLabel}>
                            {taskCustomization.recurrenceType === 'daily' ? '일마다' :
                             taskCustomization.recurrenceType === 'weekly' ? '주마다' : '개월마다'}
                          </Text>
                          <View style={styles.intervalInputContainer}>
                            <TouchableOpacity
                              style={styles.intervalButton}
                              onPress={() => {
                                const newInterval = Math.max(1, (taskCustomization.interval || 1) - 1);
                                setTaskCustomization({ ...taskCustomization, interval: newInterval });
                              }}
                            >
                              <Text style={styles.intervalButtonText}>−</Text>
                            </TouchableOpacity>
                            <TextInput
                              style={styles.intervalInput}
                              value={String(taskCustomization.interval || 1)}
                              onChangeText={(text) => {
                                const num = parseInt(text) || 1;
                                setTaskCustomization({ ...taskCustomization, interval: Math.max(1, Math.min(30, num)) });
                              }}
                              keyboardType="number-pad"
                              maxLength={2}
                            />
                            <TouchableOpacity
                              style={styles.intervalButton}
                              onPress={() => {
                                const newInterval = Math.min(30, (taskCustomization.interval || 1) + 1);
                                setTaskCustomization({ ...taskCustomization, interval: newInterval });
                              }}
                            >
                              <Text style={styles.intervalButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* 요일 선택 (매주 타입일 때만) */}
                    {taskCustomization.recurrenceType === 'weekly' && (
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>📆 반복 요일 (선택)</Text>
                        <View style={styles.dayPickerRow}>
                          {[
                            { day: 0 as DayOfWeek, label: '일' },
                            { day: 1 as DayOfWeek, label: '월' },
                            { day: 2 as DayOfWeek, label: '화' },
                            { day: 3 as DayOfWeek, label: '수' },
                            { day: 4 as DayOfWeek, label: '목' },
                            { day: 5 as DayOfWeek, label: '금' },
                            { day: 6 as DayOfWeek, label: '토' },
                          ].map(({ day, label }) => (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.dayButton,
                                selectedDays.includes(day) && styles.dayButtonActive
                              ]}
                              onPress={() => toggleDayOfWeek(day)}
                            >
                              <Text style={[
                                styles.dayButtonText,
                                selectedDays.includes(day) && styles.dayButtonTextActive
                              ]}>{label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <Text style={styles.dayPickerHint}>
                          {selectedDays.length === 0 
                            ? '요일을 선택하지 않으면 시작일 기준으로 매주 반복됩니다.' 
                            : `선택한 요일: ${selectedDays.map(d => ['일','월','화','수','목','금','토'][d]).join(', ')}`}
                        </Text>
                      </View>
                    )}

                    {/* 다음 일정 미리보기 */}
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>🔮 다음 일정 미리보기</Text>
                      <View style={styles.previewBox}>
                        {getNextOccurrences(3).map((date, index) => (
                          <Text key={index} style={styles.previewText}>
                            {index + 1}. {date.toLocaleDateString('ko-KR', { 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.largeButton]}
                      onPress={handleBackToTemplates}
                    >
                      <Text style={styles.actionButtonText}>뒤로</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.largeButton, styles.primaryButton]}
                      onPress={handleConfirmTask}
                    >
                      <Text style={[styles.actionButtonText, styles.primaryButtonText]}>추가</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // 템플릿 선택 화면
                <>
                  <ScrollView style={styles.taskList}>
                    {(() => {
                      const template = getTemplateByFurnitureType(furniture.type);
                      
                      if (!template || template.tasks.length === 0) {
                        return (
                          <Text style={styles.emptyText}>
                            이 가구에 대한 추천 Task가 없습니다.
                          </Text>
                        );
                      }

                      return template.tasks.map((task) => (
                        <TouchableOpacity
                          key={task.id}
                          style={styles.templateItem}
                          onPress={() => handleSelectTemplate(task)}
                        >
                          <View style={styles.templateItemHeader}>
                            <Text style={styles.templateItemTitle}>{task.title}</Text>
                            <Text style={styles.templateItemCategory}>{task.category}</Text>
                          </View>
                          <Text style={styles.templateItemDescription}>
                            {task.description}
                          </Text>
                          <View style={styles.templateItemFooter}>
                            <Text style={styles.templateItemMeta}>
                              ⏱️ {task.estimatedMinutes}분
                            </Text>
                            <Text style={styles.templateItemMeta}>
                              🔄 {task.defaultRecurrence.type === 'daily' ? '매일' :
                                  task.defaultRecurrence.type === 'weekly' ? `${task.defaultRecurrence.interval || 1}주마다` :
                                  task.defaultRecurrence.type === 'monthly' ? `${task.defaultRecurrence.interval || 1}개월마다` :
                                  `${task.defaultRecurrence.interval}일마다`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ));
                    })()}
                  </ScrollView>
                </>
              )}
            </>
          )}
        </View>
      );
    }

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

  const getTotalTasks = () => {
    let total = 0;
    furnitureDataMap.forEach((data) => {
      total += data.linkedTasks.length;
    });
    return total;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>데이터 불러오는 중...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>집 구조 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (!layout) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Text style={styles.loadingText}>집 구조가 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 내 집</Text>
        <View style={styles.headerStats}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('HouseEditor', { layout })} 
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>✏️ 편집</Text>
          </TouchableOpacity>
        </View>
      </View>

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

              {layout.rooms.map(renderRoom)}
              {renderCharacter()}
            </Svg>

            {/* 가구 레이블 - Animated.View 내부로 이동 */}
            {layout.rooms.map((room) =>
              room.furnitures.map((furniture) => {
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
              })
            )}

            {/* 캐릭터 레이블 */}
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
              <TouchableOpacity onPress={() => alert('캐릭터 클릭!')}>
                <Text style={styles.furnitureEmojiLabel}>🧑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickSummary}>
        <Text style={styles.summaryTitle}>오늘 할 일</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={styles.summaryText}>전체 {getTotalTasks()}개</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>🏠</Text>
            <Text style={styles.summaryText}>{layout.rooms.length}개 방</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>🪑</Text>
            <Text style={styles.summaryText}>
              {layout.rooms.reduce((sum, r) => sum + r.furnitures.length, 0)}개 가구
            </Text>
          </View>
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
    </SafeAreaView>
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
  quickSummary: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  furnitureEmojiLabel: {
    fontSize: 24,
  },
  characterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  characterEmoji: {
    fontSize: 40,
  },
  quickSummary: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  summaryTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryIcon: {
    fontSize: 24,
  },
  summaryText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
});

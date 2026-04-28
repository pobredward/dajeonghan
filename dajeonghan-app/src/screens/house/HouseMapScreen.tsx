import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  PanResponder,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '@/constants';
import { HouseLayout, Room, Furniture, FurnitureType, FURNITURE_DEFAULTS } from '@/types/house.types';
import { Task } from '@/types/task.types';
import { getHouseLayout, saveHouseLayout } from '@/services/houseService';
import { getTasks } from '@/services/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { PulseEffect } from '@/components/AnimationEffects';
import { HouseStackParamList } from '@/navigation/HouseNavigator';
import { useHouseEditor } from '@/hooks/useHouseEditor';

// furnitureId별 오늘/연체 task 개수 및 실시간 dirtyScore
interface FurnitureTaskCounts {
  [furnitureId: string]: { today: number; overdue: number; dirtyScore: number };
}

// furnitureId 시드 기반 결정론적 먼지 파티클 생성
// dirtyScore 구간: 0~14 → 0개, 15~29 → 1~2개, 30~59 → 3~7개, 60~79 → 8~11개, 80~100 → 12~15개
function getDustParticles(
  furnitureId: string,
  dirtyScore: number,
  w: number,
  h: number
): Array<{ x: number; y: number; r: number; opacity: number }> {
  if (dirtyScore < 15) return [];

  let count: number;
  if (dirtyScore < 30) {
    count = 4 + Math.floor(((dirtyScore - 15) / 15) * 3); // 4~7개
  } else if (dirtyScore < 60) {
    count = 8 + Math.floor(((dirtyScore - 30) / 30) * 7); // 8~15개
  } else if (dirtyScore < 80) {
    count = 16 + Math.floor(((dirtyScore - 60) / 20) * 6); // 16~22개
  } else {
    count = 23 + Math.floor(((dirtyScore - 80) / 20) * 7); // 23~30개
  }

  const seed = furnitureId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: count }, (_, i) => {
    const pseudo1 = (seed * (i + 1) * 9301 + 49297) % 233280;
    const pseudo2 = (seed * (i + 7) * 1103 + 12345) % 233280;
    return {
      x: (pseudo1 / 233280) * (w - 10) + 5,
      y: (pseudo2 / 233280) * (h - 10) + 5,
      r: 1.2 + (i % 3) * 0.7,
      opacity: 0.25 + (dirtyScore / 100) * 0.5,
    };
  });
}

type NavigationProp = StackNavigationProp<HouseStackParamList, 'HouseMain'>;

interface HouseMapScreenProps {
  layout?: HouseLayout;
}

export const HouseMapScreen: React.FC<HouseMapScreenProps> = ({ layout: propsLayout }) => {
  const { userId } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [viewLayout, setViewLayout] = useState<HouseLayout | null>(propsLayout || null);
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [furnitureTaskCounts, setFurnitureTaskCounts] = useState<FurnitureTaskCounts>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // 캔버스 View의 화면 절대 좌표 — 터치 pageX/pageY를 캔버스 좌표로 변환하는 데 사용
  const canvasOriginRef = useRef({ x: 0, y: 0 });
  // 캔버스 외부 탭 감지용 (스크롤 드래그와 단순 탭 구분)
  const isScrollingRef = useRef(false);

  
  
  // 편집 훅 — viewLayout이 없을 때는 더미 레이아웃으로 초기화 (훅은 조건부 호출 불가)
  const DUMMY_LAYOUT: HouseLayout = {
    id: '', userId: '', layoutType: 'custom', totalRooms: 0,
    canvasSize: { width: 600, height: 600 }, rooms: [],
    character: { position: { x: 50, y: 50 }, emoji: '🧑' },
    createdAt: new Date(), updatedAt: new Date(),
  };
  const editor = useHouseEditor(viewLayout ?? DUMMY_LAYOUT);

  // 편집 모드 진입 시 최신 viewLayout을 편집 훅에 동기화하고 이전 편집 상태 초기화
  useEffect(() => {
    if (isEditMode && viewLayout) {
      editor.resetState(viewLayout);
    }
  }, [isEditMode]);

  // 캔버스 스케일 - 현재 표시 레이아웃(뷰 or 편집) 기준
  const activeLayout = isEditMode ? editor.layout : viewLayout;

  const MIN_CANVAS_SCALE = 0.4;
  const MAX_CANVAS_SCALE = 1.5;
  const ZOOM_STEP = 0.1;

  const calcAutoScale = useCallback(() => {
    if (!activeLayout?.canvasSize || containerSize.width === 0 || containerSize.height === 0) {
      return 1;
    }
    const padding = 40;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    const scaleX = availableWidth / activeLayout.canvasSize.width;
    const scaleY = availableHeight / activeLayout.canvasSize.height;
    return Math.max(Math.min(scaleX, scaleY, 1), MIN_CANVAS_SCALE);
  }, [containerSize, activeLayout]);

  const [canvasScale, setCanvasScale] = useState(() => calcAutoScale());

  useEffect(() => {
    setCanvasScale(calcAutoScale());
  }, [containerSize.width, containerSize.height, activeLayout?.canvasSize?.width, activeLayout?.canvasSize?.height]);

  const handleZoomIn = () => {
    setCanvasScale((prev) => Math.min(MAX_CANVAS_SCALE, Math.round((prev + ZOOM_STEP) * 10) / 10));
  };

  const handleZoomOut = () => {
    setCanvasScale((prev) => Math.max(MIN_CANVAS_SCALE, Math.round((prev - ZOOM_STEP) * 10) / 10));
  };

  // 저장 함수를 ref로 관리 — 매 렌더마다 최신 editor.layout을 참조하도록 갱신
  const handleSaveEditRef = useRef<() => Promise<void>>(async () => {});

  const handleSaveEdit = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await saveHouseLayout(editor.layout);
      setViewLayout(editor.layout);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save layout:', error);
      Alert.alert('오류', '집 구조를 저장하는데 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 매 렌더마다 최신 함수로 ref 갱신 (stale closure 방지)
  handleSaveEditRef.current = handleSaveEdit;

  // 헤더 설정 — 편집 모드일 때 취소/저장 버튼 표시
  useLayoutEffect(() => {
    if (isEditMode) {
      navigation.setOptions({
        title: '편집 중',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => setIsEditMode(false)}
            style={{ marginLeft: 16 }}
          >
            <Text style={{ color: Colors.primary, fontSize: 16 }}>취소</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => handleSaveEditRef.current?.()}
            disabled={isSaving}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 16 }}>
              {isSaving ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        title: '내 집',
        headerLeft: undefined,
        headerRight: undefined,
      });
    }
  }, [isEditMode, isSaving]);

  // 초기 로딩 및 userId 변경 시에만 로딩 표시
  useEffect(() => {
    if (propsLayout) {
      setViewLayout(propsLayout);
      setLoading(false);
    } else {
      loadHouseLayout(true);
    }
  }, [userId, propsLayout]);

  // 화면 포커스 시 task 카운트 로드
  useFocusEffect(
    React.useCallback(() => {
      if (userId && viewLayout) {
        loadTaskCounts();
      }
    }, [userId, viewLayout])
  );

  const loadTaskCounts = async () => {
    if (!userId) return;
    try {
      // 인덱스 없이 전체 pending task를 가져와 클라이언트에서 분류
      const allTasks = await getTasks(userId, { filter: { status: 'pending' } });

      // objectId → furnitureId 역방향 매핑 빌드 (viewLayout의 linkedObjectIds 기반)
      const objectToFurniture: Record<string, string> = {};
      viewLayout?.rooms?.forEach(room => {
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
      const now = new Date();

      allTasks.forEach((task: Task) => {
        const furnitureId = objectToFurniture[task.objectId];
        if (!furnitureId) return;

        if (!counts[furnitureId]) counts[furnitureId] = { today: 0, overdue: 0, dirtyScore: 0 };

        const nextDue = task.recurrence?.nextDue
          ? new Date(task.recurrence.nextDue)
          : null;

        if (nextDue) {
          if (nextDue < today) {
            counts[furnitureId].overdue += 1;
            // 연체 Task 1개당 기본 15점 + 연체 일수당 5점(최대 30점) 누적
            const daysOverdue = Math.floor(
              (now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24)
            );
            const taskScore = 15 + Math.min(daysOverdue * 5, 30);
            counts[furnitureId].dirtyScore = Math.min(
              counts[furnitureId].dirtyScore + taskScore,
              100
            );
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
      if (viewLayout && !forceReload) {
        return;
      }
      
      setLoading(true);
      const existingLayout = await getHouseLayout(userId);
      
      if (existingLayout) {
        setViewLayout(existingLayout);
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


  const handleFurniturePress = (room: Room, furniture: Furniture) => {
    // 세부 페이지로 네비게이션
    navigation.navigate('FurnitureDetail', {
      roomId: room.id,
      furnitureId: furniture.id,
      furnitureType: furniture.type,
    });
  };

  const renderRoom = (room: Room) => {
    if (!room || !activeLayout) return null;
    const isSelected = isEditMode && editor.selectedItem?.type === 'room' && editor.selectedItem.id === room.id;
    const isResizingRoom = isEditMode && editor.selectedItem?.type === 'room_resize' && editor.selectedItem.id === room.id;

    return (
      <G key={room.id}>
        <Rect
          x={room.position.x}
          y={room.position.y}
          width={room.size.width}
          height={room.size.height}
          fill={room.color}
          stroke={isSelected || isResizingRoom ? Colors.primary : Colors.darkGray}
          strokeWidth={isSelected || isResizingRoom ? 3 : 2}
          rx={8}
          onPress={() => isEditMode && editor.handleRoomPress(room.id)}
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

        {/* 편집 모드 - 방 선택 시 리사이즈 핸들 */}
        {isSelected && (
          <>
            <Rect x={room.position.x + room.size.width * 0.3} y={room.position.y - 5} width={room.size.width * 0.4} height={10} fill={Colors.accent} opacity={0.8} rx={3} onPress={() => editor.startResizeRoom(room.id, 'top')} />
            <Rect x={room.position.x + room.size.width - 5} y={room.position.y + room.size.height * 0.3} width={10} height={room.size.height * 0.4} fill={Colors.accent} opacity={0.8} rx={3} onPress={() => editor.startResizeRoom(room.id, 'right')} />
            <Rect x={room.position.x + room.size.width * 0.3} y={room.position.y + room.size.height - 5} width={room.size.width * 0.4} height={10} fill={Colors.accent} opacity={0.8} rx={3} onPress={() => editor.startResizeRoom(room.id, 'bottom')} />
            <Rect x={room.position.x - 5} y={room.position.y + room.size.height * 0.3} width={10} height={room.size.height * 0.4} fill={Colors.accent} opacity={0.8} rx={3} onPress={() => editor.startResizeRoom(room.id, 'left')} />
          </>
        )}
      </G>
    );
  };

  const renderFurniture = (room: Room, furniture: Furniture) => {
    const counts = furnitureTaskCounts[furniture.id] ?? { today: 0, overdue: 0, dirtyScore: 0 };
    const hasOverdueTasks = counts.overdue > 0;
    const isSelectedFurniture = isEditMode && editor.selectedItem?.type === 'furniture' && editor.selectedItem.roomId === room.id && editor.selectedItem.id === furniture.id;
    // counts 항목이 존재하면(Task가 있으면) 실시간 계산값 우선, 없으면 Firestore 저장값
    const dirtyScore = furniture.id in furnitureTaskCounts
      ? counts.dirtyScore
      : (furniture.dirtyScore ?? 0);
    const dustParticles = getDustParticles(
      furniture.id,
      dirtyScore,
      furniture.size.width,
      furniture.size.height
    );
    const showDirtyLabel = furniture.size.width > 60 && dirtyScore >= 15;

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
          stroke={isSelectedFurniture ? Colors.accent : hasOverdueTasks ? Colors.error : Colors.primary}
          strokeWidth={isSelectedFurniture || hasOverdueTasks ? 3 : 2}
          rx={8}
          opacity={0.9}
          onPress={() => isEditMode ? editor.handleFurniturePress(room.id, furniture.id) : handleFurniturePress(room, furniture)}
        />

        {/* 먼지 파티클 — furnitureId 시드 기반 결정론적 좌표로 고정 */}
        {dustParticles.map((p, idx) => (
          <Circle
            key={`dust-${furniture.id}-${idx}`}
            cx={absoluteX + p.x}
            cy={absoluteY + p.y}
            r={p.r}
            fill="#8B6914"
            opacity={p.opacity}
          />
        ))}

        {/* 더러움 퍼센트 텍스트 (가구 너비 충분할 때만) */}
        {showDirtyLabel && (
          <SvgText
            x={centerX}
            y={absoluteY + furniture.size.height - 6}
            fontSize="9"
            fill="#8B6914"
            textAnchor="middle"
            fontWeight="bold"
            opacity={0.85}
          >
            {`${Math.round(dirtyScore)}%`}
          </SvgText>
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
    if (!activeLayout) return null;
    
    const charX = activeLayout.character.position.x;
    const charY = activeLayout.character.position.y;
    const isSelected = isEditMode && editor.selectedItem?.type === 'character';
    return (
      <G onPress={() => !isEditMode && Alert.alert('알림', '캐릭터 클릭!')}>
        {isSelected && (
          <Circle cx={charX} cy={charY} r={30} fill="transparent" stroke={Colors.accent} strokeWidth={3} />
        )}
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>집 구조 불러오는 중...</Text>
      </View>
    );
  }

  if (!viewLayout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>집 구조가 없습니다.</Text>
      </View>
    );
  }

  const displayLayout = activeLayout ?? viewLayout;

  const ResizeBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.resizeEdgeBtn} onPress={onPress}>
      <Text style={styles.resizeEdgeBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderFurnitureMenu = () => {
    const categories = [
      { name: '주방', types: ['fridge', 'sink', 'stove'] as FurnitureType[] },
      { name: '침실', types: ['bed', 'closet', 'dresser', 'drawer'] as FurnitureType[] },
      { name: '욕실', types: ['toilet', 'bathtub', 'shower', 'mirror'] as FurnitureType[] },
      { name: '거실', types: ['sofa', 'tv', 'table', 'plant'] as FurnitureType[] },
      { name: '서재', types: ['desk', 'chair', 'bookshelf'] as FurnitureType[] },
      { name: '기타', types: ['washing_machine'] as FurnitureType[] },
    ];
    return (
      <Modal visible={editor.showFurnitureMenu} animationType="none" transparent onRequestClose={() => editor.setShowFurnitureMenu(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.furnitureMenuContainer}>
            <View style={styles.furnitureMenuHeader}>
              <Text style={styles.furnitureMenuTitle}>가구 추가</Text>
              <TouchableOpacity onPress={() => editor.setShowFurnitureMenu(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.furnitureMenuScroll}>
              {categories.map((cat) => (
                <View key={cat.name} style={styles.furnitureCategory}>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  <View style={styles.furnitureGrid}>
                    {cat.types.map((type) => {
                      const defaults = FURNITURE_DEFAULTS[type];
                      return (
                        <TouchableOpacity key={type} style={styles.furnitureButton} onPress={() => editor.selectedRoomForFurniture && editor.handleAddFurniture(editor.selectedRoomForFurniture, type)}>
                          <Text style={styles.furnitureMenuEmoji}>{defaults.emoji}</Text>
                          <Text style={styles.furnitureName}>{editor.getFurnitureName(type)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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
        onTouchEnd={() => {
          if (
            isEditMode &&
            !isScrollingRef.current &&
            !editor.isDraggingRoom &&
            !editor.isDraggingFurniture &&
            !editor.isDraggingCharacter &&
            !editor.isResizing &&
            editor.selectedItem
          ) {
            editor.setSelectedItem(null);
          }
        }}
      >
        {/* 캔버스 리사이즈 모드 상단바 */}
        {isEditMode && editor.isCanvasResizeMode && (
          <View style={styles.resizeInfoBar}>
            <Text style={styles.resizeInfoText}>
              너비: {editor.layout.canvasSize.width}px  |  높이: {editor.layout.canvasSize.height}px
            </Text>
            <TouchableOpacity style={styles.resizeDoneBtn} onPress={() => editor.setIsCanvasResizeMode(false)}>
              <Text style={styles.resizeDoneBtnText}>완료</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 양방향 스크롤: 수직 ScrollView > 수평 ScrollView */}
        <ScrollView
          style={styles.mapScrollOuter}
          contentContainerStyle={styles.mapScrollOuterContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={!editor.isDraggingRoom && !editor.isDraggingFurniture && !editor.isDraggingCharacter && !editor.isResizing}
          onScrollBeginDrag={() => { isScrollingRef.current = true; }}
          onScrollEndDrag={() => { setTimeout(() => { isScrollingRef.current = false; }, 50); }}
          onMomentumScrollEnd={() => { isScrollingRef.current = false; }}
        >
          <ScrollView
            horizontal
            style={styles.mapScrollInner}
            contentContainerStyle={styles.mapScrollInnerContent}
            showsHorizontalScrollIndicator={true}
            scrollEnabled={!editor.isDraggingRoom && !editor.isDraggingFurniture && !editor.isDraggingCharacter && !editor.isResizing}
            onScrollBeginDrag={() => { isScrollingRef.current = true; }}
            onScrollEndDrag={() => { setTimeout(() => { isScrollingRef.current = false; }, 50); }}
            onMomentumScrollEnd={() => { isScrollingRef.current = false; }}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              {/* 캔버스 리사이즈 모드: 위쪽 버튼 */}
              {isEditMode && editor.isCanvasResizeMode && (
                <View style={styles.resizeEdgeTop}>
                  <ResizeBtn label="↑+" onPress={() => editor.handleCanvasSizeChange('top', -50)} />
                  <ResizeBtn label="↑-" onPress={() => editor.handleCanvasSizeChange('top', 50)} />
                </View>
              )}

              <View style={{ flexDirection: 'row' }}>
                {/* 캔버스 리사이즈 모드: 왼쪽 버튼 */}
                {isEditMode && editor.isCanvasResizeMode && (
                  <View style={styles.resizeEdgeLeft}>
                    <ResizeBtn label="←+" onPress={() => editor.handleCanvasSizeChange('left', -50)} />
                    <ResizeBtn label="←-" onPress={() => editor.handleCanvasSizeChange('left', 50)} />
                  </View>
                )}

                <View style={styles.mapWrapper}>
                  <View style={{
                    width: displayLayout.canvasSize.width * canvasScale,
                    height: displayLayout.canvasSize.height * canvasScale,
                  }}>
                    <View
                      style={{
                        position: 'absolute',
                        transform: [{ scale: canvasScale }],
                        left: -(displayLayout.canvasSize.width * (1 - canvasScale)) / 2,
                        top: -(displayLayout.canvasSize.height * (1 - canvasScale)) / 2,
                      }}
                      onLayout={(e) => {
                        // scale transform이 적용된 후 실제 화면 좌표 측정
                        e.target.measure((_x, _y, _w, _h, pageX, pageY) => {
                          canvasOriginRef.current = { x: pageX, y: pageY };
                        });
                      }}
                    >
                      <Svg
                        width={displayLayout.canvasSize.width}
                        height={displayLayout.canvasSize.height}
                        viewBox={`0 0 ${displayLayout.canvasSize.width} ${displayLayout.canvasSize.height}`}
                        onPress={() => isEditMode && editor.setSelectedItem(null)}
                      >
                        <Rect x={0} y={0} width={displayLayout.canvasSize.width} height={displayLayout.canvasSize.height} fill={isEditMode ? '#FAFAFA' : '#F5F5DC'} stroke={Colors.lightGray} strokeWidth={isEditMode ? 1 : 2} />
                        {displayLayout.rooms.map(renderRoom)}
                        {renderCharacter()}
                      </Svg>

                      {/* 가구 레이블 (뷰 모드) / 드래그 핸들 (편집 모드) */}
                      {displayLayout.rooms.map((room) =>
                        room?.furnitures?.map((furniture) => {
                          if (!room?.position || !furniture?.position || !furniture?.size) return null;
                          const absX = room.position.x + furniture.position.x + furniture.size.width / 2;
                          const absY = room.position.y + furniture.position.y + furniture.size.height / 2;

                          if (isEditMode) {
                            let hasMoved = false;
                            return (
                              <View
                                key={`label-${furniture.id}`}
                                style={[styles.furnitureLabel, { left: absX - 15, top: absY - 15 }]}
                                {...PanResponder.create({
                                  onStartShouldSetPanResponder: () => true,
                                  onMoveShouldSetPanResponder: () => true,
                                  onPanResponderGrant: (evt) => {
                                    hasMoved = false;
                                    editor.furnitureDragState.current = { active: true, roomId: room.id, furnitureId: furniture.id, startX: evt.nativeEvent.pageX, startY: evt.nativeEvent.pageY, initialX: furniture.position.x, initialY: furniture.position.y };
                                  },
                                  onPanResponderMove: (evt) => {
                                    const dx = Math.abs(evt.nativeEvent.pageX - editor.furnitureDragState.current.startX);
                                    const dy = Math.abs(evt.nativeEvent.pageY - editor.furnitureDragState.current.startY);
                                    if (dx > 5 || dy > 5) { hasMoved = true; if (!editor.isDraggingFurniture) editor.setIsDraggingFurniture(true); }
                                    if (editor.furnitureDragState.current.active && hasMoved) editor.handleFurnitureDrag(evt, room.id, furniture.id, canvasScale);
                                  },
                                  onPanResponderRelease: () => {
                                    if (!hasMoved) editor.handleFurniturePress(room.id, furniture.id);
                                    editor.setIsDraggingFurniture(false);
                                    editor.furnitureDragState.current.active = false;
                                    editor.furnitureDragState.current.roomId = null;
                                    editor.furnitureDragState.current.furnitureId = null;
                                  },
                                }).panHandlers}
                              >
                                <Text style={styles.furnitureEmojiLabel}>{furniture.emoji}</Text>
                              </View>
                            );
                          }

                          return (
                            <View key={`label-${furniture.id}`} style={[styles.furnitureLabel, { left: absX - 15, top: absY - 15 }]}>
                              <TouchableOpacity onPress={() => handleFurniturePress(room, furniture)}>
                                <Text style={styles.furnitureEmojiLabel}>{furniture.emoji}</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }) ?? []
                      ).flat()}

                      {/* 캐릭터 드래그 핸들 (편집 모드) */}
                      {isEditMode ? (
                        <View
                          key="character-drag-handle"
                          style={[styles.furnitureLabel, { left: editor.layout.character.position.x - 20, top: editor.layout.character.position.y - 20 }]}
                          {...PanResponder.create({
                            onStartShouldSetPanResponder: () => true,
                            onMoveShouldSetPanResponder: () => true,
                            onPanResponderGrant: (evt) => {
                              editor.characterDragState.current = { active: true, startX: evt.nativeEvent.pageX, startY: evt.nativeEvent.pageY, initialX: editor.layout.character.position.x, initialY: editor.layout.character.position.y };
                              editor.setIsDraggingCharacter(true);
                              editor.setSelectedItem({ type: 'character' });
                            },
                            onPanResponderMove: (evt) => { if (editor.characterDragState.current.active) editor.handleCharacterDrag(evt, canvasScale); },
                            onPanResponderRelease: () => { editor.setIsDraggingCharacter(false); editor.characterDragState.current.active = false; },
                          }).panHandlers}
                        >
                          <Text style={styles.furnitureEmojiLabel}>🧑</Text>
                        </View>
                      ) : (
                        displayLayout.character?.position && (
                          <View key="character-label" style={[styles.furnitureLabel, { left: displayLayout.character.position.x - 20, top: displayLayout.character.position.y - 20 }]}>
                            <TouchableOpacity onPress={() => Alert.alert('알림', '캐릭터 클릭!')}>
                              <Text style={styles.furnitureEmojiLabel}>🧑</Text>
                            </TouchableOpacity>
                          </View>
                        )
                      )}

                      {/* 방 드래그 핸들 (편집 모드, 선택된 방만) */}
                      {isEditMode && editor.layout.rooms.map((room) => {
                        const isSelected = editor.selectedItem?.type === 'room' && editor.selectedItem.id === room.id;
                        if (!isSelected) return null;

                        // 터치 좌표(pageX, pageY)를 캔버스 좌표로 변환 후 해당 방 내 가구 hit-test
                        const findTouchedFurniture = (pageX: number, pageY: number) => {
                          const canvasX = (pageX - canvasOriginRef.current.x) / canvasScale;
                          const canvasY = (pageY - canvasOriginRef.current.y) / canvasScale;
                          return room.furnitures.find((f) => {
                            const fx = room.position.x + f.position.x;
                            const fy = room.position.y + f.position.y;
                            return canvasX >= fx && canvasX <= fx + f.size.width &&
                                   canvasY >= fy && canvasY <= fy + f.size.height;
                          }) ?? null;
                        };

                        return (
                          <View
                            key={`drag-handle-${room.id}`}
                            style={[styles.roomDragHandle, { left: room.position.x, top: room.position.y, width: room.size.width, height: room.size.height }]}
                            {...PanResponder.create({
                              onStartShouldSetPanResponder: (evt) => {
                                // 가구 위를 터치한 경우 드래그 핸들이 이벤트를 가져가지 않음
                                const touched = findTouchedFurniture(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
                                if (touched) {
                                  editor.handleFurniturePress(room.id, touched.id);
                                  return false;
                                }
                                return true;
                              },
                              onMoveShouldSetPanResponder: () => true,
                              onPanResponderGrant: (evt) => {
                                editor.setIsDraggingRoom(true);
                                editor.roomDragState.current = { active: true, roomId: room.id, startX: evt.nativeEvent.pageX, startY: evt.nativeEvent.pageY, initialX: room.position.x, initialY: room.position.y };
                              },
                              onPanResponderMove: (evt) => { if (editor.roomDragState.current.active) editor.handleRoomDrag(evt, room.id, canvasScale); },
                              onPanResponderRelease: () => { editor.setIsDraggingRoom(false); editor.roomDragState.current.active = false; editor.roomDragState.current.roomId = null; },
                            }).panHandlers}
                          />
                        );
                      })}

                      {/* 방 리사이즈 핸들 (편집 모드, 선택된 방만) */}
                      {isEditMode && editor.layout.rooms.map((room) => {
                        const isSelected = editor.selectedItem?.type === 'room' && editor.selectedItem.id === room.id;
                        if (!isSelected) return null;
                        const handleWidth = Math.min(60, Math.round(30 / canvasScale));
                        const edges = [
                          { edge: 'top' as const, x: room.position.x + room.size.width * 0.3, y: room.position.y - handleWidth / 2, width: room.size.width * 0.4, height: handleWidth },
                          { edge: 'right' as const, x: room.position.x + room.size.width - handleWidth / 2, y: room.position.y + room.size.height * 0.3, width: handleWidth, height: room.size.height * 0.4 },
                          { edge: 'bottom' as const, x: room.position.x + room.size.width * 0.3, y: room.position.y + room.size.height - handleWidth / 2, width: room.size.width * 0.4, height: handleWidth },
                          { edge: 'left' as const, x: room.position.x - handleWidth / 2, y: room.position.y + room.size.height * 0.3, width: handleWidth, height: room.size.height * 0.4 },
                        ];
                        return edges.map(({ edge, x, y, width, height }) => (
                          <View
                            key={`resize-handle-${room.id}-${edge}`}
                            style={[styles.resizeHandle, { left: x, top: y, width, height }]}
                            {...PanResponder.create({
                              onStartShouldSetPanResponder: () => true,
                              onMoveShouldSetPanResponder: () => true,
                              onPanResponderGrant: (evt) => {
                                editor.setIsResizing(true);
                                editor.resizeDragState.current = { active: true, roomId: room.id, edge, startX: evt.nativeEvent.pageX, startY: evt.nativeEvent.pageY, initialX: room.position.x, initialY: room.position.y, initialWidth: room.size.width, initialHeight: room.size.height };
                              },
                              onPanResponderMove: (evt) => { if (editor.resizeDragState.current.active) editor.handleResizeRoomDrag(evt, room.id, edge, canvasScale); },
                              onPanResponderRelease: () => { editor.setIsResizing(false); editor.resizeDragState.current.active = false; editor.resizeDragState.current.roomId = null; editor.resizeDragState.current.edge = null; },
                            }).panHandlers}
                          >
                            <View style={[styles.resizeHandleVisual, edge === 'top' || edge === 'bottom' ? { width: '100%', height: 4 } : { width: 4, height: '100%' }]} />
                          </View>
                        ));
                      })}
                    </View>
                  </View>
                </View>

                {/* 캔버스 리사이즈 모드: 오른쪽 버튼 */}
                {isEditMode && editor.isCanvasResizeMode && (
                  <View style={styles.resizeEdgeRight}>
                    <ResizeBtn label="-→" onPress={() => editor.handleCanvasSizeChange('right', 50)} />
                    <ResizeBtn label="+→" onPress={() => editor.handleCanvasSizeChange('right', -50)} />
                  </View>
                )}
              </View>

              {/* 캔버스 리사이즈 모드: 아래쪽 버튼 */}
              {isEditMode && editor.isCanvasResizeMode && (
                <View style={styles.resizeEdgeBottom}>
                  <ResizeBtn label="↓-" onPress={() => editor.handleCanvasSizeChange('bottom', 50)} />
                  <ResizeBtn label="↓+" onPress={() => editor.handleCanvasSizeChange('bottom', -50)} />
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </ScrollView>

        {/* 편집 모드 - 선택된 방/가구 컨텍스트 액션 FAB */}
        {isEditMode && (
          <View style={styles.floatingButtonContainer}>
            {!editor.selectedItem && !editor.isCanvasResizeMode && (
              <>
                <TouchableOpacity style={styles.floatingButton} onPress={editor.handleAddRoom}>
                  <Text style={styles.floatingButtonIcon}>➕</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.floatingButton} onPress={() => { editor.setSelectedItem(null); editor.setIsCanvasResizeMode(true); }}>
                  <Text style={styles.floatingButtonIcon}>📐</Text>
                </TouchableOpacity>
              </>
            )}
            {editor.selectedItem?.type === 'room' && (
              <>
                <TouchableOpacity style={styles.floatingButton} onPress={() => {
                  const room = editor.layout.rooms.find(r => r.id === (editor.selectedItem as { type: 'room'; id: string }).id);
                  if (room) { editor.setSelectedRoomForFurniture(room.id); editor.setShowFurnitureMenu(true); }
                }}>
                  <Text style={styles.floatingButtonIcon}>🪑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.floatingButton} onPress={() => {
                  const room = editor.layout.rooms.find(r => r.id === (editor.selectedItem as { type: 'room'; id: string }).id);
                  if (room) editor.handleRenameRoom(room.id, room.name);
                }}>
                  <Text style={styles.floatingButtonIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.floatingButton, styles.floatingButtonDanger]} onPress={() => {
                  editor.handleDeleteRoom((editor.selectedItem as { type: 'room'; id: string }).id);
                }}>
                  <Text style={styles.floatingButtonIcon}>🗑️</Text>
                </TouchableOpacity>
              </>
            )}
            {editor.selectedItem?.type === 'furniture' && (
              <>
                <TouchableOpacity style={[styles.floatingButton, styles.floatingButtonDanger]} onPress={() => {
                  const sel = editor.selectedItem as { type: 'furniture'; roomId: string; id: string };
                  editor.handleDeleteFurniture(sel.roomId, sel.id);
                }}>
                  <Text style={styles.floatingButtonIcon}>🗑️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* 뷰 모드 - 연필 FAB */}
        {!isEditMode && (
          <TouchableOpacity
            style={styles.editFab}
            onPress={() => setIsEditMode(true)}
          >
            <Text style={styles.editFabText}>✏️</Text>
          </TouchableOpacity>
        )}

        {/* 줌 컨트롤 - 우하단 pill 형태 */}
        <View style={styles.zoomControlContainer}>
          <TouchableOpacity
            style={[styles.zoomButton, canvasScale <= MIN_CANVAS_SCALE && styles.zoomButtonDisabled]}
            onPress={handleZoomOut}
            disabled={canvasScale <= MIN_CANVAS_SCALE}
          >
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.zoomLabel}>{Math.round(canvasScale * 100)}%</Text>
          <TouchableOpacity
            style={[styles.zoomButton, canvasScale >= MAX_CANVAS_SCALE && styles.zoomButtonDisabled]}
            onPress={handleZoomIn}
            disabled={canvasScale >= MAX_CANVAS_SCALE}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 가구 추가 모달 */}
      {isEditMode && renderFurnitureMenu()}
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
  },
  mapScrollOuter: {
    flex: 1,
    width: '100%',
  },
  mapScrollOuterContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  mapScrollInner: {
    flexGrow: 0,
  },
  mapScrollInnerContent: {
    flexGrow: 0,
    paddingHorizontal: 20,
  },
  mapWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomControlContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.surface,
    lineHeight: 22,
  },
  zoomLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'center',
    fontSize: 13,
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
  // 편집 모드 스타일
  editFab: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1000,
  },
  editFabText: {
    fontSize: 22,
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.md,
    flexDirection: 'column',
    gap: Spacing.sm,
    zIndex: 1000,
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingButtonDanger: {
    backgroundColor: Colors.error,
  },
  floatingButtonIcon: {
    fontSize: 22,
  },
  // 캔버스 리사이즈 스타일
  resizeInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    zIndex: 100,
  },
  resizeInfoText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  resizeDoneBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  resizeDoneBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  resizeEdgeTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.veryLightGray,
  },
  resizeEdgeBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.veryLightGray,
  },
  resizeEdgeLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.veryLightGray,
  },
  resizeEdgeRight: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.veryLightGray,
  },
  resizeEdgeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  resizeEdgeBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  roomDragHandle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  resizeHandle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeHandleVisual: {
    backgroundColor: Colors.accent,
    borderRadius: 2,
    opacity: 0.8,
  },
  // 가구 추가 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  furnitureMenuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    paddingBottom: Spacing.lg,
  },
  furnitureMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  furnitureMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    fontSize: 20,
    color: Colors.textSecondary,
    padding: Spacing.xs,
  },
  furnitureMenuScroll: {
    flexGrow: 0,
  },
  furnitureCategory: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  furnitureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  furnitureButton: {
    width: 70,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 8,
  },
  furnitureMenuEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  furnitureName: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  characterEmoji: {
    fontSize: 40,
    pointerEvents: 'auto',
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

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  PanResponder,
} from 'react-native';
import Svg, { Rect, G, Text as SvgText, Circle } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing } from '@/constants';
import {
  HouseLayout,
  Room,
  Furniture,
  FurnitureType,
  FURNITURE_DEFAULTS,
  ROOM_COLORS,
} from '@/types/house.types';
import { saveHouseLayout } from '@/services/houseService';
import { HouseStackParamList } from '@/navigation/HouseNavigator';

type HouseEditorRouteProp = RouteProp<HouseStackParamList, 'HouseEditor'>;
type HouseEditorNavProp = StackNavigationProp<HouseStackParamList, 'HouseEditor'>;

interface Props {
  initialLayout?: HouseLayout;
  onSave?: (updatedLayout: HouseLayout) => Promise<void>;
  onCancel?: () => void;
}

type EditorMode = 'view' | 'move_furniture' | 'resize_room' | 'add_room' | 'add_furniture';
type SelectedItem = 
  | { type: 'room'; id: string } 
  | { type: 'furniture'; roomId: string; id: string } 
  | { type: 'room_resize'; id: string; edge: 'top' | 'right' | 'bottom' | 'left' } // 4개 모서리(변)
  | { type: 'character' }
  | null;

const ROOM_PADDING = 10;
const DEFAULT_ROOM_SIZE = 150;
const MIN_ROOM_SIZE = 40;
const SEARCH_STEP = 10;

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  gap: number = ROOM_PADDING,
): boolean {
  return (
    ax < bx + bw + gap &&
    ax + aw + gap > bx &&
    ay < by + bh + gap &&
    ay + ah + gap > by
  );
}

function findEmptyPosition(
  rooms: Room[],
  canvasWidth: number,
  canvasHeight: number,
): { position: { x: number; y: number }; size: { width: number; height: number } } {
  // 1단계: 기본 크기(150×150)로 빈 공간 탐색
  for (let size = DEFAULT_ROOM_SIZE; size >= MIN_ROOM_SIZE; size -= SEARCH_STEP) {
    for (let y = ROOM_PADDING; y + size <= canvasHeight - ROOM_PADDING; y += SEARCH_STEP) {
      for (let x = ROOM_PADDING; x + size <= canvasWidth - ROOM_PADDING; x += SEARCH_STEP) {
        const hasOverlap = rooms.some(r =>
          rectsOverlap(x, y, size, size, r.position.x, r.position.y, r.size.width, r.size.height),
        );
        if (!hasOverlap) {
          return { position: { x, y }, size: { width: size, height: size } };
        }
      }
    }
  }
  // 2단계: 완전 폴백 — 최소 크기로 좌상단 배치
  return { position: { x: ROOM_PADDING, y: ROOM_PADDING }, size: { width: MIN_ROOM_SIZE, height: MIN_ROOM_SIZE } };
}

export const HouseEditorScreen: React.FC<Props> = ({ initialLayout: propsLayout, onSave, onCancel }) => {
  const navigation = useNavigation<HouseEditorNavProp>();
  const route = useRoute<HouseEditorRouteProp>();
  
  const initialLayout = propsLayout ?? route.params?.layout;
  const [layout, setLayout] = useState<HouseLayout>(initialLayout);
  const [mode, setMode] = useState<EditorMode>('view');
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [showFurnitureMenu, setShowFurnitureMenu] = useState(false);
  const [selectedRoomForFurniture, setSelectedRoomForFurniture] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingRoom, setIsDraggingRoom] = useState(false);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false);
  const [isCanvasResizeMode, setIsCanvasResizeMode] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // 가구 이동 드래그 상태
  const furnitureDragState = useRef<{
    active: boolean;
    roomId: string | null;
    furnitureId: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    active: false,
    roomId: null,
    furnitureId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  
  // 캐릭터 이동 드래그 상태
  const characterDragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  
  // 방 이동 드래그 상태
  const roomDragState = useRef<{
    active: boolean;
    roomId: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    active: false,
    roomId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  
  // 방 크기 조절 드래그 상태
  const resizeDragState = useRef<{
    active: boolean;
    roomId: string | null;
    edge: 'top' | 'right' | 'bottom' | 'left' | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
  }>({
    active: false,
    roomId: null,
    edge: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0,
  });
  
  // 캔버스 스케일 - 초기값은 화면 크기에 맞게 자동 계산, 이후 사용자가 줌 버튼으로 조절
  const MIN_CANVAS_SCALE = 0.4;
  const MAX_CANVAS_SCALE = 1.5;
  const ZOOM_STEP = 0.1;

  const calcAutoScale = React.useCallback(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    const padding = 40;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    const scaleX = availableWidth / layout.canvasSize.width;
    const scaleY = availableHeight / layout.canvasSize.height;
    return Math.max(Math.min(scaleX, scaleY, 1), MIN_CANVAS_SCALE);
  }, [containerSize, layout.canvasSize]);

  const [canvasScale, setCanvasScale] = useState(() => calcAutoScale());

  // 컨테이너 크기나 캔버스 크기가 바뀌면 자동 계산값으로 리셋
  useEffect(() => {
    setCanvasScale(calcAutoScale());
  }, [containerSize.width, containerSize.height, layout.canvasSize.width, layout.canvasSize.height]);

  const handleZoomIn = () => {
    setCanvasScale((prev) => Math.min(MAX_CANVAS_SCALE, Math.round((prev + ZOOM_STEP) * 10) / 10));
  };

  const handleZoomOut = () => {
    setCanvasScale((prev) => Math.max(MIN_CANVAS_SCALE, Math.round((prev - ZOOM_STEP) * 10) / 10));
  };

  // 간소화된 가구 이동 - 버튼으로 제어
  const moveFurniture = (roomId: string, furnitureId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 10; // 10px씩 이동
    
    const updatedRooms = layout.rooms.map((room) => {
      if (room.id === roomId) {
        return {
          ...room,
          furnitures: room.furnitures.map((f) => {
            if (f.id === furnitureId) {
              let newX = f.position.x;
              let newY = f.position.y;

              switch (direction) {
                case 'up':
                  newY = Math.max(0, f.position.y - step);
                  break;
                case 'down':
                  newY = Math.min(room.size.height - f.size.height, f.position.y + step);
                  break;
                case 'left':
                  newX = Math.max(0, f.position.x - step);
                  break;
                case 'right':
                  newX = Math.min(room.size.width - f.size.width, f.position.x + step);
                  break;
              }

              return {
                ...f,
                position: { x: newX, y: newY },
              };
            }
            return f;
          }),
        };
      }
      return room;
    });

    setLayout({ ...layout, rooms: updatedRooms });
  };

  // 방 크기 조절 - 4개 모서리(변) 드래그 지원
  const startResizeRoom = (roomId: string, edge: 'top' | 'right' | 'bottom' | 'left') => {
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    setSelectedItem({ type: 'room_resize', id: roomId, edge });
  };

  // 방들이 겹치는지 확인하는 함수
  const checkRoomOverlap = (
    roomId: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): boolean => {
    // 다른 방들과 겹치는지 확인
    for (const otherRoom of layout.rooms) {
      if (otherRoom.id === roomId) continue; // 자기 자신은 제외

      const overlap = !(
        x + width <= otherRoom.position.x || // 왼쪽에 있음
        x >= otherRoom.position.x + otherRoom.size.width || // 오른쪽에 있음
        y + height <= otherRoom.position.y || // 위에 있음
        y >= otherRoom.position.y + otherRoom.size.height // 아래에 있음
      );

      if (overlap) return true;
    }
    return false;
  };

  // 방 이동
  const handleRoomDrag = (evt: any, roomId: string) => {
    if (!roomDragState.current.active) return;

    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    const deltaX = (evt.nativeEvent.pageX - roomDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - roomDragState.current.startY) / canvasScale;

    let newX = roomDragState.current.initialX + deltaX;
    let newY = roomDragState.current.initialY + deltaY;

    // 10px 단위로 스냅
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;

    // 캔버스 경계 확인
    newX = Math.max(0, Math.min(layout.canvasSize.width - room.size.width, newX));
    newY = Math.max(0, Math.min(layout.canvasSize.height - room.size.height, newY));

    // 다른 방과 겹치는지 확인
    if (checkRoomOverlap(roomId, newX, newY, room.size.width, room.size.height)) {
      return; // 겹치면 업데이트하지 않음
    }

    const updatedRooms = layout.rooms.map((r) =>
      r.id === roomId
        ? { ...r, position: { x: newX, y: newY } }
        : r
    );

    setLayout({ ...layout, rooms: updatedRooms });
  };

  // 가구 이동
  const handleFurnitureDrag = (evt: any, roomId: string, furnitureId: string) => {
    if (!furnitureDragState.current.active) return;

    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    const furniture = room.furnitures.find(f => f.id === furnitureId);
    if (!furniture) return;

    const deltaX = (evt.nativeEvent.pageX - furnitureDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - furnitureDragState.current.startY) / canvasScale;

    let newX = furnitureDragState.current.initialX + deltaX;
    let newY = furnitureDragState.current.initialY + deltaY;

    // 10px 단위로 스냅
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;

    // 방 내부 경계 확인
    newX = Math.max(0, Math.min(room.size.width - furniture.size.width, newX));
    newY = Math.max(0, Math.min(room.size.height - furniture.size.height, newY));

    const updatedRooms = layout.rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          furnitures: r.furnitures.map((f) =>
            f.id === furnitureId
              ? { ...f, position: { x: newX, y: newY } }
              : f
          ),
        };
      }
      return r;
    });

    setLayout({ ...layout, rooms: updatedRooms });
  };

  // 캐릭터 드래그 핸들러
  const handleCharacterDrag = (evt: any) => {
    if (!characterDragState.current.active) return;

    const deltaX = (evt.nativeEvent.pageX - characterDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - characterDragState.current.startY) / canvasScale;

    let newX = characterDragState.current.initialX + deltaX;
    let newY = characterDragState.current.initialY + deltaY;

    // 10px 단위로 스냅
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;

    // 캔버스 경계 체크
    if (newX < 0 || newY < 0 ||
        newX > layout.canvasSize.width ||
        newY > layout.canvasSize.height) {
      return;
    }

    setLayout({
      ...layout,
      character: {
        ...layout.character,
        position: { x: newX, y: newY },
      },
    });
  };

  const handleResizeRoomDrag = (evt: any, roomId: string, edge: 'top' | 'right' | 'bottom' | 'left') => {
    if (!resizeDragState.current.active || resizeDragState.current.edge !== edge) return;

    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    const deltaX = (evt.nativeEvent.pageX - resizeDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - resizeDragState.current.startY) / canvasScale;

    let newX = resizeDragState.current.initialX;
    let newY = resizeDragState.current.initialY;
    let newWidth = resizeDragState.current.initialWidth;
    let newHeight = resizeDragState.current.initialHeight;

    // 각 모서리(변)에 따라 한 방향으로만 크기 조절
    switch (edge) {
      case 'top': // 위쪽 모서리
        newY = resizeDragState.current.initialY + deltaY;
        newHeight = resizeDragState.current.initialHeight - deltaY;
        break;
      case 'right': // 오른쪽 모서리
        newWidth = resizeDragState.current.initialWidth + deltaX;
        break;
      case 'bottom': // 아래쪽 모서리
        newHeight = resizeDragState.current.initialHeight + deltaY;
        break;
      case 'left': // 왼쪽 모서리
        newX = resizeDragState.current.initialX + deltaX;
        newWidth = resizeDragState.current.initialWidth - deltaX;
        break;
    }

    // 10px 단위로 스냅
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;
    newWidth = Math.round(newWidth / 10) * 10;
    newHeight = Math.round(newHeight / 10) * 10;

    // 최소/최대 크기 제한
    newWidth = Math.max(100, Math.min(400, newWidth));
    newHeight = Math.max(100, Math.min(500, newHeight));

    // 위치 조정 (크기가 최소치에 도달했을 때 위치도 조정)
    if (edge === 'left') {
      newX = resizeDragState.current.initialX + resizeDragState.current.initialWidth - newWidth;
      newX = Math.round(newX / 10) * 10;
    }
    if (edge === 'top') {
      newY = resizeDragState.current.initialY + resizeDragState.current.initialHeight - newHeight;
      newY = Math.round(newY / 10) * 10;
    }

    // 캔버스 경계 체크
    if (newX < 0 || newY < 0 || 
        newX + newWidth > layout.canvasSize.width || 
        newY + newHeight > layout.canvasSize.height) {
      return; // 캔버스를 벗어나면 업데이트하지 않음
    }

    // 다른 방과 겹치는지 확인
    if (checkRoomOverlap(roomId, newX, newY, newWidth, newHeight)) {
      return; // 겹치면 업데이트하지 않음
    }

    // 가구가 방 밖으로 벗어나는지 확인
    const shrinkLeft = edge === 'left' ? newX - resizeDragState.current.initialX : 0;
    const shrinkTop  = edge === 'top'  ? newY - resizeDragState.current.initialY : 0;
    const furnitureBlocked = room.furnitures.some(f => {
      const relX = f.position.x - shrinkLeft;
      const relY = f.position.y - shrinkTop;
      return (
        relX < 0 ||
        relY < 0 ||
        relX + f.size.width > newWidth ||
        relY + f.size.height > newHeight
      );
    });
    if (furnitureBlocked) return; // 가구가 방 밖으로 나가면 리사이즈 차단

    const updatedRooms = layout.rooms.map((r) =>
      r.id === roomId
        ? { 
            ...r, 
            position: { x: newX, y: newY },
            size: { width: newWidth, height: newHeight } 
          }
        : r
    );

    setLayout({ ...layout, rooms: updatedRooms });
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave(layout);
      } else {
        await saveHouseLayout(layout);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
      Alert.alert('오류', '집 구조를 저장하는데 실패했습니다.');
    }
  };

  const handleCancel = () => {
    Alert.alert('편집 취소', '변경사항이 저장되지 않습니다. 취소하시겠습니까?', [
      { text: '계속 편집', style: 'cancel' },
      { text: '취소', style: 'destructive', onPress: () => {
        if (onCancel) {
          onCancel();
        } else {
          navigation.goBack();
        }
      }},
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '집 편집',
      headerLeft: () => (
        <TouchableOpacity onPress={handleCancel} style={{ marginLeft: 16 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>취소</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={{ marginRight: 16 }}>
          <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 16 }}>저장</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, layout]);

  const handleAddRoom = () => {
    Alert.prompt(
      '방 추가',
      '방 이름을 입력하세요',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '추가',
          onPress: (roomName?: string) => {
            const name = roomName?.trim() || `방 ${layout.rooms.length + 1}`;

            const { position, size } = findEmptyPosition(
              layout.rooms,
              layout.canvasSize.width,
              layout.canvasSize.height,
            );
            
            const newRoom: Room = {
              id: `room_${Date.now()}`,
              type: 'bedroom',
              name,
              position,
              size,
              color: ROOM_COLORS.bedroom,
              furnitures: [],
            };

            setLayout({
              ...layout,
              rooms: [...layout.rooms, newRoom],
              totalRooms: layout.rooms.length + 1,
            });
          },
        },
      ],
      'plain-text',
      `방 ${layout.rooms.length + 1}`
    );
  };

  const handleRenameRoom = (roomId: string, currentName: string) => {
    Alert.prompt(
      '방 이름 변경',
      '새로운 방 이름을 입력하세요',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '변경',
          onPress: (newName?: string) => {
            const name = newName?.trim() || currentName;
            const updatedRooms = layout.rooms.map((r) =>
              r.id === roomId ? { ...r, name } : r
            );
            setLayout({ ...layout, rooms: updatedRooms });
          },
        },
      ],
      'plain-text',
      currentName
    );
  };

  const CANVAS_MIN_SIZE = 400;
  const CANVAS_MAX_SIZE = 1200;

  /**
   * 캔버스 너비/높이를 특정 방향에서 delta만큼 변경한다.
   *
   * side = 'right'  : 오른쪽 경계를 줄임. 우측 끝에 방이 있으면 막힘.
   * side = 'left'   : 왼쪽 경계를 줄임. 모든 방을 delta만큼 왼쪽으로 이동. 왼쪽 여백이 없으면 막힘.
   * side = 'bottom' : 아래쪽 경계를 줄임. 하단 끝에 방이 있으면 막힘.
   * side = 'top'    : 위쪽 경계를 줄임. 모든 방을 delta만큼 위로 이동. 위쪽 여백이 없으면 막힘.
   *
   * delta > 0 이면 줄이기, delta < 0 이면 늘리기.
   */
  const handleCanvasSizeChange = (side: 'left' | 'right' | 'top' | 'bottom', delta: number) => {
    const currentWidth = layout.canvasSize.width;
    const currentHeight = layout.canvasSize.height;

    if (side === 'right') {
      // 오른쪽 경계 이동: 방의 우측 끝 이하로 못 줄임
      const targetWidth = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentWidth - delta));
      const minRequiredWidth = layout.rooms.reduce(
        (max, room) => Math.max(max, room.position.x + room.size.width),
        0,
      );
      const safeWidth = Math.max(minRequiredWidth, targetWidth);
      if (safeWidth === currentWidth) return;
      setLayout({ ...layout, canvasSize: { ...layout.canvasSize, width: safeWidth } });

    } else if (side === 'left') {
      // 왼쪽 경계 이동: 모든 방의 x를 shift하고 너비를 변경
      const targetWidth = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentWidth - delta));
      const widthDiff = currentWidth - targetWidth; // 양수 = 줄이기, 음수 = 늘리기

      if (widthDiff === 0) return;

      if (widthDiff > 0) {
        // 줄이기: 방이 왼쪽 여백만큼만 줄일 수 있음
        const minRoomX = layout.rooms.reduce(
          (min, room) => Math.min(min, room.position.x),
          Infinity,
        );
        const availableLeft = isFinite(minRoomX) ? minRoomX : currentWidth;
        const safeShift = Math.min(widthDiff, availableLeft);
        if (safeShift <= 0) return;
        const movedRooms = layout.rooms.map((room) => ({
          ...room,
          position: { ...room.position, x: room.position.x - safeShift },
        }));
        setLayout({ ...layout, canvasSize: { ...layout.canvasSize, width: currentWidth - safeShift }, rooms: movedRooms });
      } else {
        // 늘리기: 모든 방을 오른쪽으로 shift하고 너비 증가
        const shift = -widthDiff; // 양수
        const movedRooms = layout.rooms.map((room) => ({
          ...room,
          position: { ...room.position, x: room.position.x + shift },
        }));
        setLayout({ ...layout, canvasSize: { ...layout.canvasSize, width: targetWidth }, rooms: movedRooms });
      }

    } else if (side === 'bottom') {
      // 아래쪽 경계 이동: 방의 하단 끝 이하로 못 줄임
      const targetHeight = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentHeight - delta));
      const minRequiredHeight = layout.rooms.reduce(
        (max, room) => Math.max(max, room.position.y + room.size.height),
        0,
      );
      const safeHeight = Math.max(minRequiredHeight, targetHeight);
      if (safeHeight === currentHeight) return;
      setLayout({ ...layout, canvasSize: { ...layout.canvasSize, height: safeHeight } });

    } else {
      // 위쪽 경계 이동: 모든 방의 y를 shift하고 높이를 변경
      const targetHeight = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentHeight - delta));
      const heightDiff = currentHeight - targetHeight; // 양수 = 줄이기, 음수 = 늘리기

      if (heightDiff === 0) return;

      if (heightDiff > 0) {
        // 줄이기: 방이 위쪽 여백만큼만 줄일 수 있음
        const minRoomY = layout.rooms.reduce(
          (min, room) => Math.min(min, room.position.y),
          Infinity,
        );
        const availableTop = isFinite(minRoomY) ? minRoomY : currentHeight;
        const safeShift = Math.min(heightDiff, availableTop);
        if (safeShift <= 0) return;
        const movedRooms = layout.rooms.map((room) => ({
          ...room,
          position: { ...room.position, y: room.position.y - safeShift },
        }));
        setLayout({ ...layout, canvasSize: { ...layout.canvasSize, height: currentHeight - safeShift }, rooms: movedRooms });
      } else {
        // 늘리기: 모든 방을 아래로 shift하고 높이 증가
        const shift = -heightDiff; // 양수
        const movedRooms = layout.rooms.map((room) => ({
          ...room,
          position: { ...room.position, y: room.position.y + shift },
        }));
        setLayout({ ...layout, canvasSize: { ...layout.canvasSize, height: targetHeight }, rooms: movedRooms });
      }
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    Alert.alert(
      '방 삭제',
      '이 방을 삭제하시겠습니까? 방 안의 모든 가구도 함께 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setLayout({
              ...layout,
              rooms: layout.rooms.filter((r) => r.id !== roomId),
              totalRooms: layout.rooms.length - 1,
            });
            setSelectedItem(null);
          },
        },
      ]
    );
  };

  const handleAddFurniture = (roomId: string, furnitureType: FurnitureType) => {
    const room = layout.rooms.find((r) => r.id === roomId);
    if (!room) return;

    const defaults = FURNITURE_DEFAULTS[furnitureType];
    const newFurniture: Furniture = {
      id: `furniture_${Date.now()}`,
      type: furnitureType,
      name: getFurnitureName(furnitureType),
      emoji: defaults.emoji,
      position: {
        x: room.size.width / 2 - defaults.defaultSize.width / 2,
        y: room.size.height / 2 - defaults.defaultSize.height / 2,
      },
      size: defaults.defaultSize,
      rotation: 0,
      linkedObjectIds: [],
      dirtyScore: 0,
    };

    const updatedRooms = layout.rooms.map((r) =>
      r.id === roomId
        ? { ...r, furnitures: [...r.furnitures, newFurniture] }
        : r
    );

    setLayout({ ...layout, rooms: updatedRooms });
    setShowFurnitureMenu(false);
  };

  const handleDeleteFurniture = (roomId: string, furnitureId: string) => {
    const updatedRooms = layout.rooms.map((r) =>
      r.id === roomId
        ? { ...r, furnitures: r.furnitures.filter((f) => f.id !== furnitureId) }
        : r
    );
    setLayout({ ...layout, rooms: updatedRooms });
    setSelectedItem(null);
  };

  const handleRoomPress = (roomId: string) => {
    setSelectedItem({ type: 'room', id: roomId });
  };

  const handleFurniturePress = (roomId: string, furnitureId: string) => {
    setSelectedItem({ type: 'furniture', roomId, id: furnitureId });
  };


  const getFurnitureName = (type: FurnitureType): string => {
    const names: Record<FurnitureType, string> = {
      bed: '침대',
      desk: '책상',
      chair: '의자',
      sofa: '소파',
      table: '테이블',
      fridge: '냉장고',
      sink: '싱크대',
      stove: '가스레인지',
      toilet: '변기',
      bathtub: '욕조',
      shower: '샤워기',
      washing_machine: '세탁기',
      closet: '옷장',
      bookshelf: '책장',
      tv: 'TV',
      plant: '식물',
      mirror: '거울',
      dresser: '화장대',
    };
    return names[type];
  };

  const renderRoom = (room: Room) => {
    const isSelected =
      selectedItem?.type === 'room' && selectedItem.id === room.id;
    const isResizing =
      selectedItem?.type === 'room_resize' && selectedItem.id === room.id;

    // 모서리 핸들 크기
    const handleSize = 20;

    return (
      <G key={room.id}>
        <Rect
          x={room.position.x}
          y={room.position.y}
          width={room.size.width}
          height={room.size.height}
          fill={room.color}
          stroke={isSelected || isResizing ? Colors.primary : Colors.darkGray}
          strokeWidth={isSelected || isResizing ? 3 : 2}
          rx={8}
          onPress={() => handleRoomPress(room.id)}
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

        {/* 가구들 렌더링 */}
        {room.furnitures.map((furniture) =>
          renderFurniture(room.id, room.position, furniture)
        )}

        {/* 4개 모서리(변) 리사이즈 핸들 - 방이 선택되었을 때만 표시 */}
        {isSelected && (
          <>
            {/* 위쪽 변 */}
            <Rect
              x={room.position.x + room.size.width * 0.3}
              y={room.position.y - 5}
              width={room.size.width * 0.4}
              height={10}
              fill={Colors.accent}
              opacity={0.8}
              rx={3}
              onPress={() => startResizeRoom(room.id, 'top')}
            />
            {/* 오른쪽 변 */}
            <Rect
              x={room.position.x + room.size.width - 5}
              y={room.position.y + room.size.height * 0.3}
              width={10}
              height={room.size.height * 0.4}
              fill={Colors.accent}
              opacity={0.8}
              rx={3}
              onPress={() => startResizeRoom(room.id, 'right')}
            />
            {/* 아래쪽 변 */}
            <Rect
              x={room.position.x + room.size.width * 0.3}
              y={room.position.y + room.size.height - 5}
              width={room.size.width * 0.4}
              height={10}
              fill={Colors.accent}
              opacity={0.8}
              rx={3}
              onPress={() => startResizeRoom(room.id, 'bottom')}
            />
            {/* 왼쪽 변 */}
            <Rect
              x={room.position.x - 5}
              y={room.position.y + room.size.height * 0.3}
              width={10}
              height={room.size.height * 0.4}
              fill={Colors.accent}
              opacity={0.8}
              rx={3}
              onPress={() => startResizeRoom(room.id, 'left')}
            />
          </>
        )}
      </G>
    );
  };

  const renderFurniture = (
    roomId: string,
    roomPosition: { x: number; y: number },
    furniture: Furniture
  ) => {
    const isSelected =
      selectedItem?.type === 'furniture' &&
      selectedItem.roomId === roomId &&
      selectedItem.id === furniture.id;

    const absoluteX = roomPosition.x + furniture.position.x;
    const absoluteY = roomPosition.y + furniture.position.y;

    // 회전 각도를 transform으로 적용
    const rotationTransform = `rotate(${furniture.rotation} ${absoluteX + furniture.size.width / 2} ${absoluteY + furniture.size.height / 2})`;

    return (
      <G key={furniture.id} transform={rotationTransform}>
        <Rect
          x={absoluteX}
          y={absoluteY}
          width={furniture.size.width}
          height={furniture.size.height}
          fill={Colors.surface}
          stroke={isSelected ? Colors.accent : Colors.primary}
          strokeWidth={isSelected ? 3 : 2}
          rx={4}
          opacity={0.9}
          onPress={() => handleFurniturePress(roomId, furniture.id)}
        />
        <SvgText
          x={absoluteX + furniture.size.width / 2}
          y={absoluteY + furniture.size.height / 2 + 6}
          fontSize="16"
          textAnchor="middle"
        >
          {furniture.emoji}
        </SvgText>
        {furniture.rotation > 0 && !isSelected && (
          <SvgText
            x={absoluteX + furniture.size.width / 2}
            y={absoluteY + furniture.size.height - 5}
            fontSize="8"
            textAnchor="middle"
            fill={Colors.textSecondary}
          >
            {furniture.rotation}°
          </SvgText>
        )}
      </G>
    );
  };

  // 캐릭터 렌더링 함수 (선택 표시만)
  const renderCharacter = () => {
    const charX = layout.character.position.x;
    const charY = layout.character.position.y;
    const isSelected = selectedItem?.type === 'character';

    return (
      <G key="character">
        {isSelected && (
          <Circle
            cx={charX}
            cy={charY}
            r={30}
            fill="transparent"
            stroke={Colors.accent}
            strokeWidth={3}
          />
        )}
      </G>
    );
  };

  const renderFurnitureMenu = () => {
    const categories = [
      { name: '주방', types: ['fridge', 'sink', 'stove'] as FurnitureType[] },
      { name: '침실', types: ['bed', 'closet', 'dresser'] as FurnitureType[] },
      { name: '욕실', types: ['toilet', 'bathtub', 'shower', 'mirror'] as FurnitureType[] },
      { name: '거실', types: ['sofa', 'tv', 'table', 'plant'] as FurnitureType[] },
      { name: '서재', types: ['desk', 'chair', 'bookshelf'] as FurnitureType[] },
      { name: '기타', types: ['washing_machine'] as FurnitureType[] },
    ];

    return (
      <Modal
        visible={showFurnitureMenu}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowFurnitureMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.furnitureMenuContainer}>
            <View style={styles.furnitureMenuHeader}>
              <Text style={styles.furnitureMenuTitle}>가구 추가</Text>
              <TouchableOpacity onPress={() => setShowFurnitureMenu(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.furnitureMenuScroll}>
              {categories.map((category) => (
                <View key={category.name} style={styles.furnitureCategory}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <View style={styles.furnitureGrid}>
                    {category.types.map((type) => {
                      const defaults = FURNITURE_DEFAULTS[type];
                      return (
                        <TouchableOpacity
                          key={type}
                          style={styles.furnitureButton}
                          onPress={() =>
                            selectedRoomForFurniture &&
                            handleAddFurniture(selectedRoomForFurniture, type)
                          }
                        >
                          <Text style={styles.furnitureEmoji}>
                            {defaults.emoji}
                          </Text>
                          <Text style={styles.furnitureName}>
                            {getFurnitureName(type)}
                          </Text>
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

  const ResizeBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.resizeEdgeBtn} onPress={onPress}>
      <Text style={styles.resizeEdgeBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View
        style={styles.canvasContainer}
        onLayout={(e) => {
          setContainerSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          });
        }}
      >
        {/* 배경 탭 → 선택 해제 */}
        <TouchableOpacity
          style={styles.canvasBackdrop}
          activeOpacity={1}
          onPress={() => {
            if (selectedItem) {
              setSelectedItem(null);
            }
          }}
        >
          {/* 양방향 스크롤: 수직 ScrollView > 수평 ScrollView */}
          <ScrollView
            style={styles.canvasScrollOuter}
            contentContainerStyle={styles.canvasScrollOuterContent}
            showsVerticalScrollIndicator={true}
            scrollEnabled={!isDraggingRoom && !isDraggingFurniture && !isDraggingCharacter && !isResizing}
          >
            <ScrollView
              horizontal
              style={styles.canvasScrollInner}
              contentContainerStyle={styles.canvasScrollInnerContent}
              showsHorizontalScrollIndicator={true}
              scrollEnabled={!isDraggingRoom && !isDraggingFurniture && !isDraggingCharacter && !isResizing}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* 리사이즈 모드: 위쪽 버튼 */}
                {isCanvasResizeMode && (
                  <View style={styles.resizeEdgeTop}>
                    <ResizeBtn label="↑+" onPress={() => handleCanvasSizeChange('top', -50)} />
                    <ResizeBtn label="↑-" onPress={() => handleCanvasSizeChange('top', 50)} />
                  </View>
                )}

                <View style={{ flexDirection: 'row' }}>
                  {/* 리사이즈 모드: 왼쪽 버튼 */}
                  {isCanvasResizeMode && (
                    <View style={styles.resizeEdgeLeft}>
                      <ResizeBtn label="←+" onPress={() => handleCanvasSizeChange('left', -50)} />
                      <ResizeBtn label="←-" onPress={() => handleCanvasSizeChange('left', 50)} />
                    </View>
                  )}

                <View style={{ 
                  transform: [{ scale: canvasScale }],
                  // scale로 인해 논리 크기와 실제 렌더 크기가 달라지므로
                  // 스케일된 실제 크기만큼 공간을 확보
                  width: layout.canvasSize.width * canvasScale,
                  height: layout.canvasSize.height * canvasScale,
                }}>
                  <View style={{
                    position: 'absolute',
                    // scale은 중심 기준이므로 origin을 좌상단으로 보정
                    left: -(layout.canvasSize.width * (1 - canvasScale)) / 2,
                    top: -(layout.canvasSize.height * (1 - canvasScale)) / 2,
                  }}>
            <Svg
              width={layout.canvasSize.width}
              height={layout.canvasSize.height}
              viewBox={`0 0 ${layout.canvasSize.width} ${layout.canvasSize.height}`}
              onPress={() => {
                if (selectedItem) {
                  setSelectedItem(null);
                }
              }}
            >
              <Rect
                x={0}
                y={0}
                width={layout.canvasSize.width}
                height={layout.canvasSize.height}
                fill="#FAFAFA"
                stroke={Colors.lightGray}
                strokeWidth={1}
              />
              {layout.rooms.map(renderRoom)}
              {renderCharacter()}
            </Svg>

            {/* 방 드래그 핸들 - 방 전체 영역 (투명) */}
            {layout.rooms.map((room) => {
              const isSelected = selectedItem?.type === 'room' && selectedItem.id === room.id;
              if (!isSelected) return null;

              return (
                <View
                  key={`drag-handle-${room.id}`}
                  style={[
                    styles.roomDragHandle,
                    { 
                      left: room.position.x, 
                      top: room.position.y,
                      width: room.size.width,
                      height: room.size.height,
                    },
                  ]}
                  {...PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onMoveShouldSetPanResponder: () => true,
                    onPanResponderGrant: (evt) => {
                      console.log('Room drag started');
                      setIsDraggingRoom(true);
                      roomDragState.current = {
                        active: true,
                        roomId: room.id,
                        startX: evt.nativeEvent.pageX,
                        startY: evt.nativeEvent.pageY,
                        initialX: room.position.x,
                        initialY: room.position.y,
                      };
                    },
                    onPanResponderMove: (evt) => {
                      if (roomDragState.current.active) {
                        handleRoomDrag(evt, room.id);
                      }
                    },
                    onPanResponderRelease: () => {
                      console.log('Room drag ended');
                      setIsDraggingRoom(false);
                      roomDragState.current.active = false;
                      roomDragState.current.roomId = null;
                    },
                  }).panHandlers}
                />
              );
            })}

            {/* 가구 레이블 - 드래그 가능 */}
            {layout.rooms.map((room) =>
              room.furnitures.map((furniture) => {
                const absX = room.position.x + furniture.position.x + furniture.size.width / 2;
                const absY = room.position.y + furniture.position.y + furniture.size.height / 2;
                
                let hasMoved = false; // 드래그인지 클릭인지 구분
                
                return (
                  <View
                    key={`label-${furniture.id}`}
                    style={[
                      styles.furnitureLabel,
                      { left: absX - 20, top: absY - 20 },
                    ]}
                    {...PanResponder.create({
                      onStartShouldSetPanResponder: () => true,
                      onMoveShouldSetPanResponder: () => true,
                      onPanResponderGrant: (evt) => {
                        hasMoved = false;
                        furnitureDragState.current = {
                          active: true,
                          roomId: room.id,
                          furnitureId: furniture.id,
                          startX: evt.nativeEvent.pageX,
                          startY: evt.nativeEvent.pageY,
                          initialX: furniture.position.x,
                          initialY: furniture.position.y,
                        };
                      },
                      onPanResponderMove: (evt) => {
                        const deltaX = Math.abs(evt.nativeEvent.pageX - furnitureDragState.current.startX);
                        const deltaY = Math.abs(evt.nativeEvent.pageY - furnitureDragState.current.startY);
                        
                        if (deltaX > 5 || deltaY > 5) {
                          hasMoved = true;
                          if (!isDraggingFurniture) {
                            console.log('Furniture drag started');
                            setIsDraggingFurniture(true);
                          }
                        }
                        
                        if (furnitureDragState.current.active && hasMoved) {
                          handleFurnitureDrag(evt, room.id, furniture.id);
                        }
                      },
                      onPanResponderRelease: () => {
                        console.log('Furniture drag ended, hasMoved:', hasMoved);
                        
                        if (!hasMoved) {
                          // 클릭으로 간주 - 가구 선택
                          handleFurniturePress(room.id, furniture.id);
                        }
                        
                        setIsDraggingFurniture(false);
                        furnitureDragState.current.active = false;
                        furnitureDragState.current.roomId = null;
                        furnitureDragState.current.furnitureId = null;
                      },
                    }).panHandlers}
                  >
                    <Text style={styles.furnitureEmojiLabel}>{furniture.emoji}</Text>
                  </View>
                );
              })
            )}

            {/* 캐릭터 드래그 핸들 */}
            <View
              key="character-drag-handle"
              style={[
                styles.furnitureLabel,
                { 
                  left: layout.character.position.x - 20, 
                  top: layout.character.position.y - 20 
                },
              ]}
              {...PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt) => {
                  characterDragState.current = {
                    active: true,
                    startX: evt.nativeEvent.pageX,
                    startY: evt.nativeEvent.pageY,
                    initialX: layout.character.position.x,
                    initialY: layout.character.position.y,
                  };
                  setIsDraggingCharacter(true);
                  setSelectedItem({ type: 'character' });
                },
                onPanResponderMove: (evt) => {
                  if (characterDragState.current.active) {
                    handleCharacterDrag(evt);
                  }
                },
                onPanResponderRelease: () => {
                  setIsDraggingCharacter(false);
                  characterDragState.current.active = false;
                },
              }).panHandlers}
            >
              <Text style={styles.furnitureEmojiLabel}>🧑</Text>
            </View>

            {/* 방 리사이즈 핸들 - 4개 변 (터치 영역 확대) */}
            {layout.rooms.map((room) => {
              const isSelected = selectedItem?.type === 'room' && selectedItem.id === room.id;
              if (!isSelected) return null;

              // 스케일이 작을수록 터치 영역을 넓혀서 조작성 보장
              const handleWidth = Math.min(60, Math.round(30 / canvasScale));
              const edges = [
                { 
                  edge: 'top' as const, 
                  x: room.position.x + room.size.width * 0.3, 
                  y: room.position.y - handleWidth / 2,
                  width: room.size.width * 0.4,
                  height: handleWidth
                },
                { 
                  edge: 'right' as const, 
                  x: room.position.x + room.size.width - handleWidth / 2, 
                  y: room.position.y + room.size.height * 0.3,
                  width: handleWidth,
                  height: room.size.height * 0.4
                },
                { 
                  edge: 'bottom' as const, 
                  x: room.position.x + room.size.width * 0.3, 
                  y: room.position.y + room.size.height - handleWidth / 2,
                  width: room.size.width * 0.4,
                  height: handleWidth
                },
                { 
                  edge: 'left' as const, 
                  x: room.position.x - handleWidth / 2, 
                  y: room.position.y + room.size.height * 0.3,
                  width: handleWidth,
                  height: room.size.height * 0.4
                },
              ];

              return edges.map(({ edge, x, y, width, height }) => (
                <View
                  key={`resize-handle-${room.id}-${edge}`}
                  style={[
                    styles.resizeHandle,
                    { 
                      left: x, 
                      top: y,
                      width: width,
                      height: height,
                    },
                  ]}
                  {...PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onMoveShouldSetPanResponder: () => true,
                    onPanResponderGrant: (evt) => {
                      console.log('Resize started:', edge);
                      setIsResizing(true);
                      resizeDragState.current = {
                        active: true,
                        roomId: room.id,
                        edge,
                        startX: evt.nativeEvent.pageX,
                        startY: evt.nativeEvent.pageY,
                        initialX: room.position.x,
                        initialY: room.position.y,
                        initialWidth: room.size.width,
                        initialHeight: room.size.height,
                      };
                    },
                    onPanResponderMove: (evt) => {
                      if (resizeDragState.current.active) {
                        handleResizeRoomDrag(evt, room.id, edge);
                      }
                    },
                    onPanResponderRelease: () => {
                      console.log('Resize ended');
                      setIsResizing(false);
                      resizeDragState.current.active = false;
                      resizeDragState.current.roomId = null;
                      resizeDragState.current.edge = null;
                    },
                  }).panHandlers}
                >
                  {/* 시각적 표시 */}
                  <View style={[
                    styles.resizeHandleVisual,
                    edge === 'top' || edge === 'bottom' 
                      ? { width: '100%', height: 4 } 
                      : { width: 4, height: '100%' }
                  ]} />
                </View>
              ));
            })}
                  </View>
                </View>

                  {/* 리사이즈 모드: 오른쪽 버튼 */}
                  {isCanvasResizeMode && (
                    <View style={styles.resizeEdgeRight}>
                      <ResizeBtn label="-→" onPress={() => handleCanvasSizeChange('right', 50)} />
                      <ResizeBtn label="+→" onPress={() => handleCanvasSizeChange('right', -50)} />
                    </View>
                  )}
                </View>

                {/* 리사이즈 모드: 아래쪽 버튼 */}
                {isCanvasResizeMode && (
                  <View style={styles.resizeEdgeBottom}>
                    <ResizeBtn label="↓-" onPress={() => handleCanvasSizeChange('bottom', 50)} />
                    <ResizeBtn label="↓+" onPress={() => handleCanvasSizeChange('bottom', -50)} />
                  </View>
                )}

              </TouchableOpacity>
            </ScrollView>
          </ScrollView>
        </TouchableOpacity>

        {/* 리사이즈 모드: 크기 정보 + 완료 버튼 (상단 고정) */}
        {isCanvasResizeMode && (
          <View style={styles.resizeInfoBar}>
            <Text style={styles.resizeInfoText}>
              너비: {layout.canvasSize.width}px  |  높이: {layout.canvasSize.height}px
            </Text>
            <TouchableOpacity
              style={styles.resizeDoneBtn}
              onPress={() => setIsCanvasResizeMode(false)}
            >
              <Text style={styles.resizeDoneBtnText}>완료</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 플로팅 액션 버튼 */}
        <View style={styles.floatingButtonContainer}>
          {!selectedItem && !isCanvasResizeMode && (
            <>
              <TouchableOpacity 
                style={styles.floatingButton} 
                onPress={handleAddRoom}
              >
                <Text style={styles.floatingButtonIcon}>➕</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.floatingButton} 
                onPress={() => {
                  setSelectedItem(null);
                  setIsCanvasResizeMode(true);
                }}
              >
                <Text style={styles.floatingButtonIcon}>📐</Text>
              </TouchableOpacity>
            </>
          )}
          
          {selectedItem?.type === 'room' && (
            <>
              <TouchableOpacity 
                style={styles.floatingButton} 
                onPress={() => {
                  const room = layout.rooms.find((r) => r.id === selectedItem.id);
                  if (room) {
                    setSelectedRoomForFurniture(room.id);
                    setShowFurnitureMenu(true);
                  }
                }}
              >
                <Text style={styles.floatingButtonIcon}>🪑</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.floatingButton} 
                onPress={() => {
                  const room = layout.rooms.find((r) => r.id === selectedItem.id);
                  if (room) {
                    handleRenameRoom(room.id, room.name);
                  }
                }}
              >
                <Text style={styles.floatingButtonIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.floatingButton, styles.floatingButtonDanger]} 
                onPress={() => handleDeleteRoom(selectedItem.id)}
              >
                <Text style={styles.floatingButtonIcon}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
          
          {selectedItem?.type === 'furniture' && (
            <>
              <TouchableOpacity 
                style={[styles.floatingButton, styles.floatingButtonDanger]} 
                onPress={() => handleDeleteFurniture(selectedItem.roomId, selectedItem.id)}
              >
                <Text style={styles.floatingButtonIcon}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
          
          {selectedItem?.type === 'character' && (
            <View style={{ padding: 10 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                캐릭터 드래그로 이동
              </Text>
            </View>
          )}
        </View>

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

      {renderFurnitureMenu()}
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
  headerButton: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    color: Colors.accent,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasBackdrop: {
    flex: 1,
    width: '100%',
  },
  canvasScrollOuter: {
    flex: 1,
    width: '100%',
  },
  canvasScrollOuterContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  canvasScrollInner: {
    flexGrow: 0,
  },
  canvasScrollInnerContent: {
    flexGrow: 0,
    paddingHorizontal: 20,
  },
  canvasWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  furnitureLabel: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  furnitureEmojiLabel: {
    fontSize: 24,
  },
  resizeHandle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  resizeHandleVisual: {
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  roomDragHandle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 998, // 가구보다 아래, 리사이즈 핸들보다 아래
  },
  roomDragHandleVisual: {
    width: '100%',
    height: '100%',
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: Spacing.md,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonDanger: {
    backgroundColor: Colors.error,
  },
  floatingButtonIcon: {
    fontSize: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  furnitureMenuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  furnitureMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  furnitureMenuTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  furnitureMenuScroll: {
    padding: Spacing.md,
  },
  furnitureCategory: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  furnitureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  furnitureButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  furnitureEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  furnitureName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  /* 캔버스 바깥 모서리 리사이즈 버튼 레이아웃 */
  resizeEdgeTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(243,244,246,0.96)',
    borderRadius: 10,
    marginBottom: Spacing.xs,
    alignSelf: 'center',
  },
  resizeEdgeBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(243,244,246,0.96)',
    borderRadius: 10,
    marginTop: Spacing.xs,
    alignSelf: 'center',
  },
  resizeEdgeLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(243,244,246,0.96)',
    borderRadius: 10,
    marginRight: Spacing.xs,
    alignSelf: 'center',
  },
  resizeEdgeRight: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(243,244,246,0.96)',
    borderRadius: 10,
    marginLeft: Spacing.xs,
    alignSelf: 'center',
  },
  resizeInfoBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(243,244,246,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    zIndex: 3000,
  },
  resizeEdgeBtn: {
    backgroundColor: Colors.primaryLight,
    width: 44,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeEdgeBtnText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  resizeInfoText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resizeDoneBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  resizeDoneBtnText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
});

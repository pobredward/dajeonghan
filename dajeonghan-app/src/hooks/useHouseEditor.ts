import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import {
  HouseLayout,
  Room,
  Furniture,
  FurnitureType,
  FURNITURE_DEFAULTS,
  ROOM_COLORS,
} from '@/types/house.types';

export type SelectedItem =
  | { type: 'room'; id: string }
  | { type: 'furniture'; roomId: string; id: string }
  | { type: 'room_resize'; id: string; edge: 'top' | 'right' | 'bottom' | 'left' }
  | { type: 'character' }
  | null;

const ROOM_PADDING = 10;
const DEFAULT_ROOM_SIZE = 150;
const MIN_ROOM_SIZE = 40;
const SEARCH_STEP = 10;
const CANVAS_MIN_SIZE = 400;
const CANVAS_MAX_SIZE = 1200;

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
  return { position: { x: ROOM_PADDING, y: ROOM_PADDING }, size: { width: MIN_ROOM_SIZE, height: MIN_ROOM_SIZE } };
}

function getFurnitureName(type: FurnitureType): string {
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
    drawer: '서랍장',
  };
  return names[type];
}

export interface UseHouseEditorReturn {
  layout: HouseLayout;
  setLayout: React.Dispatch<React.SetStateAction<HouseLayout>>;
  selectedItem: SelectedItem;
  setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem>>;
  isResizing: boolean;
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingRoom: boolean;
  setIsDraggingRoom: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingFurniture: boolean;
  setIsDraggingFurniture: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingCharacter: boolean;
  setIsDraggingCharacter: React.Dispatch<React.SetStateAction<boolean>>;
  isCanvasResizeMode: boolean;
  setIsCanvasResizeMode: React.Dispatch<React.SetStateAction<boolean>>;
  showFurnitureMenu: boolean;
  setShowFurnitureMenu: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRoomForFurniture: string | null;
  setSelectedRoomForFurniture: React.Dispatch<React.SetStateAction<string | null>>;
  furnitureDragState: React.MutableRefObject<{
    active: boolean; roomId: string | null; furnitureId: string | null;
    startX: number; startY: number; initialX: number; initialY: number;
  }>;
  characterDragState: React.MutableRefObject<{
    active: boolean; startX: number; startY: number; initialX: number; initialY: number;
  }>;
  roomDragState: React.MutableRefObject<{
    active: boolean; roomId: string | null;
    startX: number; startY: number; initialX: number; initialY: number;
  }>;
  resizeDragState: React.MutableRefObject<{
    active: boolean; roomId: string | null;
    edge: 'top' | 'right' | 'bottom' | 'left' | null;
    startX: number; startY: number;
    initialX: number; initialY: number;
    initialWidth: number; initialHeight: number;
  }>;
  startResizeRoom: (roomId: string, edge: 'top' | 'right' | 'bottom' | 'left') => void;
  checkRoomOverlap: (roomId: string, x: number, y: number, width: number, height: number) => boolean;
  handleRoomDrag: (evt: any, roomId: string, canvasScale: number) => void;
  handleFurnitureDrag: (evt: any, roomId: string, furnitureId: string, canvasScale: number) => void;
  handleCharacterDrag: (evt: any, canvasScale: number) => void;
  handleResizeRoomDrag: (evt: any, roomId: string, edge: 'top' | 'right' | 'bottom' | 'left', canvasScale: number) => void;
  handleAddRoom: () => void;
  handleRenameRoom: (roomId: string, currentName: string) => void;
  handleDeleteRoom: (roomId: string) => void;
  handleAddFurniture: (roomId: string, furnitureType: FurnitureType) => void;
  handleDeleteFurniture: (roomId: string, furnitureId: string) => void;
  handleRoomPress: (roomId: string) => void;
  handleFurniturePress: (roomId: string, furnitureId: string) => void;
  handleRotateFurniture: (roomId: string, furnitureId: string) => void;
  handleCanvasSizeChange: (side: 'left' | 'right' | 'top' | 'bottom', delta: number) => void;
  getFurnitureName: (type: FurnitureType) => string;
  resetState: (newLayout: HouseLayout) => void;
}

export function useHouseEditor(initialLayout: HouseLayout): UseHouseEditorReturn {
  const [layout, setLayout] = useState<HouseLayout>(initialLayout);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingRoom, setIsDraggingRoom] = useState(false);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false);
  const [isCanvasResizeMode, setIsCanvasResizeMode] = useState(false);
  const [showFurnitureMenu, setShowFurnitureMenu] = useState(false);
  const [selectedRoomForFurniture, setSelectedRoomForFurniture] = useState<string | null>(null);

  const furnitureDragState = useRef({
    active: false, roomId: null as string | null, furnitureId: null as string | null,
    startX: 0, startY: 0, initialX: 0, initialY: 0,
  });
  const characterDragState = useRef({
    active: false, startX: 0, startY: 0, initialX: 0, initialY: 0,
  });
  const roomDragState = useRef({
    active: false, roomId: null as string | null,
    startX: 0, startY: 0, initialX: 0, initialY: 0,
  });
  const resizeDragState = useRef({
    active: false, roomId: null as string | null,
    edge: null as 'top' | 'right' | 'bottom' | 'left' | null,
    startX: 0, startY: 0, initialX: 0, initialY: 0, initialWidth: 0, initialHeight: 0,
  });

  const startResizeRoom = (roomId: string, edge: 'top' | 'right' | 'bottom' | 'left') => {
    setSelectedItem({ type: 'room_resize', id: roomId, edge });
  };

  const checkRoomOverlap = (
    roomId: string, x: number, y: number, width: number, height: number,
  ): boolean => {
    for (const otherRoom of layout.rooms) {
      if (otherRoom.id === roomId) continue;
      const overlap = !(
        x + width <= otherRoom.position.x ||
        x >= otherRoom.position.x + otherRoom.size.width ||
        y + height <= otherRoom.position.y ||
        y >= otherRoom.position.y + otherRoom.size.height
      );
      if (overlap) return true;
    }
    return false;
  };

  const handleRoomDrag = (evt: any, roomId: string, canvasScale: number) => {
    if (!roomDragState.current.active) return;
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    const deltaX = (evt.nativeEvent.pageX - roomDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - roomDragState.current.startY) / canvasScale;

    let newX = Math.round((roomDragState.current.initialX + deltaX) / 10) * 10;
    let newY = Math.round((roomDragState.current.initialY + deltaY) / 10) * 10;

    newX = Math.max(0, Math.min(layout.canvasSize.width - room.size.width, newX));
    newY = Math.max(0, Math.min(layout.canvasSize.height - room.size.height, newY));

    if (checkRoomOverlap(roomId, newX, newY, room.size.width, room.size.height)) return;

    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, position: { x: newX, y: newY } } : r),
    }));
  };

  const handleFurnitureDrag = (evt: any, roomId: string, furnitureId: string, canvasScale: number) => {
    if (!furnitureDragState.current.active) return;
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;
    const furniture = room.furnitures.find(f => f.id === furnitureId);
    if (!furniture) return;

    const deltaX = (evt.nativeEvent.pageX - furnitureDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - furnitureDragState.current.startY) / canvasScale;

    let newX = Math.round((furnitureDragState.current.initialX + deltaX) / 10) * 10;
    let newY = Math.round((furnitureDragState.current.initialY + deltaY) / 10) * 10;

    newX = Math.max(0, Math.min(room.size.width - furniture.size.width, newX));
    newY = Math.max(0, Math.min(room.size.height - furniture.size.height, newY));

    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(r =>
        r.id === roomId
          ? { ...r, furnitures: r.furnitures.map(f => f.id === furnitureId ? { ...f, position: { x: newX, y: newY } } : f) }
          : r,
      ),
    }));
  };

  const handleCharacterDrag = (evt: any, canvasScale: number) => {
    if (!characterDragState.current.active) return;

    const deltaX = (evt.nativeEvent.pageX - characterDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - characterDragState.current.startY) / canvasScale;

    let newX = Math.round((characterDragState.current.initialX + deltaX) / 10) * 10;
    let newY = Math.round((characterDragState.current.initialY + deltaY) / 10) * 10;

    if (newX < 0 || newY < 0 || newX > layout.canvasSize.width || newY > layout.canvasSize.height) return;

    setLayout(prev => ({
      ...prev,
      character: { ...prev.character, position: { x: newX, y: newY } },
    }));
  };

  const handleResizeRoomDrag = (
    evt: any,
    roomId: string,
    edge: 'top' | 'right' | 'bottom' | 'left',
    canvasScale: number,
  ) => {
    if (!resizeDragState.current.active || resizeDragState.current.edge !== edge) return;
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    const deltaX = (evt.nativeEvent.pageX - resizeDragState.current.startX) / canvasScale;
    const deltaY = (evt.nativeEvent.pageY - resizeDragState.current.startY) / canvasScale;

    let newX = resizeDragState.current.initialX;
    let newY = resizeDragState.current.initialY;
    let newWidth = resizeDragState.current.initialWidth;
    let newHeight = resizeDragState.current.initialHeight;

    switch (edge) {
      case 'top':    newY = resizeDragState.current.initialY + deltaY; newHeight = resizeDragState.current.initialHeight - deltaY; break;
      case 'right':  newWidth = resizeDragState.current.initialWidth + deltaX; break;
      case 'bottom': newHeight = resizeDragState.current.initialHeight + deltaY; break;
      case 'left':   newX = resizeDragState.current.initialX + deltaX; newWidth = resizeDragState.current.initialWidth - deltaX; break;
    }

    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;
    newWidth = Math.max(100, Math.min(400, Math.round(newWidth / 10) * 10));
    newHeight = Math.max(100, Math.min(500, Math.round(newHeight / 10) * 10));

    if (edge === 'left') { newX = Math.round((resizeDragState.current.initialX + resizeDragState.current.initialWidth - newWidth) / 10) * 10; }
    if (edge === 'top')  { newY = Math.round((resizeDragState.current.initialY + resizeDragState.current.initialHeight - newHeight) / 10) * 10; }

    if (newX < 0 || newY < 0 || newX + newWidth > layout.canvasSize.width || newY + newHeight > layout.canvasSize.height) return;
    if (checkRoomOverlap(roomId, newX, newY, newWidth, newHeight)) return;

    const shrinkLeft = edge === 'left' ? newX - resizeDragState.current.initialX : 0;
    const shrinkTop  = edge === 'top'  ? newY - resizeDragState.current.initialY : 0;
    const furnitureBlocked = room.furnitures.some(f => {
      const relX = f.position.x - shrinkLeft;
      const relY = f.position.y - shrinkTop;
      return relX < 0 || relY < 0 || relX + f.size.width > newWidth || relY + f.size.height > newHeight;
    });
    if (furnitureBlocked) return;

    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(r =>
        r.id === roomId ? { ...r, position: { x: newX, y: newY }, size: { width: newWidth, height: newHeight } } : r,
      ),
    }));
  };

  const handleAddRoom = () => {
    Alert.prompt(
      '방 추가', '방 이름을 입력하세요',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '추가',
          onPress: (roomName?: string) => {
            const name = roomName?.trim() || `방 ${layout.rooms.length + 1}`;
            const { position, size } = findEmptyPosition(layout.rooms, layout.canvasSize.width, layout.canvasSize.height);
            const newRoom: Room = {
              id: `room_${Date.now()}`, type: 'bedroom', name,
              position, size, color: ROOM_COLORS.bedroom, furnitures: [],
            };
            setLayout(prev => ({ ...prev, rooms: [...prev.rooms, newRoom], totalRooms: prev.rooms.length + 1 }));
          },
        },
      ],
      'plain-text', `방 ${layout.rooms.length + 1}`,
    );
  };

  const handleRenameRoom = (roomId: string, currentName: string) => {
    Alert.prompt(
      '방 이름 변경', '새로운 방 이름을 입력하세요',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '변경',
          onPress: (newName?: string) => {
            const name = newName?.trim() || currentName;
            setLayout(prev => ({ ...prev, rooms: prev.rooms.map(r => r.id === roomId ? { ...r, name } : r) }));
          },
        },
      ],
      'plain-text', currentName,
    );
  };

  const handleDeleteRoom = (roomId: string) => {
    Alert.alert('방 삭제', '이 방을 삭제하시겠습니까? 방 안의 모든 가구도 함께 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: () => {
          setLayout(prev => ({
            ...prev,
            rooms: prev.rooms.filter(r => r.id !== roomId),
            totalRooms: prev.rooms.length - 1,
          }));
          setSelectedItem(null);
        },
      },
    ]);
  };

  const handleAddFurniture = (roomId: string, furnitureType: FurnitureType) => {
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    const defaults = FURNITURE_DEFAULTS[furnitureType];
    const newFurniture: Furniture = {
      id: `furniture_${Date.now()}`, type: furnitureType,
      name: getFurnitureName(furnitureType),
      emoji: defaults.emoji,
      position: {
        x: room.size.width / 2 - defaults.defaultSize.width / 2,
        y: room.size.height / 2 - defaults.defaultSize.height / 2,
      },
      size: defaults.defaultSize, rotation: 0, linkedObjectIds: [], dirtyScore: 0,
    };

    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, furnitures: [...r.furnitures, newFurniture] } : r),
    }));
    setShowFurnitureMenu(false);
  };

  const handleDeleteFurniture = (roomId: string, furnitureId: string) => {
    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(r =>
        r.id === roomId ? { ...r, furnitures: r.furnitures.filter(f => f.id !== furnitureId) } : r,
      ),
    }));
    setSelectedItem(null);
  };

  const handleRoomPress = (roomId: string) => setSelectedItem({ type: 'room', id: roomId });

  const handleFurniturePress = (roomId: string, furnitureId: string) =>
    setSelectedItem({ type: 'furniture', roomId, id: furnitureId });

  const handleRotateFurniture = (roomId: string, furnitureId: string) => {
    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          furnitures: room.furnitures.map(f => {
            if (f.id !== furnitureId) return f;
            const newRotation = (f.rotation + 90) % 360;
            const shouldSwap = (newRotation === 90 || newRotation === 270) !== (f.rotation === 90 || f.rotation === 270);
            return {
              ...f, rotation: newRotation,
              size: shouldSwap ? { width: f.size.height, height: f.size.width } : f.size,
            };
          }),
        };
      }),
    }));
  };

  const handleCanvasSizeChange = (side: 'left' | 'right' | 'top' | 'bottom', delta: number) => {
    const currentWidth = layout.canvasSize.width;
    const currentHeight = layout.canvasSize.height;

    if (side === 'right') {
      const targetWidth = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentWidth - delta));
      const minRequiredWidth = layout.rooms.reduce((max, r) => Math.max(max, r.position.x + r.size.width), 0);
      const safeWidth = Math.max(minRequiredWidth, targetWidth);
      if (safeWidth === currentWidth) return;
      setLayout(prev => ({ ...prev, canvasSize: { ...prev.canvasSize, width: safeWidth } }));

    } else if (side === 'left') {
      const targetWidth = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentWidth - delta));
      const widthDiff = currentWidth - targetWidth;
      if (widthDiff === 0) return;
      if (widthDiff > 0) {
        const minRoomX = layout.rooms.reduce((min, r) => Math.min(min, r.position.x), Infinity);
        const safeShift = Math.min(widthDiff, isFinite(minRoomX) ? minRoomX : currentWidth);
        if (safeShift <= 0) return;
        setLayout(prev => ({
          ...prev,
          canvasSize: { ...prev.canvasSize, width: currentWidth - safeShift },
          rooms: prev.rooms.map(r => ({ ...r, position: { ...r.position, x: r.position.x - safeShift } })),
        }));
      } else {
        const shift = -widthDiff;
        setLayout(prev => ({
          ...prev,
          canvasSize: { ...prev.canvasSize, width: targetWidth },
          rooms: prev.rooms.map(r => ({ ...r, position: { ...r.position, x: r.position.x + shift } })),
        }));
      }

    } else if (side === 'bottom') {
      const targetHeight = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentHeight - delta));
      const minRequiredHeight = layout.rooms.reduce((max, r) => Math.max(max, r.position.y + r.size.height), 0);
      const safeHeight = Math.max(minRequiredHeight, targetHeight);
      if (safeHeight === currentHeight) return;
      setLayout(prev => ({ ...prev, canvasSize: { ...prev.canvasSize, height: safeHeight } }));

    } else {
      const targetHeight = Math.max(CANVAS_MIN_SIZE, Math.min(CANVAS_MAX_SIZE, currentHeight - delta));
      const heightDiff = currentHeight - targetHeight;
      if (heightDiff === 0) return;
      if (heightDiff > 0) {
        const minRoomY = layout.rooms.reduce((min, r) => Math.min(min, r.position.y), Infinity);
        const safeShift = Math.min(heightDiff, isFinite(minRoomY) ? minRoomY : currentHeight);
        if (safeShift <= 0) return;
        setLayout(prev => ({
          ...prev,
          canvasSize: { ...prev.canvasSize, height: currentHeight - safeShift },
          rooms: prev.rooms.map(r => ({ ...r, position: { ...r.position, y: r.position.y - safeShift } })),
        }));
      } else {
        const shift = -heightDiff;
        setLayout(prev => ({
          ...prev,
          canvasSize: { ...prev.canvasSize, height: targetHeight },
          rooms: prev.rooms.map(r => ({ ...r, position: { ...r.position, y: r.position.y + shift } })),
        }));
      }
    }
  };

  return {
    layout, setLayout,
    selectedItem, setSelectedItem,
    isResizing, setIsResizing,
    isDraggingRoom, setIsDraggingRoom,
    isDraggingFurniture, setIsDraggingFurniture,
    isDraggingCharacter, setIsDraggingCharacter,
    isCanvasResizeMode, setIsCanvasResizeMode,
    showFurnitureMenu, setShowFurnitureMenu,
    selectedRoomForFurniture, setSelectedRoomForFurniture,
    furnitureDragState, characterDragState, roomDragState, resizeDragState,
    startResizeRoom, checkRoomOverlap,
    handleRoomDrag, handleFurnitureDrag, handleCharacterDrag, handleResizeRoomDrag,
    handleAddRoom, handleRenameRoom, handleDeleteRoom,
    handleAddFurniture, handleDeleteFurniture,
    handleRoomPress, handleFurniturePress, handleRotateFurniture,
    handleCanvasSizeChange,
    getFurnitureName,
    resetState: (newLayout: HouseLayout) => {
      setLayout(newLayout);
      setSelectedItem(null);
      setIsCanvasResizeMode(false);
      setShowFurnitureMenu(false);
      setSelectedRoomForFurniture(null);
    },
  };
}

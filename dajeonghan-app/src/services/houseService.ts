/**
 * 집 구조 관리 서비스
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  HouseLayout,
  HouseLayoutCreateInput,
  Room,
  Furniture,
  HouseTemplate,
  FURNITURE_DEFAULTS,
  ROOM_COLORS,
  ROOM_NAMES,
} from '../types/house.types';
import {
  convertDatesToTimestamps,
  convertTimestampsToDates,
  dateToTimestamp,
} from './firestoreService';

/**
 * 집 레이아웃 저장
 */
export const saveHouseLayout = async (layout: HouseLayout): Promise<void> => {
  const layoutRef = doc(db, `users/${layout.userId}/houseLayout/main`);
  const firestoreLayout = convertDatesToTimestamps(layout);
  await setDoc(layoutRef, firestoreLayout);
};

/**
 * 집 레이아웃 조회
 */
export const getHouseLayout = async (userId: string): Promise<HouseLayout | null> => {
  const layoutRef = doc(db, `users/${userId}/houseLayout/main`);
  const layoutSnap = await getDoc(layoutRef);

  if (!layoutSnap.exists()) return null;

  const data = layoutSnap.data();
  return convertTimestampsToDates<HouseLayout>({ id: layoutSnap.id, ...data });
};

/**
 * 집 레이아웃 업데이트
 */
export const updateHouseLayout = async (
  userId: string,
  updates: Partial<HouseLayout>
): Promise<void> => {
  const layoutRef = doc(db, `users/${userId}/houseLayout/main`);
  const firestoreUpdates = {
    ...convertDatesToTimestamps(updates),
    updatedAt: dateToTimestamp(new Date()),
  };
  await updateDoc(layoutRef, firestoreUpdates);
};

/**
 * 방 추가
 */
export const addRoom = async (
  userId: string,
  room: Omit<Room, 'id'>
): Promise<string> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const roomId = `room_${Date.now()}`;
  const newRoom: Room = {
    id: roomId,
    ...room,
  };

  layout.rooms.push(newRoom);
  layout.totalRooms = layout.rooms.length;
  layout.updatedAt = new Date();

  await saveHouseLayout(layout);
  return roomId;
};

/**
 * 방 삭제
 */
export const removeRoom = async (userId: string, roomId: string): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  layout.rooms = layout.rooms.filter((r) => r.id !== roomId);
  layout.totalRooms = layout.rooms.length;
  layout.updatedAt = new Date();

  await saveHouseLayout(layout);
};

/**
 * 방 업데이트
 */
export const updateRoom = async (
  userId: string,
  roomId: string,
  updates: Partial<Omit<Room, 'id'>>
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const roomIndex = layout.rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  layout.rooms[roomIndex] = {
    ...layout.rooms[roomIndex],
    ...updates,
  };
  layout.updatedAt = new Date();

  await saveHouseLayout(layout);
};

/**
 * 가구 추가
 */
export const addFurniture = async (
  userId: string,
  roomId: string,
  furniture: Omit<Furniture, 'id' | 'linkedObjectIds' | 'dirtyScore'>
): Promise<string> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furnitureId = `furniture_${Date.now()}`;
  const newFurniture: Furniture = {
    id: furnitureId,
    ...furniture,
    linkedObjectIds: [],
    dirtyScore: 0,
  };

  room.furnitures.push(newFurniture);
  layout.updatedAt = new Date();

  await saveHouseLayout(layout);
  return furnitureId;
};

/**
 * 가구 삭제
 */
export const removeFurniture = async (
  userId: string,
  roomId: string,
  furnitureId: string
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  room.furnitures = room.furnitures.filter((f) => f.id !== furnitureId);
  layout.updatedAt = new Date();

  await saveHouseLayout(layout);
};

/**
 * 가구 업데이트
 */
export const updateFurniture = async (
  userId: string,
  roomId: string,
  furnitureId: string,
  updates: Partial<Omit<Furniture, 'id'>>
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furnitureIndex = room.furnitures.findIndex((f) => f.id === furnitureId);
  if (furnitureIndex === -1) throw new Error('Furniture not found');

  room.furnitures[furnitureIndex] = {
    ...room.furnitures[furnitureIndex],
    ...updates,
  };
  layout.updatedAt = new Date();

  await saveHouseLayout(layout);
};

/**
 * 기본 템플릿 생성 (원룸)
 */
export const createStudioTemplate = (): HouseLayoutCreateInput => {
  const roomId = 'room_main';
  
  return {
    userId: '', // 나중에 설정
    layoutType: 'studio',
    totalRooms: 1,
    canvasSize: { width: 350, height: 500 },
    rooms: [
      {
        id: roomId,
        type: 'living_room',
        name: '원룸',
        position: { x: 20, y: 20 },
        size: { width: 310, height: 460 },
        color: ROOM_COLORS.living_room,
        furnitures: [],
      },
    ],
    character: {
      position: { x: 175, y: 250 },
      emoji: '😊',
    },
  };
};

/**
 * 투룸 템플릿 생성
 */
export const createTwoRoomTemplate = (): HouseLayoutCreateInput => {
  return {
    userId: '',
    layoutType: 'two_room',
    totalRooms: 3, // 거실+침실+욕실
    canvasSize: { width: 400, height: 500 },
    rooms: [
      {
        id: 'room_living',
        type: 'living_room',
        name: '거실',
        position: { x: 20, y: 20 },
        size: { width: 200, height: 300 },
        color: ROOM_COLORS.living_room,
        furnitures: [],
      },
      {
        id: 'room_bedroom',
        type: 'bedroom',
        name: '침실',
        position: { x: 240, y: 20 },
        size: { width: 140, height: 300 },
        color: ROOM_COLORS.bedroom,
        furnitures: [],
      },
      {
        id: 'room_bathroom',
        type: 'bathroom',
        name: '욕실',
        position: { x: 20, y: 340 },
        size: { width: 360, height: 140 },
        color: ROOM_COLORS.bathroom,
        furnitures: [],
      },
    ],
    character: {
      position: { x: 120, y: 170 },
      emoji: '😊',
    },
  };
};

/**
 * 쓰리룸 템플릿 생성
 */
export const createThreeRoomTemplate = (): HouseLayoutCreateInput => {
  return {
    userId: '',
    layoutType: 'three_room',
    totalRooms: 4,
    canvasSize: { width: 450, height: 550 },
    rooms: [
      {
        id: 'room_living',
        type: 'living_room',
        name: '거실',
        position: { x: 20, y: 20 },
        size: { width: 250, height: 200 },
        color: ROOM_COLORS.living_room,
        furnitures: [],
      },
      {
        id: 'room_bedroom1',
        type: 'bedroom',
        name: '방1',
        position: { x: 290, y: 20 },
        size: { width: 140, height: 200 },
        color: ROOM_COLORS.bedroom,
        furnitures: [],
      },
      {
        id: 'room_bedroom2',
        type: 'bedroom',
        name: '방2',
        position: { x: 20, y: 240 },
        size: { width: 180, height: 290 },
        color: ROOM_COLORS.bedroom,
        furnitures: [],
      },
      {
        id: 'room_bathroom',
        type: 'bathroom',
        name: '욕실',
        position: { x: 220, y: 240 },
        size: { width: 210, height: 290 },
        color: ROOM_COLORS.bathroom,
        furnitures: [],
      },
    ],
    character: {
      position: { x: 145, y: 120 },
      emoji: '😊',
    },
  };
};

/**
 * 포룸 템플릿 생성
 */
export const createFourRoomTemplate = (): HouseLayoutCreateInput => {
  return {
    userId: '',
    layoutType: 'four_room',
    totalRooms: 5,
    canvasSize: { width: 500, height: 600 },
    rooms: [
      {
        id: 'room_living',
        type: 'living_room',
        name: '거실',
        position: { x: 20, y: 20 },
        size: { width: 240, height: 240 },
        color: ROOM_COLORS.living_room,
        furnitures: [],
      },
      {
        id: 'room_kitchen',
        type: 'kitchen',
        name: '주방',
        position: { x: 280, y: 20 },
        size: { width: 200, height: 120 },
        color: ROOM_COLORS.kitchen,
        furnitures: [],
      },
      {
        id: 'room_bedroom1',
        type: 'bedroom',
        name: '안방',
        position: { x: 280, y: 160 },
        size: { width: 200, height: 180 },
        color: ROOM_COLORS.bedroom,
        furnitures: [],
      },
      {
        id: 'room_bedroom2',
        type: 'bedroom',
        name: '방2',
        position: { x: 20, y: 280 },
        size: { width: 140, height: 300 },
        color: ROOM_COLORS.bedroom,
        furnitures: [],
      },
      {
        id: 'room_bedroom3',
        type: 'bedroom',
        name: '방3',
        position: { x: 180, y: 360 },
        size: { width: 140, height: 220 },
        color: ROOM_COLORS.bedroom,
        furnitures: [],
      },
    ],
    character: {
      position: { x: 140, y: 140 },
      emoji: '😊',
    },
  };
};

/**
 * 레이아웃 타입별 템플릿 가져오기
 */
export const getLayoutTemplate = (
  layoutType: HouseLayout['layoutType']
): HouseLayoutCreateInput => {
  switch (layoutType) {
    case 'studio':
    case 'one_room':
      return createStudioTemplate();
    case 'two_room':
      return createTwoRoomTemplate();
    case 'three_room':
      return createThreeRoomTemplate();
    case 'four_room':
      return createFourRoomTemplate();
    default:
      return createStudioTemplate();
  }
};

/**
 * 가구에 LifeObject 연결
 */
export const linkLifeObjectToFurniture = async (
  userId: string,
  roomId: string,
  furnitureId: string,
  lifeObjectId: string
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furniture = room.furnitures.find((f) => f.id === furnitureId);
  if (!furniture) throw new Error('Furniture not found');

  if (!furniture.linkedObjectIds.includes(lifeObjectId)) {
    furniture.linkedObjectIds.push(lifeObjectId);
    layout.updatedAt = new Date();
    await saveHouseLayout(layout);
  }
};

/**
 * 가구에서 LifeObject 연결 해제
 */
export const unlinkLifeObjectFromFurniture = async (
  userId: string,
  roomId: string,
  furnitureId: string,
  lifeObjectId: string
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furniture = room.furnitures.find((f) => f.id === furnitureId);
  if (!furniture) throw new Error('Furniture not found');

  furniture.linkedObjectIds = furniture.linkedObjectIds.filter(
    (id) => id !== lifeObjectId
  );
  layout.updatedAt = new Date();
  await saveHouseLayout(layout);
};

/**
 * 가구 타입에 맞는 LifeObject 가져오기
 */
export const getLifeObjectsForFurniture = async (
  userId: string,
  furnitureType: string
): Promise<any[]> => {
  const { getLifeObjects } = await import('./firestoreService');
  
  // 가구 타입별 LifeObject 타입 매핑
  const typeMapping: Record<string, string> = {
    fridge: 'food',
    sink: 'cleaning',
    toilet: 'cleaning',
    bed: 'self_care',
    desk: 'self_development',
    closet: 'self_care',
  };

  const objectType = typeMapping[furnitureType];
  if (!objectType) return [];

  return await getLifeObjects(userId, objectType);
};

/**
 * 가구별 dirtyScore 계산 (연결된 Task 기반)
 */
export const calculateFurnitureDirtyScore = async (
  userId: string,
  furnitureId: string
): Promise<number> => {
  const { getTasks } = await import('./firestoreService');
  const layout = await getHouseLayout(userId);
  if (!layout) return 0;

  // 가구 찾기
  let furniture: Furniture | null = null;
  for (const room of layout.rooms) {
    const found = room.furnitures.find((f) => f.id === furnitureId);
    if (found) {
      furniture = found;
      break;
    }
  }

  if (!furniture || furniture.linkedObjectIds.length === 0) return 0;

  // 연결된 LifeObject의 Task들 가져오기
  const allTasks = await getTasks(userId);
  const linkedTasks = allTasks.filter((task) =>
    furniture!.linkedObjectIds.includes(task.objectId)
  );

  // 연체된 Task 개수로 dirtyScore 계산
  const now = new Date();
  const overdueTasks = linkedTasks.filter(
    (task) => task.recurrence.nextDue && new Date(task.recurrence.nextDue) < now
  );

  // 연체된 날짜에 따라 점수 증가 (최대 100)
  let score = 0;
  overdueTasks.forEach((task) => {
    if (task.recurrence.nextDue) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(task.recurrence.nextDue).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      score += Math.min(daysOverdue * 10, 50); // 하루당 10점, 최대 50점
    }
  });

  return Math.min(score, 100);
};

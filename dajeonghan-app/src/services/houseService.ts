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
  furniture: Omit<Furniture, 'id' | 'linkedTaskIds' | 'dirtyScore'>
): Promise<string> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furnitureId = `furniture_${Date.now()}`;
  const newFurniture: Furniture = {
    id: furnitureId,
    ...furniture,
    linkedTaskIds: [],
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
 * 방 기준 상대 좌표로 가구 프리셋 생성 헬퍼
 * position은 방 내부 상대 좌표 (렌더러가 room.position + furniture.position으로 절대 좌표 계산)
 */
const makePresetFurniture = (
  id: string,
  type: Furniture['type'],
  name: string,
  roomSize: { width: number; height: number },
  relX: number, // 0~1 비율 (방 내부 상대)
  relY: number  // 0~1 비율 (방 내부 상대)
): Furniture => {
  const defaults = FURNITURE_DEFAULTS[type];
  return {
    id,
    type,
    name,
    emoji: defaults.emoji,
    position: {
      x: Math.round(roomSize.width * relX),
      y: Math.round(roomSize.height * relY),
    },
    size: defaults.defaultSize,
    rotation: 0,
    linkedTaskIds: [],
    dirtyScore: 0,
  };
};

/**
 * 기본 템플릿 생성 (원룸)
 * 통합공간(침실+거실+주방) + 욕실 분리
 * 캔버스 500×750
 */
export const createStudioTemplate = (): HouseLayoutCreateInput => {
  // 통합 공간: (10,10) 480×490
  const mainPos = { x: 10, y: 10 };
  const mainSize = { width: 480, height: 490 };
  // 욕실: (10,510) 480×220
  const bathPos = { x: 10, y: 510 };
  const bathSize = { width: 480, height: 220 };

  return {
    userId: '',
    layoutType: 'studio',
    totalRooms: 2,
    canvasSize: { width: 500, height: 750 },
    rooms: [
      {
        id: 'room_main',
        type: 'living_room',
        name: '원룸',
        position: mainPos,
        size: mainSize,
        color: ROOM_COLORS.living_room,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed', 'bed', '침대', mainSize, 0.02, 0.02),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet', 'closet', '옷장', mainSize, 0.16, 0.02),
          // 책상 — 우상단
          makePresetFurniture('preset_desk', 'desk', '책상', mainSize, 0.36, 0.02),
          // 소파 — 중앙 좌
          makePresetFurniture('preset_sofa', 'sofa', '소파', mainSize, 0.02, 0.35),
          // TV — 소파 맞은편 우측
          makePresetFurniture('preset_tv', 'tv', 'TV', mainSize, 0.78, 0.35),
          // 냉장고 — 하단 좌 주방 코너
          makePresetFurniture('preset_fridge', 'fridge', '냉장고', mainSize, 0.02, 0.70),
          // 싱크대 — 냉장고 오른쪽
          makePresetFurniture('preset_sink', 'sink', '싱크대', mainSize, 0.14, 0.70),
          // 가스레인지 — 싱크대 오른쪽
          makePresetFurniture('preset_stove', 'stove', '가스레인지', mainSize, 0.26, 0.70),
          // 식물 — 주방 맞은편 우하단
          makePresetFurniture('preset_plant', 'plant', '식물', mainSize, 0.78, 0.70),
        ],
      },
      {
        id: 'room_bathroom',
        type: 'bathroom',
        name: '욕실',
        position: bathPos,
        size: bathSize,
        color: ROOM_COLORS.bathroom,
        furnitures: [
          // 변기 — 좌측
          makePresetFurniture('preset_toilet', 'toilet', '변기', bathSize, 0.02, 0.15),
          // 세면대 — 변기 옆
          makePresetFurniture('preset_sink_bath', 'sink', '세면대', bathSize, 0.16, 0.15),
          // 거울 — 세면대 옆
          makePresetFurniture('preset_mirror', 'mirror', '거울', bathSize, 0.30, 0.15),
          // 샤워기 — 중앙
          makePresetFurniture('preset_shower', 'shower', '샤워기', bathSize, 0.55, 0.15),
          // 세탁기 — 우측
          makePresetFurniture('preset_washing_machine', 'washing_machine', '세탁기', bathSize, 0.78, 0.15),
        ],
      },
    ],
    character: {
      position: { x: 250, y: 260 },
      emoji: '😊',
    },
  };
};

/**
 * 투룸 템플릿 생성
 * 거실+주방(LDK) / 침실 / 욕실
 * 캔버스 620×720
 */
export const createTwoRoomTemplate = (): HouseLayoutCreateInput => {
  // 거실+주방(LDK): (10,10) 600×310
  const livingPos = { x: 10, y: 10 };
  const livingSize = { width: 600, height: 310 };
  // 침실: (10,330) 370×370
  const bedroomPos = { x: 10, y: 330 };
  const bedroomSize = { width: 370, height: 370 };
  // 욕실: (390,330) 220×370
  const bathPos = { x: 390, y: 330 };
  const bathSize = { width: 220, height: 370 };

  return {
    userId: '',
    layoutType: 'two_room',
    totalRooms: 3,
    canvasSize: { width: 620, height: 720 },
    rooms: [
      {
        id: 'room_living',
        type: 'living_room',
        name: '거실·주방',
        position: livingPos,
        size: livingSize,
        color: ROOM_COLORS.living_room,
        furnitures: [
          // 소파 — 거실 좌측
          makePresetFurniture('preset_sofa', 'sofa', '소파', livingSize, 0.02, 0.08),
          // TV — 소파 맞은편 우측
          makePresetFurniture('preset_tv', 'tv', 'TV', livingSize, 0.62, 0.08),
          // 식탁 — 거실 중앙
          makePresetFurniture('preset_table', 'table', '식탁', livingSize, 0.28, 0.08),
          // 냉장고 — 주방 좌측 하단
          makePresetFurniture('preset_fridge', 'fridge', '냉장고', livingSize, 0.02, 0.60),
          // 싱크대 — 냉장고 옆
          makePresetFurniture('preset_sink', 'sink', '싱크대', livingSize, 0.12, 0.60),
          // 가스레인지 — 싱크대 옆
          makePresetFurniture('preset_stove', 'stove', '가스레인지', livingSize, 0.22, 0.60),
          // 식물 — 주방 우측 코너
          makePresetFurniture('preset_plant', 'plant', '식물', livingSize, 0.82, 0.60),
        ],
      },
      {
        id: 'room_bedroom',
        type: 'bedroom',
        name: '침실',
        position: bedroomPos,
        size: bedroomSize,
        color: ROOM_COLORS.bedroom,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed', 'bed', '침대', bedroomSize, 0.03, 0.03),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet', 'closet', '옷장', bedroomSize, 0.19, 0.03),
          // 거울 — 옷장 오른쪽
          makePresetFurniture('preset_mirror_bedroom', 'mirror', '거울', bedroomSize, 0.36, 0.03),
          // 화장대 — 하단 좌
          makePresetFurniture('preset_dresser', 'dresser', '화장대', bedroomSize, 0.03, 0.55),
          // 책상 — 화장대 오른쪽
          makePresetFurniture('preset_desk', 'desk', '책상', bedroomSize, 0.19, 0.55),
        ],
      },
      {
        id: 'room_bathroom',
        type: 'bathroom',
        name: '욕실',
        position: bathPos,
        size: bathSize,
        color: ROOM_COLORS.bathroom,
        furnitures: [
          // 변기 — 상단 좌
          makePresetFurniture('preset_toilet', 'toilet', '변기', bathSize, 0.05, 0.03),
          // 세면대 — 변기 옆
          makePresetFurniture('preset_sink_bath', 'sink', '세면대', bathSize, 0.35, 0.03),
          // 거울 — 중단 좌
          makePresetFurniture('preset_mirror', 'mirror', '거울', bathSize, 0.05, 0.32),
          // 샤워기 — 거울 옆
          makePresetFurniture('preset_shower', 'shower', '샤워기', bathSize, 0.35, 0.32),
          // 세탁기 — 하단
          makePresetFurniture('preset_washing_machine', 'washing_machine', '세탁기', bathSize, 0.05, 0.65),
        ],
      },
    ],
    character: {
      position: { x: 310, y: 165 },
      emoji: '😊',
    },
  };
};

/**
 * 쓰리룸 템플릿 생성
 * 거실 / 주방 / 침실1(안방) / 침실2 / 욕실
 * 캔버스 750×830
 */
export const createThreeRoomTemplate = (): HouseLayoutCreateInput => {
  // 거실: (10,10) 430×290
  const livingPos = { x: 10, y: 10 };
  const livingSize = { width: 430, height: 290 };
  // 주방: (450,10) 290×290
  const kitchenPos = { x: 450, y: 10 };
  const kitchenSize = { width: 290, height: 290 };
  // 침실1(안방): (10,310) 360×250
  const bed1Pos = { x: 10, y: 310 };
  const bed1Size = { width: 360, height: 250 };
  // 침실2: (10,570) 360×250
  const bed2Pos = { x: 10, y: 570 };
  const bed2Size = { width: 360, height: 250 };
  // 욕실: (380,310) 360×510 (침실1+침실2 높이 커버)
  const bathPos = { x: 380, y: 310 };
  const bathSize = { width: 360, height: 510 };

  return {
    userId: '',
    layoutType: 'three_room',
    totalRooms: 5,
    canvasSize: { width: 750, height: 830 },
    rooms: [
      {
        id: 'room_living',
        type: 'living_room',
        name: '거실',
        position: livingPos,
        size: livingSize,
        color: ROOM_COLORS.living_room,
        furnitures: [
          // 소파 — 거실 좌측
          makePresetFurniture('preset_sofa', 'sofa', '소파', livingSize, 0.03, 0.07),
          // TV — 소파 맞은편
          makePresetFurniture('preset_tv', 'tv', 'TV', livingSize, 0.72, 0.07),
          // 책장 — 좌하단
          makePresetFurniture('preset_bookshelf', 'bookshelf', '책장', livingSize, 0.03, 0.65),
          // 식물 — 우하단
          makePresetFurniture('preset_plant', 'plant', '식물', livingSize, 0.72, 0.65),
        ],
      },
      {
        id: 'room_kitchen',
        type: 'kitchen',
        name: '주방',
        position: kitchenPos,
        size: kitchenSize,
        color: ROOM_COLORS.kitchen,
        furnitures: [
          // 냉장고 — 상단 좌
          makePresetFurniture('preset_fridge', 'fridge', '냉장고', kitchenSize, 0.03, 0.04),
          // 싱크대 — 냉장고 아래
          makePresetFurniture('preset_sink', 'sink', '싱크대', kitchenSize, 0.03, 0.35),
          // 가스레인지 — 싱크대 아래
          makePresetFurniture('preset_stove', 'stove', '가스레인지', kitchenSize, 0.03, 0.66),
          // 식탁 — 오른쪽
          makePresetFurniture('preset_table', 'table', '식탁', kitchenSize, 0.45, 0.04),
        ],
      },
      {
        id: 'room_bedroom1',
        type: 'bedroom',
        name: '안방',
        position: bed1Pos,
        size: bed1Size,
        color: ROOM_COLORS.bedroom,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed', 'bed', '침대', bed1Size, 0.03, 0.04),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet', 'closet', '옷장', bed1Size, 0.20, 0.04),
          // 화장대 — 하단 좌
          makePresetFurniture('preset_dresser', 'dresser', '화장대', bed1Size, 0.03, 0.60),
          // 거울 — 화장대 옆
          makePresetFurniture('preset_mirror2', 'mirror', '거울', bed1Size, 0.20, 0.60),
        ],
      },
      {
        id: 'room_bedroom2',
        type: 'bedroom',
        name: '침실',
        position: bed2Pos,
        size: bed2Size,
        color: ROOM_COLORS.bedroom,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed2', 'bed', '침대', bed2Size, 0.03, 0.04),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet2', 'closet', '옷장', bed2Size, 0.20, 0.04),
          // 책상 — 하단 좌
          makePresetFurniture('preset_desk', 'desk', '책상', bed2Size, 0.03, 0.60),
        ],
      },
      {
        id: 'room_bathroom',
        type: 'bathroom',
        name: '욕실',
        position: bathPos,
        size: bathSize,
        color: ROOM_COLORS.bathroom,
        furnitures: [
          // 변기 — 상단 좌
          makePresetFurniture('preset_toilet', 'toilet', '변기', bathSize, 0.04, 0.03),
          // 세면대 — 변기 옆
          makePresetFurniture('preset_sink_bath', 'sink', '세면대', bathSize, 0.22, 0.03),
          // 샤워기 — 중단 좌
          makePresetFurniture('preset_shower', 'shower', '샤워기', bathSize, 0.04, 0.22),
          // 욕조 — 샤워기 옆
          makePresetFurniture('preset_bathtub', 'bathtub', '욕조', bathSize, 0.22, 0.22),
          // 세탁기 — 하단
          makePresetFurniture('preset_washing_machine', 'washing_machine', '세탁기', bathSize, 0.04, 0.50),
        ],
      },
    ],
    character: {
      position: { x: 225, y: 155 },
      emoji: '😊',
    },
  };
};

/**
 * 포룸 템플릿 생성
 * 거실 / 주방 / 안방 / 침실2 / 침실3 / 욕실
 * 캔버스 860×870
 */
export const createFourRoomTemplate = (): HouseLayoutCreateInput => {
  // 거실: (10,10) 480×290
  const livingPos = { x: 10, y: 10 };
  const livingSize = { width: 480, height: 290 };
  // 주방: (500,10) 350×290
  const kitchenPos = { x: 500, y: 10 };
  const kitchenSize = { width: 350, height: 290 };
  // 안방: (10,310) 400×260
  const bed1Pos = { x: 10, y: 310 };
  const bed1Size = { width: 400, height: 260 };
  // 침실2: (10,580) 400×280
  const bed2Pos = { x: 10, y: 580 };
  const bed2Size = { width: 400, height: 280 };
  // 침실3: (420,310) 430×260
  const bed3Pos = { x: 420, y: 310 };
  const bed3Size = { width: 430, height: 260 };
  // 욕실: (420,580) 430×280
  const bathPos = { x: 420, y: 580 };
  const bathSize = { width: 430, height: 280 };

  return {
    userId: '',
    layoutType: 'four_room',
    totalRooms: 6,
    canvasSize: { width: 860, height: 870 },
    rooms: [
      {
        id: 'room_living',
        type: 'living_room',
        name: '거실',
        position: livingPos,
        size: livingSize,
        color: ROOM_COLORS.living_room,
        furnitures: [
          // 소파 — 거실 좌측
          makePresetFurniture('preset_sofa', 'sofa', '소파', livingSize, 0.02, 0.07),
          // TV — 소파 맞은편
          makePresetFurniture('preset_tv', 'tv', 'TV', livingSize, 0.70, 0.07),
          // 식탁 — 중앙
          makePresetFurniture('preset_table', 'table', '식탁', livingSize, 0.30, 0.07),
          // 책장 — 하단 좌
          makePresetFurniture('preset_bookshelf', 'bookshelf', '책장', livingSize, 0.02, 0.65),
          // 식물 — 하단 우
          makePresetFurniture('preset_plant', 'plant', '식물', livingSize, 0.70, 0.65),
        ],
      },
      {
        id: 'room_kitchen',
        type: 'kitchen',
        name: '주방',
        position: kitchenPos,
        size: kitchenSize,
        color: ROOM_COLORS.kitchen,
        furnitures: [
          // 냉장고 — 상단 좌
          makePresetFurniture('preset_fridge', 'fridge', '냉장고', kitchenSize, 0.04, 0.04),
          // 싱크대 — 냉장고 아래
          makePresetFurniture('preset_sink', 'sink', '싱크대', kitchenSize, 0.04, 0.36),
          // 가스레인지 — 싱크대 아래
          makePresetFurniture('preset_stove', 'stove', '가스레인지', kitchenSize, 0.04, 0.65),
          // 식탁 — 오른쪽
          makePresetFurniture('preset_table2', 'table', '식탁', kitchenSize, 0.44, 0.04),
        ],
      },
      {
        id: 'room_bedroom1',
        type: 'bedroom',
        name: '안방',
        position: bed1Pos,
        size: bed1Size,
        color: ROOM_COLORS.bedroom,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed', 'bed', '침대', bed1Size, 0.03, 0.04),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet', 'closet', '옷장', bed1Size, 0.18, 0.04),
          // 화장대 — 하단 좌
          makePresetFurniture('preset_dresser', 'dresser', '화장대', bed1Size, 0.03, 0.62),
          // 거울 — 화장대 옆
          makePresetFurniture('preset_mirror2', 'mirror', '거울', bed1Size, 0.18, 0.62),
        ],
      },
      {
        id: 'room_bedroom2',
        type: 'bedroom',
        name: '침실2',
        position: bed2Pos,
        size: bed2Size,
        color: ROOM_COLORS.bedroom,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed2', 'bed', '침대', bed2Size, 0.03, 0.04),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet2', 'closet', '옷장', bed2Size, 0.18, 0.04),
          // 책상 — 하단 좌
          makePresetFurniture('preset_desk', 'desk', '책상', bed2Size, 0.03, 0.62),
        ],
      },
      {
        id: 'room_bedroom3',
        type: 'bedroom',
        name: '침실3',
        position: bed3Pos,
        size: bed3Size,
        color: ROOM_COLORS.bedroom,
        furnitures: [
          // 침대 — 좌상단
          makePresetFurniture('preset_bed3', 'bed', '침대', bed3Size, 0.03, 0.04),
          // 옷장 — 침대 오른쪽
          makePresetFurniture('preset_closet3', 'closet', '옷장', bed3Size, 0.17, 0.04),
          // 책상 — 하단 좌
          makePresetFurniture('preset_desk2', 'desk', '책상', bed3Size, 0.03, 0.62),
        ],
      },
      {
        id: 'room_bathroom',
        type: 'bathroom',
        name: '욕실',
        position: bathPos,
        size: bathSize,
        color: ROOM_COLORS.bathroom,
        furnitures: [
          // 변기 — 상단 좌
          makePresetFurniture('preset_toilet', 'toilet', '변기', bathSize, 0.03, 0.04),
          // 세면대 — 변기 옆
          makePresetFurniture('preset_sink_bath', 'sink', '세면대', bathSize, 0.18, 0.04),
          // 샤워기 — 상단 우
          makePresetFurniture('preset_shower', 'shower', '샤워기', bathSize, 0.50, 0.04),
          // 욕조 — 샤워기 옆
          makePresetFurniture('preset_bathtub', 'bathtub', '욕조', bathSize, 0.65, 0.04),
          // 세탁기 — 하단
          makePresetFurniture('preset_washing_machine', 'washing_machine', '세탁기', bathSize, 0.03, 0.60),
        ],
      },
    ],
    character: {
      position: { x: 250, y: 155 },
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
 * 가구에 Task 연결
 */
export const linkTaskToFurniture = async (
  userId: string,
  roomId: string,
  furnitureId: string,
  taskId: string
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furniture = room.furnitures.find((f) => f.id === furnitureId);
  if (!furniture) throw new Error('Furniture not found');

  if (!furniture.linkedTaskIds.includes(taskId)) {
    furniture.linkedTaskIds.push(taskId);
    layout.updatedAt = new Date();
    await saveHouseLayout(layout);
  }
};

/**
 * 가구에서 Task 연결 해제
 */
export const unlinkTaskFromFurniture = async (
  userId: string,
  roomId: string,
  furnitureId: string,
  taskId: string
): Promise<void> => {
  const layout = await getHouseLayout(userId);
  if (!layout) throw new Error('House layout not found');

  const room = layout.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const furniture = room.furnitures.find((f) => f.id === furnitureId);
  if (!furniture) throw new Error('Furniture not found');

  furniture.linkedTaskIds = furniture.linkedTaskIds.filter(
    (id) => id !== taskId
  );
  layout.updatedAt = new Date();
  await saveHouseLayout(layout);
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

  if (!furniture || furniture.linkedTaskIds.length === 0) return 0;

  const allTasks = await getTasks(userId);
  const linkedTasks = allTasks.filter((task) =>
    furniture!.linkedTaskIds.includes(task.id)
  );

  // 연체된 Task 개수로 dirtyScore 계산 (자정 기준으로 연체 판정)
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = linkedTasks.filter(
    (task) => task.recurrence?.nextDue && new Date(task.recurrence.nextDue) < today
  );

  // 연체 Task 1개당 기본 15점 + 연체 일수당 5점(태스크당 최대 30점), 전체 최대 100점
  let score = 0;
  overdueTasks.forEach((task) => {
    if (task.recurrence?.nextDue) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(task.recurrence.nextDue).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      score += 15 + Math.min(daysOverdue * 5, 30);
    }
  });

  return Math.min(score, 100);
};

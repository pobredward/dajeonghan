/**
 * 집 구조 및 가구 배치 타입 정의
 */

import { UserOwnedEntity } from './common.types';

/**
 * 방 타입
 */
export type RoomType = 
  | 'living_room'    // 거실
  | 'kitchen'        // 주방
  | 'bedroom'        // 침실
  | 'bathroom'       // 욕실
  | 'study'          // 서재
  | 'dressing_room'  // 드레스룸
  | 'utility'        // 다용도실
  | 'balcony'        // 발코니
  | 'entrance';      // 현관

/**
 * 가구 타입
 */
export type FurnitureType =
  | 'bed'            // 침대
  | 'desk'           // 책상
  | 'chair'          // 의자
  | 'sofa'           // 소파
  | 'table'          // 테이블
  | 'fridge'         // 냉장고
  | 'sink'           // 싱크대
  | 'stove'          // 가스레인지
  | 'toilet'         // 변기
  | 'bathtub'        // 욕조
  | 'shower'         // 샤워기
  | 'washing_machine'// 세탁기
  | 'closet'         // 옷장
  | 'bookshelf'      // 책장
  | 'tv'             // TV
  | 'plant'          // 식물
  | 'mirror'         // 거울
  | 'dresser';       // 화장대

/**
 * 가구별 특화 메타데이터
 */
export interface FridgeMetadata {
  type: 'fridge';
  capacity: 'large' | 'medium' | 'small'; // 용량
  temperature: number; // 온도 (°C)
  lastCleaned?: Date; // 마지막 청소일
  inventoryItems: FridgeInventoryItem[]; // 재고 아이템들
}

export interface FridgeInventoryItem {
  foodId: string; // LifeObject ID 참조
  location: 'refrigerator' | 'freezer' | 'vegetable_drawer'; // 위치
  quantity: string; // 수량 (예: "2개", "500g")
  addedDate: Date; // 추가일
}

export interface BedMetadata {
  type: 'bed';
  size: 'single' | 'double' | 'queen' | 'king'; // 침대 크기
  mattressType: string; // 매트리스 종류
  lastSheetChange?: Date; // 마지막 시트 교체일
  sleepTrackingEnabled: boolean; // 수면 추적 활성화 여부
}

export interface DeskMetadata {
  type: 'desk';
  workType: 'study' | 'office' | 'creative' | 'gaming'; // 작업 유형
  equipment: string[]; // 장비 목록
  lastOrganized?: Date; // 마지막 정리일
  focusSessionEnabled: boolean; // 집중 세션 활성화 여부
}

export interface PlantMetadata {
  type: 'plant';
  species: string; // 식물 종류
  wateringFrequency: number; // 물주기 주기 (일)
  lastWatered?: Date; // 마지막 물준 날짜
  lastFertilized?: Date; // 마지막 시비일
  sunlightRequirement: 'low' | 'medium' | 'high'; // 햇빛 요구량
}

export interface CleaningFurnitureMetadata {
  type: 'cleaning_furniture';
  cleaningFrequency: number; // 청소 주기 (일)
  lastCleaned?: Date; // 마지막 청소일
  cleaningSupplies: string[]; // 필요한 청소용품
  difficulty: 'easy' | 'medium' | 'hard'; // 청소 난이도
}

export interface DefaultFurnitureMetadata {
  type: 'default';
  customFields?: Record<string, any>; // 커스텀 필드
}

export type FurnitureMetadata = 
  | FridgeMetadata 
  | BedMetadata 
  | DeskMetadata 
  | PlantMetadata
  | CleaningFurnitureMetadata
  | DefaultFurnitureMetadata;

/**
 * 가구 정보 (확장된 버전)
 */
export interface Furniture {
  id: string;
  type: FurnitureType;
  name: string;
  emoji: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number; // 0, 90, 180, 270
  linkedObjectIds: string[]; // 연결된 LifeObject ID들
  dirtyScore: number; // 0-100
  furnitureMetadata?: FurnitureMetadata; // 가구별 특화 데이터
}

/**
 * 방 정보
 */
export interface Room {
  id: string;
  type: RoomType;
  name: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  color: string;
  furnitures: Furniture[];
}

/**
 * 집 구조 (사용자별 저장)
 */
export interface HouseLayout extends UserOwnedEntity {
  layoutType: 'studio' | 'one_room' | 'two_room' | 'three_room' | 'four_room' | 'custom';
  totalRooms: number;
  canvasSize: {
    width: number;
    height: number;
  };
  rooms: Room[];
  character: {
    position: {
      x: number;
      y: number;
    };
    emoji: string;
  };
}

/**
 * 가구 생성 입력
 */
export type FurnitureCreateInput = Omit<Furniture, 'id' | 'linkedObjectIds' | 'dirtyScore'>;

/**
 * 방 생성 입력
 */
export type RoomCreateInput = Omit<Room, 'id' | 'furnitures'>;

/**
 * 집 레이아웃 생성 입력
 */
export type HouseLayoutCreateInput = Omit<HouseLayout, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 집 레이아웃 템플릿
 */
export interface HouseTemplate {
  id: string;
  name: string;
  description: string;
  layoutType: HouseLayout['layoutType'];
  thumbnail: string;
  rooms: Omit<Room, 'id' | 'furnitures'>[];
  defaultFurnitures: {
    roomType: RoomType;
    furnitures: FurnitureCreateInput[];
  }[];
}

/**
 * 가구 카테고리별 기본 정보
 */
export const FURNITURE_DEFAULTS: Record<FurnitureType, {
  emoji: string;
  defaultSize: { width: number; height: number };
  category: 'kitchen' | 'bedroom' | 'bathroom' | 'living' | 'study' | 'utility';
}> = {
  bed: { emoji: '🛏️', defaultSize: { width: 40, height: 40 }, category: 'bedroom' },
  desk: { emoji: '🪑', defaultSize: { width: 40, height: 40 }, category: 'study' },
  chair: { emoji: '💺', defaultSize: { width: 40, height: 40 }, category: 'living' },
  sofa: { emoji: '🛋️', defaultSize: { width: 40, height: 40 }, category: 'living' },
  table: { emoji: '🪑', defaultSize: { width: 40, height: 40 }, category: 'living' },
  fridge: { emoji: '🧊', defaultSize: { width: 40, height: 40 }, category: 'kitchen' },
  sink: { emoji: '🚰', defaultSize: { width: 40, height: 40 }, category: 'kitchen' },
  stove: { emoji: '🍳', defaultSize: { width: 40, height: 40 }, category: 'kitchen' },
  toilet: { emoji: '🚽', defaultSize: { width: 40, height: 40 }, category: 'bathroom' },
  bathtub: { emoji: '🛁', defaultSize: { width: 40, height: 40 }, category: 'bathroom' },
  shower: { emoji: '🚿', defaultSize: { width: 40, height: 40 }, category: 'bathroom' },
  washing_machine: { emoji: '🧺', defaultSize: { width: 40, height: 40 }, category: 'utility' },
  closet: { emoji: '👔', defaultSize: { width: 40, height: 40 }, category: 'bedroom' },
  bookshelf: { emoji: '📚', defaultSize: { width: 40, height: 40 }, category: 'study' },
  tv: { emoji: '📺', defaultSize: { width: 40, height: 40 }, category: 'living' },
  plant: { emoji: '🪴', defaultSize: { width: 40, height: 40 }, category: 'living' },
  mirror: { emoji: '🪞', defaultSize: { width: 40, height: 40 }, category: 'bathroom' },
  dresser: { emoji: '💄', defaultSize: { width: 40, height: 40 }, category: 'bedroom' },
};

/**
 * 방 타입별 기본 색상
 */
export const ROOM_COLORS: Record<RoomType, string> = {
  living_room: '#FFF8E1',
  kitchen: '#FFF3E0',
  bedroom: '#F3E5F5',
  bathroom: '#E3F2FD',
  study: '#E8F5E9',
  dressing_room: '#FCE4EC',
  utility: '#F5F5F5',
  balcony: '#E0F2F1',
  entrance: '#FFF9C4',
};

/**
 * 방 타입별 한글 이름
 */
export const ROOM_NAMES: Record<RoomType, string> = {
  living_room: '거실',
  kitchen: '주방',
  bedroom: '침실',
  bathroom: '욕실',
  study: '서재',
  dressing_room: '드레스룸',
  utility: '다용도실',
  balcony: '발코니',
  entrance: '현관',
};

/**
 * 가구별 기본 메타데이터 생성
 */
export const createDefaultFurnitureMetadata = (furnitureType: FurnitureType): FurnitureMetadata => {
  switch (furnitureType) {
    case 'fridge':
      return {
        type: 'fridge',
        capacity: 'medium',
        temperature: 4,
        inventoryItems: [],
      };
    
    case 'bed':
      return {
        type: 'bed',
        size: 'double',
        mattressType: '스프링',
        sleepTrackingEnabled: false,
      };
    
    case 'desk':
      return {
        type: 'desk',
        workType: 'study',
        equipment: [],
        focusSessionEnabled: false,
      };
    
    case 'plant':
      return {
        type: 'plant',
        species: '일반 식물',
        wateringFrequency: 7,
        sunlightRequirement: 'medium',
      };
    
    case 'toilet':
    case 'bathtub':
    case 'shower':
    case 'sink':
    case 'washing_machine':
      return {
        type: 'cleaning_furniture',
        cleaningFrequency: 7,
        cleaningSupplies: [],
        difficulty: 'medium',
      };
    
    default:
      return {
        type: 'default',
        customFields: {},
      };
  }
};

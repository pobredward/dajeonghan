/**
 * 다정한 - 생활 객체(LifeObject) 타입 정의
 * 
 * Task가 연결되는 실제 생활 객체들을 정의합니다.
 * - 청소 공간/물건
 * - 식재료
 * - 약
 * - 자기관리 항목
 * - 자기계발 항목
 */

import { ModuleType, UserOwnedEntity } from './common.types';

/**
 * 생활 객체 메인 인터페이스
 * 
 * 모든 생활 객체의 기본 구조입니다.
 * metadata는 type에 따라 다른 구조를 가집니다.
 */
export interface LifeObject extends UserOwnedEntity {
  type: ModuleType;
  name: string;
  metadata: CleaningMetadata | FoodMetadata | MedicineMetadata | SelfCareMetadata | SelfDevelopmentMetadata;
}

/**
 * 타입 가드: LifeObject가 청소 객체인지 확인
 */
export function isCleaningObject(obj: LifeObject): obj is LifeObject & { metadata: CleaningMetadata } {
  return obj.type === 'cleaning';
}

/**
 * 타입 가드: LifeObject가 식재료인지 확인
 */
export function isFoodObject(obj: LifeObject): obj is LifeObject & { metadata: FoodMetadata } {
  return obj.type === 'food';
}

/**
 * 타입 가드: LifeObject가 약인지 확인
 */
export function isMedicineObject(obj: LifeObject): obj is LifeObject & { metadata: MedicineMetadata } {
  return obj.type === 'medicine';
}

/**
 * 타입 가드: LifeObject가 자기관리 항목인지 확인
 */
export function isSelfCareObject(obj: LifeObject): obj is LifeObject & { metadata: SelfCareMetadata } {
  return obj.type === 'self_care';
}

/**
 * 타입 가드: LifeObject가 자기계발 항목인지 확인
 */
export function isSelfDevelopmentObject(obj: LifeObject): obj is LifeObject & { metadata: SelfDevelopmentMetadata } {
  return obj.type === 'self_development';
}

// ============================================================================
// 청소 모듈
// ============================================================================

/**
 * 청소 메타데이터
 * 
 * @property room - 방/공간 이름
 * @property difficulty - 청소 난이도 (1-5)
 * @property healthPriority - 위생 우선순위 (화장실/주방은 true)
 */
export interface CleaningMetadata {
  room: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  healthPriority: boolean;
}

// ============================================================================
// 식재료 모듈
// ============================================================================

export type FoodCategory = '채소' | '과일' | '육류' | '해산물' | '유제품' | '조미료' | '가공식품' | '곡물' | '기타';
export type ExpiryType = 'sell_by' | 'consume_by';
export type StorageCondition = '냉장' | '냉동' | '실온';
export type StorageType = '밀폐용기' | '비닐' | '원래포장' | '랩';
export type FoodState = '통' | '손질' | '조리';

/**
 * 식재료 메타데이터
 * 
 * 구매일, 유통기한, 보관 상태 등을 추적합니다.
 * 권장 소진일은 자동으로 계산됩니다.
 */
export interface FoodMetadata {
  category: FoodCategory;
  purchaseDate: Date;
  expiryDate?: Date;
  expiryType?: ExpiryType;
  storageCondition: StorageCondition;
  storageType: StorageType;
  state: FoodState;
  recommendedConsumption?: Date;
  quantity?: string;
  imageUrl?: string;
  memo?: string;
}

// ============================================================================
// 약 모듈
// ============================================================================

export type MedicineType = '처방약' | '일반약' | '영양제';
export type DoseFrequency = 'daily' | 'specific_days' | 'as_needed';
export type MealTiming = '식전' | '식후' | '식사중' | '무관';

/**
 * 약 복용 스케줄
 */
export interface MedicineSchedule {
  frequency: DoseFrequency;
  days?: number[];
  times: string[];
  mealTiming: MealTiming;
}

/**
 * 약 메타데이터
 * 
 * 복용 스케줄, 재고, 재주문 알림 등을 관리합니다.
 */
export interface MedicineMetadata {
  type: MedicineType;
  dosage: string;
  schedule: MedicineSchedule;
  totalQuantity: number;
  remainingQuantity: number;
  refillThreshold: number;
}

// ============================================================================
// 자기관리 모듈
// ============================================================================

export type SelfCareCategory = '피부관리' | '신체관리' | '제모' | '헤어관리' | '도구관리';
export type BodyPart = '얼굴' | '겨드랑이' | '팔' | '다리' | '비키니' | '전신';
export type Gender = 'male' | 'female' | 'non_binary' | 'all';

/**
 * 외부 서비스 정보 (미용실, 네일샵 등)
 */
export interface ServiceInfo {
  name: string;
  location: string;
  contact: string;
  lastVisit?: Date;
  nextAppointment?: Date;
}

/**
 * 자기관리 메타데이터
 * 
 * 피부 관리, 제모, 헤어 관리 등의 정보를 담습니다.
 */
export interface SelfCareMetadata {
  category: SelfCareCategory;
  subcategory: string;
  bodyPart?: BodyPart;
  estimatedMinutes: number;
  requiredProducts?: string[];
  requiresService: boolean;
  serviceInfo?: ServiceInfo;
  gender?: Gender;
}

// ============================================================================
// 자기계발 모듈
// ============================================================================

export type SelfDevelopmentCategory = '독서' | '운동' | '학습' | '명상' | '취미';

/**
 * 진행률 추적 정보
 */
export interface ProgressTracking {
  target: number;
  current: number;
  unit: string;
}

/**
 * 자기계발 메타데이터
 * 
 * 독서, 운동, 학습 등의 진행 상황을 추적합니다.
 */
export interface SelfDevelopmentMetadata {
  category: SelfDevelopmentCategory;
  goal?: string;
  progressTracking?: ProgressTracking;
}

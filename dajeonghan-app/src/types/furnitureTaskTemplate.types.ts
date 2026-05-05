/**
 * 가구별 Task 템플릿 타입 정의
 *
 * furnitureTaskTemplates.ts 가 단일 소스. 온보딩 JSON은 사용하지 않는다.
 */

import { FurnitureType } from './house.types';
import { TaskDomain, TaskActionType, PriorityLevel } from './common.types';
import { PetType, SelfCareItem } from './user.types';

/**
 * Task 템플릿 항목
 */
export interface TaskTemplateItem {
  id: string;
  title: string;
  description: string;
  domain: TaskDomain;
  actionType: TaskActionType;
  defaultRecurrence: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number; // custom일 때 사용 (일 단위)
  };
  estimatedMinutes: number;
  priority: PriorityLevel;
  whyNeeded?: string;
  howTo?: string;
  imageUrls?: string[];
  referenceLinks?: { label: string; url: string }[];
  /**
   * 온보딩 자동 생성 설정.
   * 이 필드가 있는 항목만 온보딩 시 Task로 생성된다.
   */
  onboarding?: {
    interval: number;
    unit: 'day' | 'week' | 'month';
    linkedFurnitureType?: FurnitureType;
    /** 반려동물 모듈 전용 — 해당 petType에만 포함 */
    petType?: PetType;
    /** 자기관리 모듈 전용 — 해당 카테고리 선택 시에만 포함 */
    selfCareCategory?: SelfCareItem;
  };
}

/**
 * UI에서 "이유" / "진행방법" 탭에 표시하는 상세 정보.
 * furnitureTaskTemplates.ts 의 whyNeeded / howTo 필드에서 로컬로 조회한다.
 */
export interface TaskTemplateDetail {
  templateItemId: string;
  whyNeeded?: string;
  howTo?: string;
  imageUrls?: string[];
  referenceLinks?: { label: string; url: string }[];
  updatedAt: number;
}

/**
 * 가구별 Task 템플릿
 */
export interface FurnitureTaskTemplate {
  id: string;
  furnitureType: FurnitureType;
  furnitureName: string; // 한글 이름
  tasks: TaskTemplateItem[];
  description?: string;
}

/**
 * Task 추가 시 사용자 커스터마이징 데이터
 */
export interface TaskCustomization {
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number; // weekly: 주 간격, monthly: 월 간격, custom: 일 간격
  dayOfWeek?: number; // weekly일 때: 0(일)~6(토)
  dayOfMonth?: number; // monthly일 때: 1~31
  estimatedMinutes?: number;
  priority?: PriorityLevel;
  notificationEnabled?: boolean;
  notificationMinutesBefore?: number;
  notificationTime?: string; // 알림 시간 (HH:MM 형식)
  hasTime?: boolean; // true면 startDate의 시·분을 nextDue에 그대로 반영
  customTitle?: string; // 사용자 지정 제목
}

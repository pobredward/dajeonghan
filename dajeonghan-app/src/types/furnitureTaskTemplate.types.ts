/**
 * 가구별 Task 템플릿 타입 정의
 * 
 * 관리자가 정의한 가구별 추천 Task 템플릿
 */

import { FurnitureType } from './house.types';
import { ModuleType, PriorityLevel } from './common.types';

/**
 * Task 템플릿 항목
 */
export interface TaskTemplateItem {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  defaultRecurrence: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number; // custom일 때 사용 (일 단위)
  };
  estimatedMinutes: number;
  priority: PriorityLevel;
  category?: string; // 세부 카테고리 (예: "청소", "관리", "점검")
  whyNeeded?: string;    // 이 Task가 필요한 이유 (로컬 fallback)
  howTo?: string;        // 수행 방법 (로컬 fallback)
  imageUrls?: string[];  // 관리자 업로드 사진 URL 목록 (로컬 fallback)
  referenceLinks?: { label: string; url: string }[]; // 참고 링크 (유튜브 등)
}

/**
 * Firestore에서 관리자가 작성하는 Task 템플릿 상세 정보
 * 컬렉션 경로: /taskTemplateDetails/{templateItemId}
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
}

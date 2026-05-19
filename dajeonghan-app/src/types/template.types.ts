/**
 * 다정한 - Template 타입 정의
 * 
 * 공유 템플릿 시스템을 위한 타입을 정의합니다.
 */

import { BaseEntity } from './common.types';
import { Task } from './task.types';
import { HouseLayout, RoomType, FurnitureType, FurnitureMetadata } from './house.types';

/**
 * 템플릿 카테고리
 * 
 * 사용자의 라이프스타일에 따른 템플릿 분류
 */
export type TemplateCategory = 
  | 'student_living_alone'
  | 'worker_single'
  | 'worker_roommate'
  | 'newlywed'
  | 'family_with_kids'
  | 'pet_owner'
  | 'minimalist'
  | 'weekend_warrior'
  | 'custom';

/**
 * 템플릿 내 Task (userId, id, nextDue 제외)
 */
export type TemplateTask = Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'recurrence'> & {
  recurrence: Omit<Task['recurrence'], 'nextDue' | 'lastCompleted'>;
};

/**
 * 배치도 스냅샷 (공유용 — userId/id 제거된 순수 구조)
 */
export interface SharedHouseLayout {
  layoutType: HouseLayout['layoutType'];
  canvasSize: HouseLayout['canvasSize'];
  rooms: SharedRoom[];
  character: HouseLayout['character'];
}

export interface SharedRoom {
  type: RoomType;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  furnitures: SharedFurniture[];
}

export interface SharedFurniture {
  type: FurnitureType;
  name: string;
  emoji: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  furnitureMetadata?: FurnitureMetadata;
  tasks: TemplateTask[];
}

/**
 * 템플릿 정렬 옵션
 */
export type TemplateSortOption = 'recent' | 'popular' | 'downloads' | 'mine';

/**
 * 공유 템플릿 메인 인터페이스
 * 
 * 사용자가 만든 배치도+업무 세트를 다른 사용자와 공유할 수 있습니다.
 */
export interface SharedTemplate extends BaseEntity {
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  
  name: string;
  description: string;
  tags: string[];
  category: TemplateCategory;
  thumbnail?: string;
  
  /** 배치도 스냅샷 (없으면 업무 전용 템플릿) */
  houseLayout?: SharedHouseLayout;
  /** 배치도 없는 업무 전용 템플릿용 */
  tasks: TemplateTask[];
  
  usageCount: number;
  likeCount: number;
  commentCount: number;
  reviewCount: number;
  averageRating: number;
  
  isPublic: boolean;
  isFeatured: boolean;
}

/**
 * 템플릿 리뷰
 */
export interface TemplateReview extends BaseEntity {
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  
  rating: number;
  comment: string;
  
  helpfulCount: number;
}

/**
 * 템플릿 좋아요
 */
export interface TemplateLike extends BaseEntity {
  templateId: string;
  userId: string;
}

/**
 * 템플릿 사용 기록
 */
export interface TemplateUsage extends BaseEntity {
  templateId: string;
  userId: string;
  appliedAt: Date;
}

/**
 * 템플릿 댓글
 */
export interface TemplateComment extends BaseEntity {
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
}

/**
 * 템플릿 검색 옵션
 */
export interface TemplateSearchOptions {
  query?: string;
  category?: TemplateCategory;
  tags?: string[];
  sortBy?: 'popular' | 'recent' | 'rating';
  limit?: number;
  offset?: number;
}

/**
 * 템플릿 생성 입력
 */
export type TemplateCreateInput = Omit<SharedTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'likeCount' | 'commentCount' | 'reviewCount' | 'averageRating'>;

/**
 * 템플릿 수정 입력
 */
export type TemplateUpdateInput = Partial<Pick<SharedTemplate, 'name' | 'description' | 'tags' | 'category' | 'thumbnail' | 'isPublic'>>;

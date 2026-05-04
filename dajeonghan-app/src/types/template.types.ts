/**
 * 다정한 - Template 타입 정의
 * 
 * 공유 템플릿 시스템을 위한 타입을 정의합니다.
 * Step 14에서 사용됩니다.
 */

import { BaseEntity } from './common.types';
import { Task } from './task.types';

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
 * 공유 템플릿 메인 인터페이스
 * 
 * 사용자가 만든 Task 세트를 다른 사용자와 공유할 수 있습니다.
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
  
  tasks: TemplateTask[];
  
  usageCount: number;
  likeCount: number;
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
export type TemplateCreateInput = Omit<SharedTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'likeCount' | 'reviewCount' | 'averageRating'>;

/**
 * 템플릿 수정 입력
 */
export type TemplateUpdateInput = Partial<Pick<SharedTemplate, 'name' | 'description' | 'tags' | 'category' | 'thumbnail' | 'isPublic'>>;

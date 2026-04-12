import { Task } from '@/types/task.types';
import { LifeObject } from '@/types/lifeobject.types';

/**
 * 청소 객체 (CleaningObject)
 * 
 * 방/공간 기반의 청소 항목을 정의합니다.
 * 예: 화장실 청소, 거실 바닥 청소 등
 */
export interface CleaningObject extends LifeObject {
  type: 'cleaning';
  metadata: CleaningMetadata;
}

/**
 * 청소 메타데이터
 */
export interface CleaningMetadata {
  /** 청소할 방/공간 */
  room: RoomType;
  
  /** 난이도 (1: 매우 쉬움 ~ 5: 매우 어려움) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  
  /** 건강 우선순위 (화장실/주방 등) */
  healthPriority: boolean;
  
  /** 필요한 도구/장비 (예: 세탁기, 청소기) */
  requiresTools?: string[];
  
  /** 계절별 주기 조정 여부 (예: 여름엔 더 자주) */
  seasonalAdjustment?: boolean;
}

/**
 * 방/공간 타입
 */
export type RoomType = 
  | '거실'
  | '침실'
  | '화장실'
  | '주방'
  | '현관'
  | '베란다'
  | '전체';

/**
 * 청소 태스크 (CleaningTask)
 * 
 * Task를 확장하여 청소 특화 필드 추가
 */
export interface CleaningTask extends Task {
  type: 'cleaning';
  
  /** 더러움 점수 (0~10), 경과일 기반 자동 계산 */
  dirtyScore: number;
  
  /** CleaningMetadata 타입 보장 */
  metadata: CleaningMetadata;
}

/**
 * 청소 세션
 * 
 * 오늘의 청소 코스 (10분 코스, 여유 코스 등)
 */
export interface CleaningSession {
  /** 선택된 청소 태스크 목록 */
  tasks: CleaningTask[];
  
  /** 총 예상 소요 시간 (분) */
  totalMinutes: number;
  
  /** 총 더러움 점수 합계 */
  totalPoints: number;
}

/**
 * 청소 템플릿 항목
 * 
 * JSON 템플릿 파일에서 사용되는 구조
 */
export interface CleaningTemplateItem {
  name: string;
  room: RoomType;
  interval: number;
  unit: 'day' | 'week' | 'month';
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  healthPriority: boolean;
  priority: 'low' | 'medium' | 'high';
  requiresTools?: string[];
  seasonalAdjustment?: boolean;
}

/**
 * 청소 템플릿 컬렉션
 */
export interface CleaningTemplates {
  [persona: string]: CleaningTemplateItem[];
}

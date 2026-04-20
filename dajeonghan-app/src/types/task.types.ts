/**
 * 다정한 - Task 타입 정의
 * 
 * 생활 객체에 연결되는 Task와 관련 로그를 정의합니다.
 */

import {
  ModuleType,
  PriorityLevel,
  TaskStatus,
  Recurrence,
  NotificationSettings,
  CompletionHistory,
  UserOwnedEntity,
} from './common.types';

// Re-export common types for convenience
export type { CompletionHistory, Recurrence, NotificationSettings, ModuleType, PriorityLevel, TaskStatus };

/**
 * Task 메인 인터페이스
 * 
 * LifeObject에 연결되어 실제 해야 할 작업을 나타냅니다.
 * 주기 관리, 우선순위, 알림 설정, 완료 이력 등을 포함합니다.
 */
export interface Task extends UserOwnedEntity {
  objectId: string;
  title: string;
  description?: string;
  type: ModuleType;
  recurrence: Recurrence;
  priority: PriorityLevel;
  estimatedMinutes: number;
  status: TaskStatus;
  notificationSettings: NotificationSettings;
  completionHistory: CompletionHistory[];
  dirtyScore?: number;
  urgencyScore?: number;
  furnitureId?: string; // 가구 연결용
  isCompleted?: boolean; // 일회성 태스크 완료 여부
  completedAt?: Date; // 완료 일시
  lastCompletedAt?: Date; // 마지막 완료 일시 (반복 태스크용)
  completionDates?: string[]; // 완료된 날짜들의 배열 (toDateString() 형태로 저장)
}

/**
 * Task 생성 시 필요한 입력 데이터
 * (자동 생성 필드 제외)
 */
export type TaskCreateInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completionHistory' | 'dirtyScore' | 'urgencyScore'>;

/**
 * Task 수정 시 필요한 입력 데이터
 */
export type TaskUpdateInput = Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Task 액션 타입
 */
export type TaskAction = 'completed' | 'postponed' | 'skipped';

/**
 * Task 로그 인터페이스
 * 
 * Task의 완료, 미루기, 건너뛰기 등의 액션을 기록합니다.
 */
export interface TaskLog extends UserOwnedEntity {
  taskId: string;
  objectId: string;
  action: TaskAction;
  timestamp: Date;
  note?: string;
  nextDue?: Date;
}

/**
 * Dose 로그 인터페이스
 * 
 * 약 복용 기록을 관리합니다.
 */
export interface DoseLog extends UserOwnedEntity {
  medicineId: string;
  scheduledTime: Date;
  actualTime?: Date;
  taken: boolean;
  note?: string;
}

/**
 * Task 필터 옵션
 */
export interface TaskFilterOptions {
  type?: ModuleType;
  status?: TaskStatus;
  priority?: PriorityLevel;
  dueDateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Task 정렬 옵션
 */
export type TaskSortOption = 'dueDate' | 'priority' | 'createdAt' | 'urgencyScore';

/**
 * Task 쿼리 옵션
 */
export interface TaskQueryOptions {
  filter?: TaskFilterOptions;
  sort?: TaskSortOption;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

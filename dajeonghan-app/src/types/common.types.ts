/**
 * 다정한 - 공통 타입 정의
 * 
 * 모든 모듈에서 공통으로 사용하는 기본 타입들을 정의합니다.
 * - 모듈 타입
 * - 주기 관련 타입
 * - 우선순위 타입
 * - 상태 타입
 * - 알림 타입
 */

export type ModuleType = 'cleaning' | 'food' | 'medicine' | 'self_care' | 'self_development';

export type RecurrenceType = 'fixed' | 'flexible';

export type RecurrenceUnit = 'day' | 'week' | 'month';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'completed' | 'postponed';

export type NotificationTiming = 'immediate' | 'digest' | 'silent';

/**
 * 주기 설정 인터페이스
 * 
 * @property type - 고정 주기 vs 유연 주기
 * @property interval - 주기 간격 (숫자)
 * @property unit - 주기 단위 (일/주/월)
 * @property nextDue - 다음 예정일
 * @property lastCompleted - 마지막 완료일 (optional)
 */
export interface Recurrence {
  type: RecurrenceType;
  interval: number;
  unit: RecurrenceUnit;
  nextDue: Date;
  lastCompleted?: Date;
}

/**
 * 알림 설정 인터페이스
 * 
 * @property enabled - 알림 활성화 여부
 * @property timing - 알림 타이밍 전략
 * @property advanceHours - 사전 알림 시간 배열 (예: [24, 3] = 24시간 전, 3시간 전)
 */
export interface NotificationSettings {
  enabled: boolean;
  timing: NotificationTiming;
  advanceHours: number[];
}

/**
 * 완료 이력 인터페이스
 * 
 * @property date - 완료 날짜
 * @property postponed - 미루기 여부
 * @property actualInterval - 이전 완료부터 경과 일수 (optional)
 */
export interface CompletionHistory {
  date: Date;
  postponed: boolean;
  actualInterval?: number;
}

/**
 * 기본 엔티티 인터페이스
 * 모든 데이터 모델이 공통으로 가지는 메타데이터
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * 사용자 소유 엔티티 인터페이스
 * 사용자에게 속하는 데이터가 공통으로 가지는 필드
 */
export interface UserOwnedEntity extends BaseEntity {
  userId: string;
}

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

/**
 * Task 도메인 — "이 task는 어떤 삶의 영역인가?" (Layer 1)
 * UI 필터, 알림 그룹, 통계 대시보드, 온보딩 카테고리에 사용
 */
export type TaskDomain =
  | 'home'       // 집·가구 유지관리 (침대·화장실·세탁기 등)
  | 'food'       // 식품·냉장 관리 (냉장고)
  | 'medicine'   // 약·영양제 복용 (약장)
  | 'pet'        // 반려동물 케어
  | 'self_care'  // 개인 신체 케어 (스킨케어·운동·미용)
  | 'car'        // 차량 관리
  | 'family'     // 가족 케어 (영아 등)
  | 'growth';    // 자기계발·성장

/**
 * Task 행위 유형 — "이 task는 어떤 종류의 행위인가?" (Layer 2)
 * 가구 탭 소분류, 알림 타이밍 전략, AI 추천 피처에 사용
 */
export type TaskActionType =
  | 'cleaning'      // 물리적 청소·세척·소독
  | 'inspection'    // 상태 점검·확인
  | 'maintenance'   // 수리·유지보수·관리
  | 'organization'  // 정리·정돈
  | 'health'        // 복용·투여·접종
  | 'routine';      // 일상 루틴·돌봄·습관

/** 하위 호환 alias — Firestore 기존 데이터 마이그레이션 기간 중 유지 */
export type ModuleType = TaskDomain;

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
 * @property hasTime - true면 nextDue의 시·분이 유효한 값 (false/미설정 시 09:00 고정)
 */
export interface Recurrence {
  type: RecurrenceType;
  interval: number;
  unit: RecurrenceUnit;
  nextDue: Date;
  lastCompleted?: Date;
  hasTime?: boolean;
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

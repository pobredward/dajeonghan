/**
 * 다정한 - 엔진 통합 Export
 * 
 * 모든 엔진을 한 곳에서 import할 수 있도록 합니다.
 * 
 * @example
 * import { LifeEngineService, RecurrenceEngine } from '@/engines';
 */

export { RecurrenceEngine } from './RecurrenceEngine';
export { PostponeEngine } from './PostponeEngine';
export { PriorityCalculator } from './PriorityCalculator';
export { NotificationOrchestrator } from './NotificationOrchestrator';
export { LifeEngineService } from './LifeEngineService';

export type { PrioritizedTask } from './PriorityCalculator';
export type { PostponeReason } from './PostponeEngine';
export type { OrchestratorDigest } from './NotificationOrchestrator';
export type {
  CompleteTaskResult,
  PostponeTaskResult,
  DailyTasksResult
} from './LifeEngineService';

/**
 * 다정한 - 데이터 검증 유틸리티
 * 
 * 런타임에서 타입 안전성을 보장하기 위한 검증 함수들입니다.
 */

import { Task, TaskCreateInput } from './task.types';
import { UserProfile } from './user.types';
import { SharedTemplate } from './template.types';

/**
 * Task 검증
 */
export const isValidTask = (task: Partial<Task>): task is Task => {
  return !!(
    task.id &&
    task.userId &&
    task.furnitureId &&
    task.title &&
    task.type &&
    task.recurrence &&
    task.priority &&
    task.status &&
    task.estimatedMinutes !== undefined &&
    task.notificationSettings &&
    Array.isArray(task.completionHistory) &&
    task.createdAt &&
    task.updatedAt
  );
};

/**
 * TaskCreateInput 검증
 */
export const isValidTaskCreateInput = (input: Partial<TaskCreateInput>): input is TaskCreateInput => {
  return !!(
    input.userId &&
    input.furnitureId &&
    input.title &&
    input.type &&
    input.recurrence &&
    input.priority &&
    input.status &&
    input.estimatedMinutes !== undefined &&
    input.notificationSettings
  );
};

/**
 * UserProfile 검증
 */
export const isValidUserProfile = (profile: Partial<UserProfile>): profile is UserProfile => {
  return !!(
    profile.id &&
    profile.userId &&
    profile.persona &&
    profile.environment &&
    profile.notificationMode &&
    Array.isArray(profile.digestTimes) &&
    typeof profile.onboardingCompleted === 'boolean' &&
    profile.createdAt &&
    profile.updatedAt
  );
};

/**
 * SharedTemplate 검증
 */
export const isValidSharedTemplate = (template: Partial<SharedTemplate>): template is SharedTemplate => {
  return !!(
    template.id &&
    template.creatorId &&
    template.creatorName &&
    template.name &&
    template.description &&
    Array.isArray(template.tags) &&
    template.category &&
    Array.isArray(template.tasks) &&
    typeof template.usageCount === 'number' &&
    typeof template.likeCount === 'number' &&
    typeof template.reviewCount === 'number' &&
    typeof template.averageRating === 'number' &&
    typeof template.isPublic === 'boolean' &&
    typeof template.isFeatured === 'boolean' &&
    template.createdAt &&
    template.updatedAt
  );
};

/**
 * 이메일 형식 검증
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 날짜 형식 검증
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * 시간 문자열 검증 (HH:mm 형식)
 */
export const isValidTimeString = (time: string): boolean => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * 주기 검증
 */
export const isValidRecurrence = (recurrence: any): boolean => {
  return !!(
    recurrence &&
    (recurrence.type === 'fixed' || recurrence.type === 'flexible') &&
    typeof recurrence.interval === 'number' &&
    recurrence.interval > 0 &&
    (recurrence.unit === 'day' || recurrence.unit === 'week' || recurrence.unit === 'month') &&
    isValidDate(recurrence.nextDue)
  );
};

/**
 * 우선순위 검증
 */
export const isValidPriority = (priority: any): boolean => {
  return ['urgent', 'high', 'medium', 'low'].includes(priority);
};

/**
 * 상태 검증
 */
export const isValidTaskStatus = (status: any): boolean => {
  return ['pending', 'completed', 'postponed'].includes(status);
};

/**
 * 모듈 타입 검증
 */
export const isValidModuleType = (type: any): boolean => {
  return ['cleaning', 'food', 'medicine', 'self_care', 'self_development'].includes(type);
};

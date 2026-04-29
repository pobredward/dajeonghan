/**
 * 다정한 - User 타입 정의
 * 
 * 사용자 프로필, 환경 설정, 알림 설정 등을 정의합니다.
 */

import { BaseEntity } from './common.types';

/**
 * 알림 모드
 */
export type NotificationMode = 'immediate' | 'digest' | 'minimal';

/**
 * 페르소나 타입
 * 
 * 사용자의 라이프스타일에 따른 프리셋
 */
export type PersonaType = 
  | 'solo_young'
  | 'solo_worker'
  | 'couple_no_kid'
  | 'family_with_kid'
  | 'family_school_kid'
  | 'pet_owner'
  | 'freelancer_homebody'
  | 'senior_couple'
  | 'custom';

/**
 * 자기관리 항목
 */
export type SelfCareItem =
  | 'skincare'
  | 'gym'
  | 'hair'
  | 'nails'
  | 'wax'
  | 'massage'
  | 'dental';

/**
 * 반려동물 타입
 */
export type PetType = 'dog' | 'cat' | 'other';

/**
 * 요리 빈도
 */
export type CookingFrequency = 'rarely' | 'sometimes' | 'often' | 'daily';

/**
 * 사용자 환경 정보
 * 
 * 사용자의 생활 환경에 대한 정보를 담습니다.
 * 이 정보를 기반으로 Task 추천과 주기 조정이 이루어집니다.
 */
export interface UserEnvironment {
  hasWasher: boolean;
  hasDryer: boolean;
  usesCoinLaundry: boolean;
  cookingFrequency: CookingFrequency;
  hasPet: boolean;
  petType?: PetType;
  householdSize: number;
  hasInfant: boolean;
  hasCar: boolean;
  hasPlant: boolean;
  selfCareItems: SelfCareItem[];
}

/**
 * 온보딩 응답 데이터
 * 
 * 버전별로 다를 수 있는 원본 온보딩 답변을 저장합니다.
 * 나중에 재분석이나 마이그레이션에 사용할 수 있습니다.
 */
export interface OnboardingResponse {
  version: string; // 'v1', 'v2' 등
  timestamp: Date;
  rawAnswers: Record<string, any>; // 원본 질문-답변 쌍
  questionFlowId?: string; // 사용된 질문 템플릿 ID
}

/**
 * 사용자 프로필
 * 
 * 사용자의 기본 정보와 설정을 관리합니다.
 */
export interface UserProfile extends BaseEntity {
  userId: string;
  persona: PersonaType;
  environment: UserEnvironment;
  notificationMode: NotificationMode;
  digestTimes: string[];
  onboardingCompleted: boolean;
  onboardingDate?: Date;
  onboardingResponse?: OnboardingResponse;
  profileVersion: string;
  username?: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  followersCount?: number;
  followingCount?: number;
}

export interface PublicProfile {
  userId: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
}

/**
 * 온보딩 단계
 */
export type OnboardingStep = 
  | 'welcome'
  | 'persona_selection'
  | 'environment_setup'
  | 'notification_setup'
  | 'initial_tasks'
  | 'completed';

/**
 * 온보딩 상태
 */
export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  selectedPersona?: PersonaType;
  environmentData?: Partial<UserEnvironment>;
  notificationPreferences?: {
    mode?: NotificationMode;
    digestTimes?: string[];
  };
}

/**
 * 사용자 설정
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  timezone: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    shareStats: boolean;
    allowTemplateCreation: boolean;
  };
}

/**
 * 사용자 통계
 */
export interface UserStats {
  userId: string;
  totalTasksCompleted: number;
  totalTasksPostponed: number;
  currentStreak: number;
  longestStreak: number;
  moduleStats: {
    cleaning: ModuleStats;
    food: ModuleStats;
    medicine: ModuleStats;
    self_care: ModuleStats;
    self_development: ModuleStats;
  };
  lastUpdated: Date;
}

/**
 * 모듈별 통계
 */
export interface ModuleStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageInterval: number;
  lastCompleted?: Date;
}

/**
 * 다정한 - 온보딩 서비스
 * 
 * 사용자의 첫 사용 경험을 관리합니다.
 * - 페르소나 기반 프로필 생성
 * - 초기 테스크 자동 생성
 * - 템플릿 적용
 */

import { UserProfile, PersonaType, UserEnvironment, NotificationMode } from '@/types/user.types';
import { Task } from '@/types/task.types';
import { CleaningService } from '@/modules/cleaning/CleaningService';
import * as Crypto from 'expo-crypto';
import personas from '@/templates/personas.json';

/**
 * 온보딩 답변 인터페이스
 */
export interface OnboardingAnswers {
  washer?: boolean;
  dryer?: boolean;
  cooking?: 'rarely' | 'sometimes' | 'often' | 'daily';
  medicine?: boolean;
  self_care_level?: 'basic' | 'intermediate' | 'advanced' | 'none';
  gender?: 'male' | 'female' | 'non_binary' | 'all';
  notification?: NotificationMode;
}

/**
 * 페르소나 정의
 */
interface PersonaDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultEnvironment: {
    hasWasher: boolean;
    hasDryer: boolean;
    usesCoinLaundry: boolean;
    cookingFrequency: 'rarely' | 'sometimes' | 'often' | 'daily';
    hasPet: boolean;
    householdSize: number;
  };
}

export class OnboardingService {
  /**
   * 페르소나로부터 프로필 생성
   * 
   * @param userId 사용자 ID
   * @param personaId 선택한 페르소나
   * @param answers 온보딩 질문 답변
   * @returns 생성된 사용자 프로필
   */
  static createProfileFromPersona(
    userId: string,
    personaId: PersonaType,
    answers: OnboardingAnswers
  ): UserProfile {
    const persona = (personas as { personas: PersonaDefinition[] }).personas.find(
      p => p.id === personaId
    );
    
    if (!persona) {
      throw new Error(`Invalid persona: ${personaId}`);
    }

    const environment: UserEnvironment = {
      hasWasher: answers.washer ?? persona.defaultEnvironment.hasWasher,
      hasDryer: answers.dryer ?? persona.defaultEnvironment.hasDryer,
      usesCoinLaundry: answers.washer === false,
      cookingFrequency: answers.cooking ?? persona.defaultEnvironment.cookingFrequency,
      hasPet: persona.defaultEnvironment.hasPet,
      householdSize: persona.defaultEnvironment.householdSize
    };

    const now = new Date();

    return {
      id: Crypto.randomUUID(),
      userId,
      persona: personaId,
      environment,
      notificationMode: answers.notification ?? 'digest',
      digestTimes: ['09:00', '20:00'],
      onboardingCompleted: false,
      onboardingDate: now,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 초기 테스크 생성 (청소 모듈)
   * 
   * 온보딩 완료 시 자동으로 청소 테스크를 생성합니다.
   * 
   * @param userId 사용자 ID
   * @param profile 사용자 프로필
   * @returns 생성된 테스크 배열
   */
  static async createInitialTasks(
    userId: string,
    profile: UserProfile
  ): Promise<Task[]> {
    const cleaningTasks = CleaningService.createTasksFromTemplate(
      userId,
      profile.persona,
      profile.environment
    );

    return cleaningTasks;
  }

  /**
   * "오늘 할 일" 즉시 생성
   * 
   * 온보딩 완료 후 사용자에게 보여줄 첫 할일 목록을 생성합니다.
   * 간단한 것부터 5개를 선택합니다.
   * 
   * @param tasks 전체 테스크 목록
   * @returns 오늘 할 일 5개
   */
  static generateFirstDayTasks(tasks: Task[]): Task[] {
    const sorted = [...tasks]
      .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
      .slice(0, 5);

    return sorted;
  }

  /**
   * 온보딩 완료 마킹
   * 
   * @param profile 사용자 프로필
   * @returns 온보딩 완료 처리된 프로필
   */
  static markOnboardingCompleted(profile: UserProfile): UserProfile {
    return {
      ...profile,
      onboardingCompleted: true,
      onboardingDate: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 고급 설정 잠금 해제 여부 확인
   * 
   * 온보딩 완료 후 7일이 지났는지 확인합니다.
   * 
   * @param profile 사용자 프로필
   * @returns 고급 설정 사용 가능 여부
   */
  static canAccessAdvancedSettings(profile: UserProfile): boolean {
    if (!profile.onboardingDate) {
      return false;
    }

    const now = new Date();
    const onboardingDate = new Date(profile.onboardingDate);
    const daysPassed = Math.floor(
      (now.getTime() - onboardingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysPassed >= 7;
  }

  /**
   * 페르소나 목록 가져오기
   * 
   * @returns 페르소나 목록
   */
  static getPersonas(): PersonaDefinition[] {
    return (personas as { personas: PersonaDefinition[] }).personas;
  }

  /**
   * 페르소나 정보 가져오기
   * 
   * @param personaId 페르소나 ID
   * @returns 페르소나 정보
   */
  static getPersona(personaId: PersonaType): PersonaDefinition | undefined {
    return (personas as { personas: PersonaDefinition[] }).personas.find(
      p => p.id === personaId
    );
  }
}

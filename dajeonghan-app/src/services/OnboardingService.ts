/**
 * 다정한 - 온보딩 서비스
 * 
 * 사용자의 첫 사용 경험을 관리합니다.
 * - 페르소나 기반 프로필 생성
 * - 초기 테스크 자동 생성
 * - 템플릿 적용
 */

import { UserProfile, PersonaType, UserEnvironment, NotificationMode, OnboardingResponse } from '@/types/user.types';
import { Task } from '@/types/task.types';
import { HouseLayout, FurnitureType } from '@/types/house.types';
import { CleaningService } from '@/modules/cleaning/CleaningService';
import { getLayoutTemplate, saveHouseLayout } from '@/services/houseService';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as Crypto from 'expo-crypto';
import personas from '@/templates/personas.json';
import cleaningTemplatesData from '@/modules/cleaning/templates/cleaningTemplates.json';
import { CleaningTemplateItem } from '@/modules/cleaning/types';

// 현재 온보딩 버전
const ONBOARDING_VERSION = 'v1';
const PROFILE_VERSION = '1.0';

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

    // 원본 온보딩 답변 저장
    const onboardingResponse: OnboardingResponse = {
      version: ONBOARDING_VERSION,
      timestamp: now,
      rawAnswers: { ...answers },
      questionFlowId: 'default_v1',
    };

    return {
      id: Crypto.randomUUID(),
      userId,
      persona: personaId,
      environment,
      notificationMode: answers.notification ?? 'digest',
      digestTimes: ['09:00', '20:00'],
      onboardingCompleted: false,
      onboardingDate: now,
      onboardingResponse, // 원본 답변 보관
      profileVersion: PROFILE_VERSION, // 프로필 스키마 버전
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 온보딩 시 레이아웃(+기본 가구)을 Firestore에 저장합니다.
   * hasWasher가 false면 washing_machine 가구를 제거합니다.
   *
   * @param userId 저장할 사용자 ID (게스트 완료 후 교체된 실제 ID)
   * @param layoutType 온보딩에서 선택한 집 타입
   * @param hasWasher 세탁기 보유 여부
   * @returns 저장된 HouseLayout (가구 ID 참조용)
   */
  static async createAndSaveLayout(
    userId: string,
    layoutType: HouseLayout['layoutType'],
    hasWasher: boolean
  ): Promise<HouseLayout> {
    const template = getLayoutTemplate(layoutType);

    // hasWasher === false 이면 세탁기 가구 제거
    if (!hasWasher) {
      template.rooms = template.rooms.map((room) => ({
        ...room,
        furnitures: room.furnitures.filter((f) => f.type !== 'washing_machine'),
      }));
    }

    const layout: HouseLayout = {
      ...template,
      id: 'main',
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveHouseLayout(layout);
    console.log(`✅ 집 레이아웃 저장 완료 (${layoutType}, 가구 ${layout.rooms.reduce((acc, r) => acc + r.furnitures.length, 0)}개)`);
    return layout;
  }

  /**
   * 레이아웃의 가구 목록에서 furnitureType → {furnitureId, roomId} 맵을 빌드합니다.
   * 같은 타입의 가구가 여러 개일 때는 첫 번째를 사용합니다.
   */
  private static buildFurnitureTypeMap(
    layout: HouseLayout
  ): Map<FurnitureType, { furnitureId: string; roomId: string }> {
    const map = new Map<FurnitureType, { furnitureId: string; roomId: string }>();
    for (const room of layout.rooms) {
      for (const furniture of room.furnitures) {
        if (!map.has(furniture.type)) {
          map.set(furniture.type, { furnitureId: furniture.id, roomId: room.id });
        }
      }
    }
    return map;
  }

  /**
   * 청소 Task의 objectId를 해당 가구의 linkedObjectIds에 연결합니다.
   * 레이아웃을 한 번만 업데이트해 저장 횟수를 최소화합니다.
   *
   * @param layout 이미 저장된 HouseLayout (변경 후 재저장)
   * @param tasks 생성된 CleaningTask 배열
   * @param templates 페르소나의 CleaningTemplateItem 배열 (linkedFurnitureType 참조)
   * @returns 가구 연동이 반영된 HouseLayout
   */
  static linkTasksToFurnitures(
    layout: HouseLayout,
    tasks: Task[],
    templates: CleaningTemplateItem[]
  ): HouseLayout {
    const furnitureMap = this.buildFurnitureTypeMap(layout);

    // task와 template을 index로 매핑 (CleaningService가 같은 순서로 생성)
    tasks.forEach((task, index) => {
      const template = templates[index];
      if (!template?.linkedFurnitureType) return;

      const target = furnitureMap.get(template.linkedFurnitureType);
      if (!target) return;

      const room = layout.rooms.find((r) => r.id === target.roomId);
      const furniture = room?.furnitures.find((f) => f.id === target.furnitureId);
      if (!furniture) return;

      if (!furniture.linkedObjectIds.includes(task.objectId)) {
        furniture.linkedObjectIds.push(task.objectId);
        console.log(`🔗 "${task.title}" → ${template.linkedFurnitureType} (${target.furnitureId})`);
      }
    });

    layout.updatedAt = new Date();
    return layout;
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
   * 온보딩 Task마다 lifeObjects 컬렉션에 문서를 생성하고 objectId를 실제 Firestore ID로 교체합니다.
   *
   * 직접 추가 Task(FurnitureTaskService)는 lifeObject 문서 ID를 objectId로 사용하는 반면,
   * 온보딩 자동 생성 Task는 "cleaning_obj_{uid}_{index}" 합성 ID를 사용합니다.
   * 이 불일치를 해결하여 HouseMapScreen 집계 및 기타 lifeObject 조회가 정상 작동하게 합니다.
   *
   * @param userId 사용자 ID
   * @param tasks 합성 objectId를 가진 Task 배열
   * @returns objectId가 실제 Firestore lifeObject 문서 ID로 교체된 Task 배열
   */
  static async createLifeObjectsForTasks(
    userId: string,
    tasks: Task[]
  ): Promise<Task[]> {
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        const lifeObjectData = {
          userId,
          type: task.type,
          name: task.title,
          metadata: {
            room: (task as any).metadata?.room ?? '전체',
            difficulty: (task as any).metadata?.difficulty ?? 2,
            healthPriority: (task as any).metadata?.healthPriority ?? false,
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        const ref = await addDoc(
          collection(db, 'users', userId, 'lifeObjects'),
          lifeObjectData
        );
        return { ...task, objectId: ref.id };
      })
    );
    console.log(`✅ lifeObjects 생성 완료 (${updatedTasks.length}개)`);
    return updatedTasks;
  }

  /**
   * 템플릿 데이터를 페르소나 키로 조회합니다.
   */
  static getCleaningTemplates(persona: string): CleaningTemplateItem[] {
    const templates = cleaningTemplatesData as Record<string, CleaningTemplateItem[]>;
    return templates[persona] ?? templates['student_20s'];
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

  /**
   * 프로필 마이그레이션 필요 여부 확인
   * 
   * @param profile 사용자 프로필
   * @returns 마이그레이션 필요 여부
   */
  static needsMigration(profile: UserProfile): boolean {
    return !profile.profileVersion || profile.profileVersion !== PROFILE_VERSION;
  }

  /**
   * 프로필 마이그레이션
   * 
   * 이전 버전의 프로필을 현재 버전으로 업데이트합니다.
   * 
   * @param profile 사용자 프로필
   * @returns 마이그레이션된 프로필
   */
  static migrateProfile(profile: UserProfile): UserProfile {
    // 버전별 마이그레이션 로직
    let migratedProfile = { ...profile };

    // 버전이 없는 경우 (초기 버전)
    if (!migratedProfile.profileVersion) {
      migratedProfile.profileVersion = '1.0';
      
      // onboardingResponse가 없으면 빈 객체로 초기화
      if (!migratedProfile.onboardingResponse) {
        migratedProfile.onboardingResponse = {
          version: 'legacy',
          timestamp: migratedProfile.onboardingDate || new Date(),
          rawAnswers: {},
          questionFlowId: 'legacy',
        };
      }
    }

    // 향후 버전 추가 시 여기에 마이그레이션 로직 추가
    // if (migratedProfile.profileVersion === '1.0') {
    //   // 1.0 -> 2.0 마이그레이션
    // }

    migratedProfile.updatedAt = new Date();
    return migratedProfile;
  }

  /**
   * 기존 온보딩 완료 유저의 레이아웃 마이그레이션
   *
   * 온보딩을 이미 완료했으나 집 레이아웃이 없는 유저(구 버전)에게
   * 기본 가구가 포함된 원룸 레이아웃을 자동으로 생성합니다.
   * HouseSetupFlow에서 레이아웃이 없을 때 이미 선택 화면으로 안내하므로,
   * 이 함수는 프로그래매틱 자동 생성이 필요한 경우에 사용합니다.
   *
   * @param userId 사용자 ID
   * @param layoutType 기본값 'studio' (원룸)
   * @param hasWasher 세탁기 보유 여부
   */
  static async migrateLayoutIfMissing(
    userId: string,
    layoutType: HouseLayout['layoutType'] = 'studio',
    hasWasher: boolean = true
  ): Promise<boolean> {
    const { getHouseLayout } = await import('@/services/houseService');
    const existing = await getHouseLayout(userId);
    if (existing) {
      // 이미 레이아웃이 있으면 마이그레이션 불필요
      return false;
    }

    console.log('🏠 레이아웃 마이그레이션 시작 — 기존 유저에게 기본 레이아웃 생성');
    await this.createAndSaveLayout(userId, layoutType, hasWasher);
    return true;
  }
}

/**
 * 다정한 - 온보딩 서비스
 *
 * 사용자의 첫 사용 경험을 관리합니다.
 * - 페르소나 기반 프로필 생성
 * - 초기 Task 자동 생성 (청소·약·자기관리·반려동물·식물·차량·영아)
 * - 템플릿 적용
 */

import { UserProfile, PersonaType, UserEnvironment, NotificationMode, OnboardingResponse, SelfCareItem, PetType } from '@/types/user.types';
import { Task } from '@/types/task.types';
import { HouseLayout, FurnitureType, FURNITURE_DEFAULTS, createDefaultFurnitureMetadata } from '@/types/house.types';
import { CleaningService } from '@/modules/cleaning/CleaningService';
import { getLayoutTemplate, saveHouseLayout } from '@/services/houseService';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as Crypto from 'expo-crypto';
import personas from '@/templates/personas.json';
import cleaningTemplatesData from '@/modules/cleaning/templates/cleaningTemplates.json';
import { CleaningTemplateItem } from '@/modules/cleaning/types';

import medicineOnboardingTasks from '@/modules/medicine/templates/onboardingTasks.json';
import selfCareOnboardingTasks from '@/modules/self-care/templates/onboardingTasks.json';
import petOnboardingTasks from '@/modules/pet/templates/onboardingTasks.json';
import plantOnboardingTasks from '@/modules/plant/templates/onboardingTasks.json';
import carOnboardingTasks from '@/modules/car/templates/onboardingTasks.json';
import infantOnboardingTasks from '@/modules/infant/templates/onboardingTasks.json';

const ONBOARDING_VERSION = 'v2';
const PROFILE_VERSION = '2.0';

/**
 * 온보딩 답변 인터페이스
 */
export interface OnboardingAnswers {
  washer?: boolean;
  dryer?: boolean;
  cooking?: 'rarely' | 'sometimes' | 'often' | 'daily';
  has_pet?: boolean;
  pet_type?: PetType;
  has_infant?: boolean;
  medicine?: boolean;
  self_care?: SelfCareItem[];
  plant?: boolean;
  car?: boolean;
  notification?: NotificationMode;
}

/**
 * 온보딩 Task 템플릿 항목 (모듈 공통)
 */
interface OnboardingTaskTemplate {
  name: string;
  description: string;
  type: string;
  interval: number;
  unit: 'day' | 'week' | 'month';
  estimatedMinutes: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  linkedFurnitureType?: FurnitureType;
}

/**
 * 온보딩 시 조건부 추가 가구 설정
 */
export interface ExtraFurnitureConfig {
  hasPet: boolean;
  petType?: PetType;
  hasMedicine: boolean;
  hasCar: boolean;
  hasInfant: boolean;
  hasSelfCare: boolean;
  hasPlant: boolean;
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
    hasInfant: boolean;
    hasCar: boolean;
    hasPlant: boolean;
    selfCareItems: SelfCareItem[];
  };
}

export class OnboardingService {
  /**
   * 페르소나로부터 프로필 생성
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
      hasPet: answers.has_pet ?? persona.defaultEnvironment.hasPet,
      petType: answers.pet_type ?? undefined,
      householdSize: persona.defaultEnvironment.householdSize,
      hasInfant: answers.has_infant ?? persona.defaultEnvironment.hasInfant,
      hasCar: answers.car ?? persona.defaultEnvironment.hasCar,
      hasPlant: answers.plant ?? persona.defaultEnvironment.hasPlant,
      selfCareItems: answers.self_care ?? persona.defaultEnvironment.selfCareItems,
    };

    const now = new Date();

    const onboardingResponse: OnboardingResponse = {
      version: ONBOARDING_VERSION,
      timestamp: now,
      rawAnswers: { ...answers },
      questionFlowId: 'default_v2',
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
      onboardingResponse,
      profileVersion: PROFILE_VERSION,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 온보딩 시 레이아웃(+기본 가구)을 Firestore에 저장합니다.
   * extraFurnitures가 제공되면 조건에 따라 신규 가구를 레이아웃에 추가합니다.
   */
  static async createAndSaveLayout(
    userId: string,
    layoutType: HouseLayout['layoutType'],
    hasWasher: boolean,
    extraFurnitures?: ExtraFurnitureConfig
  ): Promise<HouseLayout> {
    const template = getLayoutTemplate(layoutType);

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

    if (extraFurnitures) {
      this.appendExtraFurnitures(layout, extraFurnitures);
    }

    await saveHouseLayout(layout);
    console.log(`✅ 집 레이아웃 저장 완료 (${layoutType}, 가구 ${layout.rooms.reduce((acc, r) => acc + r.furnitures.length, 0)}개)`);
    return layout;
  }

  /**
   * 조건에 따라 신규 가구를 레이아웃에 추가합니다.
   * 거실(living_room)이 없으면 첫 번째 방에 추가합니다.
   */
  private static appendExtraFurnitures(
    layout: HouseLayout,
    config: ExtraFurnitureConfig
  ): void {
    const getLivingRoom = () =>
      layout.rooms.find((r) => r.type === 'living_room') ?? layout.rooms[0];
    const getBathroomRoom = () =>
      layout.rooms.find((r) => r.type === 'bathroom') ?? getLivingRoom();

    const makeFurniture = (type: FurnitureType, targetRoom: any) => {
      const defaults = FURNITURE_DEFAULTS[type];
      const existingOfType = layout.rooms.flatMap((r) => r.furnitures).filter((f) => f.type === type);
      if (existingOfType.length > 0) return; // 이미 있으면 중복 추가 안 함

      const x = 10 + (targetRoom.furnitures.length % 5) * 60;
      const y = 10 + Math.floor(targetRoom.furnitures.length / 5) * 60;

      targetRoom.furnitures.push({
        id: `${type}_onboarding_${Crypto.randomUUID().slice(0, 8)}`,
        type,
        name: defaults?.emoji ? `${defaults.emoji}` : type,
        emoji: defaults?.emoji ?? '📦',
        position: { x, y },
        size: defaults?.defaultSize ?? { width: 50, height: 50 },
        rotation: 0,
        linkedObjectIds: [],
        dirtyScore: 0,
        furnitureMetadata: createDefaultFurnitureMetadata(type),
      });
      console.log(`🏠 신규 가구 추가: ${type} → ${targetRoom.type ?? targetRoom.id}`);
    };

    if (config.hasPet) makeFurniture('pet', getLivingRoom());
    if (config.hasMedicine) makeFurniture('medicine_cabinet', getBathroomRoom());
    if (config.hasCar) makeFurniture('car', getLivingRoom());
    if (config.hasInfant) makeFurniture('baby_station', getLivingRoom());
    if (config.hasSelfCare) makeFurniture('personal_care', getLivingRoom());
    // plant 가구는 기본 템플릿에 이미 포함되어 있으므로 중복 방지 로직이 자동 처리
    if (config.hasPlant) makeFurniture('plant', getLivingRoom());
  }

  /**
   * 레이아웃의 가구 목록에서 furnitureType → {furnitureId, roomId} 맵을 빌드합니다.
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
   * @deprecated linkAllTasksToFurnitures를 사용하세요.
   */
  static linkTasksToFurnitures(
    layout: HouseLayout,
    tasks: Task[],
    templates: CleaningTemplateItem[]
  ): HouseLayout {
    const furnitureMap = this.buildFurnitureTypeMap(layout);

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
   * 모든 Task(청소 + 비청소)를 task.metadata.linkedFurnitureType 기준으로 가구에 연결합니다.
   * 청소 Task는 linkedFurnitureType이 metadata에 없으면 cleaningTemplates로 폴백합니다.
   */
  static linkAllTasksToFurnitures(
    layout: HouseLayout,
    tasks: Task[],
    cleaningTemplates: CleaningTemplateItem[]
  ): HouseLayout {
    const furnitureMap = this.buildFurnitureTypeMap(layout);

    let cleaningIndex = 0;

    for (const task of tasks) {
      const linkedType: FurnitureType | undefined =
        (task as any).metadata?.linkedFurnitureType ??
        (task.type === 'cleaning' ? cleaningTemplates[cleaningIndex]?.linkedFurnitureType : undefined);

      if (task.type === 'cleaning') cleaningIndex++;

      if (!linkedType) continue;

      const target = furnitureMap.get(linkedType);
      if (!target) continue;

      const room = layout.rooms.find((r) => r.id === target.roomId);
      const furniture = room?.furnitures.find((f) => f.id === target.furnitureId);
      if (!furniture) continue;

      if (!furniture.linkedObjectIds.includes(task.objectId)) {
        furniture.linkedObjectIds.push(task.objectId);
        console.log(`🔗 "${task.title}" → ${linkedType} (${target.furnitureId})`);
      }
    }

    layout.updatedAt = new Date();
    return layout;
  }

  /**
   * 초기 Task 생성 — 청소 + 질문 답변 기반 모든 카테고리
   */
  static async createInitialTasks(
    userId: string,
    profile: UserProfile
  ): Promise<Task[]> {
    const allTasks: Task[] = [];
    const { environment } = profile;

    // 1. 청소 Task (페르소나 기반)
    const cleaningTasks = CleaningService.createTasksFromTemplate(
      userId,
      profile.persona,
      environment
    );
    allTasks.push(...cleaningTasks);

    let extraIndex = cleaningTasks.length;

    // 2. 약·영양제 Task
    if (environment && (profile.onboardingResponse?.rawAnswers as OnboardingAnswers)?.medicine === true) {
      const medicineTasks = this.createTasksFromTemplateArray(
        userId,
        medicineOnboardingTasks as OnboardingTaskTemplate[],
        extraIndex
      );
      allTasks.push(...medicineTasks);
      extraIndex += medicineTasks.length;
    }

    // 3. 반려동물 Task
    if (environment.hasPet) {
      const petType: PetType = environment.petType ?? 'other';
      const petTemplates = (petOnboardingTasks as Record<string, OnboardingTaskTemplate[]>)[petType] ?? [];
      const petTasks = this.createTasksFromTemplateArray(userId, petTemplates, extraIndex);
      allTasks.push(...petTasks);
      extraIndex += petTasks.length;
    }

    // 4. 영아 Task
    if (environment.hasInfant) {
      const infantTasks = this.createTasksFromTemplateArray(
        userId,
        infantOnboardingTasks as OnboardingTaskTemplate[],
        extraIndex
      );
      allTasks.push(...infantTasks);
      extraIndex += infantTasks.length;
    }

    // 5. 자기관리 Task
    if (environment.selfCareItems && environment.selfCareItems.length > 0) {
      const selfCareTemplatesMap = selfCareOnboardingTasks as Record<string, OnboardingTaskTemplate[]>;
      for (const item of environment.selfCareItems) {
        const templates = selfCareTemplatesMap[item] ?? [];
        const selfCareTasks = this.createTasksFromTemplateArray(userId, templates, extraIndex);
        allTasks.push(...selfCareTasks);
        extraIndex += selfCareTasks.length;
      }
    }

    // 6. 식물 Task
    if (environment.hasPlant) {
      const plantTasks = this.createTasksFromTemplateArray(
        userId,
        plantOnboardingTasks as OnboardingTaskTemplate[],
        extraIndex
      );
      allTasks.push(...plantTasks);
      extraIndex += plantTasks.length;
    }

    // 7. 차량 Task
    if (environment.hasCar) {
      const carTasks = this.createTasksFromTemplateArray(
        userId,
        carOnboardingTasks as OnboardingTaskTemplate[],
        extraIndex
      );
      allTasks.push(...carTasks);
      extraIndex += carTasks.length;
    }

    console.log(`✅ 초기 Task 생성 완료 (총 ${allTasks.length}개)`);
    return allTasks;
  }

  /**
   * 모듈 공통 템플릿 배열에서 Task 생성
   */
  private static createTasksFromTemplateArray(
    userId: string,
    templates: OnboardingTaskTemplate[],
    startIndex: number
  ): Task[] {
    const now = new Date();

    return templates.map((template, i) => {
      const taskId = Crypto.randomUUID();
      const nextDueDate = new Date(now);

      if (template.unit === 'day') {
        nextDueDate.setDate(nextDueDate.getDate() + template.interval);
      } else if (template.unit === 'week') {
        nextDueDate.setDate(nextDueDate.getDate() + template.interval * 7);
      } else if (template.unit === 'month') {
        nextDueDate.setMonth(nextDueDate.getMonth() + template.interval);
      }

      const metadata: Record<string, any> = {};
      if (template.linkedFurnitureType) {
        metadata.linkedFurnitureType = template.linkedFurnitureType;
      }

      return {
        id: taskId,
        userId,
        objectId: `onboarding_obj_${userId}_${startIndex + i}`,
        title: template.name,
        description: template.description,
        type: template.type as any,
        recurrence: {
          type: 'fixed' as const,
          interval: template.interval,
          unit: template.unit,
          nextDue: nextDueDate,
        },
        priority: template.priority,
        estimatedMinutes: template.estimatedMinutes,
        status: 'pending' as const,
        notificationSettings: {
          enabled: true,
          timing: 'digest' as const,
          advanceHours: [24],
        },
        completionHistory: [],
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        createdAt: now,
        updatedAt: now,
      } as Task;
    });
  }

  /**
   * 온보딩 Task마다 lifeObjects 컬렉션에 문서를 생성하고 objectId를 실제 Firestore ID로 교체합니다.
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
   * 청소 템플릿 데이터를 페르소나 키로 조회합니다.
   */
  static getCleaningTemplates(persona: string): CleaningTemplateItem[] {
    const templates = cleaningTemplatesData as Record<string, CleaningTemplateItem[]>;
    return templates[persona] ?? templates['solo_young'] ?? templates['student_20s'] ?? [];
  }

  /**
   * Task 카테고리별 요약 정보 반환
   * FirstTasksScreen에서 카테고리별 뱃지 표시에 사용
   */
  static categorizeTasksForPreview(tasks: Task[]): Record<string, Task[]> {
    const categories: Record<string, Task[]> = {};

    for (const task of tasks) {
      const category = (task as any).type ?? 'cleaning';
      const label = this.getCategoryLabel(category);
      if (!categories[label]) categories[label] = [];
      categories[label].push(task);
    }

    return categories;
  }

  static getCategoryLabel(type: string): string {
    const map: Record<string, string> = {
      cleaning: '청소',
      medicine: '약·영양제',
      self_care: '자기관리',
      food: '식품 관리',
      self_development: '자기계발',
    };
    return map[type] ?? '기타';
  }

  /**
   * "오늘 할 일" 즉시 생성 — 카테고리별 대표 Task + 빠른 것 위주
   */
  static generateFirstDayTasks(tasks: Task[]): Task[] {
    const categoryMap: Record<string, Task[]> = {};
    for (const task of tasks) {
      const type = (task as any).type ?? 'cleaning';
      if (!categoryMap[type]) categoryMap[type] = [];
      categoryMap[type].push(task);
    }

    const selected: Task[] = [];

    // 카테고리마다 가장 짧은 Task 1개씩 대표로 선택
    for (const type of Object.keys(categoryMap)) {
      const sorted = [...categoryMap[type]].sort(
        (a, b) => a.estimatedMinutes - b.estimatedMinutes
      );
      if (sorted[0]) selected.push(sorted[0]);
    }

    // 최대 6개, 시간 오름차순으로 정렬
    return selected.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes).slice(0, 6);
  }

  /**
   * 온보딩 완료 마킹
   */
  static markOnboardingCompleted(profile: UserProfile): UserProfile {
    return {
      ...profile,
      onboardingCompleted: true,
      onboardingDate: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 고급 설정 잠금 해제 여부 확인
   */
  static canAccessAdvancedSettings(profile: UserProfile): boolean {
    if (!profile.onboardingDate) return false;

    const now = new Date();
    const onboardingDate = new Date(profile.onboardingDate);
    const daysPassed = Math.floor(
      (now.getTime() - onboardingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysPassed >= 7;
  }

  /**
   * 페르소나 목록 가져오기
   */
  static getPersonas(): PersonaDefinition[] {
    return (personas as { personas: PersonaDefinition[] }).personas;
  }

  /**
   * 페르소나 정보 가져오기
   */
  static getPersona(personaId: PersonaType): PersonaDefinition | undefined {
    return (personas as { personas: PersonaDefinition[] }).personas.find(
      p => p.id === personaId
    );
  }

  /**
   * 페르소나별 예상 Task 수 반환 (PersonaSelectionScreen 뱃지용)
   */
  static getEstimatedTaskCount(personaId: PersonaType): {
    cleaning: number;
    total: number;
  } {
    const templates = cleaningTemplatesData as Record<string, CleaningTemplateItem[]>;
    const cleaningCount =
      templates[personaId]?.length ??
      templates['solo_young']?.length ??
      templates['student_20s']?.length ??
      0;

    const persona = this.getPersona(personaId);
    let extra = 0;
    if (persona?.defaultEnvironment.hasPet) extra += 5;
    if (persona?.defaultEnvironment.hasInfant) extra += 4;
    if (persona?.defaultEnvironment.hasPlant) extra += 2;
    if (persona?.defaultEnvironment.hasCar) extra += 3;

    return { cleaning: cleaningCount, total: cleaningCount + extra };
  }

  /**
   * 프로필 마이그레이션 필요 여부 확인
   */
  static needsMigration(profile: UserProfile): boolean {
    return !profile.profileVersion || profile.profileVersion !== PROFILE_VERSION;
  }

  /**
   * 프로필 마이그레이션
   */
  static migrateProfile(profile: UserProfile): UserProfile {
    let migratedProfile = { ...profile };

    if (!migratedProfile.profileVersion) {
      migratedProfile.profileVersion = PROFILE_VERSION;

      if (!migratedProfile.onboardingResponse) {
        migratedProfile.onboardingResponse = {
          version: 'legacy',
          timestamp: migratedProfile.onboardingDate || new Date(),
          rawAnswers: {},
          questionFlowId: 'legacy',
        };
      }
    }

    // v1 → v2: 신규 환경 필드 기본값 채우기
    if (migratedProfile.profileVersion === '1.0') {
      migratedProfile.environment = {
        ...migratedProfile.environment,
        hasInfant: migratedProfile.environment?.hasInfant ?? false,
        hasCar: migratedProfile.environment?.hasCar ?? false,
        hasPlant: migratedProfile.environment?.hasPlant ?? false,
        selfCareItems: migratedProfile.environment?.selfCareItems ?? [],
      };
      migratedProfile.profileVersion = PROFILE_VERSION;
    }

    migratedProfile.updatedAt = new Date();
    return migratedProfile;
  }

  /**
   * 기존 온보딩 완료 유저의 레이아웃 마이그레이션
   */
  static async migrateLayoutIfMissing(
    userId: string,
    layoutType: HouseLayout['layoutType'] = 'studio',
    hasWasher: boolean = true
  ): Promise<boolean> {
    const { getHouseLayout } = await import('@/services/houseService');
    const existing = await getHouseLayout(userId);
    if (existing) return false;

    console.log('🏠 레이아웃 마이그레이션 시작 — 기존 유저에게 기본 레이아웃 생성');
    await this.createAndSaveLayout(userId, layoutType, hasWasher);
    return true;
  }
}

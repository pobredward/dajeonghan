/**
 * 다정한 - OnboardingService 테스트
 *
 * 온보딩 서비스의 핵심 로직을 검증합니다.
 */

import { OnboardingService } from '../OnboardingService';
import { PersonaType } from '@/types/user.types';

describe('OnboardingService', () => {
  describe('createProfileFromPersona', () => {
    it('페르소나로부터 프로필 생성', () => {
      const userId = 'test-user-123';
      const personaId: PersonaType = 'solo_young';
      const answers = {
        washer: true,
        dryer: false,
        cooking: 'sometimes' as const,
        medicine: false,
        notification: 'digest' as const,
      };

      const profile = OnboardingService.createProfileFromPersona(
        userId,
        personaId,
        answers
      );

      expect(profile.userId).toBe(userId);
      expect(profile.persona).toBe(personaId);
      expect(profile.environment.hasWasher).toBe(true);
      expect(profile.environment.hasDryer).toBe(false);
      expect(profile.environment.cookingFrequency).toBe('sometimes');
      expect(profile.notificationMode).toBe('digest');
      expect(profile.onboardingCompleted).toBe(false);
    });

    it('페르소나의 기본값을 사용', () => {
      const userId = 'test-user-456';
      const personaId: PersonaType = 'solo_worker';
      const answers = {};

      const profile = OnboardingService.createProfileFromPersona(
        userId,
        personaId,
        answers
      );

      expect(profile.environment.hasWasher).toBe(true);
      expect(profile.environment.hasDryer).toBe(false);
      expect(profile.environment.cookingFrequency).toBe('rarely');
      expect(profile.notificationMode).toBe('digest');
    });

    it('코인세탁 사용자 처리', () => {
      const userId = 'test-user-789';
      const personaId: PersonaType = 'solo_worker';
      const answers = {
        washer: false,
      };

      const profile = OnboardingService.createProfileFromPersona(
        userId,
        personaId,
        answers
      );

      expect(profile.environment.hasWasher).toBe(false);
      expect(profile.environment.usesCoinLaundry).toBe(true);
    });

    it('신규 환경 필드가 프로필에 반영됨', () => {
      const userId = 'test-user-env';
      const personaId: PersonaType = 'pet_owner';
      const answers = {
        has_pet: true,
        pet_type: 'dog' as const,
        has_infant: false,
        car: false,
        plant: true,
        self_care: ['skincare', 'gym'] as any,
      };

      const profile = OnboardingService.createProfileFromPersona(userId, personaId, answers);

      expect(profile.environment.hasPet).toBe(true);
      expect(profile.environment.petType).toBe('dog');
      expect(profile.environment.hasPlant).toBe(true);
      expect(profile.environment.selfCareItems).toEqual(['skincare', 'gym']);
    });

    it('잘못된 페르소나 ID는 에러 발생', () => {
      const userId = 'test-user-999';
      const personaId = 'invalid_persona' as PersonaType;
      const answers = {};

      expect(() => {
        OnboardingService.createProfileFromPersona(userId, personaId, answers);
      }).toThrow();
    });
  });

  describe('createInitialTasks', () => {
    it('초기 청소 Task 생성', async () => {
      const userId = 'test-user-123';
      const profile = OnboardingService.createProfileFromPersona(
        userId,
        'solo_young',
        {}
      );

      const tasks = await OnboardingService.createInitialTasks(userId, profile);

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].userId).toBe(userId);
      expect(tasks[0].type).toBe('cleaning');
    });

    it('반려동물 있으면 관련 Task 포함', async () => {
      const userId = 'test-pet-user';
      const profile = OnboardingService.createProfileFromPersona(userId, 'pet_owner', {
        has_pet: true,
        pet_type: 'dog',
      });

      const tasks = await OnboardingService.createInitialTasks(userId, profile);
      const petTasks = tasks.filter(t => (t as any).description?.includes('강아지') || t.title.includes('강아지'));

      expect(petTasks.length).toBeGreaterThan(0);
    });
  });

  describe('generateFirstDayTasks', () => {
    it('카테고리별 대표 Task를 최대 6개 선택', () => {
      const mockTasks = [
        { id: '1', estimatedMinutes: 30, type: 'cleaning' },
        { id: '2', estimatedMinutes: 5, type: 'cleaning' },
        { id: '3', estimatedMinutes: 15, type: 'medicine' },
        { id: '4', estimatedMinutes: 10, type: 'medicine' },
        { id: '5', estimatedMinutes: 45, type: 'self_care' },
        { id: '6', estimatedMinutes: 8, type: 'self_care' },
        { id: '7', estimatedMinutes: 20, type: 'cleaning' },
      ] as any[];

      const firstDay = OnboardingService.generateFirstDayTasks(mockTasks);

      expect(firstDay.length).toBeLessThanOrEqual(6);
      expect(firstDay.length).toBeGreaterThan(0);
    });

    it('Task가 적으면 모두 반환', () => {
      const mockTasks = [
        { id: '1', estimatedMinutes: 10, type: 'cleaning' },
        { id: '2', estimatedMinutes: 20, type: 'medicine' },
      ] as any[];

      const firstDay = OnboardingService.generateFirstDayTasks(mockTasks);

      expect(firstDay.length).toBe(2);
    });
  });

  describe('markOnboardingCompleted', () => {
    it('온보딩 완료 마킹', () => {
      const profile = OnboardingService.createProfileFromPersona(
        'test-user-123',
        'solo_young',
        {}
      );

      const completed = OnboardingService.markOnboardingCompleted(profile);

      expect(completed.onboardingCompleted).toBe(true);
      expect(completed.onboardingDate).toBeDefined();
    });
  });

  describe('canAccessAdvancedSettings', () => {
    it('온보딩 7일 후 고급 설정 접근 가능', () => {
      const profile = OnboardingService.createProfileFromPersona(
        'test-user-123',
        'solo_young',
        {}
      );

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 8);
      profile.onboardingDate = pastDate;

      const canAccess = OnboardingService.canAccessAdvancedSettings(profile);

      expect(canAccess).toBe(true);
    });

    it('온보딩 7일 이내는 고급 설정 접근 불가', () => {
      const profile = OnboardingService.createProfileFromPersona(
        'test-user-123',
        'solo_young',
        {}
      );

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);
      profile.onboardingDate = recentDate;

      const canAccess = OnboardingService.canAccessAdvancedSettings(profile);

      expect(canAccess).toBe(false);
    });

    it('온보딩 날짜가 없으면 접근 불가', () => {
      const profile = OnboardingService.createProfileFromPersona(
        'test-user-123',
        'solo_young',
        {}
      );

      delete profile.onboardingDate;

      const canAccess = OnboardingService.canAccessAdvancedSettings(profile);

      expect(canAccess).toBe(false);
    });
  });

  describe('getPersonas', () => {
    it('페르소나 목록 반환 (8개)', () => {
      const personas = OnboardingService.getPersonas();

      expect(personas.length).toBe(8);
      expect(personas.map(p => p.id)).toContain('solo_young');
      expect(personas.map(p => p.id)).toContain('senior_couple');
      expect(personas[0].icon).toBeDefined();
      expect(personas[0].name).toBeDefined();
    });
  });

  describe('getPersona', () => {
    it('특정 페르소나 정보 반환', () => {
      const persona = OnboardingService.getPersona('solo_young');

      expect(persona).toBeDefined();
      expect(persona?.id).toBe('solo_young');
      expect(persona?.name).toBe('자취 청년');
    });

    it('존재하지 않는 페르소나는 undefined 반환', () => {
      const persona = OnboardingService.getPersona('invalid' as PersonaType);

      expect(persona).toBeUndefined();
    });
  });

  describe('getEstimatedTaskCount', () => {
    it('페르소나별 예상 Task 수 반환', () => {
      const count = OnboardingService.getEstimatedTaskCount('solo_young');

      expect(count.cleaning).toBeGreaterThan(0);
      expect(count.total).toBeGreaterThanOrEqual(count.cleaning);
    });

    it('반려동물 페르소나는 더 많은 Task 예상', () => {
      const pet = OnboardingService.getEstimatedTaskCount('pet_owner');
      const solo = OnboardingService.getEstimatedTaskCount('solo_worker');

      expect(pet.total).toBeGreaterThan(solo.total);
    });
  });
});

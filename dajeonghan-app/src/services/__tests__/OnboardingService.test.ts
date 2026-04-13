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
      const personaId: PersonaType = 'student_20s_male';
      const answers = {
        washer: true,
        dryer: false,
        cooking: 'sometimes' as const,
        medicine: false,
        self_care_level: 'basic' as const,
        gender: 'male' as const,
        notification: 'digest' as const
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
      const personaId: PersonaType = 'student_20s_female';
      const answers = {};

      const profile = OnboardingService.createProfileFromPersona(
        userId,
        personaId,
        answers
      );

      expect(profile.environment.hasWasher).toBe(true);
      expect(profile.environment.hasDryer).toBe(false);
      expect(profile.environment.cookingFrequency).toBe('often');
      expect(profile.notificationMode).toBe('digest');
    });

    it('코인세탁 사용자 처리', () => {
      const userId = 'test-user-789';
      const personaId: PersonaType = 'worker_single';
      const answers = {
        washer: false
      };

      const profile = OnboardingService.createProfileFromPersona(
        userId,
        personaId,
        answers
      );

      expect(profile.environment.hasWasher).toBe(false);
      expect(profile.environment.usesCoinLaundry).toBe(true);
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
    it('초기 청소 테스크 생성', async () => {
      const userId = 'test-user-123';
      const profile = OnboardingService.createProfileFromPersona(
        userId,
        'student_20s_male',
        {}
      );

      const tasks = await OnboardingService.createInitialTasks(userId, profile);

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].userId).toBe(userId);
      expect(tasks[0].type).toBe('cleaning');
    });
  });

  describe('generateFirstDayTasks', () => {
    it('간단한 작업부터 5개 선택', () => {
      const mockTasks = [
        { id: '1', estimatedMinutes: 30 },
        { id: '2', estimatedMinutes: 5 },
        { id: '3', estimatedMinutes: 15 },
        { id: '4', estimatedMinutes: 10 },
        { id: '5', estimatedMinutes: 45 },
        { id: '6', estimatedMinutes: 8 },
        { id: '7', estimatedMinutes: 20 }
      ] as any[];

      const firstDay = OnboardingService.generateFirstDayTasks(mockTasks);

      expect(firstDay.length).toBe(5);
      expect(firstDay[0].estimatedMinutes).toBeLessThanOrEqual(
        firstDay[1].estimatedMinutes
      );
    });

    it('5개 미만일 경우 모두 반환', () => {
      const mockTasks = [
        { id: '1', estimatedMinutes: 10 },
        { id: '2', estimatedMinutes: 20 }
      ] as any[];

      const firstDay = OnboardingService.generateFirstDayTasks(mockTasks);

      expect(firstDay.length).toBe(2);
    });
  });

  describe('markOnboardingCompleted', () => {
    it('온보딩 완료 마킹', () => {
      const profile = OnboardingService.createProfileFromPersona(
        'test-user-123',
        'student_20s_male',
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
        'student_20s_male',
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
        'student_20s_male',
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
        'student_20s_male',
        {}
      );

      delete profile.onboardingDate;

      const canAccess = OnboardingService.canAccessAdvancedSettings(profile);

      expect(canAccess).toBe(false);
    });
  });

  describe('getPersonas', () => {
    it('페르소나 목록 반환', () => {
      const personas = OnboardingService.getPersonas();

      expect(personas.length).toBe(6);
      expect(personas[0].id).toBe('student_20s_male');
      expect(personas[0].icon).toBeDefined();
      expect(personas[0].name).toBeDefined();
    });
  });

  describe('getPersona', () => {
    it('특정 페르소나 정보 반환', () => {
      const persona = OnboardingService.getPersona('student_20s_male');

      expect(persona).toBeDefined();
      expect(persona?.id).toBe('student_20s_male');
      expect(persona?.name).toBe('20대 초반 자취 대학생 (남)');
    });

    it('존재하지 않는 페르소나는 undefined 반환', () => {
      const persona = OnboardingService.getPersona('invalid' as PersonaType);

      expect(persona).toBeUndefined();
    });
  });
});

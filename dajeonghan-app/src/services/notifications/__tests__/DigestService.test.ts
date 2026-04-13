/**
 * 다정한 - DigestService 테스트 (간소화 버전)
 */

import { DigestService } from '../DigestService';
import { Task } from '@/types/task.types';
import { FoodItem } from '@/modules/fridge/types';
import { Medicine } from '@/modules/medicine/types';

describe('DigestService', () => {
  describe('generateDigest', () => {
    it('빈 데이터로 다이제스트 생성', () => {
      const digest = DigestService.generateDigest('morning', [], [], []);

      expect(digest.title).toBe('☀️ 오늘의 할 일');
      expect(digest.body).toBe('오늘은 할 일이 없어요!');
      expect(digest.sections).toHaveLength(0);
      expect(digest.totalItems).toBe(0);
    });

    it('저녁 다이제스트 제목 생성', () => {
      const digest = DigestService.generateDigest('evening', [], [], []);

      expect(digest.title).toBe('🌙 오늘 남은 일');
      expect(digest.body).toBe('오늘 할 일을 모두 끝냈어요!');
    });

    it('청소 테스크 포함 다이제스트', () => {
      const tasks = [
        {
          id: '1',
          type: 'cleaning',
          title: '설거지',
          estimatedMinutes: 10,
          status: 'pending',
          recurrence: {
            type: 'fixed',
            interval: 1,
            unit: 'day',
            nextDue: new Date()
          }
        } as Task
      ];

      const digest = DigestService.generateDigest('morning', tasks, [], []);

      expect(digest.sections.length).toBeGreaterThan(0);
      const cleaningSection = digest.sections.find(s => s.type === 'cleaning');
      expect(cleaningSection).toBeDefined();
      if (cleaningSection) {
        expect(cleaningSection.icon).toBe('🧹');
        expect(cleaningSection.items[0]).toContain('설거지');
      }
    });

    it('식재료 임박 포함 다이제스트', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const foods = [
        {
          id: '1',
          name: '우유',
          type: 'food',
          metadata: {
            category: '유제품',
            purchaseDate: new Date(),
            expiryDate: tomorrow,
            recommendedConsumption: tomorrow,
            storageCondition: '냉장',
            storageType: '원래포장',
            state: '통'
          }
        } as FoodItem
      ];

      const digest = DigestService.generateDigest('morning', [], foods, []);

      expect(digest.sections.length).toBeGreaterThan(0);
      const foodSection = digest.sections.find(s => s.type === 'food');
      expect(foodSection).toBeDefined();
      if (foodSection) {
        expect(foodSection.icon).toBe('🥗');
        expect(foodSection.items[0]).toContain('우유');
      }
    });

    it('약 포함 오전 다이제스트', () => {
      const medicines = [
        {
          id: '1',
          name: '비타민',
          type: 'medicine',
          metadata: {
            type: '영양제',
            dosage: '1정',
            schedule: {
              frequency: 'daily',
              times: ['09:00'],
              mealTiming: '식후'
            },
            totalQuantity: 30,
            remainingQuantity: 20,
            refillThreshold: 7
          }
        } as Medicine
      ];

      const digest = DigestService.generateDigest('morning', [], [], medicines);

      expect(digest.sections.length).toBeGreaterThan(0);
      const medicineSection = digest.sections.find(s => s.type === 'medicine');
      expect(medicineSection).toBeDefined();
      if (medicineSection) {
        expect(medicineSection.icon).toBe('💊');
        expect(medicineSection.items[0]).toContain('비타민');
      }
    });

    it('저녁 다이제스트에는 약이 포함되지 않음', () => {
      const medicines = [
        {
          id: '1',
          name: '비타민',
          type: 'medicine',
          metadata: {
            type: '영양제',
            dosage: '1정',
            schedule: {
              frequency: 'daily',
              times: ['09:00'],
              mealTiming: '식후'
            },
            totalQuantity: 30,
            remainingQuantity: 20,
            refillThreshold: 7
          }
        } as Medicine
      ];

      const digest = DigestService.generateDigest('evening', [], [], medicines);

      const medicineSection = digest.sections.find(s => s.type === 'medicine');
      expect(medicineSection).toBeUndefined();
    });
  });

  describe('renderDigestHTML', () => {
    it('HTML 렌더링', () => {
      const digest = {
        title: '☀️ 오늘의 할 일',
        body: '🧹 청소 1개',
        sections: [
          {
            type: 'cleaning' as const,
            icon: '🧹',
            items: ['설거지 (10분)'],
            count: 1
          }
        ],
        totalItems: 1
      };

      const html = DigestService.renderDigestHTML(digest);

      expect(html).toContain('<h2>☀️ 오늘의 할 일</h2>');
      expect(html).toContain('<h3>🧹 청소</h3>');
      expect(html).toContain('<li>설거지 (10분)</li>');
    });
  });

  describe('isEmpty', () => {
    it('빈 다이제스트 확인', () => {
      const digest = {
        title: '제목',
        body: '본문',
        sections: [],
        totalItems: 0
      };

      expect(DigestService.isEmpty(digest)).toBe(true);
    });

    it('내용이 있는 다이제스트', () => {
      const digest = {
        title: '제목',
        body: '본문',
        sections: [
          {
            type: 'cleaning' as const,
            icon: '🧹',
            items: ['설거지'],
            count: 1
          }
        ],
        totalItems: 1
      };

      expect(DigestService.isEmpty(digest)).toBe(false);
    });
  });
});

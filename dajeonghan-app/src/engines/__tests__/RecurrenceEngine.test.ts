/**
 * RecurrenceEngine 테스트
 */

import { RecurrenceEngine } from '../RecurrenceEngine';
import { Task } from '../../types/task.types';
import { addDays } from 'date-fns';

describe('RecurrenceEngine', () => {
  const mockTask: Task = {
    id: 'test-task-1',
    userId: 'test-user',
    objectId: 'test-object',
    title: '테스트 작업',
    type: 'cleaning',
    recurrence: {
      type: 'fixed',
      interval: 7,
      unit: 'day',
      nextDue: new Date('2026-04-20'),
      lastCompleted: new Date('2026-04-13')
    },
    priority: 'medium',
    estimatedMinutes: 30,
    status: 'pending',
    notificationSettings: {
      enabled: true,
      timing: 'digest',
      advanceHours: [24]
    },
    completionHistory: [],
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01')
  };

  describe('calculateNextDue', () => {
    it('should calculate next due date correctly for days', () => {
      const completedAt = new Date('2026-04-20');
      const nextDue = RecurrenceEngine.calculateNextDue(mockTask, completedAt);
      
      expect(nextDue).toEqual(new Date('2026-04-27'));
    });

    it('should calculate next due date correctly for weeks', () => {
      const weeklyTask = {
        ...mockTask,
        recurrence: {
          ...mockTask.recurrence,
          interval: 2,
          unit: 'week' as const
        }
      };
      
      const completedAt = new Date('2026-04-20');
      const nextDue = RecurrenceEngine.calculateNextDue(weeklyTask, completedAt);
      
      expect(nextDue).toEqual(new Date('2026-05-04'));
    });

    it('should calculate next due date correctly for months', () => {
      const monthlyTask = {
        ...mockTask,
        recurrence: {
          ...mockTask.recurrence,
          interval: 1,
          unit: 'month' as const
        }
      };
      
      const completedAt = new Date('2026-04-20');
      const nextDue = RecurrenceEngine.calculateNextDue(monthlyTask, completedAt);
      
      expect(nextDue).toEqual(new Date('2026-05-20'));
    });
  });

  describe('adjustRecurrenceByHistory', () => {
    it('should return null when history is less than 3', () => {
      const taskWithShortHistory = {
        ...mockTask,
        completionHistory: [
          { date: new Date('2026-04-01'), postponed: false },
          { date: new Date('2026-04-08'), postponed: false }
        ]
      };

      const result = RecurrenceEngine.adjustRecurrenceByHistory(taskWithShortHistory);
      expect(result).toBeNull();
    });

    it('should calculate average interval from history', () => {
      const taskWithHistory = {
        ...mockTask,
        completionHistory: [
          { date: new Date('2026-04-01'), postponed: false },
          { date: new Date('2026-04-08'), postponed: false },
          { date: new Date('2026-04-15'), postponed: false },
          { date: new Date('2026-04-22'), postponed: false }
        ]
      };

      const result = RecurrenceEngine.adjustRecurrenceByHistory(taskWithHistory);
      expect(result).toBe(7);
    });

    it('should ignore postponed entries', () => {
      const taskWithPostpones = {
        ...mockTask,
        completionHistory: [
          { date: new Date('2026-04-01'), postponed: false },
          { date: new Date('2026-04-05'), postponed: true },
          { date: new Date('2026-04-08'), postponed: false },
          { date: new Date('2026-04-15'), postponed: false },
          { date: new Date('2026-04-22'), postponed: false }
        ]
      };

      const result = RecurrenceEngine.adjustRecurrenceByHistory(taskWithPostpones);
      expect(result).toBe(7);
    });
  });

  describe('suggestRecurrenceUpdate', () => {
    it('should suggest update when interval differs by 20%+', () => {
      const taskWithHistory = {
        ...mockTask,
        recurrence: {
          ...mockTask.recurrence,
          interval: 7
        },
        completionHistory: [
          { date: new Date('2026-04-01'), postponed: false },
          { date: new Date('2026-04-11'), postponed: false },
          { date: new Date('2026-04-21'), postponed: false }
        ]
      };

      const result = RecurrenceEngine.suggestRecurrenceUpdate(taskWithHistory);
      expect(result.shouldUpdate).toBe(true);
      expect(result.suggestedInterval).toBe(10);
    });

    it('should not suggest update when interval is appropriate', () => {
      const taskWithHistory = {
        ...mockTask,
        recurrence: {
          ...mockTask.recurrence,
          interval: 7
        },
        completionHistory: [
          { date: new Date('2026-04-01'), postponed: false },
          { date: new Date('2026-04-08'), postponed: false },
          { date: new Date('2026-04-15'), postponed: false }
        ]
      };

      const result = RecurrenceEngine.suggestRecurrenceUpdate(taskWithHistory);
      expect(result.shouldUpdate).toBe(false);
    });
  });

  describe('calculateElapsedRatio', () => {
    it('should calculate elapsed ratio correctly', () => {
      const task = {
        ...mockTask,
        recurrence: {
          ...mockTask.recurrence,
          lastCompleted: new Date('2026-04-13'),
          nextDue: new Date('2026-04-20')
        },
        createdAt: new Date('2026-04-13')
      };

      const ratio = RecurrenceEngine.calculateElapsedRatio(task);
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(2);
    });

    it('should cap at 200%', () => {
      const task = {
        ...mockTask,
        recurrence: {
          ...mockTask.recurrence,
          lastCompleted: new Date('2026-01-01'),
          nextDue: new Date('2026-01-08')
        },
        createdAt: new Date('2026-01-01')
      };

      const ratio = RecurrenceEngine.calculateElapsedRatio(task);
      expect(ratio).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateDirtyScore', () => {
    it('should calculate dirty score correctly', () => {
      const score = RecurrenceEngine.calculateDirtyScore(mockTask);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

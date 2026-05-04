import { CleaningService } from '../CleaningService';
import { CleaningTask } from '../types';

describe('CleaningService', () => {
  describe('createTasksFromTemplate', () => {
    it('should create tasks from student_20s template', () => {
      const userId = 'test_user_123';
      const persona = 'student_20s';
      const environment = {
        hasWasher: true,
        hasDryer: false,
        usesCoinLaundry: false,
        cookingFrequency: 'sometimes' as const,
        hasPet: false,
        householdSize: 1
      };

      const tasks = CleaningService.createTasksFromTemplate(userId, persona, environment);

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].userId).toBe(userId);
      expect(tasks[0].type).toBe('cleaning');
      expect(tasks[0].dirtyScore).toBe(0);
    });

    it('should adapt tasks for coin laundry when no washer', () => {
      const userId = 'test_user_123';
      const persona = 'student_20s';
      const environment = {
        hasWasher: false,
        hasDryer: false,
        usesCoinLaundry: true,
        cookingFrequency: 'sometimes' as const,
        hasPet: false,
        householdSize: 1
      };

      const tasks = CleaningService.createTasksFromTemplate(userId, persona, environment);

      const laundryTask = tasks.find(t => t.title.includes('침구 세탁'));
      expect(laundryTask).toBeDefined();
      expect(laundryTask?.title).toContain('코인세탁');
      expect(laundryTask?.description).toContain('코인세탁 방문');
    });
  });

  describe('calculateDirtyScore', () => {
    it('should calculate dirty score based on elapsed time', () => {
      const now = new Date();
      const lastCompleted = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5일 전 완료
      const nextDue = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2일 후 예정

      const task: CleaningTask = {
        id: 'test_task_1',
        userId: 'test_user',
        furnitureId: 'test_furniture',
        title: '화장실 청소',
        description: '화장실 청소 작업',
        type: 'cleaning',
        recurrence: {
          type: 'fixed',
          interval: 7,
          unit: 'day',
          nextDue,
          lastCompleted
        },
        priority: 'high',
        estimatedMinutes: 20,
        status: 'pending',
        notificationSettings: {
          enabled: true,
          timing: 'digest',
          advanceHours: [24]
        },
        completionHistory: [],
        dirtyScore: 0,
        metadata: {
          room: '화장실',
          difficulty: 3,
          healthPriority: true
        },
        createdAt: now,
        updatedAt: now
      };

      const score = CleaningService.calculateDirtyScore(task);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should give higher score to health priority tasks', () => {
      const now = new Date();
      const lastCompleted = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const nextDue = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      const healthTask: CleaningTask = {
        id: 'test_task_1',
        userId: 'test_user',
        furnitureId: 'test_furniture',
        title: '화장실 청소',
        description: '화장실 청소 작업',
        type: 'cleaning',
        recurrence: {
          type: 'fixed',
          interval: 7,
          unit: 'day',
          nextDue,
          lastCompleted
        },
        priority: 'high',
        estimatedMinutes: 20,
        status: 'pending',
        notificationSettings: {
          enabled: true,
          timing: 'digest',
          advanceHours: [24]
        },
        completionHistory: [],
        dirtyScore: 0,
        metadata: {
          room: '화장실',
          difficulty: 3,
          healthPriority: true
        },
        createdAt: now,
        updatedAt: now
      };

      const normalTask: CleaningTask = {
        ...healthTask,
        id: 'test_task_2',
        title: '거실 청소',
        metadata: {
          room: '거실',
          difficulty: 3,
          healthPriority: false
        }
      };

      const healthScore = CleaningService.calculateDirtyScore(healthTask);
      const normalScore = CleaningService.calculateDirtyScore(normalTask);

      expect(healthScore).toBeGreaterThan(normalScore);
    });
  });

  describe('recommendQuickSession', () => {
    it('should recommend tasks within target minutes', () => {
      const userId = 'test_user';
      const now = new Date();
      const pastDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const tasks: CleaningTask[] = [
        {
          id: 'task_1',
          userId,
          furnitureId: 'furniture_1',
          title: '환기',
          description: '환기 작업',
          type: 'cleaning',
          recurrence: {
            type: 'fixed',
            interval: 1,
            unit: 'day',
            nextDue: pastDate
          },
          priority: 'low',
          estimatedMinutes: 5,
          status: 'pending',
          notificationSettings: {
            enabled: true,
            timing: 'digest',
            advanceHours: [24]
          },
          completionHistory: [],
          dirtyScore: 0,
          metadata: {
            room: '전체',
            difficulty: 1,
            healthPriority: true
          },
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'task_2',
          userId,
          furnitureId: 'furniture_2',
          title: '거울 닦기',
          description: '거울 닦기 작업',
          type: 'cleaning',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: pastDate
          },
          priority: 'low',
          estimatedMinutes: 5,
          status: 'pending',
          notificationSettings: {
            enabled: true,
            timing: 'digest',
            advanceHours: [24]
          },
          completionHistory: [],
          dirtyScore: 0,
          metadata: {
            room: '화장실',
            difficulty: 1,
            healthPriority: false
          },
          createdAt: now,
          updatedAt: now
        }
      ];

      const session = CleaningService.recommendQuickSession(tasks, 10);

      expect(session.tasks.length).toBeGreaterThan(0);
      expect(session.totalMinutes).toBeLessThanOrEqual(10);
      expect(session.tasks.length).toBeLessThanOrEqual(3);
    });
  });

  describe('filterByRoom', () => {
    it('should filter tasks by room', () => {
      const userId = 'test_user';
      const now = new Date();

      const tasks: CleaningTask[] = [
        {
          id: 'task_1',
          userId,
          furnitureId: 'furniture_1',
          title: '화장실 청소',
          description: '화장실 청소 작업',
          type: 'cleaning',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: now
          },
          priority: 'high',
          estimatedMinutes: 20,
          status: 'pending',
          notificationSettings: {
            enabled: true,
            timing: 'digest',
            advanceHours: [24]
          },
          completionHistory: [],
          dirtyScore: 0,
          metadata: {
            room: '화장실',
            difficulty: 3,
            healthPriority: true
          },
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'task_2',
          userId,
          furnitureId: 'furniture_2',
          title: '거실 청소',
          description: '거실 청소 작업',
          type: 'cleaning',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: now
          },
          priority: 'medium',
          estimatedMinutes: 15,
          status: 'pending',
          notificationSettings: {
            enabled: true,
            timing: 'digest',
            advanceHours: [24]
          },
          completionHistory: [],
          dirtyScore: 0,
          metadata: {
            room: '거실',
            difficulty: 2,
            healthPriority: false
          },
          createdAt: now,
          updatedAt: now
        }
      ];

      const bathroomTasks = CleaningService.filterByRoom(tasks, '화장실');

      expect(bathroomTasks.length).toBe(1);
      expect(bathroomTasks[0].metadata.room).toBe('화장실');
    });
  });

  describe('getHealthPriorityTasks', () => {
    it('should filter health priority tasks', () => {
      const userId = 'test_user';
      const now = new Date();

      const tasks: CleaningTask[] = [
        {
          id: 'task_1',
          userId,
          furnitureId: 'furniture_1',
          title: '화장실 청소',
          description: '화장실 청소 작업',
          type: 'cleaning',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: now
          },
          priority: 'high',
          estimatedMinutes: 20,
          status: 'pending',
          notificationSettings: {
            enabled: true,
            timing: 'digest',
            advanceHours: [24]
          },
          completionHistory: [],
          dirtyScore: 0,
          metadata: {
            room: '화장실',
            difficulty: 3,
            healthPriority: true
          },
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'task_2',
          userId,
          furnitureId: 'furniture_2',
          title: '거실 청소',
          description: '거실 청소 작업',
          type: 'cleaning',
          recurrence: {
            type: 'fixed',
            interval: 7,
            unit: 'day',
            nextDue: now
          },
          priority: 'medium',
          estimatedMinutes: 15,
          status: 'pending',
          notificationSettings: {
            enabled: true,
            timing: 'digest',
            advanceHours: [24]
          },
          completionHistory: [],
          dirtyScore: 0,
          metadata: {
            room: '거실',
            difficulty: 2,
            healthPriority: false
          },
          createdAt: now,
          updatedAt: now
        }
      ];

      const healthTasks = CleaningService.getHealthPriorityTasks(tasks);

      expect(healthTasks.length).toBe(1);
      expect(healthTasks[0].metadata.healthPriority).toBe(true);
    });
  });
});

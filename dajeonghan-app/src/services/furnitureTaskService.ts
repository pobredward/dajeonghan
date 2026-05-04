/**
 * 가구 Task 관리 서비스
 * 
 * 가구에 Task를 추가하고 관리하는 서비스
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  Timestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task, Recurrence } from '@/types/task.types';
import { TaskTemplateItem, TaskCustomization } from '@/types/furnitureTaskTemplate.types';
import { linkTaskToFurniture, calculateFurnitureDirtyScore, updateFurniture, getHouseLayout } from '@/services/houseService';

export class FurnitureTaskService {
  /**
   * 템플릿 Task를 기반으로 Task 생성
   */
  static async addTaskFromTemplate(
    userId: string,
    roomId: string,
    furnitureId: string,
    roomName: string,
    furnitureName: string,
    templateTask: TaskTemplateItem,
    customization: TaskCustomization,
    startDate?: Date
  ): Promise<{ taskId: string }> {
    try {
      const recurrence = this.createRecurrence(customization, startDate);

      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        furnitureId,
        title: customization.customTitle?.trim() || templateTask.title,
        description: templateTask.description,
        type: templateTask.type,
        recurrence,
        priority: customization.priority || templateTask.priority,
        estimatedMinutes: customization.estimatedMinutes ?? templateTask.estimatedMinutes ?? 30,
        status: 'pending',
        notificationSettings: {
          enabled: customization.notificationEnabled ?? true,
          timing: 'immediate',
          advanceHours: customization.notificationMinutesBefore 
            ? [customization.notificationMinutesBefore / 60] 
            : [0.5],
        },
        completionHistory: [],
        templateItemId: templateTask.id,
      };

      const taskRef = await addDoc(
        collection(db, 'users', userId, 'tasks'),
        {
          ...taskData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      await linkTaskToFurniture(userId, roomId, furnitureId, taskRef.id);

      return { taskId: taskRef.id };
    } catch (error) {
      console.error('Add task from template error:', error);
      throw error;
    }
  }

  /**
   * 커스텀 Task 생성 (템플릿 없이)
   */
  static async addCustomTask(
    userId: string,
    roomId: string,
    furnitureId: string,
    roomName: string,
    furnitureName: string,
    taskData: {
      title: string;
      description?: string;
      type: 'cleaning' | 'food' | 'medicine' | 'self_care' | 'self_development';
      customization: TaskCustomization;
    }
  ): Promise<{ taskId: string }> {
    try {
      const recurrence = this.createRecurrence(taskData.customization);

      const newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        furnitureId,
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        recurrence,
        priority: taskData.customization.priority || 'medium',
        estimatedMinutes: taskData.customization.estimatedMinutes || 30,
        status: 'pending',
        notificationSettings: {
          enabled: taskData.customization.notificationEnabled ?? true,
          timing: 'immediate',
          advanceHours: taskData.customization.notificationMinutesBefore 
            ? [taskData.customization.notificationMinutesBefore / 60] 
            : [0.5],
        },
        completionHistory: [],
      };

      const taskRef = await addDoc(
        collection(db, 'users', userId, 'tasks'),
        {
          ...newTaskData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      await linkTaskToFurniture(userId, roomId, furnitureId, taskRef.id);

      return { taskId: taskRef.id };
    } catch (error) {
      console.error('Add custom task error:', error);
      throw error;
    }
  }

  /**
   * Recurrence 생성
   */
  private static createRecurrence(customization: TaskCustomization, startDate?: Date): Recurrence {
    const baseDate = startDate || new Date();
    let nextDue = new Date(baseDate);

    let unit: 'day' | 'week' | 'month' = 'week';
    let interval = customization.interval || 1;

    switch (customization.recurrenceType) {
      case 'daily':
        unit = 'day';
        break;

      case 'weekly':
        unit = 'week';
        if (customization.dayOfWeek !== undefined) {
          const currentDay = baseDate.getDay();
          const targetDay = customization.dayOfWeek;
          
          if (currentDay === targetDay) {
            nextDue = new Date(baseDate);
          } else {
            const daysToAdd = (targetDay - currentDay + 7) % 7;
            nextDue.setDate(nextDue.getDate() + daysToAdd);
          }
        }
        break;

      case 'monthly':
        unit = 'month';
        if (customization.dayOfMonth !== undefined) {
          nextDue.setDate(customization.dayOfMonth);
          if (nextDue < baseDate) {
            nextDue.setMonth(nextDue.getMonth() + 1);
          }
        }
        break;

      case 'custom':
        unit = 'day';
        interval = customization.interval || 7;
        break;

      default:
        unit = 'week';
        interval = 1;
    }

    if (!customization.hasTime) {
      nextDue.setHours(9, 0, 0, 0);
    }

    return {
      type: 'fixed',
      interval,
      unit,
      nextDue,
      hasTime: customization.hasTime ?? false,
    };
  }

  /**
   * Task 완료 후 해당 가구의 dirtyScore를 재계산하여 Firestore에 동기화
   */
  static async syncDirtyScoreAfterTaskComplete(
    userId: string,
    furnitureId: string
  ): Promise<void> {
    try {
      const layout = await getHouseLayout(userId);
      if (!layout) return;

      let targetRoomId: string | null = null;

      for (const room of layout.rooms) {
        const found = room.furnitures.find((f) => f.id === furnitureId);
        if (found) {
          targetRoomId = room.id;
          break;
        }
      }

      if (!targetRoomId) return;

      const newDirtyScore = await calculateFurnitureDirtyScore(userId, furnitureId);
      await updateFurniture(userId, targetRoomId, furnitureId, {
        dirtyScore: newDirtyScore,
      });
    } catch (error) {
      console.error('Sync dirtyScore error:', error);
    }
  }

  /**
   * 가구의 Task 목록 조회
   */
  static async getFurnitureTasks(
    userId: string,
    furnitureId: string
  ): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, 'users', userId, 'tasks'),
        where('furnitureId', '==', furnitureId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);

      return tasksSnapshot.docs.map((taskDoc) => {
        const taskData = taskDoc.data();
        return {
          id: taskDoc.id,
          ...taskData,
          createdAt: taskData.createdAt?.toDate() || new Date(),
          updatedAt: taskData.updatedAt?.toDate() || new Date(),
          recurrence: {
            ...taskData.recurrence,
            nextDue: taskData.recurrence?.nextDue?.toDate() || new Date(),
            lastCompleted: taskData.recurrence?.lastCompleted?.toDate(),
          },
        } as Task;
      });
    } catch (error) {
      console.error('Get furniture tasks error:', error);
      return [];
    }
  }
}

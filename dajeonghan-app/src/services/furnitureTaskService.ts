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
  arrayUnion,
  Timestamp,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { LifeObject } from '@/types/lifeobject.types';
import { Task, Recurrence } from '@/types/task.types';
import { TaskTemplateItem, TaskCustomization } from '@/types/furnitureTaskTemplate.types';
import { Furniture } from '@/types/house.types';
import { linkLifeObjectToFurniture } from '@/services/houseService';

export class FurnitureTaskService {
  /**
   * 템플릿 Task를 기반으로 LifeObject + Task 생성
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
  ): Promise<{ lifeObjectId: string; taskId: string }> {
    try {
      // 1. LifeObject 생성
      const lifeObjectData: Omit<LifeObject, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        type: templateTask.type,
        name: `${furnitureName} - ${templateTask.title}`,
        metadata: this.createMetadataForType(templateTask.type, roomName, furnitureName),
      };

      const lifeObjectRef = await addDoc(
        collection(db, 'users', userId, 'lifeObjects'),
        {
          ...lifeObjectData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      // 2. Recurrence 설정
      const recurrence = this.createRecurrence(customization, startDate);

      // 3. Task 생성
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        objectId: lifeObjectRef.id,
        title: templateTask.title,
        description: templateTask.description,
        type: templateTask.type,
        recurrence,
        priority: customization.priority || templateTask.priority,
        estimatedMinutes: customization.estimatedMinutes || templateTask.estimatedMinutes,
        status: 'pending',
        notificationSettings: {
          enabled: customization.notificationEnabled ?? true,
          timing: 'immediate',
          advanceHours: customization.notificationMinutesBefore 
            ? [customization.notificationMinutesBefore / 60] 
            : [0.5], // 30분 = 0.5시간
        },
        completionHistory: [],
      };

      const taskRef = await addDoc(
        collection(db, 'users', userId, 'tasks'),
        {
          ...taskData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      // 4. Furniture의 linkedObjectIds 업데이트
      await linkLifeObjectToFurniture(userId, roomId, furnitureId, lifeObjectRef.id);

      return {
        lifeObjectId: lifeObjectRef.id,
        taskId: taskRef.id,
      };
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
  ): Promise<{ lifeObjectId: string; taskId: string }> {
    try {
      // LifeObject 생성
      const lifeObjectData: Omit<LifeObject, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        type: taskData.type,
        name: `${furnitureName} - ${taskData.title}`,
        metadata: this.createMetadataForType(taskData.type, roomName, furnitureName),
      };

      const lifeObjectRef = await addDoc(
        collection(db, 'users', userId, 'lifeObjects'),
        {
          ...lifeObjectData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      // Recurrence 설정
      const recurrence = this.createRecurrence(taskData.customization);

      // Task 생성
      const newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        objectId: lifeObjectRef.id,
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

      // Furniture 연결
      await linkLifeObjectToFurniture(userId, roomId, furnitureId, lifeObjectRef.id);

      return {
        lifeObjectId: lifeObjectRef.id,
        taskId: taskRef.id,
      };
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
        // 첫 실행은 startDate, 그 다음부터 interval 적용
        // nextDue는 이미 baseDate(startDate)로 설정되어 있음
        break;

      case 'weekly':
        unit = 'week';
        // 특정 요일로 설정 (선택된 요일이 있으면)
        if (customization.dayOfWeek !== undefined) {
          const currentDay = baseDate.getDay();
          const targetDay = customization.dayOfWeek;
          
          if (currentDay === targetDay) {
            // 오늘이 목표 요일이면 오늘부터 시작
            nextDue = new Date(baseDate);
          } else {
            // 다음 목표 요일을 찾음
            const daysToAdd = (targetDay - currentDay + 7) % 7;
            nextDue.setDate(nextDue.getDate() + daysToAdd);
          }
        }
        break;

      case 'monthly':
        unit = 'month';
        // 특정 일자로 설정
        if (customization.dayOfMonth !== undefined) {
          nextDue.setDate(customization.dayOfMonth);
          // 만약 이번 달의 해당 일자가 이미 지났다면 다음 달로
          if (nextDue < baseDate) {
            nextDue.setMonth(nextDue.getMonth() + 1);
          }
        }
        break;

      case 'custom':
        unit = 'day';
        interval = customization.interval || 7;
        // 첫 실행은 startDate, 그 다음부터 interval 적용
        break;

      default:
        unit = 'week';
        interval = 1;
        // 첫 실행은 startDate, 그 다음부터 주간 반복
    }

    return {
      type: 'fixed',
      interval,
      unit,
      nextDue,
    };
  }

  /**
   * 타입별 메타데이터 생성
   */
  private static createMetadataForType(
    type: 'cleaning' | 'food' | 'medicine' | 'self_care' | 'self_development',
    roomName: string,
    furnitureName: string
  ): any {
    switch (type) {
      case 'cleaning':
        return {
          room: roomName,
          difficulty: 2,
          healthPriority: false,
        };

      case 'food':
        return {
          category: '기타',
          purchaseDate: new Date(),
          storageCondition: '냉장',
          storageType: '원래포장',
          state: '통',
        };

      case 'medicine':
        return {
          type: '일반약',
          dosage: '1정',
          schedule: {
            frequency: 'daily',
            times: ['09:00'],
            mealTiming: '무관',
          },
          totalQuantity: 30,
          remainingQuantity: 30,
          refillThreshold: 5,
        };

      case 'self_care':
        return {
          category: '도구관리',
          subcategory: furnitureName,
          estimatedMinutes: 30,
          requiredProducts: [],
          requiresService: false,
        };

      case 'self_development':
        return {
          category: '취미',
          goal: `${furnitureName} 관리`,
        };

      default:
        return {};
    }
  }

  /**
   * 가구의 Task 목록 조회
   */
  static async getFurnitureTasks(
    userId: string,
    furnitureId: string
  ): Promise<{ lifeObject: LifeObject; task: Task }[]> {
    try {
      // HouseLayout에서 linkedObjectIds 가져오기
      const layoutsQuery = query(
        collection(db, 'users', userId, 'houseLayouts')
      );
      const layoutsSnapshot = await getDocs(layoutsQuery);

      if (layoutsSnapshot.empty) {
        return [];
      }

      const layoutData = layoutsSnapshot.docs[0].data();
      const rooms = layoutData.rooms || [];

      let linkedObjectIds: string[] = [];
      for (const room of rooms) {
        for (const furniture of room.furnitures || []) {
          if (furniture.id === furnitureId) {
            linkedObjectIds = furniture.linkedObjectIds || [];
            break;
          }
        }
        if (linkedObjectIds.length > 0) break;
      }

      if (linkedObjectIds.length === 0) {
        return [];
      }

      // LifeObject들 가져오기
      const results: { lifeObject: LifeObject; task: Task }[] = [];
      
      for (const objectId of linkedObjectIds) {
        const objectDoc = await getDoc(
          doc(db, 'users', userId, 'lifeObjects', objectId)
        );
        
        if (!objectDoc.exists()) continue;

        const lifeObject = {
          id: objectDoc.id,
          ...objectDoc.data(),
          createdAt: objectDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: objectDoc.data().updatedAt?.toDate() || new Date(),
        } as LifeObject;

        // 해당 LifeObject의 Task 찾기
        const tasksQuery = query(
          collection(db, 'users', userId, 'tasks'),
          where('objectId', '==', objectId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        for (const taskDoc of tasksSnapshot.docs) {
          const taskData = taskDoc.data();
          const task: Task = {
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

          results.push({ lifeObject, task });
        }
      }

      return results;
    } catch (error) {
      console.error('Get furniture tasks error:', error);
      return [];
    }
  }
}

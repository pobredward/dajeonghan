/**
 * 가구 세부 페이지 관리 서비스
 * 
 * 가구별 특화 기능과 데이터를 통합 관리합니다.
 */

import { 
  Furniture, 
  FurnitureType, 
  FurnitureMetadata,
  createDefaultFurnitureMetadata 
} from '@/types/house.types';
import { LifeObject } from '@/types/lifeobject.types';
import { Task } from '@/types/task.types';
import { getLifeObjects, getTasks } from '@/services/firestoreService';
import { getHouseLayout, updateFurniture } from '@/services/houseService';

export interface FurnitureDetailData extends Furniture {
  linkedObjects: LifeObject[];
  linkedTasks: Task[];
  calculatedDirtyScore: number;
  roomName: string;
}

export class FurnitureDetailService {
  /**
   * 가구의 모든 관련 데이터를 가져옵니다.
   */
  static async getFurnitureData(
    userId: string, 
    furnitureId: string, 
    roomId: string
  ): Promise<FurnitureDetailData | null> {
    try {
      // House Layout 가져오기
      const layout = await getHouseLayout(userId);
      if (!layout) return null;

      // 방과 가구 찾기
      const room = layout.rooms.find(r => r.id === roomId);
      if (!room) return null;

      const furniture = room.furnitures.find(f => f.id === furnitureId);
      if (!furniture) return null;

      // 연결된 LifeObject와 Task 가져오기
      const [allObjects, allTasks] = await Promise.all([
        getLifeObjects(userId),
        getTasks(userId)
      ]);

      const linkedObjects = allObjects.filter((obj) =>
        furniture.linkedObjectIds.includes(obj.id)
      );

      const linkedTasks = allTasks.filter((task) =>
        furniture.linkedObjectIds.includes(task.objectId)
      );

      // dirtyScore 계산
      const calculatedDirtyScore = this.calculateDirtyScore(linkedTasks);

      return {
        ...furniture,
        linkedObjects,
        linkedTasks,
        calculatedDirtyScore,
        roomName: room.name,
      };
    } catch (error) {
      console.error('Failed to get furniture data:', error);
      return null;
    }
  }

  /**
   * 가구별 특화 기능 이름을 반환합니다.
   */
  static getFurnitureFeatureName(furnitureType: FurnitureType): string {
    switch (furnitureType) {
      case 'fridge':
        return '재고 관리';
      case 'toilet':
      case 'bathtub':
      case 'shower':
        return '청소 관리';
      case 'washing_machine':
        return '세탁 관리';
      case 'closet':
        return '의류 관리';
      case 'plant':
        return '식물 관리';
      case 'tv':
      case 'sofa':
        return '사용 관리';
      default:
        return '기본 관리';
    }
  }

  /**
   * 가구에 메타데이터가 없으면 기본값을 설정합니다.
   */
  static async ensureFurnitureMetadata(
    userId: string, 
    roomId: string, 
    furnitureId: string,
    furnitureType: FurnitureType
  ): Promise<void> {
    try {
      const layout = await getHouseLayout(userId);
      if (!layout) return;

      const room = layout.rooms.find(r => r.id === roomId);
      if (!room) return;

      const furniture = room.furnitures.find(f => f.id === furnitureId);
      if (!furniture) return;

      // 메타데이터가 없으면 기본값 설정
      if (!furniture.furnitureMetadata) {
        const defaultMetadata = createDefaultFurnitureMetadata(furnitureType);
        await updateFurniture(userId, roomId, furnitureId, {
          furnitureMetadata: defaultMetadata
        });
      }
    } catch (error) {
      console.error('Failed to ensure furniture metadata:', error);
    }
  }

  /**
   * 가구별 추천 Task 템플릿을 가져옵니다.
   */
  static getRecommendedTaskTemplates(furnitureType: FurnitureType): string[] {
    const templates: Record<FurnitureType, string[]> = {
      fridge: [
        '유통기한 확인하기',
        '냉장고 정리하기',
        '냉장고 청소하기',
      ],
      bed: [
        '침대 시트 교체하기',
        '베개커버 세탁하기',
        '매트리스 관리하기',
      ],
      desk: [
        '책상 정리하기',
        '모니터 청소하기',
        '케이블 정리하기',
      ],
      toilet: [
        '변기 청소하기',
        '변기시트 교체하기',
        '화장지 보충하기',
      ],
      bathtub: [
        '욕조 청소하기',
        '배수구 청소하기',
        '곰팡이 제거하기',
      ],
      shower: [
        '샤워부스 청소하기',
        '샤워헤드 청소하기',
        '타일 청소하기',
      ],
      washing_machine: [
        '세탁기 청소하기',
        '필터 청소하기',
        '세제 보충하기',
      ],
      plant: [
        '물 주기',
        '분갈이하기',
        '잎 닦기',
      ],
      sink: [
        '싱크대 청소하기',
        '배수구 청소하기',
        '수도꼭지 닦기',
      ],
      closet: [
        '옷장 정리하기',
        '계절옷 정리하기',
        '좀벌레 방지하기',
      ],
      // 기본 템플릿들
      chair: ['의자 청소하기'],
      sofa: ['소파 청소하기', '쿠션 정리하기'],
      table: ['테이블 닦기', '테이블 정리하기'],
      stove: ['가스레인지 청소하기'],
      bookshelf: ['책장 정리하기', '책 먼지 털기'],
      tv: ['TV 청소하기', '리모컨 정리하기'],
      mirror: ['거울 닦기'],
      dresser: ['화장대 정리하기'],
    };

    return templates[furnitureType] || ['기본 청소하기', '정리하기'];
  }

  /**
   * 연결된 Task들을 기반으로 dirtyScore를 계산합니다.
   */
  private static calculateDirtyScore(linkedTasks: Task[]): number {
    const now = new Date();
    const overdueTasks = linkedTasks.filter(
      (task) => task.recurrence.nextDue && new Date(task.recurrence.nextDue) < now
    );

    let score = 0;
    overdueTasks.forEach((task) => {
      if (task.recurrence.nextDue) {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(task.recurrence.nextDue).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        score += Math.min(daysOverdue * 10, 50); // 하루당 10점, 최대 50점
      }
    });

    return Math.min(score, 100);
  }

  /**
   * 가구별 통계 정보를 계산합니다.
   */
  static calculateFurnitureStats(furnitureData: FurnitureDetailData): {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    upcomingTasks: number;
  } {
    const { linkedTasks } = furnitureData;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedTasks = linkedTasks.filter(task => task.status === 'completed').length;
    const overdueTasks = linkedTasks.filter(
      task => task.recurrence.nextDue && new Date(task.recurrence.nextDue) < now
    ).length;
    const upcomingTasks = linkedTasks.filter(
      task => task.recurrence.nextDue && 
               new Date(task.recurrence.nextDue) >= now && 
               new Date(task.recurrence.nextDue) <= tomorrow
    ).length;

    return {
      totalTasks: linkedTasks.length,
      completedTasks,
      overdueTasks,
      upcomingTasks,
    };
  }

  /**
   * 가구별 사용 빈도를 분석합니다.
   */
  static analyzeUsagePattern(furnitureData: FurnitureDetailData): {
    lastUsed?: Date;
    usageFrequency: 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    // Task 완료 기록을 기반으로 사용 패턴 분석
    const { linkedTasks } = furnitureData;
    const recentCompletions = linkedTasks
      .flatMap(task => task.completionHistory || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastUsed = recentCompletions.length > 0 ? recentCompletions[0].date : undefined;
    
    // 최근 30일간 완료 횟수로 사용 빈도 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCompletionsCount = recentCompletions.filter(
      completion => new Date(completion.date) >= thirtyDaysAgo
    ).length;

    let usageFrequency: 'high' | 'medium' | 'low';
    if (recentCompletionsCount >= 10) {
      usageFrequency = 'high';
    } else if (recentCompletionsCount >= 3) {
      usageFrequency = 'medium';
    } else {
      usageFrequency = 'low';
    }

    // 사용 패턴에 따른 추천사항
    const recommendations: string[] = [];
    if (usageFrequency === 'low') {
      recommendations.push('정기적인 관리 일정을 설정해보세요');
    }
    if (furnitureData.calculatedDirtyScore > 50) {
      recommendations.push('청소나 정리가 필요합니다');
    }
    if (linkedTasks.length === 0) {
      recommendations.push('관리 Task를 추가해보세요');
    }

    return {
      lastUsed,
      usageFrequency,
      recommendations,
    };
  }
}
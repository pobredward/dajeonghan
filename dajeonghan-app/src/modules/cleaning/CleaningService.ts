import { CleaningTask, CleaningSession, RoomType, CleaningTemplateItem, CleaningMetadata } from './types';
import { UserProfile } from '@/types/user.types';
import { RecurrenceEngine } from '@/engines/RecurrenceEngine';
import * as Crypto from 'expo-crypto';
import cleaningTemplatesData from './templates/cleaningTemplates.json';

/**
 * 청소 서비스
 * 
 * 청소 모듈의 핵심 비즈니스 로직을 담당합니다.
 * - 템플릿으로부터 태스크 생성
 * - 더러움 점수 계산
 * - 10분 코스 / 여유 코스 추천
 * - 환경에 따른 태스크 조정
 */
export class CleaningService {
  /**
   * 템플릿으로부터 청소 태스크 생성
   * 
   * @param userId 사용자 ID
   * @param persona 사용자 페르소나 (student_20s, worker_single, family, minimalist)
   * @param userEnvironment 사용자 환경 설정 (세탁기 유무 등)
   * @returns 생성된 청소 태스크 배열
   */
  static createTasksFromTemplate(
    userId: string,
    persona: string,
    userEnvironment: UserProfile['environment']
  ): CleaningTask[] {
    const templates = cleaningTemplatesData as Record<string, CleaningTemplateItem[]>;
    const template = templates[persona] || templates['student_20s'];
    
    return template.map((item, index) => {
      // 환경에 따른 필터링
      if (item.requiresTools?.includes('세탁기') && !userEnvironment.hasWasher) {
        return this.adaptToCoinLaundry(userId, item, index);
      }

      return this.createCleaningTask(userId, item, index);
    });
  }

  /**
   * 코인세탁 모드로 변경
   * 
   * 세탁기가 없는 경우 코인세탁 방법으로 태스크 조정
   */
  private static adaptToCoinLaundry(
    userId: string,
    template: CleaningTemplateItem,
    index: number
  ): CleaningTask {
    const baseTask = this.createCleaningTask(userId, template, index);
    
    return {
      ...baseTask,
      title: `${template.name} (코인세탁)`,
      description: '1. 세탁물 준비 → 2. 코인세탁 방문 → 3. 세탁 완료 후 픽업',
      estimatedMinutes: template.estimatedMinutes + 30 // 이동 시간 추가
    };
  }

  /**
   * 청소 태스크 생성
   */
  private static createCleaningTask(
    userId: string,
    template: CleaningTemplateItem,
    index: number
  ): CleaningTask {
    const now = new Date();
    const taskId = Crypto.randomUUID();
    
    // interval에 따라 nextDue 계산
    let nextDueDate = new Date(now);
    if (template.unit === 'day') {
      nextDueDate.setDate(nextDueDate.getDate() + template.interval);
    } else if (template.unit === 'week') {
      nextDueDate.setDate(nextDueDate.getDate() + template.interval * 7);
    } else if (template.unit === 'month') {
      nextDueDate.setMonth(nextDueDate.getMonth() + template.interval);
    }
    
    const metadata: CleaningMetadata = {
      room: template.room,
      difficulty: template.difficulty,
      healthPriority: template.healthPriority,
      requiresTools: template.requiresTools,
      seasonalAdjustment: template.seasonalAdjustment
    };
    
    return {
      id: taskId,
      userId,
      furnitureId: '',
      title: template.name,
      description: `${template.room} 청소 작업`,
      type: 'cleaning',
      recurrence: {
        type: 'fixed',
        interval: template.interval,
        unit: template.unit,
        nextDue: nextDueDate
      },
      priority: template.priority,
      estimatedMinutes: template.estimatedMinutes,
      status: 'pending',
      notificationSettings: {
        enabled: true,
        timing: 'digest',
        advanceHours: [24]
      },
      completionHistory: [],
      dirtyScore: 0,
      metadata,
      ...(template.templateItemId ? { templateItemId: template.templateItemId } : {}),
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 더러움 점수 계산
   * 
   * 경과 비율 × 난이도를 기반으로 0~10 사이의 점수 계산
   * 
   * @param task 청소 태스크
   * @returns 더러움 점수 (0~10)
   */
  static calculateDirtyScore(task: CleaningTask): number {
    const elapsedRatio = RecurrenceEngine.calculateElapsedRatio(task);
    
    // 경과 비율 × 난이도
    const difficulty = task.metadata.difficulty || 3;
    
    // 건강 우선순위 항목은 점수를 더 높게
    const healthMultiplier = task.metadata.healthPriority ? 1.3 : 1.0;
    
    const score = Math.min(elapsedRatio * difficulty * 2 * healthMultiplier, 10);
    
    return Math.round(score * 10) / 10;
  }

  /**
   * 오늘의 청소 10분 코스
   * 
   * 빠르게 끝낼 수 있는 작업들로 조합하여 추천
   * 
   * @param tasks 모든 청소 태스크
   * @param targetMinutes 목표 시간 (기본 10분)
   * @returns 청소 세션
   */
  static recommendQuickSession(
    tasks: CleaningTask[],
    targetMinutes: number = 10
  ): CleaningSession {
    // 1. 더러움 점수 계산 및 정렬
    const scored = tasks
      .map(task => ({
        task,
        score: this.calculateDirtyScore(task)
      }))
      .sort((a, b) => b.score - a.score);

    // 2. 10분 이내 작업만 필터링
    const quickTasks = scored.filter(s => s.task.estimatedMinutes <= 10);

    // 3. 목표 시간 내로 조합
    const selected: CleaningTask[] = [];
    let totalMinutes = 0;

    for (const { task } of quickTasks) {
      if (totalMinutes + task.estimatedMinutes <= targetMinutes) {
        selected.push(task);
        totalMinutes += task.estimatedMinutes;
      }

      if (selected.length >= 3) break; // 최대 3개
    }

    return {
      tasks: selected,
      totalMinutes,
      totalPoints: selected.reduce((sum, t) => sum + this.calculateDirtyScore(t), 0)
    };
  }

  /**
   * 여유 있을 때 코스
   * 
   * 10~30분 소요되는 작업 중 긴급한 것 추천
   * 
   * @param tasks 모든 청소 태스크
   * @param targetMinutes 목표 시간 (기본 30분)
   * @returns 청소 세션
   */
  static recommendLeisureSession(
    tasks: CleaningTask[],
    targetMinutes: number = 30
  ): CleaningSession {
    // 10~30분 소요 태스크 필터링
    const leisure = tasks.filter(t => 
      t.estimatedMinutes >= 10 && t.estimatedMinutes <= targetMinutes
    );

    const scored = leisure
      .map(task => ({
        task,
        score: this.calculateDirtyScore(task)
      }))
      .sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, 3).map(s => s.task);

    return {
      tasks: selected,
      totalMinutes: selected.reduce((sum, t) => sum + t.estimatedMinutes, 0),
      totalPoints: selected.reduce((sum, t) => sum + this.calculateDirtyScore(t), 0)
    };
  }

  /**
   * 방별 필터링
   * 
   * @param tasks 모든 청소 태스크
   * @param room 필터링할 방 타입
   * @returns 해당 방의 청소 태스크
   */
  static filterByRoom(tasks: CleaningTask[], room: RoomType): CleaningTask[] {
    return tasks.filter(task => task.metadata.room === room);
  }

  /**
   * 건강 우선순위 태스크 필터링
   * 
   * 화장실/주방 등 건강에 직결되는 청소 작업
   * 
   * @param tasks 모든 청소 태스크
   * @returns 건강 우선순위 태스크
   */
  static getHealthPriorityTasks(tasks: CleaningTask[]): CleaningTask[] {
    return tasks.filter(task => task.metadata.healthPriority === true);
  }

  /**
   * 태스크별 더러움 점수 일괄 업데이트
   * 
   * @param tasks 모든 청소 태스크
   * @returns 더러움 점수가 업데이트된 태스크 배열
   */
  static updateDirtyScores(tasks: CleaningTask[]): CleaningTask[] {
    return tasks.map(task => ({
      ...task,
      dirtyScore: this.calculateDirtyScore(task)
    }));
  }

  /**
   * 긴급한 청소 작업 필터링
   * 
   * 더러움 점수가 7 이상인 작업
   * 
   * @param tasks 모든 청소 태스크
   * @returns 긴급한 청소 태스크
   */
  static getUrgentTasks(tasks: CleaningTask[]): CleaningTask[] {
    return tasks.filter(task => this.calculateDirtyScore(task) >= 7);
  }

  /**
   * 오늘 할 청소 추천
   * 
   * 10분 코스와 여유 코스를 모두 반환
   * 
   * @param tasks 모든 청소 태스크
   * @returns 10분 코스와 여유 코스
   */
  static recommendTodaysCleaning(tasks: CleaningTask[]): {
    quickSession: CleaningSession;
    leisureSession: CleaningSession;
  } {
    // 더러움 점수 업데이트
    const updatedTasks = this.updateDirtyScores(tasks);

    return {
      quickSession: this.recommendQuickSession(updatedTasks, 10),
      leisureSession: this.recommendLeisureSession(updatedTasks, 30)
    };
  }
}

import { differenceInDays } from 'date-fns';

export interface ActivityLog {
  date: Date;
  userId: string;
  type: 'task_complete' | 'app_open';
}

export interface Milestone {
  day: number;
  message: string;
  badge: string;
}

export interface MilestoneResult {
  milestone?: number;
  message?: string;
  badge?: string;
}

export class HabitService {
  /**
   * 연속 사용 일수 계산
   */
  static calculateStreak(userId: string, logs: ActivityLog[]): number {
    if (logs.length === 0) return 0;

    const sortedLogs = logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    let streak = 1;
    let currentDate = sortedLogs[0].date;

    for (let i = 1; i < sortedLogs.length; i++) {
      const diff = differenceInDays(currentDate, sortedLogs[i].date);
      
      if (diff === 1) {
        streak++;
        currentDate = sortedLogs[i].date;
      } else if (diff > 1) {
        break;
      }
    }

    return streak;
  }

  /**
   * 마일스톤 체크
   */
  static checkMilestones(streak: number): MilestoneResult {
    const milestones: Milestone[] = [
      { day: 3, message: '3일 연속! 좋은 시작이에요 🎉', badge: '시작' },
      { day: 7, message: '1주일 달성! 루틴이 생기고 있어요 🔥', badge: '1주' },
      { day: 14, message: '2주 연속! 이미 습관이 되어가고 있어요 💪', badge: '2주' },
      { day: 30, message: '한 달 완성! 대단해요 🏆', badge: '1개월' },
      { day: 66, message: '66일 달성! 완전한 습관화에 성공했어요 ⭐', badge: '마스터' }
    ];

    const achieved = milestones.find(m => m.day === streak);
    return achieved || {};
  }

  /**
   * 습관 점수 계산 (0~100)
   */
  static calculateHabitScore(
    completionRate: number,
    streak: number,
    totalDays: number
  ): number {
    const completionScore = completionRate * 0.5; // 50%
    const streakScore = Math.min(streak / 66, 1) * 0.3; // 30%
    const consistencyScore = Math.min(totalDays / 90, 1) * 0.2; // 20%

    return Math.round((completionScore + streakScore + consistencyScore) * 100);
  }

  /**
   * 주간 통계 계산
   */
  static calculateWeeklyStats(logs: ActivityLog[], tasks: any[]): {
    completedTasks: number;
    totalTasks: number;
    streak: number;
    topModule: string;
  } {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyTasks = tasks.filter(task => {
      const completedAt = task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt);
      return task.status === 'completed' && completedAt >= oneWeekAgo;
    });

    const moduleCounts = {
      home: 0,
      food: 0,
      medicine: 0,
      pet: 0,
      self_care: 0,
      car: 0,
      family: 0,
      growth: 0,
    };

    weeklyTasks.forEach(task => {
      const domain = (task.domain ?? task.type ?? 'home') as keyof typeof moduleCounts;
      if (domain in moduleCounts) {
        moduleCounts[domain]++;
      }
    });

    const topModule = (Object.entries(moduleCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'home') as keyof typeof moduleCounts;

    const totalTasks = tasks.filter(task => {
      const createdAt = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;

    const streak = this.calculateStreak(logs[0]?.userId || '', logs);

    return {
      completedTasks: weeklyTasks.length,
      totalTasks: totalTasks || weeklyTasks.length,
      streak,
      topModule
    };
  }

  /**
   * 스트릭 끊김 체크 (오늘 활동이 있는지)
   */
  static isStreakAtRisk(lastActivityDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActivity = new Date(lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    
    return differenceInDays(today, lastActivity) >= 1;
  }
}

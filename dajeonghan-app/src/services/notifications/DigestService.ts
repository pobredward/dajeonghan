/**
 * 다정한 - 다이제스트 서비스
 * 
 * 하루 2회 배치 알림의 내용을 생성합니다.
 * - 오전 다이제스트: 오늘 할 일 요약
 * - 저녁 다이제스트: 남은 일 요약
 */

import { Task } from '@/types/task.types';
import { FoodItem } from '@/modules/fridge/types';
import { Medicine } from '@/modules/medicine/types';
import { DigestContent, DigestSection, DigestTime } from '@/types/notification.types';
import { differenceInDays } from 'date-fns';

export class DigestService {
  /**
   * 다이제스트 생성
   * 
   * @param time 시간대 (morning/evening)
   * @param tasks 테스크 목록
   * @param foods 식재료 목록
   * @param medicines 약 목록
   * @returns 다이제스트 콘텐츠
   */
  static generateDigest(
    time: DigestTime,
    tasks: Task[],
    foods: FoodItem[],
    medicines: Medicine[]
  ): DigestContent {
    const sections: DigestSection[] = [];

    const cleaningSection = this.generateCleaningSection(tasks);
    if (cleaningSection) sections.push(cleaningSection);

    const foodSection = this.generateFoodSection(foods);
    if (foodSection) sections.push(foodSection);

    if (time === 'morning') {
      const medicineSection = this.generateMedicineSection(medicines);
      if (medicineSection) sections.push(medicineSection);
    }

    const { title, body } = this.generateTitleAndBody(time, sections);

    return {
      title,
      body,
      sections,
      totalItems: sections.reduce((sum, s) => sum + s.count, 0)
    };
  }

  /**
   * 청소 섹션 생성
   */
  private static generateCleaningSection(tasks: Task[]): DigestSection | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cleaningTasks = tasks
      .filter(t => (t.domain ?? t.type) === 'home' && t.status === 'pending')
      .filter(t => {
        const nextDue = new Date(t.recurrence.nextDue);
        return nextDue <= today || differenceInDays(nextDue, today) <= 1;
      })
      .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
      .slice(0, 3);

    if (cleaningTasks.length === 0) return null;

    return {
      type: 'cleaning',
      icon: '🧹',
      items: cleaningTasks.map(t => `${t.title} (${t.estimatedMinutes}분)`),
      count: cleaningTasks.length
    };
  }

  /**
   * 식재료 섹션 생성
   */
  private static generateFoodSection(foods: FoodItem[]): DigestSection | null {
    const today = new Date();
    
    const expiringFoods = foods
      .filter(f => {
        const expiry = f.metadata.recommendedConsumption || f.metadata.expiryDate;
        if (!expiry) return false;
        
        const daysLeft = differenceInDays(new Date(expiry), today);
        return daysLeft >= 0 && daysLeft <= 3;
      })
      .sort((a, b) => {
        const aExpiry = a.metadata.recommendedConsumption || a.metadata.expiryDate;
        const bExpiry = b.metadata.recommendedConsumption || b.metadata.expiryDate;
        if (!aExpiry || !bExpiry) return 0;
        return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
      })
      .slice(0, 3);

    if (expiringFoods.length === 0) return null;

    return {
      type: 'food',
      icon: '🥗',
      items: expiringFoods.map(f => {
        const expiry = f.metadata.recommendedConsumption || f.metadata.expiryDate;
        const daysLeft = expiry ? differenceInDays(new Date(expiry), today) : 0;
        
        const dayText = daysLeft === 0 
          ? '오늘까지' 
          : daysLeft === 1 
          ? '내일까지'
          : `${daysLeft}일 남음`;
        
        return `${f.name} (${dayText})`;
      }),
      count: expiringFoods.length
    };
  }

  /**
   * 약 섹션 생성 (오전 다이제스트 전용)
   */
  private static generateMedicineSection(medicines: Medicine[]): DigestSection | null {
    const today = new Date();
    const todayDay = today.getDay();

    const todayMeds = medicines
      .filter(m => {
        const schedule = m.metadata.schedule;
        if (schedule.frequency === 'daily') return true;
        if (schedule.frequency === 'specific_days') {
          return schedule.days?.includes(todayDay) || false;
        }
        return false;
      })
      .sort((a, b) => {
        const aTime = a.metadata.schedule.times[0] || '00:00';
        const bTime = b.metadata.schedule.times[0] || '00:00';
        return aTime.localeCompare(bTime);
      })
      .slice(0, 3);

    if (todayMeds.length === 0) return null;

    return {
      type: 'medicine',
      icon: '💊',
      items: todayMeds.map(m => {
        const schedule = m.metadata.schedule;
        const firstTime = schedule.times[0];
        return `${m.name} (${firstTime} ${schedule.mealTiming})`;
      }),
      count: todayMeds.length
    };
  }

  /**
   * 제목과 본문 생성
   */
  private static generateTitleAndBody(
    time: DigestTime,
    sections: DigestSection[]
  ): { title: string; body: string } {
    const title = time === 'morning' ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일';

    if (sections.length === 0) {
      const body = time === 'morning' 
        ? '오늘은 할 일이 없어요!'
        : '오늘 할 일을 모두 끝냈어요!';
      return { title, body };
    }

    const summary: string[] = [];
    sections.forEach(section => {
      const label = {
        cleaning: '청소',
        food: '식재료',
        medicine: '약'
      }[section.type];
      summary.push(`${section.icon} ${label} ${section.count}개`);
    });

    const body = summary.join(' · ');

    return { title, body };
  }

  /**
   * 다이제스트 HTML 렌더링 (앱 내 표시용)
   */
  static renderDigestHTML(digest: DigestContent): string {
    let html = `<h2>${digest.title}</h2>`;
    html += `<p>${digest.body}</p>`;

    if (digest.sections.length > 0) {
      digest.sections.forEach(section => {
        const label = {
          cleaning: '청소',
          food: '식재료',
          medicine: '약'
        }[section.type];
        
        html += `<h3>${section.icon} ${label}</h3>`;
        html += '<ul>';
        section.items.forEach(item => {
          html += `<li>${item}</li>`;
        });
        html += '</ul>';
      });
    }

    return html;
  }

  /**
   * 다이제스트가 비어있는지 확인
   */
  static isEmpty(digest: DigestContent): boolean {
    return digest.totalItems === 0;
  }
}

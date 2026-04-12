import { Medicine, MedicineMetadata, DoseLog, RefillReminder, TodayDose } from './types';
import { addDays, getDay, parseISO, differenceInDays } from 'date-fns';
import * as Crypto from 'expo-crypto';

/**
 * 약 관리 서비스
 */
export class MedicineService {
  /**
   * 약 추가
   */
  static createMedicine(
    userId: string,
    basicInfo: {
      name: string;
      type: '처방약' | '일반약' | '영양제';
      dosage: string;
      times: string[];
      totalQuantity: number;
      mealTiming?: '식전' | '식후' | '식사중' | '무관';
    }
  ): Medicine {
    const now = new Date();
    const itemId = Crypto.randomUUID();

    const metadata: MedicineMetadata = {
      type: basicInfo.type,
      dosage: basicInfo.dosage,
      schedule: {
        frequency: 'daily',
        times: basicInfo.times,
        mealTiming: basicInfo.mealTiming || '무관',
        minutesFromMeal: basicInfo.mealTiming === '식전' ? 30 : 
                        basicInfo.mealTiming === '식후' ? 30 : 0
      },
      totalQuantity: basicInfo.totalQuantity,
      remainingQuantity: basicInfo.totalQuantity,
      refillThreshold: Math.min(7, Math.floor(basicInfo.totalQuantity * 0.2))
    };

    return {
      id: itemId,
      userId,
      type: 'medicine',
      name: basicInfo.name,
      metadata,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 오늘의 복용 일정 생성
   */
  static getTodaySchedule(medicines: Medicine[]): TodayDose[] {
    const today = new Date();
    const todayDay = getDay(today);

    const schedule: TodayDose[] = [];

    medicines.forEach(medicine => {
      const { schedule: medSchedule } = medicine.metadata;

      if (medSchedule.frequency === 'specific_days') {
        if (!medSchedule.days?.includes(todayDay)) {
          return;
        }
      }

      medSchedule.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date(today);
        scheduledTime.setHours(hours, minutes, 0, 0);

        schedule.push({
          medicine,
          time,
          taken: false,
          scheduledTime
        });
      });
    });

    schedule.sort((a, b) => a.time.localeCompare(b.time));

    return schedule;
  }

  /**
   * 복용 기록
   */
  static createDoseLog(
    userId: string,
    medicineId: string,
    medicineName: string,
    scheduledTime: Date,
    taken: boolean,
    note?: string
  ): DoseLog {
    const now = new Date();

    return {
      id: Crypto.randomUUID(),
      userId,
      medicineId,
      medicineName,
      scheduledTime,
      actualTime: taken ? now : undefined,
      taken,
      skipped: !taken,
      note,
      createdAt: now
    };
  }

  /**
   * 복용 후 재고 감소
   */
  static decreaseQuantity(medicine: Medicine): Medicine {
    const newQuantity = medicine.metadata.remainingQuantity - 1;

    return {
      ...medicine,
      metadata: {
        ...medicine.metadata,
        remainingQuantity: Math.max(0, newQuantity)
      },
      updatedAt: new Date()
    };
  }

  /**
   * 리필 필요 여부 체크
   */
  static checkRefillNeeded(medicines: Medicine[]): RefillReminder[] {
    const reminders: RefillReminder[] = [];

    medicines.forEach(medicine => {
      const { remainingQuantity, refillThreshold, schedule } = medicine.metadata;

      if (remainingQuantity <= refillThreshold) {
        const dailyDose = schedule.times.length;
        const daysLeft = Math.floor(remainingQuantity / dailyDose);

        reminders.push({
          medicineId: medicine.id,
          medicineName: medicine.name,
          remainingQuantity,
          daysLeft,
          pharmacy: medicine.metadata.pharmacy,
          urgent: daysLeft <= 3
        });
      }
    });

    reminders.sort((a, b) => a.daysLeft - b.daysLeft);

    return reminders;
  }

  /**
   * 복용률 계산
   */
  static calculateAdherence(
    logs: DoseLog[],
    startDate: Date,
    endDate: Date
  ): {
    total: number;
    taken: number;
    skipped: number;
    adherenceRate: number;
  } {
    const filtered = logs.filter(log => 
      log.scheduledTime >= startDate && log.scheduledTime <= endDate
    );

    const taken = filtered.filter(log => log.taken).length;
    const skipped = filtered.filter(log => log.skipped).length;
    const total = filtered.length;

    return {
      total,
      taken,
      skipped,
      adherenceRate: total > 0 ? (taken / total) * 100 : 0
    };
  }
}

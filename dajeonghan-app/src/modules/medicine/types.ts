import { LifeObject } from '@/types/lifeobject.types';

/**
 * 약/영양제 아이템
 */
export interface Medicine extends LifeObject {
  type: 'medicine';
  metadata: MedicineMetadata;
}

/**
 * 약 메타데이터
 */
export interface MedicineMetadata {
  type: MedicineType;
  dosage: string; // '1정', '1포', '10ml'
  schedule: DoseSchedule;
  totalQuantity: number;
  remainingQuantity: number;
  refillThreshold: number; // 7일치 남으면 알림
  prescriptionDate?: Date;
  prescriptionEndDate?: Date;
  pharmacy?: string;
  notes?: string;
}

export type MedicineType = '처방약' | '일반약' | '영양제';

/**
 * 복용 스케줄
 */
export interface DoseSchedule {
  frequency: 'daily' | 'specific_days' | 'as_needed';
  days?: number[]; // [1,3,5] = 월수금 (0=일요일)
  times: string[]; // ['08:00', '13:00', '20:00']
  mealTiming: '식전' | '식후' | '식사중' | '무관';
  minutesFromMeal?: number; // 식전/후 몇 분
}

/**
 * 복용 기록
 */
export interface DoseLog {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: Date;
  actualTime?: Date;
  taken: boolean;
  skipped: boolean;
  note?: string;
  createdAt: Date;
}

/**
 * 리필 알림
 */
export interface RefillReminder {
  medicineId: string;
  medicineName: string;
  remainingQuantity: number;
  daysLeft: number;
  pharmacy?: string;
  urgent: boolean; // 3일 이하면 true
}

/**
 * 오늘의 복용 일정
 */
export interface TodayDose {
  medicine: Medicine;
  time: string;
  taken: boolean;
  scheduledTime: Date;
}

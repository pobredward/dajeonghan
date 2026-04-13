export const FREE_LIMITS = {
  tasks: 50,
  foods: 30,
  medicines: 5,
  devices: 1
};

export const PREMIUM_FEATURES = {
  unlimitedTasks: '무제한 테스크',
  unlimitedFoods: '무제한 식재료',
  unlimitedMedicines: '무제한 약',
  multiDevice: '멀티 디바이스 동기화',
  familySharing: '가족 공유 (최대 5명)',
  advancedNotifications: '고급 알림 커스터마이징',
  receiptOCR: '영수증 자동 인식',
  exportData: '데이터 내보내기 (PDF, Excel)',
  prioritySupport: '우선 고객 지원'
};

export const PREMIUM_PRICE = {
  monthly: 4900,
  yearly: 49000,
  lifetime: 99000
};

export type PremiumFeatureKey = keyof typeof PREMIUM_FEATURES;

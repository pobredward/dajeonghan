import { MedicineService } from '../MedicineService';

describe('MedicineService', () => {
  describe('createMedicine', () => {
    it('should create medicine with basic info', () => {
      const medicine = MedicineService.createMedicine('user_123', {
        name: '타이레놀',
        type: '일반약',
        dosage: '1정',
        times: ['08:00', '20:00'],
        totalQuantity: 20
      });

      expect(medicine.name).toBe('타이레놀');
      expect(medicine.metadata.type).toBe('일반약');
      expect(medicine.metadata.schedule.times).toEqual(['08:00', '20:00']);
      expect(medicine.metadata.remainingQuantity).toBe(20);
    });
  });

  describe('getTodaySchedule', () => {
    it('should generate today schedule', () => {
      const medicines = [
        MedicineService.createMedicine('user_123', {
          name: '혈압약',
          type: '처방약',
          dosage: '1정',
          times: ['08:00', '20:00'],
          totalQuantity: 60,
          mealTiming: '식후'
        })
      ];

      const schedule = MedicineService.getTodaySchedule(medicines);

      expect(schedule.length).toBe(2);
      expect(schedule[0].time).toBe('08:00');
      expect(schedule[1].time).toBe('20:00');
    });
  });

  describe('decreaseQuantity', () => {
    it('should decrease remaining quantity', () => {
      const medicine = MedicineService.createMedicine('user_123', {
        name: '비타민',
        type: '영양제',
        dosage: '1정',
        times: ['09:00'],
        totalQuantity: 30
      });

      const updated = MedicineService.decreaseQuantity(medicine);

      expect(updated.metadata.remainingQuantity).toBe(29);
    });

    it('should not go below zero', () => {
      const medicine = MedicineService.createMedicine('user_123', {
        name: '비타민',
        type: '영양제',
        dosage: '1정',
        times: ['09:00'],
        totalQuantity: 1
      });

      let updated = MedicineService.decreaseQuantity(medicine);
      updated = MedicineService.decreaseQuantity(updated);

      expect(updated.metadata.remainingQuantity).toBe(0);
    });
  });

  describe('checkRefillNeeded', () => {
    it('should detect refill needed', () => {
      const medicine = MedicineService.createMedicine('user_123', {
        name: '혈압약',
        type: '처방약',
        dosage: '1정',
        times: ['08:00', '20:00'],
        totalQuantity: 60
      });

      medicine.metadata.remainingQuantity = 5;

      const reminders = MedicineService.checkRefillNeeded([medicine]);

      expect(reminders.length).toBe(1);
      expect(reminders[0].medicineName).toBe('혈압약');
      expect(reminders[0].daysLeft).toBe(2);
      expect(reminders[0].urgent).toBe(true);
    });
  });
});

import * as SecureStore from 'expo-secure-store';
import { Medicine, DoseLog } from '../types';

const MEDICINES_KEY = 'medicines';
const DOSE_LOGS_KEY = 'dose_logs';

/**
 * 약 정보 보안 저장소
 */
export class SecureMedicineStorage {
  static async saveMedicines(userId: string, medicines: Medicine[]): Promise<void> {
    const key = `${MEDICINES_KEY}_${userId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(medicines));
  }

  static async loadMedicines(userId: string): Promise<Medicine[]> {
    const key = `${MEDICINES_KEY}_${userId}`;
    const data = await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : [];
  }

  static async saveDoseLog(userId: string, log: DoseLog): Promise<void> {
    const key = `${DOSE_LOGS_KEY}_${userId}`;
    const existing = await this.loadDoseLogs(userId);
    existing.push(log);
    await SecureStore.setItemAsync(key, JSON.stringify(existing));
  }

  static async loadDoseLogs(userId: string): Promise<DoseLog[]> {
    const key = `${DOSE_LOGS_KEY}_${userId}`;
    const data = await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : [];
  }

  static async deleteAllData(userId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${MEDICINES_KEY}_${userId}`);
    await SecureStore.deleteItemAsync(`${DOSE_LOGS_KEY}_${userId}`);
  }
}

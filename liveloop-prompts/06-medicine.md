# 06. 약/영양제 모듈 구현

## 목표
정확한 복용 시간 알림 및 리필 관리 시스템을 구현합니다.

## 핵심 원칙
- **정확성**: 의료 판단 제외, 리마인더 중심
- **신뢰성**: 개인정보 보호 최우선
- **안전성**: 로컬 저장 기본, 선택적 동기화
- **간결함**: 복용 기록 및 리필만 집중

## 데이터 확장

`src/modules/medicine/types.ts`:

```typescript
import { LifeObject } from '@/types/task.types';

export interface Medicine extends LifeObject {
  type: 'medicine';
  metadata: MedicineMetadata;
}

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

export interface DoseSchedule {
  frequency: 'daily' | 'specific_days' | 'as_needed';
  days?: number[]; // [1,3,5] = 월수금 (0=일요일)
  times: string[]; // ['08:00', '13:00', '20:00']
  mealTiming: '식전' | '식후' | '식사중' | '무관';
  minutesFromMeal?: number; // 식전/후 몇 분
}

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

export interface RefillReminder {
  medicineId: string;
  medicineName: string;
  remainingQuantity: number;
  daysLeft: number;
  pharmacy?: string;
  urgent: boolean; // 3일 이하면 true
}
```

## 약 관리 서비스

`src/modules/medicine/medicineService.ts`:

```typescript
import { Medicine, MedicineMetadata, DoseLog, RefillReminder } from './types';
import { addDays, format, parseISO, isToday, getDay } from 'date-fns';

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
      refillThreshold: Math.min(7, Math.floor(basicInfo.totalQuantity * 0.2)) // 20% 또는 7일치
    };

    return {
      id: `medicine_${userId}_${Date.now()}`,
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
  static getTodaySchedule(medicines: Medicine[]): Array<{
    medicine: Medicine;
    time: string;
    taken: boolean;
  }> {
    const today = new Date();
    const todayDay = getDay(today); // 0=일요일

    const schedule: Array<any> = [];

    medicines.forEach(medicine => {
      const { schedule: medSchedule } = medicine.metadata;

      // 빈도 체크
      if (medSchedule.frequency === 'specific_days') {
        if (!medSchedule.days?.includes(todayDay)) {
          return; // 오늘은 복용일이 아님
        }
      }

      // 각 시간대별로 추가
      medSchedule.times.forEach(time => {
        schedule.push({
          medicine,
          time,
          taken: false // 실제로는 DoseLog 조회 필요
        });
      });
    });

    // 시간 순으로 정렬
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    return schedule;
  }

  /**
   * 복용 기록
   */
  static async recordDose(
    userId: string,
    medicineId: string,
    medicineName: string,
    scheduledTime: Date,
    taken: boolean,
    note?: string
  ): Promise<DoseLog> {
    const now = new Date();

    const log: DoseLog = {
      id: `dose_${userId}_${Date.now()}`,
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

    // Firestore에 저장
    // await saveDoseLog(log);

    return log;
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
        // 하루 복용량 계산
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

    // 긴급 순으로 정렬
    reminders.sort((a, b) => a.daysLeft - b.daysLeft);

    return reminders;
  }

  /**
   * 복용률 계산 (주간/월간)
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

  /**
   * PDF 내보내기 데이터 생성 (병원 방문용)
   */
  static generateMedicineList(medicines: Medicine[]): string {
    let output = '복용 중인 약 목록\n';
    output += `생성일: ${format(new Date(), 'yyyy-MM-dd')}\n\n`;

    medicines.forEach((med, index) => {
      output += `${index + 1}. ${med.name}\n`;
      output += `   - 종류: ${med.metadata.type}\n`;
      output += `   - 용량: ${med.metadata.dosage}\n`;
      output += `   - 복용 시간: ${med.metadata.schedule.times.join(', ')}\n`;
      output += `   - 식사 관계: ${med.metadata.schedule.mealTiming}\n`;
      if (med.metadata.notes) {
        output += `   - 메모: ${med.metadata.notes}\n`;
      }
      output += '\n';
    });

    return output;
  }

  /**
   * 미복용 알림 (30분 후 리마인더)
   */
  static shouldSendReminder(scheduledTime: Date, currentTime: Date = new Date()): boolean {
    const diffMinutes = (currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
    
    // 예정 시간 지나고 30분 경과
    return diffMinutes >= 30 && diffMinutes < 40;
  }
}
```

## UI 컴포넌트

`src/modules/medicine/components/MedicineCard.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Medicine } from '../types';

interface Props {
  medicine: Medicine;
  time: string;
  taken: boolean;
  onTake: () => void;
  onSkip: () => void;
}

export const MedicineCard: React.FC<Props> = ({ 
  medicine, 
  time, 
  taken, 
  onTake, 
  onSkip 
}) => {
  const mealInfo = medicine.metadata.schedule.mealTiming !== '무관'
    ? ` (${medicine.metadata.schedule.mealTiming})`
    : '';

  return (
    <View style={[styles.card, taken && styles.cardTaken]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{medicine.name}</Text>
          <Text style={styles.info}>
            {time}{mealInfo} · {medicine.metadata.dosage}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{medicine.metadata.type}</Text>
        </View>
      </View>

      {!taken ? (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.takeButton]} 
            onPress={onTake}
          >
            <Text style={styles.buttonText}>✓ 복용</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.skipButton]} 
            onPress={onSkip}
          >
            <Text style={styles.buttonText}>건너뛰기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.takenBadge}>
          <Text style={styles.takenText}>✓ 복용 완료</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTaken: {
    backgroundColor: '#F1F8F4',
    opacity: 0.7
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  info: {
    fontSize: 14,
    color: '#666'
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  takeButton: {
    backgroundColor: '#4CAF50'
  },
  skipButton: {
    backgroundColor: '#9E9E9E'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  takenBadge: {
    alignItems: 'center',
    paddingVertical: 8
  },
  takenText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600'
  }
});
```

## 리필 알림 컴포넌트

`src/modules/medicine/components/RefillAlert.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RefillReminder } from '../types';

interface Props {
  reminder: RefillReminder;
  onDismiss: () => void;
}

export const RefillAlert: React.FC<Props> = ({ reminder, onDismiss }) => {
  const isUrgent = reminder.urgent;

  return (
    <View style={[styles.container, isUrgent && styles.urgent]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{isUrgent ? '⚠️' : '📦'}</Text>
        <View style={styles.content}>
          <Text style={styles.title}>
            {reminder.medicineName} 리필 필요
          </Text>
          <Text style={styles.subtitle}>
            {reminder.daysLeft}일치 남음 ({reminder.remainingQuantity}개)
          </Text>
          {reminder.pharmacy && (
            <Text style={styles.pharmacy}>📍 {reminder.pharmacy}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onDismiss}>
        <Text style={styles.buttonText}>확인</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  urgent: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  icon: {
    fontSize: 24,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  pharmacy: {
    fontSize: 12,
    color: '#999'
  },
  button: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
```

## 개인정보 처리 동의

`src/modules/medicine/components/PrivacyConsent.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  onAccept: (syncEnabled: boolean) => void;
  onDecline: () => void;
}

export const PrivacyConsent: React.FC<Props> = ({ onAccept, onDecline }) => {
  const [syncEnabled, setSyncEnabled] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>약 정보 보호 안내</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 로컬 저장 (기본)</Text>
        <Text style={styles.text}>
          약 정보는 기본적으로 이 기기에만 저장됩니다. 앱을 삭제하면 데이터도 함께 삭제됩니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>☁️ 클라우드 동기화 (선택)</Text>
        <Text style={styles.text}>
          여러 기기에서 사용하려면 클라우드 동기화를 활성화할 수 있습니다. 
          데이터는 암호화되어 전송되며, 본인만 접근할 수 있습니다.
        </Text>
        
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => setSyncEnabled(!syncEnabled)}
        >
          <Text style={styles.checkboxIcon}>{syncEnabled ? '☑️' : '☐'}</Text>
          <Text style={styles.checkboxText}>클라우드 동기화 활성화</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>⚠️ 중요한 안내</Text>
        <Text style={styles.disclaimerText}>
          • 본 앱은 의료 조언을 제공하지 않습니다{'\n'}
          • 약물 상호작용 경고 기능은 제공하지 않습니다{'\n'}
          • 복용 변경은 반드시 의사/약사와 상담하세요{'\n'}
          • 응급 상황 시 즉시 의료 기관에 연락하세요
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => onAccept(syncEnabled)}
        >
          <Text style={styles.acceptButtonText}>동의하고 시작</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.declineButton} 
          onPress={onDecline}
        >
          <Text style={styles.declineButtonText}>취소</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666'
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8
  },
  checkboxIcon: {
    fontSize: 20,
    marginRight: 8
  },
  checkboxText: {
    fontSize: 14,
    flex: 1
  },
  disclaimer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginBottom: 24
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#666'
  },
  actions: {
    gap: 12
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  declineButton: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  declineButtonText: {
    color: '#666',
    fontSize: 16
  }
});
```

## 로컬 저장 (암호화)

`src/modules/medicine/storage/secureStorage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import { Medicine, DoseLog } from '../types';

const MEDICINES_KEY = 'medicines';
const DOSE_LOGS_KEY = 'dose_logs';

export class SecureMedicineStorage {
  /**
   * 약 목록 저장 (로컬)
   */
  static async saveMedicines(userId: string, medicines: Medicine[]): Promise<void> {
    const key = `${MEDICINES_KEY}_${userId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(medicines));
  }

  /**
   * 약 목록 불러오기
   */
  static async loadMedicines(userId: string): Promise<Medicine[]> {
    const key = `${MEDICINES_KEY}_${userId}`;
    const data = await SecureStore.getItemAsync(key);
    
    if (!data) return [];
    
    return JSON.parse(data);
  }

  /**
   * 복용 로그 저장
   */
  static async saveDoseLog(userId: string, log: DoseLog): Promise<void> {
    const key = `${DOSE_LOGS_KEY}_${userId}`;
    const existing = await this.loadDoseLogs(userId);
    
    existing.push(log);
    
    await SecureStore.setItemAsync(key, JSON.stringify(existing));
  }

  /**
   * 복용 로그 불러오기
   */
  static async loadDoseLogs(userId: string): Promise<DoseLog[]> {
    const key = `${DOSE_LOGS_KEY}_${userId}`;
    const data = await SecureStore.getItemAsync(key);
    
    if (!data) return [];
    
    return JSON.parse(data);
  }

  /**
   * 모든 데이터 삭제
   */
  static async deleteAllData(userId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${MEDICINES_KEY}_${userId}`);
    await SecureStore.deleteItemAsync(`${DOSE_LOGS_KEY}_${userId}`);
  }
}
```

## 다음 단계
- 07-onboarding.md: 템플릿 온보딩 시스템 구현
- 5분 이내 가치 체감 경험 설계

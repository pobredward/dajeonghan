# 09. 약 복용 모듈 v2 (공간 기반)

> **🎯 목표**: 약 관리를 아이템 기반으로 재구성하고 안전한 복용 알림 시스템 구축

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 약 보관 장소를 Item으로 관리
- ✅ 약 복용 알림
- ✅ 복용 이력 추적
- ✅ 법적 면책 문구 표시

**예상 소요 시간**: 3-4시간

---

## ⚠️ 법적 주의사항

**중요**: 이 앱은 의료 기기가 아니며, 질병의 진단, 치료, 완화, 예방 목적이 아닙니다.

```typescript
// 앱 곳곳에 표시할 면책 문구
export const MEDICAL_DISCLAIMER = `
⚠️ 의료 면책 고지

이 기능은 단순 알림 및 기록 용도입니다.
- 의사의 처방을 대체하지 않습니다
- 복용 시간/용량은 의사와 상담하세요
- 이상 반응 시 즉시 의료 기관을 방문하세요
`;
```

---

## 💊 약 데이터 모델

### MedicineInventory 타입

`src/types/medicine.types.ts`:

```typescript
export interface MedicineInventory {
  id: string;
  userId: string;
  itemId: string;           // 약통 Item ID
  roomId: string;           // 방 ID (보통 침실/화장실)
  
  // 약 정보
  name: string;
  type: MedicineType;
  icon: string;
  
  // 복용 정보
  dosage: string;           // 예: "1정", "10ml"
  frequency: number;        // 하루 몇 회
  timings: string[];        // 예: ["08:00", "20:00"]
  withMeal: 'before' | 'after' | 'anytime';
  
  // 기간
  startDate: Date;
  endDate?: Date;           // 없으면 무기한
  totalDays?: number;
  
  // 재고
  remainingQuantity: number;
  unit: string;             // 정, ml, 포 등
  
  // 메타
  prescriptionUrl?: string;  // 처방전 사진
  memo?: string;
  sideEffects?: string[];
  
  // 알림
  notificationEnabled: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export type MedicineType =
  | 'prescription'   // 처방약
  | 'otc'            // 일반의약품
  | 'supplement'     // 영양제
  | 'herb';          // 한약

export interface MedicineDose {
  id: string;
  medicineId: string;
  scheduledTime: Date;
  takenAt?: Date;
  status: 'pending' | 'taken' | 'skipped';
  memo?: string;
}
```

---

## 💊 약 추가 화면

`src/screens/medicine/AddMedicineScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const AddMedicineScreen = ({ route }) => {
  const { itemId, roomId } = route.params; // 약통 Item

  const [name, setName] = useState('');
  const [type, setType] = useState<MedicineType>('prescription');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState(1);
  const [timings, setTimings] = useState(['08:00']);
  const [withMeal, setWithMeal] = useState<'before' | 'after' | 'anytime'>('after');
  const [startDate, setStartDate] = useState(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date());

  const handleAdd = async () => {
    const medicine: MedicineInventory = {
      id: `med_${Date.now()}`,
      userId: getCurrentUserId(),
      itemId,
      roomId,
      name,
      type,
      icon: getMedicineIcon(type),
      dosage,
      frequency,
      timings,
      withMeal,
      startDate,
      endDate: hasEndDate ? endDate : undefined,
      totalDays: hasEndDate ? differenceInDays(endDate, startDate) : undefined,
      remainingQuantity: 0, // 나중에 입력
      unit: '정',
      notificationEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await MedicineService.addMedicine(medicine);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      {/* 면책 고지 */}
      <DisclaimerBox text={MEDICAL_DISCLAIMER} />

      {/* 약 이름 */}
      <FormField label="약 이름" required>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 타이레놀"
        />
      </FormField>

      {/* 약 종류 */}
      <FormField label="종류">
        <RadioGroup
          options={[
            { label: '처방약', value: 'prescription', icon: '💊' },
            { label: '일반약', value: 'otc', icon: '💉' },
            { label: '영양제', value: 'supplement', icon: '🧴' },
            { label: '한약', value: 'herb', icon: '🌿' }
          ]}
          value={type}
          onChange={setType}
        />
      </FormField>

      {/* 복용량 */}
      <FormField label="1회 복용량">
        <TextInput
          value={dosage}
          onChangeText={setDosage}
          placeholder="예: 1정, 10ml"
        />
      </FormField>

      {/* 복용 횟수 */}
      <FormField label="하루 복용 횟수">
        <Counter
          value={frequency}
          onChange={(val) => {
            setFrequency(val);
            // 시간 배열 조정
            const newTimings = Array.from({ length: val }, (_, i) => 
              timings[i] || '08:00'
            );
            setTimings(newTimings);
          }}
          min={1}
          max={6}
          suffix="회"
        />
      </FormField>

      {/* 복용 시간 */}
      <FormField label="복용 시간">
        {timings.map((time, index) => (
          <TimePicker
            key={index}
            label={`${index + 1}회차`}
            value={time}
            onChange={(newTime) => {
              const updated = [...timings];
              updated[index] = newTime;
              setTimings(updated);
            }}
          />
        ))}
      </FormField>

      {/* 식사와의 관계 */}
      <FormField label="복용 시점">
        <SegmentedControl
          options={[
            { label: '식전', value: 'before' },
            { label: '식후', value: 'after' },
            { label: '상관없음', value: 'anytime' }
          ]}
          value={withMeal}
          onChange={setWithMeal}
        />
      </FormField>

      {/* 복용 기간 */}
      <FormField label="복용 시작일">
        <DatePicker value={startDate} onChange={setStartDate} />
      </FormField>

      <FormField label="복용 종료일">
        <Switch
          value={hasEndDate}
          onValueChange={setHasEndDate}
        />
        {hasEndDate && (
          <DatePicker value={endDate} onChange={setEndDate} />
        )}
      </FormField>

      {/* 추가 버튼 */}
      <Button
        title="약 추가"
        onPress={handleAdd}
        disabled={!name || !dosage}
      />
    </ScrollView>
  );
};

function getMedicineIcon(type: MedicineType): string {
  switch (type) {
    case 'prescription': return '💊';
    case 'otc': return '💉';
    case 'supplement': return '🧴';
    case 'herb': return '🌿';
  }
}
```

---

## 📋 약 목록 화면

`src/screens/medicine/MedicineListScreen.tsx`:

```typescript
export const MedicineListScreen = ({ route }) => {
  const { itemId } = route.params; // 약통 Item
  const { medicines } = useMedicineInventory(itemId);
  const { doses } = useTodayDoses();

  return (
    <ScrollView>
      {/* 오늘의 복용 */}
      <Section title="오늘 복용할 약">
        {doses.map(dose => (
          <DoseRow
            key={dose.id}
            dose={dose}
            onTake={() => takeDose(dose)}
          />
        ))}
      </Section>

      {/* 전체 약 목록 */}
      <Section title="복용 중인 약">
        {medicines.map(medicine => (
          <MedicineRow
            key={medicine.id}
            medicine={medicine}
            onPress={() => navigateToMedicineDetail(medicine.id)}
          />
        ))}
      </Section>

      {/* 추가 버튼 */}
      <Button
        title="+ 약 추가"
        onPress={() => navigateToAddMedicine(itemId)}
      />
    </ScrollView>
  );
};

const DoseRow = ({ dose, onTake }) => {
  const medicine = useMedicine(dose.medicineId);
  const isPast = isPast(dose.scheduledTime);

  return (
    <TouchableOpacity
      style={[
        styles.doseRow,
        dose.status === 'taken' && styles.doseRowTaken
      ]}
      onPress={onTake}
      disabled={dose.status === 'taken'}
    >
      <View style={styles.doseTime}>
        <Text style={styles.timeText}>
          {format(dose.scheduledTime, 'HH:mm')}
        </Text>
        {isPast && dose.status === 'pending' && (
          <Text style={styles.lateLabel}>늦음</Text>
        )}
      </View>

      <View style={styles.doseInfo}>
        <Text style={styles.medicineName}>
          {medicine.icon} {medicine.name}
        </Text>
        <Text style={styles.dosage}>{medicine.dosage}</Text>
      </View>

      {dose.status === 'taken' ? (
        <Text style={styles.takenIcon}>✅</Text>
      ) : (
        <View style={styles.takeButton}>
          <Text>복용</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MedicineRow = ({ medicine, onPress }) => {
  const progress = medicine.endDate
    ? (differenceInDays(new Date(), medicine.startDate) / medicine.totalDays) * 100
    : 0;

  return (
    <TouchableOpacity style={styles.medicineRow} onPress={onPress}>
      <Text style={styles.medicineIcon}>{medicine.icon}</Text>
      
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{medicine.name}</Text>
        <Text style={styles.medicineSchedule}>
          하루 {medicine.frequency}회 · {medicine.dosage}
        </Text>
        
        {medicine.endDate && (
          <ProgressBar progress={progress} />
        )}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};
```

---

## ⏰ 복용 알림 시스템

### MedicineService

`src/services/MedicineService.ts`:

```typescript
import { MedicineInventory, MedicineDose } from '@/types/medicine.types';
import { scheduleNotification } from '@/services/notificationService';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

export class MedicineService {
  /**
   * 약 추가 + 알림 스케줄링
   */
  static async addMedicine(medicine: MedicineInventory): Promise<void> {
    // 1. Firestore에 저장
    await saveDoc(db, `users/${medicine.userId}/medicines/${medicine.id}`, medicine);

    // 2. 복용 일정 생성 (7일치)
    await this.generateDoseSchedule(medicine, 7);

    // 3. 알림 예약
    if (medicine.notificationEnabled) {
      await this.scheduleNotifications(medicine);
    }
  }

  /**
   * 복용 일정 생성
   */
  private static async generateDoseSchedule(
    medicine: MedicineInventory,
    days: number
  ): Promise<void> {
    const doses: MedicineDose[] = [];

    for (let day = 0; day < days; day++) {
      const date = addDays(startOfDay(medicine.startDate), day);
      
      // 종료일 체크
      if (medicine.endDate && date > medicine.endDate) break;

      // 각 복용 시간마다
      for (const timing of medicine.timings) {
        const [hour, minute] = timing.split(':').map(Number);
        const scheduledTime = setMinutes(setHours(date, hour), minute);

        doses.push({
          id: `dose_${medicine.id}_${scheduledTime.getTime()}`,
          medicineId: medicine.id,
          scheduledTime,
          status: 'pending'
        });
      }
    }

    // Firestore에 저장
    const batch = db.batch();
    for (const dose of doses) {
      const ref = doc(db, `users/${medicine.userId}/doses/${dose.id}`);
      batch.set(ref, dose);
    }
    await batch.commit();
  }

  /**
   * 알림 예약
   */
  private static async scheduleNotifications(
    medicine: MedicineInventory
  ): Promise<void> {
    // 7일치 알림 예약
    const doses = await this.getDoses(medicine.id, 7);

    for (const dose of doses) {
      await scheduleNotification({
        id: dose.id,
        title: `💊 ${medicine.name} 복용 시간`,
        body: `${medicine.dosage} 복용하세요`,
        time: dose.scheduledTime,
        data: {
          type: 'medicine_dose',
          doseId: dose.id
        }
      });
    }
  }

  /**
   * 복용 완료
   */
  static async takeDose(doseId: string): Promise<void> {
    const now = new Date();
    
    await updateDoc(db, `users/${userId}/doses/${doseId}`, {
      status: 'taken',
      takenAt: now
    });

    // 복용 이력 기록
    await this.logDose(doseId, now);

    // 재고 감소
    const dose = await this.getDose(doseId);
    await this.decreaseStock(dose.medicineId);
  }

  /**
   * 재고 감소
   */
  private static async decreaseStock(medicineId: string): Promise<void> {
    const medicine = await this.getMedicine(medicineId);
    const newQuantity = medicine.remainingQuantity - 1;

    await updateDoc(db, `users/${medicine.userId}/medicines/${medicineId}`, {
      remainingQuantity: newQuantity
    });

    // 재고 부족 알림
    if (newQuantity <= 3) {
      await this.notifyLowStock(medicine);
    }
  }
}
```

---

## 📊 복용 이력 추적

### 복용 통계

```typescript
const MedicineStatsScreen = ({ medicineId }) => {
  const { medicine } = useMedicine(medicineId);
  const { stats } = useMedicineStats(medicineId);

  return (
    <ScrollView>
      {/* 복용률 */}
      <StatCard
        title="이번 주 복용률"
        value={stats.weeklyCompletionRate}
        suffix="%"
        icon="📊"
        color={stats.weeklyCompletionRate >= 80 ? '#4CAF50' : '#FF9800'}
      />

      {/* 연속 복용 */}
      <StatCard
        title="연속 복용"
        value={stats.streak}
        suffix="일"
        icon="🔥"
        color="#FF6B6B"
      />

      {/* 놓친 복용 */}
      <StatCard
        title="이번 주 놓친 횟수"
        value={stats.missedCount}
        suffix="회"
        icon="⚠️"
        color="#F44336"
      />

      {/* 캘린더 */}
      <Section title="복용 기록">
        <DoseCalendar medicineId={medicineId} />
      </Section>
    </ScrollView>
  );
};

// 복용 캘린더
const DoseCalendar = ({ medicineId }) => {
  const { doses } = useMedicineDoses(medicineId, 30); // 30일치

  return (
    <View style={styles.calendar}>
      {doses.map(dose => (
        <DoseDay
          key={dose.id}
          dose={dose}
          status={dose.status}
        />
      ))}
    </View>
  );
};
```

---

## 🔔 복용 알림 전략

### 알림 타이밍

```typescript
// 복용 30분 전 알림
await scheduleNotification({
  time: subMinutes(dose.scheduledTime, 30),
  title: '곧 약 복용 시간이에요',
  body: `30분 후 ${medicine.name} 복용`
});

// 복용 시간 알림
await scheduleNotification({
  time: dose.scheduledTime,
  title: `💊 ${medicine.name} 복용 시간`,
  body: `${medicine.dosage} 복용하세요`
});

// 복용 1시간 후 미복용 시 재알림
await scheduleNotification({
  time: addHours(dose.scheduledTime, 1),
  title: '아직 약을 복용하지 않으셨어요',
  body: `${medicine.name} 복용을 잊지 마세요`,
  condition: () => dose.status === 'pending'
});
```

---

## ✅ 테스트 체크리스트

- [ ] 약 추가 (이름, 복용 시간, 기간)
- [ ] 복용 일정 자동 생성 (7일치)
- [ ] 복용 시간 알림
- [ ] 복용 완료 처리
- [ ] 재고 추적
- [ ] 재고 부족 알림
- [ ] 복용 이력 기록
- [ ] 복용률 통계
- [ ] 면책 고지 표시

---

## 🚀 다음 단계

- **11-onboarding-v2.md**: 온보딩 (집 설정 포함)
- **13-ui-ux-v2.md**: UI/UX (시각화)

---

**안전한 약 관리 시스템 완성! 💊✨**

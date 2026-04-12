import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MedicineService } from '../MedicineService';
import { MedicineCard } from '../components/MedicineCard';
import { Medicine, TodayDose } from '../types';

export const MedicineHomeScreen: React.FC = () => {
  const [todaySchedule, setTodaySchedule] = useState<TodayDose[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const mockMedicines = await loadMockMedicines();
    const schedule = MedicineService.getTodaySchedule(mockMedicines);
    setTodaySchedule(schedule);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const handleTake = (dose: TodayDose) => {
    setTodaySchedule(prev =>
      prev.map(d => d.medicine.id === dose.medicine.id && d.time === dose.time
        ? { ...d, taken: true }
        : d
      )
    );
  };

  const handleSkip = (dose: TodayDose) => {
    console.log('Skipped:', dose.medicine.name);
  };

  const completedCount = todaySchedule.filter(d => d.taken).length;
  const totalCount = todaySchedule.length;

  if (totalCount === 0) {
    return (
      <ScrollView style={styles.container} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💊</Text>
          <Text style={styles.emptyTitle}>약이 없어요</Text>
          <Text style={styles.emptySubtitle}>약을 추가해서 복용 관리를 시작하세요!</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ 약 추가</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>오늘의 복용 일정</Text>
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedCount / totalCount) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} 완료
          </Text>
        </View>
      </View>

      <View style={styles.schedule}>
        {todaySchedule.map((dose, index) => (
          <MedicineCard
            key={`${dose.medicine.id}-${dose.time}-${index}`}
            dose={dose}
            onTake={() => handleTake(dose)}
            onSkip={() => handleSkip(dose)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

async function loadMockMedicines(): Promise<Medicine[]> {
  const userId = 'mock_user';
  
  return [
    MedicineService.createMedicine(userId, {
      name: '혈압약',
      type: '처방약',
      dosage: '1정',
      times: ['08:00', '20:00'],
      totalQuantity: 60,
      mealTiming: '식후'
    }),
    MedicineService.createMedicine(userId, {
      name: '비타민D',
      type: '영양제',
      dosage: '1정',
      times: ['09:00'],
      totalQuantity: 30,
      mealTiming: '무관'
    }),
    MedicineService.createMedicine(userId, {
      name: '소화제',
      type: '일반약',
      dosage: '1포',
      times: ['13:00'],
      totalQuantity: 10,
      mealTiming: '식후'
    })
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  summary: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  summaryTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#212121' },
  progress: { gap: 8 },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50' },
  progressText: { fontSize: 14, color: '#666', textAlign: 'right' },
  schedule: { padding: 16 },
  emptyState: { alignItems: 'center', padding: 48, marginTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  addButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

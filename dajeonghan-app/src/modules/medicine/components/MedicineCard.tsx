import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Medicine, TodayDose } from '../types';

interface Props {
  dose: TodayDose;
  onTake: () => void;
  onSkip: () => void;
}

export const MedicineCard: React.FC<Props> = ({ dose, onTake, onSkip }) => {
  const { medicine, time, taken } = dose;
  const mealInfo = medicine.metadata.schedule.mealTiming !== '무관'
    ? ` (${medicine.metadata.schedule.mealTiming})`
    : '';

  return (
    <View style={[styles.card, taken && styles.cardTaken]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{medicine.name}</Text>
          <Text style={styles.detail}>
            {time}{mealInfo} · {medicine.metadata.dosage}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{medicine.metadata.type}</Text>
        </View>
      </View>

      {!taken ? (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.takeButton]} onPress={onTake}>
            <Text style={styles.buttonText}>✓ 복용</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={onSkip}>
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
  info: {
    flex: 1
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#212121'
  },
  detail: {
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

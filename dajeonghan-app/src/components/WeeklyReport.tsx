import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  weekData: {
    completedTasks: number;
    totalTasks: number;
    streak: number;
    topModule: 'cleaning' | 'fridge' | 'medicine';
  };
}

export const WeeklyReport: React.FC<Props> = ({ weekData }) => {
  const completionRate = weekData.totalTasks > 0 
    ? Math.round((weekData.completedTasks / weekData.totalTasks) * 100)
    : 0;

  const getMessage = () => {
    if (completionRate >= 90) return '완벽해요! 🏆';
    if (completionRate >= 70) return '훌륭해요! 🌟';
    if (completionRate >= 50) return '잘하고 있어요! 👍';
    return '조금만 더 힘내요! 💪';
  };

  const getModuleName = (module: string) => {
    const names = {
      cleaning: '청소',
      fridge: '냉장고',
      medicine: '약'
    };
    return names[module as keyof typeof names] || module;
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>이번 주 리포트</Text>
      
      <View style={styles.mainStat}>
        <Text style={styles.percentage}>{completionRate}%</Text>
        <Text style={styles.message}>{getMessage()}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{weekData.completedTasks}</Text>
          <Text style={styles.statLabel}>완료한 일</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{weekData.streak}일</Text>
          <Text style={styles.statLabel}>연속 사용</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{getModuleName(weekData.topModule)}</Text>
          <Text style={styles.statLabel}>자주 쓴 기능</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: Spacing.md
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.md
  },
  mainStat: {
    alignItems: 'center',
    paddingVertical: Spacing.lg
  },
  percentage: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm
  },
  message: {
    ...Typography.h4,
    color: Colors.textSecondary
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray
  },
  stat: {
    alignItems: 'center'
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary
  }
});

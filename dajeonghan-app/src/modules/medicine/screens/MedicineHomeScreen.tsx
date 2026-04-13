import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { Card } from '@/components';

export const MedicineHomeScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💊 약</Text>
        <Text style={styles.subtitle}>정확한 복용 관리</Text>
      </View>

      <View style={styles.content}>
        <Card>
          <Text style={styles.emptyText}>
            약 관리 기능은 곧 업데이트됩니다.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  content: {
    padding: Spacing.md
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xl
  }
});

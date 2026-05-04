import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { Room, Furniture } from '@/types/house.types';

interface FridgeTabProps {
  furniture: Furniture;
  room: Room;
  onDataUpdate: () => void;
}

export const FridgeTab: React.FC<FridgeTabProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🧊</Text>
      <Text style={styles.title}>식재료 관리</Text>
      <Text style={styles.description}>
        식재료 관리 기능은 준비 중입니다.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

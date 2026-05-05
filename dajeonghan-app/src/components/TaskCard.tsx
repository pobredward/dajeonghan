import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '@/types/task.types';
import { getModuleIcon } from '@/utils/taskUtils';
import { Card } from './Card';
import { Badge } from './Badge';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  task: Task;
  onComplete: () => void;
  onPostpone: () => void;
}

export const TaskCard: React.FC<Props> = ({ task, onComplete, onPostpone }) => {
  const domainIcon = getModuleIcon(task.domain ?? task.type as any);

  const getPriorityVariant = (): 'primary' | 'success' | 'warning' | 'error' => {
    switch (task.priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{domainIcon}</Text>
          <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        </View>
        <Badge text={`${task.estimatedMinutes}분`} variant={getPriorityVariant()} />
      </View>

      {task.description && (
        <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={onComplete}
        >
          <Text style={styles.buttonText}>✓ 완료</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.postponeButton]}
          onPress={onPostpone}
        >
          <Text style={styles.buttonText}>→ 미루기</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.sm
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center'
  },
  completeButton: {
    backgroundColor: Colors.secondary
  },
  postponeButton: {
    backgroundColor: Colors.accent
  },
  buttonText: {
    ...Typography.label,
    color: Colors.white
  }
});

import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Task } from '@/types/task.types';
import { Colors, Typography, Spacing } from '@/constants';
import { Card, TaskCard } from '@/components';

export const HomeScreen: React.FC = () => {
  const [quickTasks, setQuickTasks] = useState<Task[]>([]);
  const [leisureTasks, setLeisureTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // TODO: LifeEngineService 통합 후 실제 데이터 로드
      // const allTasks: Task[] = await FirestoreService.getTodayTasks();
      // const daily = await LifeEngineService.generateDailyTasks(allTasks, userProfile);
      
      // 임시 데이터
      setQuickTasks([]);
      setLeisureTasks([]);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleComplete = async (task: Task) => {
    console.log('Complete task:', task.id);
    await loadTasks();
  };

  const handlePostpone = async (task: Task) => {
    console.log('Postpone task:', task.id);
    await loadTasks();
  };

  const getTotalMinutes = (tasks: Task[]) => {
    return tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요 👋</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚀 10분 코스</Text>
          <Text style={styles.sectionSubtitle}>
            {getTotalMinutes(quickTasks)}분 · {quickTasks.length}개
          </Text>
        </View>

        {quickTasks.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {loading ? '로딩 중...' : '오늘은 할 일이 없어요!'}
            </Text>
          </Card>
        ) : (
          quickTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task)}
              onPostpone={() => handlePostpone(task)}
            />
          ))
        )}
      </View>

      {leisureTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏰ 여유 있을 때</Text>
            <Text style={styles.sectionSubtitle}>
              {getTotalMinutes(leisureTasks)}분 · {leisureTasks.length}개
            </Text>
          </View>

          {leisureTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task)}
              onPostpone={() => handlePostpone(task)}
            />
          ))}
        </View>
      )}
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
  greeting: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  date: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  section: {
    padding: Spacing.md
  },
  sectionHeader: {
    marginBottom: Spacing.md
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg
  }
});

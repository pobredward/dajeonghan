/**
 * 다정한 - 첫 할일 화면
 * 
 * 온보딩 마지막 단계: 생성된 첫 할일 목록 보여주기
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Task } from '@/types/task.types';

interface Props {
  tasks: Task[];
  onStart: () => void;
  onBack: () => void;
}

export const FirstTasksScreen: React.FC<Props> = ({ tasks, onStart, onBack }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.celebration}>🎉</Text>
        <Text style={styles.title}>준비 완료!</Text>
        <Text style={styles.subtitle}>
          오늘부터 시작할 수 있는{'\n'}할 일 {tasks.length}개를 준비했어요
        </Text>

        <View style={styles.taskList}>
          {tasks.map((task, index) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskNumber}>
                <Text style={styles.taskNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskTime}>{task.estimatedMinutes}분 소요</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          💡 완료하거나 미루기만 누르면 돼요!{'\n'}
          복잡한 설정은 나중에 해도 됩니다.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40
  },
  celebration: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1A1A1A'
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24
  },
  taskList: {
    marginBottom: 32,
    gap: 12
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12
  },
  taskNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  taskNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1A1A1A'
  },
  taskTime: {
    fontSize: 12,
    color: '#666666'
  },
  checkmark: {
    fontSize: 20,
    color: '#CCCCCC'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700'
  },
  hint: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20
  }
});

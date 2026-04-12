import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { CleaningService } from '../CleaningService';
import { CleaningCard } from '../components/CleaningCard';
import { CleaningTask } from '../types';
import { LifeEngineService } from '@/engines/LifeEngineService';
import { UserProfile } from '@/types/user.types';

/**
 * 청소 홈 화면
 * 
 * 오늘의 청소 추천:
 * - 10분 코스: 빠르게 끝낼 수 있는 작업
 * - 여유 코스: 시간이 있을 때 하면 좋은 작업
 */
export const CleaningHomeScreen: React.FC = () => {
  const [quickSession, setQuickSession] = useState<any>(null);
  const [leisureSession, setLeisureSession] = useState<any>(null);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // TODO: Firestore에서 청소 태스크 로드
      // 현재는 목업 데이터
      const mockTasks: CleaningTask[] = await loadMockTasks();
      
      setTasks(mockTasks);
      
      // 오늘의 청소 추천
      const recommendations = CleaningService.recommendTodaysCleaning(mockTasks);
      
      setQuickSession(recommendations.quickSession);
      setLeisureSession(recommendations.leisureSession);
    } catch (error) {
      console.error('Failed to load cleaning tasks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleComplete = async (task: CleaningTask) => {
    try {
      // TODO: UserProfile을 Context에서 가져오기
      const mockUserProfile: UserProfile = {
        id: task.userId,
        userId: task.userId,
        persona: 'worker_single',
        environment: {
          hasWasher: true,
          hasDryer: false,
          usesCoinLaundry: false,
          cookingFrequency: 'sometimes',
          hasPet: false,
          householdSize: 1
        },
        notificationMode: 'digest',
        digestTimes: ['09:00', '20:00'],
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 완료 처리
      await LifeEngineService.completeTask(task, mockUserProfile);
      
      // 태스크 목록 새로고침
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handlePostpone = async (task: CleaningTask) => {
    try {
      const mockUserProfile: UserProfile = {
        id: task.userId,
        userId: task.userId,
        persona: 'worker_single',
        environment: {
          hasWasher: true,
          hasDryer: false,
          usesCoinLaundry: false,
          cookingFrequency: 'sometimes',
          hasPet: false,
          householdSize: 1
        },
        notificationMode: 'digest',
        digestTimes: ['09:00', '20:00'],
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 미루기 처리
      await LifeEngineService.postponeTask(task, mockUserProfile, 'busy');
      
      // 태스크 목록 새로고침
      await loadTasks();
    } catch (error) {
      console.error('Failed to postpone task:', error);
    }
  };

  const renderEmptyState = (title: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>🎉 {title}이 비어있어요!</Text>
      <Text style={styles.emptyStateSubtext}>지금은 모든 청소가 완료되었습니다.</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 10분 코스 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 오늘의 10분 코스</Text>
        <Text style={styles.sectionSubtitle}>
          빠르게 끝낼 수 있는 작업들
        </Text>
        {quickSession && quickSession.tasks.length > 0 ? (
          <>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionInfoText}>
                총 {quickSession.totalMinutes}분 · {quickSession.tasks.length}개 작업
              </Text>
              <Text style={styles.sessionInfoText}>
                더러움 점수: {quickSession.totalPoints.toFixed(1)}
              </Text>
            </View>
            
            {quickSession.tasks.map((task: CleaningTask) => (
              <CleaningCard
                key={task.id}
                task={task}
                onComplete={() => handleComplete(task)}
                onPostpone={() => handlePostpone(task)}
              />
            ))}
          </>
        ) : (
          renderEmptyState('10분 코스')
        )}
      </View>

      {/* 여유 코스 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ 여유 있을 때</Text>
        <Text style={styles.sectionSubtitle}>
          시간이 있을 때 하면 좋은 작업들
        </Text>
        {leisureSession && leisureSession.tasks.length > 0 ? (
          <>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionInfoText}>
                총 {leisureSession.totalMinutes}분 · {leisureSession.tasks.length}개 작업
              </Text>
              <Text style={styles.sessionInfoText}>
                더러움 점수: {leisureSession.totalPoints.toFixed(1)}
              </Text>
            </View>
            
            {leisureSession.tasks.map((task: CleaningTask) => (
              <CleaningCard
                key={task.id}
                task={task}
                onComplete={() => handleComplete(task)}
                onPostpone={() => handlePostpone(task)}
              />
            ))}
          </>
        ) : (
          renderEmptyState('여유 코스')
        )}
      </View>
    </ScrollView>
  );
};

/**
 * 목업 태스크 로드 (개발용)
 * TODO: Firestore 연동 시 제거
 */
async function loadMockTasks(): Promise<CleaningTask[]> {
  // 실제로는 Firestore에서 조회
  const userId = 'mock_user_id';
  const persona = 'student_20s';
  
  const userEnvironment = {
    hasWasher: true,
    hasDryer: false,
    usesCoinLaundry: false,
    cookingFrequency: 'sometimes' as const,
    hasPet: false,
    householdSize: 1
  };

  const tasks = CleaningService.createTasksFromTemplate(userId, persona, userEnvironment);
  
  // 일부 태스크의 nextDue를 과거로 설정하여 테스트
  if (tasks.length > 0) {
    const now = new Date();
    tasks[0].recurrence.nextDue = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3일 전
  }
  if (tasks.length > 1) {
    const now = new Date();
    tasks[1].recurrence.nextDue = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1일 전
  }
  if (tasks.length > 2) {
    const now = new Date();
    tasks[2].recurrence.nextDue = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5일 전
  }

  // 더러움 점수 업데이트
  return CleaningService.updateDirtyScores(tasks);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  section: {
    padding: 16,
    paddingTop: 24
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#212121'
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666'
  }
});

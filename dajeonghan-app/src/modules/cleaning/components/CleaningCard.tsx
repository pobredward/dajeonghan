import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CleaningTask } from '../types';

interface Props {
  task: CleaningTask;
  onComplete: () => void;
  onPostpone: () => void;
}

/**
 * 청소 카드 컴포넌트
 * 
 * 개별 청소 태스크를 표시하고 완료/미루기 액션을 제공합니다.
 */
export const CleaningCard: React.FC<Props> = ({ task, onComplete, onPostpone }) => {
  const { title, estimatedMinutes, metadata, dirtyScore } = task;

  // 더러움 점수에 따른 색상
  const getDirtyScoreColor = (score: number): string => {
    if (score >= 7) return '#FF5252'; // 높음 (빨강)
    if (score >= 4) return '#FF9800'; // 중간 (주황)
    return '#4CAF50'; // 낮음 (초록)
  };

  // 난이도 표시
  const renderDifficulty = () => {
    return '⭐'.repeat(metadata.difficulty);
  };

  return (
    <View style={styles.card}>
      {/* 헤더: 제목 + 시간 배지 */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{estimatedMinutes}분</Text>
        </View>
      </View>
      
      {/* 메타데이터: 방, 난이도, 더러움 점수 */}
      <View style={styles.metadata}>
        <Text style={styles.room}>🏠 {metadata.room}</Text>
        <Text style={styles.difficulty}>{renderDifficulty()}</Text>
        {dirtyScore > 0 && (
          <View style={[styles.dirtyBadge, { backgroundColor: getDirtyScoreColor(dirtyScore) }]}>
            <Text style={styles.dirtyText}>🧹 {dirtyScore.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* 건강 우선순위 표시 */}
      {metadata.healthPriority && (
        <View style={styles.healthPriorityBadge}>
          <Text style={styles.healthPriorityText}>💊 건강 우선</Text>
        </View>
      )}

      {/* 액션 버튼 */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#212121'
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600'
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12
  },
  room: {
    fontSize: 14,
    color: '#666'
  },
  difficulty: {
    fontSize: 14
  },
  dirtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  dirtyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  healthPriorityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  healthPriorityText: {
    color: '#2E7D32',
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
  completeButton: {
    backgroundColor: '#4CAF50'
  },
  postponeButton: {
    backgroundColor: '#FF9800'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  }
});

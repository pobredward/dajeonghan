/**
 * 다정한 - 첫 할일 화면
 *
 * 온보딩 마지막 단계: 생성된 할 일 목록 미리보기
 * - 카테고리별 요약 뱃지 (청소 N개 · 약 N개 · 자기관리 N개 ...)
 * - 오늘 시작 할 일 최대 6개 샘플 표시
 * - '원하지 않는 건 홈에서 삭제 가능' 안내
 * - allTasks prop으로 전체 개수 집계
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Task } from '@/types/task.types';
import { OnboardingService } from '@/services/OnboardingService';

interface Props {
  tasks: Task[];
  allTasks: Task[];
  onStart: () => void;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  청소: '🧹',
  '약·영양제': '💊',
  자기관리: '✨',
  '식품 관리': '🥦',
  자기계발: '📚',
  기타: '📋',
};

export const FirstTasksScreen: React.FC<Props> = ({ tasks, allTasks, onStart, onBack }) => {
  const categorySummary = useMemo(() => {
    return OnboardingService.categorizeTasksForPreview(allTasks);
  }, [allTasks]);

  const totalCount = allTasks.length;

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
          총 <Text style={styles.countHighlight}>{totalCount}개</Text>의 할 일을 준비했어요
        </Text>

        {/* 카테고리 요약 뱃지 */}
        <View style={styles.categoryRow}>
          {Object.entries(categorySummary).map(([label, taskList]) => (
            <View key={label} style={styles.categoryChip}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[label] ?? '📋'}</Text>
              <Text style={styles.categoryLabel}>{label}</Text>
              <Text style={styles.categoryCount}>{taskList.length}개</Text>
            </View>
          ))}
        </View>

        {/* 오늘 시작할 Task 샘플 */}
        <Text style={styles.sectionTitle}>오늘 바로 시작해볼 것들</Text>
        <View style={styles.taskList}>
          {tasks.map((task, index) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskNumber}>
                <Text style={styles.taskNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <Text style={styles.taskTime}>{task.estimatedMinutes}분</Text>
                  <View style={[
                    styles.priorityDot,
                    task.priority === 'high' && styles.priorityHigh,
                    task.priority === 'medium' && styles.priorityMedium,
                    task.priority === 'low' && styles.priorityLow,
                  ]} />
                </View>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>

        {totalCount > tasks.length && (
          <Text style={styles.moreHint}>
            + {totalCount - tasks.length}개는 홈에서 확인할 수 있어요
          </Text>
        )}

        {/* 자율성 안내 박스 */}
        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>💡</Text>
          <View style={styles.noteTextContainer}>
            <Text style={styles.noteTitle}>마음에 안 드는 항목이 있다면?</Text>
            <Text style={styles.noteText}>
              앱 시작 후 할 일 목록에서 언제든지 삭제하거나 주기를 바꿀 수 있어요. 완벽하게 시작하지 않아도 돼요.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.startButtonText}>다정한 시작하기</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          완료하거나 미루기만 눌러도 충분해요
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 48,
  },
  celebration: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  countHighlight: {
    color: '#2196F3',
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 28,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8FF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    gap: 4,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2196F3',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  taskList: {
    marginBottom: 12,
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 12,
  },
  taskNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    color: '#1A1A1A',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTime: {
    fontSize: 12,
    color: '#888888',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityHigh: {
    backgroundColor: '#F44336',
  },
  priorityMedium: {
    backgroundColor: '#FF9800',
  },
  priorityLow: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  moreHint: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  noteTextContainer: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
});

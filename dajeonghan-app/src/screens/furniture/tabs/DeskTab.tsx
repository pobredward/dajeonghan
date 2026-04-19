import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { Room, Furniture, DeskMetadata } from '@/types/house.types';
import { useAuth } from '@/contexts/AuthContext';

interface DeskTabProps {
  furniture: Furniture;
  room: Room;
  onDataUpdate: () => void;
  initialSection?: 'overview' | 'focus' | 'equipment';
}

interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // 분 단위
  task: string;
  completed: boolean;
}

interface StudyStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  longestSession: number;
  todayMinutes: number;
  weeklyMinutes: number;
}

export const DeskTab: React.FC<DeskTabProps> = ({
  furniture,
  room,
  onDataUpdate,
  initialSection = 'overview',
}) => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deskMetadata, setDeskMetadata] = useState<DeskMetadata | null>(null);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'focus' | 'equipment'>(initialSection);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    loadDeskData();
    
    // 활성 세션이 있으면 타이머 시작
    if (currentSession && !currentSession.endTime) {
      const interval = setInterval(() => {
        setCurrentSession(prev => prev ? { ...prev } : null);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [furniture.id, currentSession?.id]);

  const loadDeskData = async () => {
    setLoading(true);
    try {
      // 책상 메타데이터 로드
      const metadata = furniture.furnitureMetadata as DeskMetadata;
      if (metadata && metadata.type === 'desk') {
        setDeskMetadata(metadata);
      } else {
        // 기본 메타데이터 설정
        const defaultMetadata: DeskMetadata = {
          type: 'desk',
          workType: 'study',
          equipment: [],
          focusSessionEnabled: false,
        };
        setDeskMetadata(defaultMetadata);
      }

      // TODO: 실제 집중 세션 기록 로드
      setFocusSessions([]);
    } catch (error) {
      console.error('Failed to load desk data:', error);
      Alert.alert('오류', '책상 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startFocusSession = () => {
    if (newTaskName.trim()) {
      const session: FocusSession = {
        id: Date.now().toString(),
        startTime: new Date(),
        task: newTaskName.trim(),
        completed: false,
      };
      
      setCurrentSession(session);
      setFocusSessions(prev => [session, ...prev]);
      setNewTaskName('');
      setShowNewSessionModal(false);
    }
  };

  const endFocusSession = () => {
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60));
      
      const updatedSession = {
        ...currentSession,
        endTime,
        duration,
        completed: true,
      };
      
      setFocusSessions(prev => 
        prev.map(session => 
          session.id === currentSession.id ? updatedSession : session
        )
      );
      
      setCurrentSession(null);
      Alert.alert('완료', `${duration}분간 집중하셨습니다!`);
    }
  };

  const pauseFocusSession = () => {
    endFocusSession();
  };

  const addEquipment = () => {
    Alert.prompt(
      '장비 추가',
      '새로운 장비를 추가하세요',
      (text) => {
        if (text && text.trim() && deskMetadata) {
          setDeskMetadata({
            ...deskMetadata,
            equipment: [...deskMetadata.equipment, text.trim()]
          });
        }
      }
    );
  };

  const removeEquipment = (equipment: string) => {
    if (deskMetadata) {
      setDeskMetadata({
        ...deskMetadata,
        equipment: deskMetadata.equipment.filter(item => item !== equipment)
      });
    }
  };

  const markOrganized = () => {
    Alert.alert(
      '책상 정리',
      '책상을 정리하셨나요?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '완료', 
          onPress: () => {
            if (deskMetadata) {
              setDeskMetadata({
                ...deskMetadata,
                lastOrganized: new Date()
              });
            }
            Alert.alert('완료', '책상 정리가 기록되었습니다.');
            onDataUpdate();
          }
        }
      ]
    );
  };

  const getOrganizedStatus = () => {
    if (!deskMetadata?.lastOrganized) {
      return { 
        status: 'unknown', 
        message: '정리 기록이 없습니다',
        color: Colors.textSecondary 
      };
    }

    const daysSinceOrganized = Math.floor(
      (new Date().getTime() - deskMetadata.lastOrganized.getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    if (daysSinceOrganized <= 3) {
      return { 
        status: 'good', 
        message: `${daysSinceOrganized}일 전 정리 (깔끔함)`,
        color: Colors.success 
      };
    } else if (daysSinceOrganized <= 7) {
      return { 
        status: 'warning', 
        message: `${daysSinceOrganized}일 전 정리 (곧 정리 필요)`,
        color: Colors.warning 
      };
    } else {
      return { 
        status: 'overdue', 
        message: `${daysSinceOrganized}일 전 정리 (정리 필요)`,
        color: Colors.error 
      };
    }
  };

  const calculateStats = (): StudyStats => {
    const completedSessions = focusSessions.filter(s => s.completed);
    const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionLength = completedSessions.length > 0 ? totalMinutes / completedSessions.length : 0;
    const longestSession = Math.max(...completedSessions.map(s => s.duration || 0), 0);
    
    // 오늘 세션들
    const today = new Date();
    const todaySessions = completedSessions.filter(s => 
      s.startTime.toDateString() === today.toDateString()
    );
    const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // 이번 주 세션들
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklySessions = completedSessions.filter(s => s.startTime >= weekAgo);
    const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    return {
      totalSessions: completedSessions.length,
      totalMinutes,
      averageSessionLength: Math.round(averageSessionLength),
      longestSession,
      todayMinutes,
      weeklyMinutes,
    };
  };

  const getCurrentSessionDuration = (): number => {
    if (!currentSession) return 0;
    return Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / (1000 * 60));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>책상 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const organizedStatus = getOrganizedStatus();
  const stats = calculateStats();
  const currentDuration = getCurrentSessionDuration();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {activeSection === 'overview' && (
          <View>
            {/* 책상 정보 */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>책상 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>용도:</Text>
                <Text style={styles.infoValue}>
                  {deskMetadata?.workType === 'study' ? '학습' :
                   deskMetadata?.workType === 'office' ? '업무' :
                   deskMetadata?.workType === 'creative' ? '창작' :
                   deskMetadata?.workType === 'gaming' ? '게임' : '학습'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>장비 수:</Text>
                <Text style={styles.infoValue}>{deskMetadata?.equipment.length || 0}개</Text>
              </View>
            </View>

            {/* 정리 상태 */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.cardTitle}>정리 상태</Text>
                <TouchableOpacity 
                  style={styles.organizeButton} 
                  onPress={markOrganized}
                >
                  <Text style={styles.organizeButtonText}>정리 완료</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.statusIndicator, { borderColor: organizedStatus.color }]}>
                <Text style={[styles.statusText, { color: organizedStatus.color }]}>
                  {organizedStatus.message}
                </Text>
              </View>
              <Text style={styles.statusTip}>
                💡 책상은 2-3일마다 정리하는 것이 좋습니다
              </Text>
            </View>

            {/* 학습 통계 */}
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>학습 통계</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.todayMinutes}</Text>
                  <Text style={styles.statLabel}>오늘 (분)</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.weeklyMinutes}</Text>
                  <Text style={styles.statLabel}>이번 주 (분)</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalSessions}</Text>
                  <Text style={styles.statLabel}>총 세션</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.averageSessionLength}</Text>
                  <Text style={styles.statLabel}>평균 (분)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeSection === 'focus' && (
          <View>
            {/* 현재 세션 */}
            {currentSession ? (
              <View style={styles.currentSessionCard}>
                <Text style={styles.cardTitle}>집중 중</Text>
                <Text style={styles.sessionTask}>{currentSession.task}</Text>
                <Text style={styles.sessionTimer}>{currentDuration}분</Text>
                <View style={styles.sessionButtons}>
                  <TouchableOpacity 
                    style={styles.pauseButton} 
                    onPress={pauseFocusSession}
                  >
                    <Text style={styles.pauseButtonText}>일시정지</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.endButton} 
                    onPress={endFocusSession}
                  >
                    <Text style={styles.endButtonText}>완료</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.startSessionCard}
                onPress={() => setShowNewSessionModal(true)}
              >
                <Text style={styles.startSessionEmoji}>🎯</Text>
                <Text style={styles.startSessionTitle}>집중 세션 시작</Text>
                <Text style={styles.startSessionSubtext}>새로운 집중 세션을 시작해보세요</Text>
              </TouchableOpacity>
            )}

            {/* 세션 기록 */}
            <View style={styles.sessionHistory}>
              <Text style={styles.sectionTitle}>최근 세션</Text>
              {focusSessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>세션 기록이 없습니다</Text>
                  <Text style={styles.emptySubtext}>
                    첫 번째 집중 세션을 시작해보세요!
                  </Text>
                </View>
              ) : (
                <View>
                  {focusSessions.slice(0, 10).map((session) => (
                    <View key={session.id} style={styles.sessionItem}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionItemTask}>{session.task}</Text>
                        <Text style={styles.sessionItemTime}>
                          {session.startTime.toLocaleDateString()} • 
                          {session.completed ? `${session.duration}분` : '진행 중'}
                        </Text>
                      </View>
                      <View style={[
                        styles.sessionStatus,
                        { backgroundColor: session.completed ? Colors.success : Colors.warning }
                      ]}>
                        <Text style={styles.sessionStatusText}>
                          {session.completed ? '✓' : '⏱'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {activeSection === 'equipment' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>장비 관리</Text>
              <TouchableOpacity style={styles.addButton} onPress={addEquipment}>
                <Text style={styles.addButtonText}>+ 추가</Text>
              </TouchableOpacity>
            </View>

            {deskMetadata?.equipment.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🖥</Text>
                <Text style={styles.emptyTitle}>등록된 장비가 없습니다</Text>
                <Text style={styles.emptySubtext}>
                  책상에 있는 장비들을 등록해보세요.
                </Text>
              </View>
            ) : (
              <View style={styles.equipmentList}>
                {deskMetadata?.equipment.map((item, index) => (
                  <View key={index} style={styles.equipmentItem}>
                    <Text style={styles.equipmentName}>{item}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeEquipment(item)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 새 세션 모달 */}
      <Modal
        visible={showNewSessionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewSessionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>새 집중 세션</Text>
            <TouchableOpacity 
              onPress={() => setShowNewSessionModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>무엇에 집중하시겠어요?</Text>
            <TextInput
              style={styles.taskInput}
              placeholder="예: 수학 공부, 프로젝트 작업, 독서 등"
              value={newTaskName}
              onChangeText={setNewTaskName}
              autoFocus
              onSubmitEditing={startFocusSession}
            />
            
            <TouchableOpacity 
              style={[
                styles.startButton,
                !newTaskName.trim() && styles.startButtonDisabled
              ]} 
              onPress={startFocusSession}
              disabled={!newTaskName.trim()}
            >
              <Text style={styles.startButtonText}>집중 시작</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTabActive: {
    borderBottomColor: Colors.primary,
  },
  sectionTabText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  sectionTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  organizeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
  },
  organizeButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  statusIndicator: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusText: {
    ...Typography.body,
    textAlign: 'center',
    fontWeight: '500',
  },
  statusTip: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: Spacing.md,
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  currentSessionCard: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  sessionTask: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  sessionTimer: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  pauseButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  pauseButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  endButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  endButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  startSessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  startSessionEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  startSessionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  startSessionSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sessionHistory: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
  },
  addButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionItemTask: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sessionItemTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sessionStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionStatusText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  equipmentList: {
    gap: Spacing.sm,
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentName: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    ...Typography.caption,
    color: Colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalCloseText: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputLabel: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  taskInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: Colors.border,
  },
  startButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 16,
  },
});
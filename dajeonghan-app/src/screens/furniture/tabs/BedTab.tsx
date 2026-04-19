import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { Room, Furniture, BedMetadata } from '@/types/house.types';
import { useAuth } from '@/contexts/AuthContext';

interface BedTabProps {
  furniture: Furniture;
  room: Room;
  onDataUpdate: () => void;
  initialSection?: 'overview' | 'sleep' | 'maintenance';
}

interface SleepRecord {
  id: string;
  date: Date;
  bedTime: Date;
  wakeTime: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export const BedTab: React.FC<BedTabProps> = ({
  furniture,
  room,
  onDataUpdate,
  initialSection = 'overview',
}) => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bedMetadata, setBedMetadata] = useState<BedMetadata | null>(null);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'sleep' | 'maintenance'>(initialSection);

  useEffect(() => {
    loadBedData();
  }, [furniture.id]);

  const loadBedData = async () => {
    setLoading(true);
    try {
      // 침대 메타데이터 로드
      const metadata = furniture.furnitureMetadata as BedMetadata;
      if (metadata && metadata.type === 'bed') {
        setBedMetadata(metadata);
      } else {
        // 기본 메타데이터 설정
        const defaultMetadata: BedMetadata = {
          type: 'bed',
          size: 'double',
          mattressType: '스프링',
          sleepTrackingEnabled: false,
        };
        setBedMetadata(defaultMetadata);
      }

      // TODO: 실제 수면 기록 로드
      setSleepRecords([]);
    } catch (error) {
      console.error('Failed to load bed data:', error);
      Alert.alert('오류', '침대 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = () => {
    Alert.alert(
      '시트 교체',
      '시트를 교체하셨나요?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '완료', 
          onPress: () => {
            if (bedMetadata) {
              setBedMetadata({
                ...bedMetadata,
                lastSheetChange: new Date()
              });
            }
            Alert.alert('완료', '시트 교체가 기록되었습니다.');
            onDataUpdate();
          }
        }
      ]
    );
  };

  const addSleepRecord = () => {
    // TODO: 수면 기록 추가 모달 구현
    Alert.alert('알림', '수면 기록 추가 기능이 곧 추가됩니다.');
  };

  const getSheetChangeStatus = () => {
    if (!bedMetadata?.lastSheetChange) {
      return { 
        status: 'unknown', 
        message: '시트 교체 기록이 없습니다',
        color: Colors.textSecondary 
      };
    }

    const daysSinceChange = Math.floor(
      (new Date().getTime() - bedMetadata.lastSheetChange.getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    if (daysSinceChange <= 7) {
      return { 
        status: 'good', 
        message: `${daysSinceChange}일 전 교체 (깨끗함)`,
        color: Colors.success 
      };
    } else if (daysSinceChange <= 14) {
      return { 
        status: 'warning', 
        message: `${daysSinceChange}일 전 교체 (곧 교체 필요)`,
        color: Colors.warning 
      };
    } else {
      return { 
        status: 'overdue', 
        message: `${daysSinceChange}일 전 교체 (교체 필요)`,
        color: Colors.error 
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>침대 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const sheetStatus = getSheetChangeStatus();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {activeSection === 'overview' && (
          <View>
            {/* 침대 정보 */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>침대 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>크기:</Text>
                <Text style={styles.infoValue}>
                  {bedMetadata?.size === 'single' ? '싱글' :
                   bedMetadata?.size === 'double' ? '더블' :
                   bedMetadata?.size === 'queen' ? '퀸' :
                   bedMetadata?.size === 'king' ? '킹' : '더블'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>매트리스:</Text>
                <Text style={styles.infoValue}>{bedMetadata?.mattressType || '스프링'}</Text>
              </View>
            </View>

            {/* 시트 상태 */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.cardTitle}>시트 상태</Text>
                <TouchableOpacity 
                  style={styles.changeButton} 
                  onPress={handleSheetChange}
                >
                  <Text style={styles.changeButtonText}>교체 완료</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.statusIndicator, { borderColor: sheetStatus.color }]}>
                <Text style={[styles.statusText, { color: sheetStatus.color }]}>
                  {sheetStatus.message}
                </Text>
              </View>
              <Text style={styles.statusTip}>
                💡 시트는 주 1-2회 교체하는 것이 좋습니다
              </Text>
            </View>

            {/* 수면 추적 설정 */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Text style={styles.cardTitle}>수면 추적</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    bedMetadata?.sleepTrackingEnabled && styles.toggleButtonActive
                  ]}
                  onPress={() => {
                    if (bedMetadata) {
                      setBedMetadata({
                        ...bedMetadata,
                        sleepTrackingEnabled: !bedMetadata.sleepTrackingEnabled
                      });
                    }
                  }}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    bedMetadata?.sleepTrackingEnabled && styles.toggleButtonTextActive
                  ]}>
                    {bedMetadata?.sleepTrackingEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                수면 시간과 품질을 기록하여 수면 패턴을 분석할 수 있습니다.
              </Text>
            </View>
          </View>
        )}

        {activeSection === 'sleep' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>수면 기록</Text>
              <TouchableOpacity style={styles.addButton} onPress={addSleepRecord}>
                <Text style={styles.addButtonText}>+ 기록 추가</Text>
              </TouchableOpacity>
            </View>

            {sleepRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>😴</Text>
                <Text style={styles.emptyTitle}>수면 기록이 없습니다</Text>
                <Text style={styles.emptySubtext}>
                  수면 시간을 기록하여 패턴을 분석해보세요.
                </Text>
              </View>
            ) : (
              <View>
                {sleepRecords.map((record) => (
                  <View key={record.id} style={styles.sleepRecord}>
                    {/* TODO: 수면 기록 카드 UI 구현 */}
                    <Text>{record.date.toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeSection === 'maintenance' && (
          <View>
            <Text style={styles.sectionTitle}>침대 관리</Text>
            
            {/* 관리 체크리스트 */}
            <View style={styles.checklistCard}>
              <Text style={styles.cardTitle}>정기 관리 체크리스트</Text>
              
              {[
                { task: '시트 교체', frequency: '주 1-2회', status: sheetStatus.status },
                { task: '베개커버 교체', frequency: '주 2-3회', status: 'unknown' },
                { task: '매트리스 뒤집기', frequency: '월 1회', status: 'unknown' },
                { task: '침대 프레임 점검', frequency: '분기 1회', status: 'unknown' },
              ].map((item, index) => (
                <View key={index} style={styles.checklistItem}>
                  <View style={styles.checklistInfo}>
                    <Text style={styles.checklistTask}>{item.task}</Text>
                    <Text style={styles.checklistFrequency}>{item.frequency}</Text>
                  </View>
                  <View style={[
                    styles.checklistStatus,
                    { backgroundColor: 
                      item.status === 'good' ? Colors.success + '20' :
                      item.status === 'warning' ? Colors.warning + '20' :
                      item.status === 'overdue' ? Colors.error + '20' :
                      Colors.textSecondary + '20'
                    }
                  ]}>
                    <Text style={styles.checklistStatusText}>
                      {item.status === 'good' ? '✓' :
                       item.status === 'warning' ? '⚠' :
                       item.status === 'overdue' ? '!' : '?'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 관리 팁 */}
            <View style={styles.tipsCard}>
              <Text style={styles.cardTitle}>침대 관리 팁</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tip}>• 매주 시트와 베개커버를 교체하세요</Text>
                <Text style={styles.tip}>• 매트리스는 3-6개월마다 뒤집어주세요</Text>
                <Text style={styles.tip}>• 침실 환기를 자주 해주세요</Text>
                <Text style={styles.tip}>• 진드기 방지를 위해 햇볕에 말리세요</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  changeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
  },
  changeButtonText: {
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
  settingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  toggleButton: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: Colors.white,
  },
  settingDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    marginTop: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sleepRecord: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checklistInfo: {
    flex: 1,
  },
  checklistTask: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  checklistFrequency: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  checklistStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistStatusText: {
    ...Typography.button,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tip: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
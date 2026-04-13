import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button } from '@/components/Button';
import { AuthService } from '@/services/authService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface Props {
  onDeleteSuccess?: () => void;
}

export const DeleteAccountScreen: React.FC<Props> = ({ onDeleteSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까?\n\n• 모든 데이터가 즉시 삭제됩니다\n• 삭제 후 복구할 수 없습니다\n\n이 작업은 되돌릴 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    setLoading(true);

    try {
      await AuthService.deleteAccount();
      
      Alert.alert(
        '삭제 완료',
        '계정이 삭제되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              onDeleteSuccess?.();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Delete account error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>계정 삭제</Text>
        <Text style={styles.description}>
          계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>• 모든 테스크 및 일정</Text>
          <Text style={styles.listItem}>• 청소 일정 및 기록</Text>
          <Text style={styles.listItem}>• 식재료 정보</Text>
          <Text style={styles.listItem}>• 약 복용 기록</Text>
          <Text style={styles.listItem}>• 자기계발 및 자기돌봄 기록</Text>
          <Text style={styles.listItem}>• 완료 이력 및 통계</Text>
          <Text style={styles.listItem}>• 사용자 설정 및 선호도</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 주의사항</Text>
          <Text style={styles.warningText}>
            • 이 작업은 되돌릴 수 없습니다{'\n'}
            • 데이터는 즉시 삭제되며 복구할 수 없습니다{'\n'}
            • 삭제 후 다시 가입하더라도 이전 데이터는 복원되지 않습니다
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 대안</Text>
          <Text style={styles.infoText}>
            잠시 쉬고 싶으신가요? 계정을 삭제하는 대신 앱의 알림을 끄거나 데이터를 백업하는 방법도 있습니다.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={loading ? "삭제 중..." : "계정 삭제"}
          onPress={handleDelete}
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  contentContainer: {
    flexGrow: 1,
    padding: Spacing.lg
  },
  content: {
    flex: 1
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: Colors.textPrimary
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center'
  },
  list: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg
  },
  listItem: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 24
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    marginBottom: Spacing.md
  },
  warningTitle: {
    ...Typography.label,
    color: Colors.error,
    marginBottom: Spacing.xs
  },
  warningText: {
    ...Typography.bodySmall,
    color: Colors.error,
    lineHeight: 20
  },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.lg
  },
  infoTitle: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.xs
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20
  },
  actions: {
    paddingTop: Spacing.lg
  }
});

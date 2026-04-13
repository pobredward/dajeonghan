import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export const DisclaimerScreen: React.FC<Props> = ({ onAccept, onDecline }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>중요한 안내</Text>
      <Text style={styles.subtitle}>
        약 복용 기능을 사용하기 전에 반드시 읽어주세요
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>본 앱은 의료 기기가 아닙니다</Text>
        <Text style={styles.text}>
          다정한은 약 복용 일정을 기록하고 알림을 제공하는 도구일 뿐,
          의료 조언이나 진단을 제공하지 않습니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>의사/약사와 상담하세요</Text>
        <Text style={styles.text}>
          다음의 경우 반드시 전문가와 상담하십시오:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• 약물 복용 방법을 변경할 때</Text>
          <Text style={styles.bullet}>• 부작용이 발생했을 때</Text>
          <Text style={styles.bullet}>• 새로운 약을 추가할 때</Text>
          <Text style={styles.bullet}>• 다른 약과 함께 복용할 때</Text>
          <Text style={styles.bullet}>• 임신, 수유 중일 때</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>상호작용 경고 없음</Text>
        <Text style={styles.text}>
          본 앱은 약물 간 상호작용, 알레르기, 부작용 경고 기능을 제공하지 않습니다.
          여러 약을 복용하는 경우 반드시 전문가와 상담하세요.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>응급 상황</Text>
        <Text style={styles.text}>
          응급 상황 시 즉시 119에 연락하거나 가까운 병원을 방문하세요.
          본 앱은 응급 상황에 대응하지 않습니다.
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>책임의 제한</Text>
        <Text style={styles.warningText}>
          회사는 서비스 사용으로 인한 건강 관련 결과에 대해 책임지지 않습니다.
          모든 의료 결정은 반드시 의료 전문가와 상담하여 내려야 합니다.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="이해했습니다"
          onPress={onAccept}
          variant="primary"
          fullWidth
        />
        <Button
          title="취소"
          onPress={onDecline}
          variant="text"
          fullWidth
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface
  },
  contentContainer: {
    padding: Spacing.lg
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.textPrimary
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.xl
  },
  section: {
    marginBottom: Spacing.lg
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary
  },
  text: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24
  },
  bulletList: {
    marginTop: Spacing.sm,
    paddingLeft: Spacing.sm
  },
  bullet: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 24
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    marginBottom: Spacing.xl
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
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.md
  }
});

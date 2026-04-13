import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { Colors, Typography, Spacing } from '@/constants';
import { PREMIUM_FEATURES, PREMIUM_PRICE, PremiumFeatureKey } from '@/constants/Premium';

interface Props {
  feature: PremiumFeatureKey;
  onUpgrade: () => void;
  onClose?: () => void;
}

export const PremiumGate: React.FC<Props> = ({ feature, onUpgrade, onClose }) => {
  return (
    <View style={styles.overlay}>
      <Card style={styles.card}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.icon}>⭐</Text>
        <Text style={styles.title}>프리미엄 기능</Text>
        <Text style={styles.feature}>{PREMIUM_FEATURES[feature]}</Text>
        <Text style={styles.description}>
          이 기능은 프리미엄 플랜에서 사용할 수 있습니다.
        </Text>

        <View style={styles.benefits}>
          <Text style={styles.benefitItem}>✓ 무제한 데이터</Text>
          <Text style={styles.benefitItem}>✓ 멀티 디바이스</Text>
          <Text style={styles.benefitItem}>✓ 가족 공유</Text>
          <Text style={styles.benefitItem}>✓ 고급 기능</Text>
        </View>

        <Button
          title={`월 ${PREMIUM_PRICE.monthly.toLocaleString()}원으로 업그레이드`}
          onPress={onUpgrade}
          variant="primary"
          fullWidth
        />

        <Text style={styles.hint}>
          첫 7일 무료 체험
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  card: {
    margin: Spacing.md,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  closeText: {
    fontSize: 24,
    color: Colors.textSecondary
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm
  },
  feature: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.md
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg
  },
  benefits: {
    width: '100%',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg
  },
  benefitItem: {
    ...Typography.body,
    marginBottom: Spacing.sm
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm
  }
});

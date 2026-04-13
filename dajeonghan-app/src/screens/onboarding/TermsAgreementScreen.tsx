import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Button } from '@/components/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface Props {
  onAccept: () => void;
}

export const TermsAgreementScreen: React.FC<Props> = ({ onAccept }) => {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const handlePrivacyPolicyPress = () => {
    // 추후 내부 화면으로 네비게이션하거나 웹 링크 열기
    console.log('Open privacy policy');
  };

  const handleTermsPress = () => {
    // 추후 내부 화면으로 네비게이션하거나 웹 링크 열기
    console.log('Open terms of service');
  };

  const canProceed = termsAgreed && privacyAgreed;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>다정한에 오신 것을 환영합니다</Text>
        <Text style={styles.subtitle}>
          시작하기 전에 약관을 확인해주세요
        </Text>

        <View style={styles.agreementSection}>
          <Text style={styles.sectionTitle}>필수 동의 항목</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAgreed(!termsAgreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
              {termsAgreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>
                서비스 이용약관 동의 <Text style={styles.required}>(필수)</Text>
              </Text>
              <TouchableOpacity onPress={handleTermsPress}>
                <Text style={styles.linkText}>약관 보기 ›</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPrivacyAgreed(!privacyAgreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, privacyAgreed && styles.checkboxChecked]}>
              {privacyAgreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>
                개인정보 처리방침 동의 <Text style={styles.required}>(필수)</Text>
              </Text>
              <TouchableOpacity onPress={handlePrivacyPolicyPress}>
                <Text style={styles.linkText}>방침 보기 ›</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📌 주요 안내사항</Text>
          <Text style={styles.infoText}>
            • 다정한은 익명으로 사용할 수 있습니다{'\n'}
            • 모든 데이터는 안전하게 암호화됩니다{'\n'}
            • 언제든지 계정을 삭제할 수 있습니다{'\n'}
            • 약 복용 기능은 의료 조언이 아닙니다
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="동의하고 시작하기"
          onPress={onAccept}
          variant="primary"
          fullWidth
          disabled={!canProceed}
        />
        {!canProceed && (
          <Text style={styles.footerNote}>
            모든 필수 항목에 동의해주세요
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.xl
  },
  agreementSection: {
    marginBottom: Spacing.xl
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.md
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  checkmark: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700'
  },
  checkboxTextContainer: {
    flex: 1
  },
  checkboxLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  required: {
    color: Colors.error
  },
  linkText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600'
  },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary
  },
  infoTitle: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.sm
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray
  },
  footerNote: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm
  }
});

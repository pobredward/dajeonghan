import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface Props {
  onDirectSetup: () => void;
  onMarketplace: () => void;
  onBack: () => void;
}

export const OnboardingChoiceScreen: React.FC<Props> = ({
  onDirectSetup,
  onMarketplace,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backButtonText}>← 뒤로</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.emoji}>🏡</Text>
        <Text style={styles.title}>어떻게 시작할까요?</Text>
        <Text style={styles.subtitle}>
          내 집을 직접 설정하거나{'\n'}마켓플레이스 템플릿으로 바로 시작하세요
        </Text>

        {/* 직접 설정 카드 */}
        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          onPress={onDirectSetup}
          activeOpacity={0.85}
        >
          <View style={styles.cardIconWrap}>
            <Text style={styles.cardIcon}>⚙️</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>내 집 직접 설정하기</Text>
              <View style={styles.recommendBadge}>
                <Text style={styles.recommendBadgeText}>추천</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              집 구조, 라이프스타일, 생활 환경을 직접 선택해서 나에게 딱 맞는 할 일 목록을 만들어요
            </Text>
            <View style={styles.cardMeta}>
              <MetaChip icon="📋" label="약관 → 집 구조 → 페르소나 → 질문" />
              <MetaChip icon="⏱️" label="약 3분 소요" />
            </View>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* 마켓플레이스 카드 */}
        <TouchableOpacity
          style={[styles.card, styles.cardSecondary]}
          onPress={onMarketplace}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIconWrap, styles.cardIconWrapSecondary]}>
            <Text style={styles.cardIcon}>🛍️</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, styles.cardTitleSecondary]}>
              마켓플레이스에서 가져오기
            </Text>
            <Text style={[styles.cardDesc, styles.cardDescSecondary]}>
              다른 사람들이 공유한 템플릿을 그대로 가져와서 바로 시작해요
            </Text>
            <View style={styles.cardMeta}>
              <MetaChip icon="⚡" label="바로 시작" accent />
              <MetaChip icon="✏️" label="나중에 수정 가능" accent />
            </View>
          </View>
          <Text style={[styles.cardArrow, styles.cardArrowSecondary]}>›</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          어느 방법이든 나중에 설정에서 자유롭게 변경할 수 있어요
        </Text>
      </ScrollView>
    </View>
  );
};

const MetaChip: React.FC<{ icon: string; label: string; accent?: boolean }> = ({
  icon,
  label,
  accent,
}) => (
  <View style={[metaChipStyles.chip, accent && metaChipStyles.chipAccent]}>
    <Text style={metaChipStyles.icon}>{icon}</Text>
    <Text style={[metaChipStyles.label, accent && metaChipStyles.labelAccent]}>
      {label}
    </Text>
  </View>
);

const metaChipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipAccent: {
    backgroundColor: '#E8F5E9',
  },
  icon: {
    fontSize: 11,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelAccent: {
    color: Colors.secondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  // 카드 공통
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  cardIconWrapSecondary: {
    backgroundColor: Colors.secondaryLight,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardTitleSecondary: {
    marginBottom: 4,
  },
  cardDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  cardDescSecondary: {
    color: Colors.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cardArrow: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '300',
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },
  cardArrowSecondary: {
    color: Colors.secondary,
  },

  // 직접 설정 카드 강조 테두리
  cardPrimary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cardSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
  },

  recommendBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },

  footerNote: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 18,
  },
});

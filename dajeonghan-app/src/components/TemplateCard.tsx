import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SharedTemplate, TemplateCategory } from '@/types/template.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { getCategoryIcon, getCategoryName } from '@/constants/TemplateCategories';

interface Props {
  template: SharedTemplate;
  onPress?: () => void;
  onCreatorPress?: (creatorId: string, creatorName: string) => void;
}

// 카테고리별 테마 (그라데이션 효과를 위한 시작/끝 색 + 텍스트 색)
const CATEGORY_THEME: Record<TemplateCategory, { light: string; mid: string; accent: string; text: string }> = {
  student_living_alone: { light: '#E8F5E9', mid: '#C8E6C9', accent: '#388E3C', text: '#1B5E20' },
  worker_single:        { light: '#E3F2FD', mid: '#BBDEFB', accent: '#1976D2', text: '#0D47A1' },
  worker_roommate:      { light: '#F3E5F5', mid: '#E1BEE7', accent: '#7B1FA2', text: '#4A148C' },
  newlywed:             { light: '#FCE4EC', mid: '#F8BBD0', accent: '#C2185B', text: '#880E4F' },
  family_with_kids:     { light: '#FFF8E1', mid: '#FFECB3', accent: '#F57F17', text: '#E65100' },
  pet_owner:            { light: '#FFF3E0', mid: '#FFE0B2', accent: '#E65100', text: '#BF360C' },
  minimalist:           { light: '#F5F5F5', mid: '#E0E0E0', accent: '#455A64', text: '#263238' },
  weekend_warrior:      { light: '#E0F7FA', mid: '#B2EBF2', accent: '#00838F', text: '#006064' },
  custom:               { light: '#EDE7F6', mid: '#D1C4E9', accent: '#512DA8', text: '#311B92' },
};

function getCategoryTheme(category: TemplateCategory) {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.custom;
}

function getInitial(name: string): string {
  if (!name) return '?';
  // 한글 첫 글자 또는 영문 대문자
  return name.charAt(0).toUpperCase();
}

function getTotalTaskCount(template: SharedTemplate): number {
  if (template.houseLayout) {
    return (template.houseLayout.rooms ?? []).reduce(
      (sum, room) => sum + (room.furnitures ?? []).reduce((s, f) => s + (f.tasks?.length ?? 0), 0),
      0
    );
  }
  return template.tasks?.length ?? 0;
}

function getRoomCount(template: SharedTemplate): number {
  return template.houseLayout?.rooms?.length ?? 0;
}

export const TemplateCard: React.FC<Props> = ({ template, onPress, onCreatorPress }) => {
  const totalTasks = getTotalTaskCount(template);
  const roomCount = getRoomCount(template);
  const theme = getCategoryTheme(template.category);

  const handleCreatorPress = (e: any) => {
    e.stopPropagation();
    onCreatorPress?.(template.creatorId, template.creatorName);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.78}>
      {/* ── 헤더 배너 ── */}
      <View style={[styles.banner, { backgroundColor: theme.light }]}>
        {/* 카테고리 뱃지 */}
        <View style={[styles.categoryBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.categoryBadgeIcon}>{getCategoryIcon(template.category)}</Text>
          <Text style={styles.categoryBadgeText}>{getCategoryName(template.category)}</Text>
        </View>

        {/* 방 + 업무 수 하이라이트 */}
        <View style={styles.countBadgeGroup}>
          {roomCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: theme.mid }]}>
              <Text style={[styles.countBadgeNum, { color: theme.text }]}>{roomCount}</Text>
              <Text style={[styles.countBadgeLabel, { color: theme.accent }]}>방</Text>
            </View>
          )}
          <View style={[styles.countBadge, { backgroundColor: theme.mid }]}>
            <Text style={[styles.countBadgeNum, { color: theme.text }]}>{totalTasks}</Text>
            <Text style={[styles.countBadgeLabel, { color: theme.accent }]}>업무</Text>
          </View>
        </View>
      </View>

      {/* ── 본문 ── */}
      <View style={styles.body}>
        {/* 제목 + 작성자 인라인 */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{template.name}</Text>
          <TouchableOpacity
            style={styles.creatorInline}
            onPress={onCreatorPress ? handleCreatorPress : undefined}
            activeOpacity={onCreatorPress ? 0.6 : 1}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {template.creatorAvatar ? (
              <Image
                source={{ uri: template.creatorAvatar }}
                style={[styles.avatarSmall, { borderColor: theme.accent + '55' }]}
              />
            ) : (
              <View style={[styles.avatarSmallFallback, { backgroundColor: theme.mid, borderColor: theme.accent + '55' }]}>
                <Text style={[styles.avatarSmallInitial, { color: theme.accent }]}>
                  {getInitial(template.creatorName)}
                </Text>
              </View>
            )}
            <Text style={styles.creatorNameInline} numberOfLines={1}>{template.creatorName}</Text>
          </TouchableOpacity>
        </View>

        {!!template.description && (
          <Text style={styles.description} numberOfLines={2}>{template.description}</Text>
        )}

        {/* 태그 */}
        {(template.tags?.length ?? 0) > 0 && (
          <View style={styles.tags}>
            {(template.tags ?? []).slice(0, 4).map((tag, i) => (
              <View key={i} style={[styles.tagChip, { borderColor: theme.accent + '44' }]}>
                <Text style={[styles.tagText, { color: theme.accent }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 통계 바 */}
        <View style={styles.statsBar}>
          <StatItem icon="❤️" value={template.likeCount} label="좋아요" />
          <View style={styles.statsDivider} />
          <StatItem icon="⬇️" value={template.usageCount} label="다운로드" />
          {template.averageRating > 0 && (
            <>
              <View style={styles.statsDivider} />
              <StatItem icon="⭐" value={template.averageRating.toFixed(1)} label="평점" />
            </>
          )}
          {((template.commentCount ?? 0) > 0) && (
            <>
              <View style={styles.statsDivider} />
              <StatItem icon="💬" value={template.commentCount} label="댓글" />
            </>
          )}
        </View>
      </View>

      {/* ── 하단 액센트 바 ── */}
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
    </TouchableOpacity>
  );
};

// ── 통계 아이템 서브 컴포넌트 ──
const StatItem: React.FC<{ icon: string; value: string | number; label: string }> = ({ icon, value, label }) => (
  <View style={statStyles.wrap}>
    <Text style={statStyles.icon}>{icon}</Text>
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 13,
    lineHeight: 18,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  label: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 13,
    marginTop: 1,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },

  // ── 헤더 배너 ──
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeIcon: {
    fontSize: 13,
    lineHeight: 17,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  countBadgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  countBadge: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 44,
  },
  countBadgeNum: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 21,
  },
  countBadgeLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 12,
  },

  // ── 본문 ──
  body: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    flex: 1,
  },
  creatorInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  avatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  avatarSmallFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallInitial: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  creatorNameInline: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    maxWidth: 72,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },

  // 태그
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 10,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // 통계 바
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statsDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.veryLightGray,
  },

  // ── 하단 액센트 바 ──
  accentBar: {
    height: 3,
  },
});

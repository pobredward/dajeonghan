import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SharedTemplate } from '@/types/template.types';
import { Colors, Typography, Spacing } from '@/constants';
import { getCategoryIcon, getCategoryName } from '@/constants/TemplateCategories';

interface Props {
  template: SharedTemplate;
  onPress?: () => void;
  compact?: boolean;
}

function getTotalTaskCount(template: SharedTemplate): number {
  if (template.houseLayout) {
    return template.houseLayout.rooms.reduce(
      (sum, room) =>
        sum + room.furnitures.reduce((s, f) => s + f.tasks.length, 0),
      0
    );
  }
  return template.tasks.length;
}

export const TemplateCard: React.FC<Props> = ({ template, onPress, compact = false }) => {
  const totalTasks = getTotalTaskCount(template);
  const hasLayout = !!template.houseLayout;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{getCategoryIcon(template.category)}</Text>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {template.name}
            </Text>
            {hasLayout && (
              <View style={styles.layoutBadge}>
                <Text style={styles.layoutBadgeText}>배치도</Text>
              </View>
            )}
          </View>
          <Text style={styles.creator} numberOfLines={1}>
            by {template.creatorName}
          </Text>
        </View>
      </View>

      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {template.description}
        </Text>
      )}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statText}>{template.likeCount}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statIcon}>⬇️</Text>
          <Text style={styles.statText}>{template.usageCount}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statText}>{template.commentCount ?? 0}</Text>
        </View>

        {template.averageRating > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>{template.averageRating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.stat}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statText}>{totalTasks}</Text>
        </View>
      </View>

      {template.tags.length > 0 && (
        <View style={styles.tags}>
          {template.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactCard: {
    padding: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...Typography.h4,
    flexShrink: 1,
    marginRight: Spacing.xs,
  },
  layoutBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  layoutBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  creator: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primary,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { TemplateReview } from '@/types/template.types';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { Colors, Typography, Spacing } from '@/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  templateId: string;
  limit?: number;
}

export const ReviewList: React.FC<Props> = ({ templateId, limit = 10 }) => {
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [templateId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const result = await TemplateMarketplaceService.getReviews(templateId, limit);
      setReviews(result);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  const renderReview = ({ item }: { item: TemplateReview }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthor}>
          <Text style={styles.authorName}>{item.userName}</Text>
          {renderRating(item.rating)}
        </View>
        <Text style={styles.reviewDate}>
          {format(item.createdAt, 'yyyy.MM.dd', { locale: ko })}
        </Text>
      </View>
      
      <Text style={styles.reviewComment}>{item.comment}</Text>
      
      {item.helpfulCount > 0 && (
        <View style={styles.helpfulContainer}>
          <Text style={styles.helpfulIcon}>👍</Text>
          <Text style={styles.helpfulText}>
            {item.helpfulCount}명이 도움이 됐다고 했어요
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>리뷰를 불러오는 중...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>아직 리뷰가 없습니다</Text>
        <Text style={styles.emptySubtext}>첫 리뷰를 작성해보세요!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      renderItem={renderReview}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center'
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md
  },
  emptyText: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  reviewItem: {
    paddingVertical: Spacing.md
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm
  },
  reviewAuthor: {
    flex: 1
  },
  authorName: {
    ...Typography.label,
    marginBottom: 4
  },
  ratingContainer: {
    flexDirection: 'row'
  },
  star: {
    fontSize: 14,
    marginRight: 2
  },
  reviewDate: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  reviewComment: {
    ...Typography.body,
    lineHeight: 22,
    marginBottom: Spacing.sm
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  helpfulIcon: {
    fontSize: 14,
    marginRight: 4
  },
  helpfulText: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: Spacing.xs
  }
});

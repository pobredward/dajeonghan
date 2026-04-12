import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FoodItem } from '../types';
import { FridgeService } from '../FridgeService';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  item: FoodItem;
  onPress?: () => void;
  onDelete?: () => void;
}

/**
 * 식재료 카드 컴포넌트
 * 
 * 개별 식재료를 표시하고 임박 상태를 시각적으로 나타냅니다.
 */
export const FoodItemCard: React.FC<Props> = ({ item, onPress, onDelete }) => {
  const daysLeft = FridgeService.getDaysLeft(item);
  const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;

  /**
   * 임박 레벨에 따른 색상
   */
  const getUrgencyColor = (): string => {
    if (daysLeft === null) return '#9E9E9E';
    if (daysLeft < 0) return '#F44336'; // 만료
    if (daysLeft === 0) return '#FF5722'; // D-day
    if (daysLeft === 1) return '#FF9800'; // D-1
    if (daysLeft <= 3) return '#FFC107'; // D-3
    return '#4CAF50'; // 여유
  };

  /**
   * 임박 텍스트
   */
  const getUrgencyText = (): string => {
    if (daysLeft === null) return '날짜 없음';
    if (daysLeft < 0) return `${Math.abs(daysLeft)}일 지남`;
    if (daysLeft === 0) return '오늘까지';
    if (daysLeft === 1) return '내일까지';
    return `${daysLeft}일 남음`;
  };

  /**
   * 카테고리 이모지
   */
  const getCategoryEmoji = (): string => {
    const emojiMap: Record<string, string> = {
      '채소': '🥬',
      '과일': '🍎',
      '육류': '🥩',
      '해산물': '🦐',
      '유제품': '🥛',
      '조미료': '🧂',
      '가공식품': '🥫',
      '곡물': '🌾',
      '기타': '📦'
    };
    return emojiMap[item.metadata.category] || '📦';
  };

  /**
   * 보관 조건 이모지
   */
  const getStorageEmoji = (): string => {
    const emojiMap: Record<string, string> = {
      '냉장': '❄️',
      '냉동': '🧊',
      '실온': '🌡️'
    };
    return emojiMap[item.metadata.storageCondition] || '📦';
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{getCategoryEmoji()}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getUrgencyColor() }]}>
          <Text style={styles.badgeText}>{getUrgencyText()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detail}>
          {getStorageEmoji()} {item.metadata.storageCondition}
        </Text>
        <Text style={styles.detail}>
          · {item.metadata.storageType}
        </Text>
        <Text style={styles.detail}>
          · {item.metadata.state}
        </Text>
      </View>

      {expiryDate && (
        <Text style={styles.date}>
          권장 소진: {format(expiryDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
        </Text>
      )}

      {item.metadata.quantity && (
        <Text style={styles.quantity}>
          수량: {item.metadata.quantity}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  emoji: {
    fontSize: 24,
    marginRight: 8
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#212121'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginRight: 4
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginTop: 4
  },
  quantity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  }
});

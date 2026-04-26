import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { HouseLayout } from '@/types/house.types';

interface Props {
  onSelect: (layoutType: HouseLayout['layoutType']) => Promise<void>;
  onBack?: () => void;
  isOnboarding?: boolean;
}

interface LayoutOption {
  type: HouseLayout['layoutType'];
  title: string;
  subtitle: string;
  emoji: string;
  rooms: string[];
  recommended?: boolean;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    type: 'studio',
    title: '원룸',
    subtitle: '모든 공간이 하나로',
    emoji: '🏠',
    rooms: ['통합 공간 + 욕실'],
  },
  {
    type: 'two_room',
    title: '투룸',
    subtitle: '거실과 침실 분리',
    emoji: '🏘️',
    rooms: ['거실', '침실', '욕실'],
    recommended: true,
  },
  {
    type: 'three_room',
    title: '쓰리룸',
    subtitle: '방이 2개 이상',
    emoji: '🏢',
    rooms: ['거실', '방1', '방2', '욕실'],
  },
  {
    type: 'four_room',
    title: '포룸',
    subtitle: '넓은 공간',
    emoji: '🏛️',
    rooms: ['거실', '주방', '안방', '방2', '방3'],
  },
];

export const HouseLayoutSelectionScreen: React.FC<Props> = ({ onSelect, onBack, isOnboarding }) => {
  const [selectedType, setSelectedType] = useState<HouseLayout['layoutType']>('studio');

  const handleSelect = (type: HouseLayout['layoutType']) => {
    setSelectedType(type);
  };

  const handleNext = async () => {
    try {
      await onSelect(selectedType);
    } catch (error) {
      console.error('Failed to select layout:', error);
      Alert.alert('오류', '집 구조를 선택하는데 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerEmoji}>🏠</Text>
        <Text style={styles.headerTitle}>집 구조 선택</Text>
        <Text style={styles.headerSubtitle}>
          {isOnboarding
            ? '어떤 집에 살고 계신가요?\n선택하면 기본 가구를 자동으로 배치해 드려요'
            : '현재 살고 계신 집의 구조를 선택해주세요\n나중에 방 크기와 가구를 자유롭게 배치할 수 있어요'}
        </Text>
      </View>

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {LAYOUT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={[
              styles.optionCard,
              selectedType === option.type && styles.optionCardSelected,
            ]}
            onPress={() => handleSelect(option.type)}
            activeOpacity={0.7}
          >
            {option.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>추천</Text>
              </View>
            )}

            <View style={styles.optionHeader}>
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedType === option.type && styles.radioButtonSelected,
                ]}
              >
                {selectedType === option.type && <View style={styles.radioButtonInner} />}
              </View>
            </View>

            <View style={styles.roomsList}>
              {option.rooms.map((room, index) => (
                <View key={index} style={styles.roomTag}>
                  <Text style={styles.roomTagText}>{room}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>
            {isOnboarding
              ? '선택한 집 구조에 맞는 기본 가구가 자동 배치돼요.\n언제든 위치를 옮기거나 삭제할 수 있어요.'
              : '선택한 구조는 기본 템플릿이에요.\n다음 단계에서 방을 추가하거나 제거하고,\n크기와 가구를 자유롭게 배치할 수 있습니다.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.veryLightGray,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optionEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  optionHeaderText: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  optionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  roomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  roomTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomTagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  noteIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.h4,
    color: Colors.white,
    fontWeight: '700',
  },
});

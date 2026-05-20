import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { TemplateCard } from '@/components/TemplateCard';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { SharedTemplate, TemplateSortOption } from '@/types/template.types';

type SortKey = Exclude<TemplateSortOption, 'mine'>;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'downloads', label: '다운로드순' },
];

interface Props {
  onApply: (templateId: string) => Promise<void>;
  onBack: () => void;
}

const SkeletonCard: React.FC = () => (
  <View style={skeletonStyles.card}>
    <View style={skeletonStyles.header} />
    <View style={skeletonStyles.body}>
      <View style={skeletonStyles.line} />
      <View style={[skeletonStyles.line, { width: '60%' }]} />
      <View style={skeletonStyles.statsRow}>
        {[0, 1, 2, 3].map(i => <View key={i} style={skeletonStyles.stat} />)}
      </View>
    </View>
  </View>
);

export const OnboardingMarketplacePickerScreen: React.FC<Props> = ({
  onApply,
  onBack,
}) => {
  const [sort, setSort] = useState<SortKey>('popular');
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<SharedTemplate | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setError(null);
    try {
      const result = await TemplateMarketplaceService.getTemplatesSorted(sort, 50);
      // 배치도가 있는 템플릿만 표시 (적용 가능한 것만)
      setTemplates(result.filter(t => !!t.houseLayout));
    } catch {
      setError('템플릿을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    if (!searchActive) {
      setLoading(true);
      fetchTemplates();
    }
  }, [fetchTemplates, searchActive]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchActive(false);
      return;
    }
    setSearchActive(true);
    setLoading(true);
    setError(null);
    try {
      const result = await TemplateMarketplaceService.searchTemplates(q);
      setTemplates(result.filter(t => !!t.houseLayout));
    } catch {
      setError('검색 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
  };

  const handleTemplatePress = (template: SharedTemplate) => {
    setSelectedTemplate(template);
    setPreviewVisible(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedTemplate) return;
    setApplying(true);
    try {
      await onApply(selectedTemplate.id);
    } catch {
      Alert.alert('오류', '템플릿 적용 중 문제가 발생했습니다. 다시 시도해주세요.');
      setApplying(false);
    }
  };

  const getTotalTasks = (template: SharedTemplate): number => {
    if (template.houseLayout) {
      return template.houseLayout.rooms.reduce(
        (sum, room) => sum + room.furnitures.reduce((s, f) => s + f.tasks.length, 0),
        0
      );
    }
    return template.tasks.length;
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>템플릿 고르기</Text>
          <Text style={styles.headerSub}>배치도가 포함된 템플릿만 표시돼요</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="이름 또는 태그로 검색..."
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 정렬 토글 */}
      <View style={styles.toolBar}>
        {searchActive ? (
          <Text style={styles.searchResultText}>
            검색 결과 <Text style={styles.searchResultCount}>{templates.length}</Text>개
          </Text>
        ) : (
          <View style={styles.sortToggle}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortBtn, sort === opt.key && styles.sortBtnActive]}
                onPress={() => {
                  setSort(opt.key);
                  setSearchActive(false);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.sortBtnText, sort === opt.key && styles.sortBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 에러 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(null); fetchTemplates(); }}>
            <Text style={styles.errorRetry}>재시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 목록 */}
      {loading ? (
        <View style={{ padding: Spacing.md }}>
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              onPress={() => handleTemplatePress(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {searchActive ? '검색 결과가 없어요' : '아직 배치도 템플릿이 없어요'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchActive ? '다른 키워드로 검색해보세요' : '직접 설정으로 시작해보세요'}
              </Text>
            </View>
          }
        />
      )}

      {/* 템플릿 미리보기 모달 */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />

            {selectedTemplate && (
              <ScrollView
                contentContainerStyle={modalStyles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* 카테고리 + 제목 */}
                <Text style={modalStyles.templateName}>{selectedTemplate.name}</Text>
                {!!selectedTemplate.description && (
                  <Text style={modalStyles.templateDesc}>{selectedTemplate.description}</Text>
                )}

                {/* 통계 요약 */}
                <View style={modalStyles.statsRow}>
                  <StatPill
                    icon="🏠"
                    value={`${selectedTemplate.houseLayout?.rooms.length ?? 0}개 방`}
                  />
                  <StatPill
                    icon="📋"
                    value={`${getTotalTasks(selectedTemplate)}개 할일`}
                  />
                  <StatPill
                    icon="❤️"
                    value={`좋아요 ${selectedTemplate.likeCount}`}
                  />
                </View>

                {/* 방 목록 */}
                {selectedTemplate.houseLayout && (
                  <View style={modalStyles.section}>
                    <Text style={modalStyles.sectionTitle}>포함된 방</Text>
                    {selectedTemplate.houseLayout.rooms.map((room, idx) => (
                      <View key={idx} style={modalStyles.roomRow}>
                        <Text style={modalStyles.roomName}>{room.name}</Text>
                        <Text style={modalStyles.roomTaskCount}>
                          가구 {room.furnitures.length}개
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 태그 */}
                {selectedTemplate.tags.length > 0 && (
                  <View style={modalStyles.tags}>
                    {selectedTemplate.tags.map((tag, i) => (
                      <View key={i} style={modalStyles.tagChip}>
                        <Text style={modalStyles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={modalStyles.applyNote}>
                  이 템플릿을 적용하면 집 레이아웃과 할 일 목록이 자동으로 설정돼요.{'\n'}
                  나중에 설정에서 언제든지 수정할 수 있어요.
                </Text>
              </ScrollView>
            )}

            {/* 버튼 영역 */}
            <View style={modalStyles.footer}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => setPreviewVisible(false)}
                disabled={applying}
              >
                <Text style={modalStyles.cancelBtnText}>다른 템플릿 보기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.applyBtn, applying && modalStyles.applyBtnDisabled]}
                onPress={handleConfirmApply}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={modalStyles.applyBtnText}>이 템플릿으로 시작하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatPill: React.FC<{ icon: string; value: string }> = ({ icon, value }) => (
  <View style={statPillStyles.pill}>
    <Text style={statPillStyles.icon}>{icon}</Text>
    <Text style={statPillStyles.value}>{value}</Text>
  </View>
);

const statPillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  icon: {
    fontSize: 13,
  },
  value: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.veryLightGray,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  templateName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  templateDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  roomName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  roomTaskCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyNote: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
  },
  cancelBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  applyBtnDisabled: {
    backgroundColor: Colors.lightGray,
  },
  applyBtnText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  backButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 70,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    minWidth: 70,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearBtnText: {
    color: Colors.gray,
    fontSize: 14,
  },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  sortToggle: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    backgroundColor: Colors.white,
  },
  sortBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  sortBtnText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sortBtnTextActive: {
    color: Colors.primary,
  },
  searchResultText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  searchResultCount: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
  },
  errorRetry: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  header: {
    height: 64,
    backgroundColor: Colors.veryLightGray,
  },
  body: {
    padding: Spacing.md,
  },
  line: {
    height: 14,
    backgroundColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    width: '80%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  stat: {
    width: 40,
    height: 36,
    backgroundColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
  },
});

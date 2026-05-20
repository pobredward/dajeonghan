import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { FAB } from '@/components/FAB';
import { TemplateCard } from '@/components/TemplateCard';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { SharedTemplate, TemplateSortOption } from '@/types/template.types';
import { useAuth } from '@/contexts/AuthContext';
import { TemplateStackParamList } from '@/navigation/TemplateNavigator';
import { Button } from '@/components/Button';

type NavigationProp = StackNavigationProp<TemplateStackParamList, 'TemplateMarketplace'>;

type SortKey = Exclude<TemplateSortOption, 'mine'>;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'downloads', label: '다운로드순' },
];

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

export const TemplateMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [sort, setSort] = useState<SortKey>('recent');
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const sortBtnRef = useRef<TouchableOpacity>(null);

  const handleCreatorPress = useCallback((creatorId: string, creatorName: string) => {
    navigation.navigate('UserProfile', { userId: creatorId, displayName: creatorName });
  }, [navigation]);

  const fetchTemplates = useCallback(async () => {
    setError(null);
    try {
      const result = await TemplateMarketplaceService.getTemplatesSorted(
        sort,
        50,
        userId ?? undefined
      );
      setTemplates(result);
    } catch (e) {
      setError('템플릿을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [sort, userId]);

  useEffect(() => {
    if (!searchActive) {
      setLoading(true);
      fetchTemplates();
    }
  }, [fetchTemplates, searchActive]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result = await TemplateMarketplaceService.getTemplatesSorted(
        sort, 50, userId ?? undefined
      );
      setTemplates(result);
    } catch (e) {
      setError('새로고침 중 문제가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

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
      setTemplates(result);
    } catch (e) {
      setError('검색 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
  };

  const handleSortChange = (key: SortKey) => {
    setSort(key);
    setSortDropdownVisible(false);
    setSearchActive(false);
    setSearchQuery('');
  };

  const openSortDropdown = () => {
    sortBtnRef.current?.measure((_fx, _fy, width, height, px, py) => {
      // Android에서 measure() 콜백 값이 NaN/0으로 올 수 있어 방어
      const safeY = Number.isFinite(py) && py > 0 ? py + height : 60;
      const safeX = Number.isFinite(px) ? px : 0;
      const safeW = Number.isFinite(width) && width > 0 ? width : 100;
      setDropdownLayout({ x: safeX, y: safeY, width: safeW, height: height || 36 });
      setSortDropdownVisible(true);
    });
  };

  const renderSkeleton = () => (
    <View style={{ padding: Spacing.md }}>
      {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 정렬 드롭다운 */}
      <View style={styles.toolBar}>
        {false ? (
          <Text style={styles.searchResultText}>
            검색 결과 <Text style={styles.searchResultCount}>{templates.length}</Text>개
          </Text>
        ) : (
          <View style={styles.toolBarRight}>
            <TouchableOpacity
              ref={sortBtnRef}
              style={styles.sortDropdownBtn}
              onPress={openSortDropdown}
              activeOpacity={0.7}
            >
              <Text style={styles.sortDropdownBtnText}>
                {SORT_OPTIONS.find(o => o.key === sort)?.label ?? '정렬'}
              </Text>
              <Text style={styles.sortDropdownArrow}>
                {sortDropdownVisible ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 정렬 드롭다운 모달 */}
      <Modal
        visible={sortDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setSortDropdownVisible(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              { top: dropdownLayout.y, right: 16 },
            ]}
          >
            {SORT_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.dropdownItem,
                  sort === opt.key && styles.dropdownItemActive,
                  idx < SORT_OPTIONS.length - 1 && styles.dropdownItemBorder,
                ]}
                onPress={() => handleSortChange(opt.key)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    sort === opt.key && styles.dropdownItemTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {sort === opt.key && (
                  <Text style={styles.dropdownItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(null); fetchTemplates(); }}>
            <Text style={styles.errorRetry}>재시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 콘텐츠 */}
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
              onCreatorPress={handleCreatorPress}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {searchActive ? '검색 결과가 없어요' : '아직 템플릿이 없어요'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchActive
                  ? '다른 키워드로 검색해보세요'
                  : '첫 번째 템플릿을 만들어보세요!'}
              </Text>
              {!searchActive && (
                <View style={styles.emptyCTA}>
                  <Button
                    title="내 템플릿 만들기"
                    onPress={() => navigation.navigate('CreateFullTemplate')}
                    size="small"
                  />
                </View>
              )}
            </View>
          }
        />
      )}

      <FAB
        icon="✏️"
        label="만들기"
        onPress={() => navigation.navigate('CreateFullTemplate')}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  toolBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  sortDropdownBtnText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  sortDropdownArrow: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    minWidth: 140,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dropdownItemCheck: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
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
    paddingBottom: 100,
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
  emptyCTA: {
    marginTop: Spacing.lg,
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

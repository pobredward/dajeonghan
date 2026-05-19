import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing } from '@/constants';
import { FAB } from '@/components/FAB';
import { TemplateCard } from '@/components/TemplateCard';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { SharedTemplate, TemplateSortOption } from '@/types/template.types';
import { useAuth } from '@/contexts/AuthContext';
import { TemplateStackParamList } from '@/navigation/TemplateNavigator';

type NavigationProp = StackNavigationProp<TemplateStackParamList, 'TemplateMarketplace'>;

const SORT_TABS: { key: TemplateSortOption; label: string; icon: string }[] = [
  { key: 'recent', label: '최신', icon: '🆕' },
  { key: 'popular', label: '인기', icon: '❤️' },
  { key: 'downloads', label: '다운로드', icon: '⬇️' },
  { key: 'mine', label: '내 템플릿', icon: '👤' },
];

export const TemplateMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [sort, setSort] = useState<TemplateSortOption>('recent');
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await TemplateMarketplaceService.getTemplatesSorted(
        sort,
        30,
        userId ?? undefined
      );
      setTemplates(result);
    } catch (e) {
      console.error('fetch templates error', e);
    } finally {
      setLoading(false);
    }
  }, [sort, userId]);

  useEffect(() => {
    if (!searchActive) fetchTemplates();
  }, [fetchTemplates, searchActive]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchActive(false);
      fetchTemplates();
      return;
    }
    setSearchActive(true);
    setLoading(true);
    try {
      const result = await TemplateMarketplaceService.searchTemplates(searchQuery.trim());
      setTemplates(result);
    } catch (e) {
      console.error('search error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    fetchTemplates();
  };

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="태그로 검색..."
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearSearch}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 정렬 탭 */}
      <View style={styles.tabBar}>
        {SORT_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, sort === tab.key && styles.activeTab]}
            onPress={() => { setSort(tab.key); setSearchActive(false); setSearchQuery(''); }}
          >
            <Text style={[styles.tabText, sort === tab.key && styles.activeTabText]}>
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {searchActive ? '검색 결과가 없습니다' : '아직 템플릿이 없습니다'}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="✏️"
        label="내 템플릿 만들기"
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearBtnText: {
    color: Colors.gray,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  activeTabText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

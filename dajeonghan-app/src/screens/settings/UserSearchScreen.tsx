import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { searchUsersByUsername } from '@/services/profileService';
import { UserProfileModal } from './UserProfileModal';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import type { MyInfoStackParamList } from '@/navigation/MyInfoNavigator';
import type { PublicProfile } from '@/types/user.types';

type NavigationProp = StackNavigationProp<MyInfoStackParamList, 'UserSearch'>;

interface Props {
  navigation: NavigationProp;
}

export const UserSearchScreen: React.FC<Props> = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim().replace(/^@+/, '');
    if (!trimmed) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const found = await searchUsersByUsername(trimmed);
      setResults(found);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = (profile: PublicProfile) => {
    setSelectedProfile(profile);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: PublicProfile }) => {
    const initials = item.displayName ? item.displayName.charAt(0).toUpperCase() : '?';
    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => openProfile(item)}
        activeOpacity={0.7}
      >
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.userMeta}>
          {item.username ? (
            <Text style={styles.username}>@{item.username}</Text>
          ) : null}
          <Text style={styles.displayName}>{item.displayName || '이름 미설정'}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          ) : null}
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* 검색 입력 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="아이디로 검색"
          placeholderTextColor={Colors.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!query.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.searchButtonText}>검색</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 결과 */}
      {!loading && searched && results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          <Text style={styles.emptyHint}>아이디를 정확히 입력했는지 확인해주세요.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            !searched ? (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>아이디로 사용자를 검색할 수 있습니다.</Text>
              </View>
            ) : null
          }
        />
      )}

      <UserProfileModal
        visible={modalVisible}
        profile={selectedProfile}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.background,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    backgroundColor: Colors.surface,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  userMeta: {
    flex: 1,
  },
  username: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  displayName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  bio: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginLeft: Spacing.md + 48 + Spacing.md,
  },
  emptyContainer: {
    paddingTop: Spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    ...Typography.bodySmall,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
  hintContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  hintText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

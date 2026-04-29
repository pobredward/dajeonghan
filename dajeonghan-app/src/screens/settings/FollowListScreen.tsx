import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getFollowers, getFollowing, unfollowUser } from '@/services/followService';
import { UserProfileModal } from './UserProfileModal';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import type { MyInfoStackParamList } from '@/navigation/MyInfoNavigator';
import type { PublicProfile } from '@/types/user.types';

type NavigationProp = StackNavigationProp<MyInfoStackParamList, 'FollowList'>;
type Route = RouteProp<MyInfoStackParamList, 'FollowList'>;

interface Props {
  navigation: NavigationProp;
  route: Route;
}

type TabType = 'followers' | 'following';

const UserRow: React.FC<{
  profile: PublicProfile;
  showUnfollow?: boolean;
  onUnfollow?: () => void;
  onPress?: () => void;
}> = ({ profile, showUnfollow, onUnfollow, onPress }) => {
  const initials = profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity style={styles.userRow} onPress={onPress} activeOpacity={0.7}>
      {profile.photoURL ? (
        <Image source={{ uri: profile.photoURL }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarFallback}>
          <Text style={styles.userAvatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.userMeta}>
        <Text style={styles.userName}>{profile.displayName || '이름 미설정'}</Text>
        {profile.username ? (
          <Text style={styles.userUsername}>@{profile.username}</Text>
        ) : null}
        {profile.bio ? (
          <Text style={styles.userBio} numberOfLines={1}>{profile.bio}</Text>
        ) : null}
      </View>
      {showUnfollow && onUnfollow && (
        <TouchableOpacity
          style={styles.unfollowButton}
          onPress={(e) => { e.stopPropagation?.(); onUnfollow(); }}
          activeOpacity={0.7}
        >
          <Text style={styles.unfollowButtonText}>언팔로우</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export const FollowListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab ?? 'followers');
  const [followers, setFollowers] = useState<PublicProfile[]>([]);
  const [following, setFollowing] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: Spacing.md }}
          onPress={() => navigation.navigate('UserSearch')}
          activeOpacity={0.7}
        >
          <Text style={{ color: Colors.primary, fontSize: 22 }}>⊕</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [frs, fing] = await Promise.all([
        getFollowers(userId),
        getFollowing(userId),
      ]);
      setFollowers(frs);
      setFollowing(fing);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setFilterQuery('');
  };

  const handleUnfollow = async (targetUid: string) => {
    if (!userId) return;
    Alert.alert('언팔로우', '정말 언팔로우 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '언팔로우',
        style: 'destructive',
        onPress: async () => {
          await unfollowUser(userId, targetUid);
          setFollowing((prev) => prev.filter((p) => p.userId !== targetUid));
        },
      },
    ]);
  };

  const openProfile = (profile: PublicProfile) => {
    setSelectedProfile(profile);
    setModalVisible(true);
  };

  const followingIds = new Set(following.map((p) => p.userId));
  const rawList = activeTab === 'followers' ? followers : following;

  const filteredList = filterQuery.trim()
    ? rawList.filter((p) => {
        const q = filterQuery.toLowerCase();
        return (
          p.displayName?.toLowerCase().includes(q) ||
          p.username?.toLowerCase().includes(q)
        );
      })
    : rawList;

  const EmptyComponent = () => {
    const isFiltered = filterQuery.trim().length > 0;
    if (isFiltered) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
        </View>
      );
    }
    if (activeTab === 'followers') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>아직 팔로워가 없어요</Text>
          <Text style={styles.emptySubText}>다른 사용자가 회원님을 팔로우하면{'\n'}여기에 표시돼요</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyText}>팔로잉 중인 사람이 없어요</Text>
        <Text style={styles.emptySubText}>사용자 검색으로 새 친구를 찾아보세요</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('UserSearch')}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyButtonText}>사용자 검색하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* 세그먼트 탭 */}
      <View style={styles.segmentWrapper}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'followers' && styles.segmentTabActive]}
          onPress={() => handleTabChange('followers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'followers' && styles.segmentTextActive]}>
            팔로워 {followers.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'following' && styles.segmentTabActive]}
          onPress={() => handleTabChange('following')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'following' && styles.segmentTextActive]}>
            팔로잉 {following.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 내 검색 필드 */}
      {!loading && rawList.length > 0 && (
        <View style={styles.filterBar}>
          <TextInput
            style={styles.filterInput}
            value={filterQuery}
            onChangeText={setFilterQuery}
            placeholder="이름 또는 아이디로 검색"
            placeholderTextColor={Colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={[
            styles.listContent,
            filteredList.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={<EmptyComponent />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <UserRow
              profile={item}
              showUnfollow={activeTab === 'following'}
              onUnfollow={
                activeTab === 'following'
                  ? () => handleUnfollow(item.userId)
                  : undefined
              }
              onPress={() => openProfile(item)}
            />
          )}
        />
      )}

      <UserProfileModal
        visible={modalVisible}
        profile={selectedProfile}
        onClose={() => setModalVisible(false)}
        onFollowChange={(targetUid, isNowFollowing) => {
          if (!isNowFollowing) {
            setFollowing((prev) => prev.filter((p) => p.userId !== targetUid));
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 세그먼트 */
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentTabActive: {
    borderBottomColor: Colors.primary,
  },
  segmentText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
  },

  /* 탭 내 검색 */
  filterBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  filterInput: {
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },

  /* 리스트 */
  listContent: {
    backgroundColor: Colors.surface,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
  },
  userAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    color: Colors.primary,
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userUsername: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userBio: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unfollowButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  unfollowButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginLeft: Spacing.md + 46 + Spacing.md,
  },

  /* 빈 상태 */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.white,
  },
});

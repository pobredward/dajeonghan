import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getFollowers, getFollowing, unfollowUser } from '@/services/followService';
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
  isFollowing: boolean;
  onUnfollow?: () => void;
}> = ({ profile, isFollowing, onUnfollow }) => {
  const initials = profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.userRow}>
      {profile.photoURL ? (
        <Image source={{ uri: profile.photoURL }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarFallback}>
          <Text style={styles.userAvatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.userMeta}>
        <Text style={styles.userName}>{profile.displayName || '이름 미설정'}</Text>
        {profile.bio ? <Text style={styles.userBio} numberOfLines={1}>{profile.bio}</Text> : null}
      </View>
      {isFollowing && onUnfollow && (
        <TouchableOpacity style={styles.unfollowButton} onPress={onUnfollow} activeOpacity={0.7}>
          <Text style={styles.unfollowButtonText}>언팔로우</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const FollowListScreen: React.FC<Props> = ({ route }) => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab ?? 'followers');
  const [followers, setFollowers] = useState<PublicProfile[]>([]);
  const [following, setFollowing] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  const followingIds = new Set(following.map((p) => p.userId));
  const list = activeTab === 'followers' ? followers : following;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* 세그먼트 탭 */}
      <View style={styles.segmentWrapper}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'followers' && styles.segmentTabActive]}
          onPress={() => setActiveTab('followers')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'followers' && styles.segmentTextActive,
            ]}
          >
            팔로워 {followers.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'following' && styles.segmentTabActive]}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'following' && styles.segmentTextActive,
            ]}
          >
            팔로잉 {following.length}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'followers' ? '아직 팔로워가 없습니다.' : '팔로잉 중인 사람이 없습니다.'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <UserRow
              profile={item}
              isFollowing={activeTab === 'following' || followingIds.has(item.userId)}
              onUnfollow={
                activeTab === 'following'
                  ? () => handleUnfollow(item.userId)
                  : undefined
              }
            />
          )}
        />
      )}
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

  /* 리스트 */
  listContent: {
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
  },
  userAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    ...Typography.label,
    color: Colors.primary,
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  userBio: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unfollowButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
    marginLeft: Spacing.md + 44 + Spacing.md,
  },

  /* 빈 상태 */
  emptyContainer: {
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

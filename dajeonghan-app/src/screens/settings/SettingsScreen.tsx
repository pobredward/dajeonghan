import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/firestoreService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import type { MyInfoStackParamList } from '@/navigation/MyInfoNavigator';

type NavigationProp = StackNavigationProp<MyInfoStackParamList, 'MyInfoMain'>;

interface Props {
  navigation: NavigationProp;
}

interface MenuItem {
  title: string;
  onPress: () => void;
}

const MenuRow: React.FC<MenuItem> = ({ title, onPress }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuTitle}>{title}</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { userId } = useAuth();
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [bio, setBio] = useState<string | undefined>();
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        setDisplayName(profile.displayName);
        setBio(profile.bio);
        setPhotoURL(profile.photoURL);
        setFollowersCount(profile.followersCount ?? 0);
        setFollowingCount(profile.followingCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const initials = displayName ? displayName.charAt(0).toUpperCase() : '나';

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{displayName || '이름 미설정'}</Text>
            {bio ? <Text style={styles.profileBio}>{bio}</Text> : null}

            <View style={styles.followRow}>
              <TouchableOpacity
                style={styles.followStat}
                onPress={() => navigation.navigate('FollowList', { tab: 'followers' })}
                activeOpacity={0.7}
              >
                <Text style={styles.followCount}>{followersCount}</Text>
                <Text style={styles.followLabel}>팔로워</Text>
              </TouchableOpacity>

              <View style={styles.followDivider} />

              <TouchableOpacity
                style={styles.followStat}
                onPress={() => navigation.navigate('FollowList', { tab: 'following' })}
                activeOpacity={0.7}
              >
                <Text style={styles.followCount}>{followingCount}</Text>
                <Text style={styles.followLabel}>팔로잉</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>편집</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 메뉴 */}
        <View style={styles.menuSection}>
          <MenuRow
            title="앱 설정"
            onPress={() => navigation.navigate('AppSettings')}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            title="정보"
            onPress={() => navigation.navigate('AppInfo')}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            title="계정 관리"
            onPress={() => navigation.navigate('AccountManagement')}
          />
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  /* 프로필 */
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: '700',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileBio: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  followStat: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  followCount: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  followLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  followDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.veryLightGray,
  },
  editButton: {
    marginLeft: 'auto' as any,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },

  divider: {
    height: 8,
    backgroundColor: Colors.background,
  },

  /* 메뉴 */
  menuSection: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  menuTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  arrow: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginLeft: Spacing.md,
  },
});

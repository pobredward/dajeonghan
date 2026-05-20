import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getPublicProfile } from '@/services/profileService';
import { isFollowing, followUser, unfollowUser } from '@/services/followService';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import type { PublicProfile } from '@/types/user.types';
import type { SharedTemplate } from '@/types/template.types';

export type UserProfileScreenParams = {
  userId: string;
  /** 로딩 전 표시할 기본 정보 (선택) */
  displayName?: string;
  photoURL?: string;
};

const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  student_living_alone: '자취생',
  worker_single: '직장인 싱글',
  worker_roommate: '룸메이트',
  newlywed: '신혼부부',
  family_with_kids: '자녀 있는 가족',
  pet_owner: '반려동물',
  minimalist: '미니멀리스트',
  weekend_warrior: '주말러',
  custom: '커스텀',
};

const MiniTemplateCard: React.FC<{
  template: SharedTemplate;
  onPress: () => void;
}> = ({ template, onPress }) => (
  <TouchableOpacity style={miniCardStyles.card} onPress={onPress} activeOpacity={0.75}>
    <View style={miniCardStyles.header}>
      <Text style={miniCardStyles.category}>
        {TEMPLATE_CATEGORY_LABELS[template.category] ?? template.category}
      </Text>
    </View>
    <View style={miniCardStyles.body}>
      <Text style={miniCardStyles.name} numberOfLines={2}>{template.name}</Text>
      <View style={miniCardStyles.stats}>
        <Text style={miniCardStyles.stat}>❤️ {template.likeCount}</Text>
        <Text style={miniCardStyles.stat}>⬇️ {template.usageCount}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

interface Props<TStack extends Record<string, object | undefined>> {
  navigation: StackNavigationProp<TStack>;
  route: RouteProp<TStack & { UserProfile: UserProfileScreenParams }, 'UserProfile'>;
  /** 템플릿 상세로 이동하는 방법을 외부에서 주입 */
  onNavigateToTemplate?: (templateId: string) => void;
}

export function UserProfileScreen<TStack extends Record<string, object | undefined>>({
  navigation,
  route,
  onNavigateToTemplate,
}: Props<TStack>) {
  const { userId: myUid } = useAuth();
  const { userId: targetUid, displayName: initialName, photoURL: initialPhoto } = route.params;

  const [profile, setProfile] = useState<PublicProfile | null>(
    initialName || initialPhoto
      ? { userId: targetUid, displayName: initialName, photoURL: initialPhoto }
      : null
  );
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [following, setFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const isOwnProfile = myUid === targetUid;

  useLayoutEffect(() => {
    if (initialName) {
      navigation.setOptions({ title: initialName });
    }
  }, [navigation, initialName]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingProfile(true);
      try {
        const p = await getPublicProfile(targetUid);
        if (!cancelled) {
          setProfile(p);
          if (p?.displayName) {
            navigation.setOptions({ title: p.displayName });
          }
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    if (myUid) {
      setCheckingFollow(true);
      isFollowing(myUid, targetUid)
        .then((v) => { if (!cancelled) setFollowing(v); })
        .finally(() => { if (!cancelled) setCheckingFollow(false); });
    } else {
      setCheckingFollow(false);
    }

    setLoadingTemplates(true);
    TemplateMarketplaceService.getMyTemplates(targetUid)
      .then((list) => {
        if (!cancelled) setTemplates(list.filter((t) => t.isPublic).slice(0, 6));
      })
      .finally(() => { if (!cancelled) setLoadingTemplates(false); });

    return () => { cancelled = true; };
  }, [targetUid, myUid]);

  const handleFollowToggle = async () => {
    if (!myUid || !profile) return;
    setLoadingFollow(true);
    try {
      if (following) {
        Alert.alert(
          '언팔로우',
          `${profile.displayName || '이 사용자'}를 언팔로우 하시겠습니까?`,
          [
            { text: '취소', style: 'cancel', onPress: () => setLoadingFollow(false) },
            {
              text: '언팔로우',
              style: 'destructive',
              onPress: async () => {
                try {
                  await unfollowUser(myUid, profile.userId);
                  setFollowing(false);
                  setProfile((prev) =>
                    prev
                      ? { ...prev, followersCount: Math.max((prev.followersCount ?? 1) - 1, 0) }
                      : prev
                  );
                } finally {
                  setLoadingFollow(false);
                }
              },
            },
          ]
        );
      } else {
        await followUser(myUid, profile.userId);
        setFollowing(true);
        setProfile((prev) =>
          prev ? { ...prev, followersCount: (prev.followersCount ?? 0) + 1 } : prev
        );
        setLoadingFollow(false);
      }
    } catch {
      Alert.alert('오류', '잠시 후 다시 시도해주세요.');
      setLoadingFollow(false);
    }
  };

  const handleReport = () => {
    Alert.alert(
      '신고',
      '이 사용자를 신고하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고하기',
          style: 'destructive',
          onPress: () =>
            Alert.alert('접수 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.'),
        },
      ]
    );
  };

  const displayName = profile?.displayName || '이름 미설정';
  const initials = displayName.charAt(0).toUpperCase();
  const followersCount = profile?.followersCount ?? 0;
  const followingCount = profile?.followingCount ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── 섹션 1: 기본 신원 ── */}
        <View style={styles.identitySection}>
          {loadingProfile && !profile ? (
            <ActivityIndicator color={Colors.primary} style={styles.profileLoader} />
          ) : (
            <>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}

              <Text style={styles.displayName}>{displayName}</Text>

              {profile?.username ? (
                <Text style={styles.username}>@{profile.username}</Text>
              ) : null}

              {/* 팔로워 / 팔로잉 */}
              <View style={styles.socialRow}>
                <View style={styles.socialItem}>
                  <Text style={styles.socialCount}>{followersCount.toLocaleString()}</Text>
                  <Text style={styles.socialLabel}>팔로워</Text>
                </View>
                <View style={styles.socialDivider} />
                <View style={styles.socialItem}>
                  <Text style={styles.socialCount}>{followingCount.toLocaleString()}</Text>
                  <Text style={styles.socialLabel}>팔로잉</Text>
                </View>
              </View>

              {/* 자기소개 */}
              {profile?.bio ? (
                <View style={styles.bioBox}>
                  <Text style={styles.bio}>{profile.bio}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* ── 섹션 2: 공유 템플릿 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>공유한 템플릿</Text>
            {!loadingTemplates && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{templates.length}</Text>
              </View>
            )}
          </View>

          {loadingTemplates ? (
            <View style={styles.templateLoadingBox}>
              <ActivityIndicator color={Colors.primary} size="small" />
            </View>
          ) : templates.length === 0 ? (
            <View style={styles.emptyTemplates}>
              <Text style={styles.emptyTemplatesText}>아직 공유한 템플릿이 없어요</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateList}
              ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
              renderItem={({ item }) => (
                <MiniTemplateCard
                  template={item}
                  onPress={() => onNavigateToTemplate?.(item.id)}
                />
              )}
            />
          )}
        </View>

        {/* ── 섹션 3: 액션 ── */}
        {!isOwnProfile && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.followButton,
                following && styles.followButtonActive,
                (checkingFollow || loadingFollow) && styles.followButtonLoading,
              ]}
              onPress={handleFollowToggle}
              disabled={checkingFollow || loadingFollow}
              activeOpacity={0.8}
            >
              {checkingFollow || loadingFollow ? (
                <ActivityIndicator
                  color={following ? Colors.primary : Colors.white}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    following && styles.followButtonTextActive,
                  ]}
                >
                  {following ? '팔로잉 중' : '팔로우'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportButton} onPress={handleReport} activeOpacity={0.7}>
              <Text style={styles.reportButtonText}>이 사용자 신고</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileLoader: {
    marginVertical: Spacing.xl,
  },

  /* ── 섹션 1: 신원 ── */
  identitySection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.veryLightGray,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
  },
  displayName: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  /* 팔로워/팔로잉 */
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xl,
  },
  socialItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  socialCount: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  socialLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  socialDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.veryLightGray,
  },

  bioBox: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  bio: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* ── 섹션 2: 공유 템플릿 ── */
  section: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  templateLoadingBox: {
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTemplates: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  emptyTemplatesText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  templateList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },

  /* ── 섹션 3: 액션 ── */
  actionSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  followButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  followButtonActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  followButtonLoading: {
    opacity: 0.7,
  },
  followButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.white,
  },
  followButtonTextActive: {
    color: Colors.primary,
  },
  reportButton: {
    paddingVertical: Spacing.sm,
  },
  reportButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

const miniCardStyles = StyleSheet.create({
  card: {
    width: 148,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  header: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  body: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stat: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

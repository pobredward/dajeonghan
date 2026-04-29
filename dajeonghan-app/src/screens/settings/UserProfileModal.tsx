import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { isFollowing, followUser, unfollowUser } from '@/services/followService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import type { PublicProfile } from '@/types/user.types';

interface Props {
  visible: boolean;
  profile: PublicProfile | null;
  onClose: () => void;
  onFollowChange?: (targetUid: string, following: boolean) => void;
}

export const UserProfileModal: React.FC<Props> = ({
  visible,
  profile,
  onClose,
  onFollowChange,
}) => {
  const { userId } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  useEffect(() => {
    if (!visible || !profile || !userId) return;
    setCheckingFollow(true);
    isFollowing(userId, profile.userId)
      .then(setFollowing)
      .finally(() => setCheckingFollow(false));
  }, [visible, profile, userId]);

  const handleFollowToggle = async () => {
    if (!userId || !profile) return;
    if (userId === profile.userId) return;

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
                  await unfollowUser(userId, profile.userId);
                  setFollowing(false);
                  onFollowChange?.(profile.userId, false);
                } finally {
                  setLoadingFollow(false);
                }
              },
            },
          ]
        );
      } else {
        await followUser(userId, profile.userId);
        setFollowing(true);
        onFollowChange?.(profile.userId, true);
        setLoadingFollow(false);
      }
    } catch {
      Alert.alert('오류', '잠시 후 다시 시도해주세요.');
      setLoadingFollow(false);
    }
  };

  if (!profile) return null;

  const initials = profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?';
  const isOwnProfile = userId === profile.userId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* 드래그 인디케이터 */}
        <View style={styles.dragIndicatorWrapper}>
          <View style={styles.dragIndicator} />
        </View>

        {/* 닫기 버튼 */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        {/* 프로필 내용 */}
        <View style={styles.content}>
          {/* 아바타 */}
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          )}

          {/* 이름 + 아이디 */}
          <Text style={styles.displayName}>
            {profile.displayName || '이름 미설정'}
          </Text>
          {profile.username ? (
            <Text style={styles.username}>@{profile.username}</Text>
          ) : null}

          {/* 자기소개 */}
          {profile.bio ? (
            <View style={styles.bioBox}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* 팔로우 버튼 */}
          {!isOwnProfile && (
            <View style={styles.actionArea}>
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
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  /* 드래그 인디케이터 */
  dragIndicatorWrapper: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.veryLightGray,
  },

  /* 닫기 버튼 */
  closeButton: {
    position: 'absolute',
    top: Spacing.sm + 2,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  /* 프로필 */
  content: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.veryLightGray,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  avatarInitial: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.primary,
  },
  displayName: {
    fontSize: Typography.h3.fontSize,
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
  bioBox: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  bio: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* 팔로우 버튼 */
  actionArea: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  followButton: {
    width: '80%',
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
});

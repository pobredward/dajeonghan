import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ReviewList } from '@/components/ReviewList';
import { TemplateLayoutPreview } from '@/components/TemplateLayoutPreview';
import { UserProfileModal } from '@/screens/settings/UserProfileModal';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { TemplateCommentService } from '@/services/templateCommentService';
import { FullTemplateApplyService, ApplyMode } from '@/services/fullTemplateApplyService';
import { TemplateSharingService } from '@/services/templateSharingService';
import { getPublicProfile } from '@/services/profileService';
import { SharedTemplate, TemplateComment } from '@/types/template.types';
import { PublicProfile } from '@/types/user.types';
import { useAuth } from '@/contexts/AuthContext';
import { TemplateStackParamList } from '@/navigation/TemplateNavigator';
import { getCategoryIcon, getCategoryName } from '@/constants/TemplateCategories';

type RoutePropType = RouteProp<TemplateStackParamList, 'TemplateDetail'>;

export const TemplateDetailScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { userId, user } = useAuth();
  const { templateId } = route.params;

  const [template, setTemplate] = useState<SharedTemplate | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<TemplateComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // 작성자 프로필 모달
  const [creatorProfile, setCreatorProfile] = useState<PublicProfile | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [loadingCreator, setLoadingCreator] = useState(false);

  // 좋아요 spring 애니메이션
  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadAll();
  }, [templateId]);

  const loadAll = async () => {
    setLoadingTemplate(true);
    try {
      const [tmpl, liked, cmts] = await Promise.all([
        TemplateMarketplaceService.getTemplateById(templateId),
        userId ? TemplateMarketplaceService.checkIfLiked(templateId, userId) : Promise.resolve(false),
        TemplateCommentService.getComments(templateId),
      ]);
      setTemplate(tmpl);
      setIsLiked(liked);
      setComments(cmts);
    } catch (e) {
      console.error('load detail error', e);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const triggerLikeAnimation = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.4, useNativeDriver: true, speed: 30 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const handleLike = async () => {
    if (!userId) {
      Alert.alert('로그인 필요', '좋아요 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }
    triggerLikeAnimation();
    try {
      if (isLiked) {
        await TemplateMarketplaceService.unlikeTemplate(templateId, userId);
        setIsLiked(false);
        setTemplate(prev => prev ? { ...prev, likeCount: Math.max(prev.likeCount - 1, 0) } : null);
      } else {
        await TemplateMarketplaceService.likeTemplate(templateId, userId);
        setIsLiked(true);
        setTemplate(prev => prev ? { ...prev, likeCount: prev.likeCount + 1 } : null);
      }
    } catch (e) {
      console.error('like error', e);
    }
  };

  const handleCreatorPress = async () => {
    if (!template) return;
    setLoadingCreator(true);
    try {
      const profile = await getPublicProfile(template.creatorId);
      // 프로필이 없더라도 최소 정보로 구성해서 모달 열기
      setCreatorProfile(
        profile ?? {
          userId: template.creatorId,
          displayName: template.creatorName,
          photoURL: template.creatorAvatar,
        }
      );
      setProfileModalVisible(true);
    } catch {
      Alert.alert('오류', '프로필을 불러오지 못했습니다.');
    } finally {
      setLoadingCreator(false);
    }
  };

  const handleShare = async () => {
    if (!template) return;
    try {
      const { url, text } = await TemplateSharingService.generateShareLink(templateId);
      await Share.share({ message: `${text}\n\n${url}`, url });
    } catch (e) {
      console.error('share error', e);
    }
  };

  const handleSubmitComment = async () => {
    if (!userId || !user) {
      Alert.alert('로그인 필요', '댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await TemplateCommentService.addComment(
        templateId,
        userId,
        user.displayName || '익명',
        commentText.trim(),
        user.photoURL ?? undefined
      );
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      setTemplate(prev => prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : null);
    } catch {
      Alert.alert('오류', '댓글 작성 중 문제가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('댓글 삭제', '이 댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await TemplateCommentService.deleteComment(commentId, templateId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            setTemplate(prev =>
              prev ? { ...prev, commentCount: Math.max((prev.commentCount ?? 1) - 1, 0) } : null
            );
          } catch {
            Alert.alert('오류', '댓글 삭제 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  // Modal에서 바로 적용 (이중 확인 제거)
  const handleApply = async (mode: ApplyMode) => {
    if (!userId) return;
    setApplyModalVisible(false);
    setApplying(true);
    try {
      await FullTemplateApplyService.applyFullTemplate(templateId, userId, mode);
      Alert.alert('적용 완료! 🎉', '템플릿이 내 집에 적용되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('오류', '적용 중 문제가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  if (loadingTemplate) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (!template) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>😥</Text>
        <Text style={styles.emptyTitle}>템플릿을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const totalTasks = template.houseLayout
    ? template.houseLayout.rooms.reduce(
        (sum, r) => sum + r.furnitures.reduce((s, f) => s + f.tasks.length, 0),
        0
      )
    : template.tasks.length;

  const canApply = !!template.houseLayout || template.tasks.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* 헤더 카드 */}
        <Card style={styles.card}>
          {/* 카테고리 배너 */}
          <View style={styles.categoryBanner}>
            <Text style={styles.categoryBannerIcon}>{getCategoryIcon(template.category)}</Text>
            <Text style={styles.categoryBannerName}>{getCategoryName(template.category)}</Text>
            {template.houseLayout && (
              <View style={styles.layoutBadge}>
                <Text style={styles.layoutBadgeText}>배치도 포함</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.description}>{template.description}</Text>

          {/* 작성자 */}
          <TouchableOpacity
            style={styles.creatorRow}
            onPress={handleCreatorPress}
            activeOpacity={0.7}
            disabled={loadingCreator}
          >
            {template.creatorAvatar ? (
              <Image source={{ uri: template.creatorAvatar }} style={styles.creatorAvatarImg} />
            ) : (
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>
                  {template.creatorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.creatorTextWrap}>
              <Text style={styles.creatorByLabel}>작성자</Text>
              <Text style={styles.creator}>{template.creatorName}</Text>
            </View>
            {loadingCreator ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />
            ) : (
              <Text style={styles.creatorChevron}>›</Text>
            )}
          </TouchableOpacity>

          {/* 통계 (아이콘 위 숫자, 아래 라벨) */}
          <View style={styles.statsRow}>
            <StatColumn value={template.likeCount} label="좋아요" icon="❤️" />
            <View style={styles.statDivider} />
            <StatColumn value={template.usageCount} label="다운로드" icon="⬇️" />
            <View style={styles.statDivider} />
            <StatColumn value={template.commentCount ?? 0} label="댓글" icon="💬" />
            <View style={styles.statDivider} />
            <StatColumn value={totalTasks} label="업무 수" icon="📝" />
            {template.averageRating > 0 && (
              <>
                <View style={styles.statDivider} />
                <StatColumn value={template.averageRating.toFixed(1)} label="평점" icon="⭐" />
              </>
            )}
          </View>

          {/* 태그 */}
          {template.tags.length > 0 && (
            <View style={styles.tags}>
              {template.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 인터랙션 버튼 */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
              onPress={handleLike}
            >
              <Animated.Text style={[styles.actionBtnIcon, { transform: [{ scale: likeScale }] }]}>
                {isLiked ? '❤️' : '🤍'}
              </Animated.Text>
              <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextLiked]}>
                {isLiked ? '좋아요 취소' : '좋아요'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnIcon}>📤</Text>
              <Text style={styles.actionBtnText}>공유</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 배치도 2D 시각화 */}
        {template.houseLayout && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>배치도</Text>
            <TemplateLayoutPreview houseLayout={template.houseLayout} containerHeight={280} />
          </Card>
        )}

        {/* 업무 목록 */}
        {template.houseLayout ? (
          template.houseLayout.rooms.some(r => r.furnitures.some(f => f.tasks.length > 0)) && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>포함된 업무</Text>
              {template.houseLayout.rooms.map((room, rIdx) =>
                room.furnitures.map((f, fIdx) =>
                  f.tasks.length > 0 ? (
                    <View key={`${rIdx}-${fIdx}`} style={styles.furnitureTaskGroup}>
                      <Text style={styles.furnitureGroupTitle}>
                        {f.emoji} {f.name}
                      </Text>
                      {f.tasks.map((task, tIdx) => (
                        <View key={tIdx} style={styles.taskItem}>
                          <View style={styles.taskDot} />
                          <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <Text style={styles.taskMeta}>
                              {task.estimatedMinutes}분 ·{' '}
                              {task.recurrence.unit === 'day'
                                ? `${task.recurrence.interval}일마다`
                                : task.recurrence.unit === 'week'
                                ? `${task.recurrence.interval}주마다`
                                : `${task.recurrence.interval}개월마다`}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null
                )
              )}
            </Card>
          )
        ) : template.tasks.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>포함된 업무</Text>
            {template.tasks.map((task, tIdx) => (
              <View key={tIdx} style={styles.taskItem}>
                <View style={styles.taskDot} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.estimatedMinutes}분 ·{' '}
                    {task.recurrence.unit === 'day'
                      ? `${task.recurrence.interval}일마다`
                      : task.recurrence.unit === 'week'
                      ? `${task.recurrence.interval}주마다`
                      : `${task.recurrence.interval}개월마다`}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {/* 리뷰 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>
            리뷰{template.averageRating > 0 ? ` ⭐ ${template.averageRating.toFixed(1)}` : ''}
          </Text>
          <ReviewList templateId={templateId} />
        </Card>

        {/* 댓글 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>댓글 {template.commentCount ?? 0}</Text>

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="댓글을 입력하세요..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[
                styles.commentSendBtn,
                (!commentText.trim() || submittingComment) && styles.commentSendBtnDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.commentSendBtnText}>전송</Text>
              )}
            </TouchableOpacity>
          </View>

          {comments.length === 0 ? (
            <View style={styles.noCommentWrap}>
              <Text style={styles.noCommentIcon}>💬</Text>
              <Text style={styles.noCommentText}>첫 댓글을 남겨보세요!</Text>
            </View>
          ) : (
            comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{c.userName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.userName}</Text>
                    <Text style={styles.commentDate}>
                      {format(c.createdAt, 'MM.dd HH:mm', { locale: ko })}
                    </Text>
                    {c.userId === userId && (
                      <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                        <Text style={styles.commentDelete}>삭제</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 적용 바 */}
      <View style={styles.applyBar}>
        <Button
          title={applying ? '적용 중...' : '내 집에 적용하기'}
          onPress={() => setApplyModalVisible(true)}
          disabled={applying || !canApply}
          fullWidth
          loading={applying}
        />
        {!canApply && (
          <Text style={styles.applyNote}>이 템플릿은 적용할 수 없습니다.</Text>
        )}
      </View>

      {/* 적용 방식 모달 (이중 확인 제거 — 경고 인라인) */}
      <Modal
        visible={applyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setApplyModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>적용 방식 선택</Text>
            <Text style={styles.modalDesc}>현재 내 집에 어떻게 적용할까요?</Text>

            {/* 병합 */}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleApply('merge')}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Text style={styles.modalOptionIconText}>➕</Text>
              </View>
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>병합</Text>
                <Text style={styles.modalOptionDesc}>
                  기존 집 유지 + 이 템플릿의 방과 업무 추가
                </Text>
              </View>
            </TouchableOpacity>

            {/* 교체 */}
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={() => handleApply('replace')}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#FFEBEE' }]}>
                <Text style={styles.modalOptionIconText}>🔄</Text>
              </View>
              <View style={styles.modalOptionContent}>
                <Text style={[styles.modalOptionTitle, { color: Colors.error }]}>교체</Text>
                <Text style={styles.modalOptionDesc}>
                  기존 배치도와 모든 업무 삭제 후 새로 적용
                </Text>
                <Text style={styles.modalOptionWarn}>⚠️ 이 작업은 되돌릴 수 없습니다</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setApplyModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 작성자 프로필 모달 */}
      <UserProfileModal
        visible={profileModalVisible}
        profile={creatorProfile}
        onClose={() => setProfileModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const StatColumn: React.FC<{ value: string | number; label: string; icon: string }> = ({
  value, label, icon,
}) => (
  <View style={styles.statCol}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h4, color: Colors.textSecondary },

  card: { marginBottom: Spacing.md },

  // 카테고리 배너
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryBannerIcon: { fontSize: 20 },
  categoryBannerName: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  layoutBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  layoutBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  title: { ...Typography.h2, marginBottom: Spacing.xs, color: Colors.textPrimary },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },

  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  creatorAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  creatorTextWrap: { flex: 1 },
  creatorByLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  creator: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  creatorChevron: {
    fontSize: 20,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // 통계 (아이콘 위 숫자 아래 라벨)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
    marginBottom: Spacing.md,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { ...Typography.h4, color: Colors.textPrimary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.veryLightGray },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  tagText: { ...Typography.caption, color: Colors.primary },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    backgroundColor: Colors.background,
  },
  actionBtnLiked: {
    backgroundColor: '#FFF0F0',
    borderColor: Colors.error + '55',
  },
  actionBtnIcon: { fontSize: 16 },
  actionBtnText: { ...Typography.label, color: Colors.textSecondary },
  actionBtnTextLiked: { color: Colors.error },

  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },

  furnitureTaskGroup: { marginBottom: Spacing.md },
  furnitureGroupTitle: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  taskInfo: { flex: 1 },
  taskTitle: { ...Typography.body, color: Colors.textPrimary },
  taskMeta: { ...Typography.caption, color: Colors.textSecondary },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  commentInput: {
    flex: 1,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    maxHeight: 100,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  commentSendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 56,
    alignItems: 'center',
    ...Shadows.small,
  },
  commentSendBtnDisabled: { backgroundColor: Colors.lightGray },
  commentSendBtnText: { ...Typography.label, color: Colors.white },

  noCommentWrap: { alignItems: 'center', paddingVertical: Spacing.lg },
  noCommentIcon: { fontSize: 32, marginBottom: Spacing.xs },
  noCommentText: { ...Typography.body, color: Colors.textSecondary },

  commentItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  commentBody: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 3,
  },
  commentAuthor: { ...Typography.label, color: Colors.textPrimary },
  commentDate: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  commentDelete: { ...Typography.caption, color: Colors.error },
  commentContent: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },

  applyBar: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    ...Shadows.medium,
  },
  applyNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lightGray,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { ...Typography.h3, marginBottom: Spacing.xs, textAlign: 'center' },
  modalDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  modalOptionDanger: {
    borderColor: Colors.error + '33',
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalOptionIconText: { fontSize: 22 },
  modalOptionContent: { flex: 1 },
  modalOptionTitle: { ...Typography.label, marginBottom: 2, color: Colors.textPrimary },
  modalOptionDesc: { ...Typography.caption, color: Colors.textSecondary },
  modalOptionWarn: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 3,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  modalCancelText: { ...Typography.label, color: Colors.textSecondary },
});

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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Colors, Typography, Spacing } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ReviewList } from '@/components/ReviewList';
import { TemplateLayoutPreview } from '@/components/TemplateLayoutPreview';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { TemplateCommentService } from '@/services/templateCommentService';
import { FullTemplateApplyService, ApplyMode } from '@/services/fullTemplateApplyService';
import { TemplateSharingService } from '@/services/templateSharingService';
import { SharedTemplate, TemplateComment } from '@/types/template.types';
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

  const handleLike = async () => {
    if (!userId) {
      Alert.alert('로그인 필요', '좋아요 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }
    try {
      if (isLiked) {
        await TemplateMarketplaceService.unlikeTemplate(templateId, userId);
        setIsLiked(false);
        setTemplate(prev => prev ? { ...prev, likeCount: prev.likeCount - 1 } : null);
      } else {
        await TemplateMarketplaceService.likeTemplate(templateId, userId);
        setIsLiked(true);
        setTemplate(prev => prev ? { ...prev, likeCount: prev.likeCount + 1 } : null);
      }
    } catch (e) {
      console.error('like error', e);
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
    } catch (e) {
      Alert.alert('오류', '댓글 작성 중 문제가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('댓글 삭제', '이 댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await TemplateCommentService.deleteComment(commentId, templateId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            setTemplate(prev => prev ? { ...prev, commentCount: Math.max((prev.commentCount ?? 1) - 1, 0) } : null);
          } catch (e) {
            Alert.alert('오류', '댓글 삭제 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const handleApply = (mode: ApplyMode) => {
    setApplyModalVisible(false);
    Alert.alert(
      mode === 'replace' ? '기존 집 교체' : '내 집에 병합',
      mode === 'replace'
        ? '기존 배치도와 모든 업무가 삭제됩니다. 계속할까요?'
        : '현재 집에 이 템플릿의 방과 업무가 추가됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '적용',
          onPress: async () => {
            if (!userId) return;
            setApplying(true);
            try {
              await FullTemplateApplyService.applyFullTemplate(templateId, userId, mode);
              Alert.alert('적용 완료! 🎉', '템플릿이 내 집에 적용되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('오류', '적용 중 문제가 발생했습니다.');
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  if (loadingTemplate) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!template) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>템플릿을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const totalTasks = template.houseLayout
    ? template.houseLayout.rooms.reduce(
        (sum, r) => sum + r.furnitures.reduce((s, f) => s + f.tasks.length, 0),
        0
      )
    : template.tasks.length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* 헤더 카드 */}
        <Card style={styles.card}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(template.category)}</Text>
            <Text style={styles.categoryName}>{getCategoryName(template.category)}</Text>
            {template.houseLayout && (
              <View style={styles.layoutBadge}>
                <Text style={styles.layoutBadgeText}>배치도 포함</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.description}>{template.description}</Text>

          <Text style={styles.creator}>by {template.creatorName}</Text>

          {/* 통계 바 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{template.likeCount}</Text>
              <Text style={styles.statLabel}>좋아요</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{template.usageCount}</Text>
              <Text style={styles.statLabel}>다운로드</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{template.commentCount ?? 0}</Text>
              <Text style={styles.statLabel}>댓글</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalTasks}</Text>
              <Text style={styles.statLabel}>업무</Text>
            </View>
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

          {/* 인터렉션 버튼 */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isLiked && styles.actionBtnActive]}
              onPress={handleLike}
            >
              <Text style={styles.actionBtnIcon}>{isLiked ? '❤️' : '🤍'}</Text>
              <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextActive]}>
                좋아요
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
            <TemplateLayoutPreview houseLayout={template.houseLayout} />
          </Card>
        )}

        {/* 업무 목록 */}
        {template.houseLayout ? (
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
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskMeta}>
                          {task.estimatedMinutes}분 · {
                            task.recurrence.unit === 'day' ? `${task.recurrence.interval}일마다` :
                            task.recurrence.unit === 'week' ? `${task.recurrence.interval}주마다` :
                            `${task.recurrence.interval}개월마다`
                          }
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null
              )
            )}
          </Card>
        ) : template.tasks.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>포함된 업무</Text>
            {template.tasks.map((task, tIdx) => (
              <View key={tIdx} style={styles.taskItem}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.estimatedMinutes}분 · {
                    task.recurrence.unit === 'day' ? `${task.recurrence.interval}일마다` :
                    task.recurrence.unit === 'week' ? `${task.recurrence.interval}주마다` :
                    `${task.recurrence.interval}개월마다`
                  }
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {/* 별점 리뷰 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>
            리뷰 {template.averageRating > 0 ? `⭐ ${template.averageRating.toFixed(1)}` : ''}
          </Text>
          <ReviewList templateId={templateId} />
        </Card>

        {/* 댓글 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>댓글 {template.commentCount ?? 0}</Text>

          {/* 댓글 입력 */}
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
              style={[styles.commentSendBtn, !commentText.trim() && styles.commentSendBtnDisabled]}
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

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <Text style={styles.noComment}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</Text>
          ) : (
            comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
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
            ))
          )}
        </Card>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 고정 적용 버튼 */}
      <View style={styles.applyBar}>
        <Button
          title={applying ? '적용 중...' : '내 집에 적용하기'}
          onPress={() => setApplyModalVisible(true)}
          disabled={applying || !template.houseLayout}
          fullWidth
          loading={applying}
        />
        {!template.houseLayout && (
          <Text style={styles.applyNote}>이 템플릿은 배치도가 없어 적용할 수 없습니다.</Text>
        )}
      </View>

      {/* 적용 모달 */}
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
            <Text style={styles.modalTitle}>적용 방식 선택</Text>
            <Text style={styles.modalDesc}>
              현재 내 집에 어떻게 적용할까요?
            </Text>

            <TouchableOpacity style={styles.modalOption} onPress={() => handleApply('merge')}>
              <Text style={styles.modalOptionIcon}>➕</Text>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>병합</Text>
                <Text style={styles.modalOptionDesc}>기존 집 유지 + 템플릿 방과 업무 추가</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={() => handleApply('replace')}
            >
              <Text style={styles.modalOptionIcon}>🔄</Text>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: Colors.error }]}>교체</Text>
                <Text style={styles.modalOptionDesc}>기존 집과 업무를 모두 지우고 새로 적용</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setApplyModalVisible(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },

  card: { marginBottom: Spacing.md },

  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  categoryIcon: { fontSize: 24, marginRight: Spacing.xs },
  categoryName: { ...Typography.caption, color: Colors.textSecondary, marginRight: Spacing.xs },
  layoutBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  layoutBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  title: { ...Typography.h2, marginBottom: Spacing.xs },
  description: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.sm },
  creator: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    marginBottom: Spacing.md,
  },
  statItem: { alignItems: 'center' },
  statNum: { ...Typography.h3, color: Colors.textPrimary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.lightGray },

  tags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: { ...Typography.caption, color: Colors.primary },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  actionBtnActive: { backgroundColor: '#FFF0F0', borderColor: Colors.error },
  actionBtnIcon: { fontSize: 16, marginRight: 6 },
  actionBtnText: { ...Typography.label, color: Colors.textSecondary },
  actionBtnTextActive: { color: Colors.error },

  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },

  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  roomName: { ...Typography.label, width: 60, color: Colors.textSecondary },
  furnitureRow: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  furnitureEmoji: { fontSize: 20, marginRight: 4 },

  furnitureTaskGroup: { marginBottom: Spacing.md },
  furnitureGroupTitle: { ...Typography.label, marginBottom: Spacing.xs },
  taskItem: {
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryLight,
    marginBottom: Spacing.xs,
  },
  taskTitle: { ...Typography.body },
  taskMeta: { ...Typography.caption, color: Colors.textSecondary },

  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md },
  commentInput: {
    flex: 1,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.sm,
    maxHeight: 100,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  commentSendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  commentSendBtnDisabled: { backgroundColor: Colors.lightGray },
  commentSendBtnText: { ...Typography.label, color: Colors.white },

  noComment: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.lg },

  commentItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentAuthor: { ...Typography.label, marginRight: Spacing.sm },
  commentDate: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  commentDelete: { ...Typography.caption, color: Colors.error },
  commentContent: { ...Typography.body },

  applyBar: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  applyNote: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },

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
  modalTitle: { ...Typography.h3, marginBottom: Spacing.xs, textAlign: 'center' },
  modalDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  modalOptionDanger: { borderWidth: 1, borderColor: '#FFE0E0' },
  modalOptionIcon: { fontSize: 28, marginRight: Spacing.md },
  modalOptionText: { flex: 1 },
  modalOptionTitle: { ...Typography.label, marginBottom: 2 },
  modalOptionDesc: { ...Typography.caption, color: Colors.textSecondary },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  modalCancelText: { ...Typography.label, color: Colors.textSecondary },
});

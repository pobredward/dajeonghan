import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TemplateLayoutPreview } from '@/components/TemplateLayoutPreview';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { TemplateSharingService } from '@/services/templateSharingService';
import { getHouseLayout } from '@/services/houseService';
import { getPublicProfile } from '@/services/profileService';
import { HouseLayout, Furniture } from '@/types/house.types';
import { TemplateCategory } from '@/types/template.types';
import { useAuth } from '@/contexts/AuthContext';
import { TEMPLATE_CATEGORIES } from '@/constants/TemplateCategories';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['배치도 확인', '업무 선택', '정보 입력'];

export const CreateFullTemplateScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userId, user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [layout, setLayout] = useState<HouseLayout | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);

  const [selectedFurnitureIds, setSelectedFurnitureIds] = useState<Set<string>>(new Set());

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const l = await getHouseLayout(userId);
        setLayout(l);
        if (l) {
          const all = new Set<string>();
          l.rooms.forEach(r => r.furnitures.forEach(f => all.add(f.id)));
          setSelectedFurnitureIds(all);
        }
      } catch (e) {
        console.error('load layout error', e);
      } finally {
        setLoadingLayout(false);
      }
    })();
  }, [userId]);

  const allFurnitures: { roomName: string; furniture: Furniture }[] = layout
    ? layout.rooms.flatMap(r => r.furnitures.map(f => ({ roomName: r.name, furniture: f })))
    : [];

  const toggleFurniture = (id: string) => {
    setSelectedFurnitureIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!userId || !user) {
      Alert.alert('로그인 필요', '템플릿을 만들려면 로그인이 필요합니다.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('오류', '템플릿 이름을 입력해주세요.');
      return;
    }
    if (selectedFurnitureIds.size === 0) {
      Alert.alert('오류', '최소 1개 이상의 가구를 선택해주세요.');
      return;
    }

    setCreating(true);
    try {
      // Auth.displayName 대신 Firestore PublicProfile 우선 사용
      const firestoreProfile = await getPublicProfile(userId).catch(() => null);
      const resolvedName =
        firestoreProfile?.displayName ||
        user.displayName ||
        firestoreProfile?.username ||
        '이름 미설정';
      const resolvedAvatar =
        firestoreProfile?.photoURL || user.photoURL || undefined;

      const templateId = await TemplateMarketplaceService.createFullTemplate(userId, {
        creatorName: resolvedName,
        creatorAvatar: resolvedAvatar,
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        category,
        isPublic,
        selectedFurnitureIds: Array.from(selectedFurnitureIds),
      });

      const { url, text } = await TemplateSharingService.generateShareLink(templateId);

      Alert.alert(
        '템플릿 공유 완료! 🎉',
        '마켓플레이스에 등록되었습니다.',
        [
          {
            text: '공유하기',
            onPress: async () => {
              await Share.share({ message: `${text}\n\n${url}`, url });
              navigation.goBack();
            },
          },
          { text: '닫기', style: 'cancel', onPress: () => navigation.goBack() },
        ]
      );
    } catch (e) {
      console.error('create template error', e);
      Alert.alert('오류', '템플릿 생성 중 문제가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  if (loadingLayout) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>배치도 불러오는 중...</Text>
      </View>
    );
  }

  if (!layout) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🏠</Text>
        <Text style={styles.emptyTitle}>배치도가 없습니다</Text>
        <Text style={styles.emptyDesc}>
          먼저 내 집 탭에서 배치도를 만들어주세요.
        </Text>
        <View style={styles.emptyCTA}>
          <Button
            title="뒤로 가기"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="medium"
          />
        </View>
      </View>
    );
  }

  // SharedHouseLayout으로 변환 (TemplateLayoutPreview용)
  const sharedLayout = {
    layoutType: layout.layoutType,
    canvasSize: layout.canvasSize,
    character: layout.character,
    rooms: layout.rooms.map(r => ({
      type: r.type,
      name: r.name,
      position: r.position,
      size: r.size,
      color: r.color,
      furnitures: r.furnitures
        .filter(f => selectedFurnitureIds.has(f.id))
        .map(f => ({
          type: f.type,
          name: f.name,
          emoji: f.emoji,
          position: f.position,
          size: f.size,
          rotation: f.rotation,
          tasks: [],
        })),
    })),
  };

  const selectedTaskCount = layout.rooms.reduce(
    (sum, r) =>
      sum + r.furnitures
        .filter(f => selectedFurnitureIds.has(f.id))
        .reduce((s, f) => s + f.linkedTaskIds.length, 0),
    0
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      {/* 단계 표시 */}
      <View style={styles.stepBar}>
        {([1, 2, 3] as Step[]).map((s, i) => {
          const done = step > s;
          const active = step === s;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  active && styles.stepCircleActive,
                  done && styles.stepCircleDone,
                ]}>
                  {done
                    ? <Text style={styles.stepCheck}>✓</Text>
                    : <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>{s}</Text>
                  }
                </View>
                <Text style={[
                  styles.stepLabel,
                  (active || done) && styles.stepLabelActive,
                ]}>
                  {STEP_LABELS[i]}
                </Text>
              </View>
              {s < 3 && (
                <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* ── Step 1: 배치도 2D 미리보기 ── */}
        {step === 1 && (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>내 배치도 미리보기</Text>
              <Text style={styles.sectionDesc}>
                현재 내 집의 구조입니다. 다음 단계에서 포함할 가구를 선택할 수 있습니다.
              </Text>
              <TemplateLayoutPreview
                houseLayout={sharedLayout as any}
                containerHeight={260}
              />
            </Card>
            <View style={styles.navRow}>
              <Button
                title="다음 단계 →"
                onPress={() => setStep(2)}
                fullWidth
              />
            </View>
          </>
        )}

        {/* ── Step 2: 포함할 가구 선택 ── */}
        {step === 2 && (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>포함할 가구 선택</Text>
              <Text style={styles.sectionDesc}>
                템플릿에 포함할 가구와 업무를 선택하세요.
              </Text>

              <View style={styles.selectAllRow}>
                <TouchableOpacity
                  style={styles.selectAllBtn}
                  onPress={() => {
                    if (selectedFurnitureIds.size === allFurnitures.length) {
                      setSelectedFurnitureIds(new Set());
                    } else {
                      setSelectedFurnitureIds(new Set(allFurnitures.map(f => f.furniture.id)));
                    }
                  }}
                >
                  <Text style={styles.selectAllText}>
                    {selectedFurnitureIds.size === allFurnitures.length ? '전체 해제' : '전체 선택'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.selectedCount}>
                  {selectedFurnitureIds.size}/{allFurnitures.length}개 선택
                </Text>
              </View>

              {allFurnitures.map(({ roomName, furniture }) => {
                const checked = selectedFurnitureIds.has(furniture.id);
                return (
                  <TouchableOpacity
                    key={furniture.id}
                    style={[styles.furnitureCheckRow, checked && styles.furnitureCheckRowActive]}
                    onPress={() => toggleFurniture(furniture.id)}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.furnitureCheckEmoji}>{furniture.emoji}</Text>
                    <View style={styles.furnitureCheckInfo}>
                      <Text style={styles.furnitureCheckName}>{furniture.name}</Text>
                      <Text style={styles.furnitureCheckRoom}>
                        {roomName} · 업무 {furniture.linkedTaskIds.length}개
                      </Text>
                    </View>
                    {furniture.linkedTaskIds.length > 0 && (
                      <View style={styles.taskCountBadge}>
                        <Text style={styles.taskCountBadgeText}>{furniture.linkedTaskIds.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>

            <View style={styles.navRow}>
              <View style={{ flex: 1 }}>
                <Button title="← 이전" onPress={() => setStep(1)} variant="outline" fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="다음 단계 →"
                  onPress={() => setStep(3)}
                  disabled={selectedFurnitureIds.size === 0}
                  fullWidth
                />
              </View>
            </View>
          </>
        )}

        {/* ── Step 3: 정보 입력 ── */}
        {step === 3 && (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>기본 정보</Text>

              <Text style={styles.label}>템플릿 이름 *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="예: 직장인 미니멀 루틴"
                placeholderTextColor={Colors.textSecondary}
                maxLength={40}
              />

              <Text style={styles.label}>설명</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="이 템플릿에 대해 설명해주세요"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={200}
              />

              <Text style={styles.label}>카테고리</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={TEMPLATE_CATEGORIES as any[]}
                keyExtractor={item => item.id}
                contentContainerStyle={{ gap: Spacing.xs, paddingVertical: Spacing.sm }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.categoryChip, category === item.id && styles.categoryChipActive]}
                    onPress={() => setCategory(item.id)}
                  >
                    <Text style={styles.categoryChipIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      category === item.id && styles.categoryChipTextActive,
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <Text style={styles.label}>태그 (쉼표로 구분)</Text>
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="예: 미니멀, 주말청소, 1인가구"
                placeholderTextColor={Colors.textSecondary}
              />

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>공개 템플릿</Text>
                  <Text style={styles.switchDesc}>다른 사용자가 이 템플릿을 찾을 수 있습니다</Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </Card>

            {/* 요약 */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>업로드 요약</Text>
              <View style={styles.summaryGrid}>
                <SummaryItem icon="🏠" value={`방 ${layout.rooms.length}개`} />
                <SummaryItem icon="🪑" value={`가구 ${selectedFurnitureIds.size}개`} />
                <SummaryItem icon="📝" value={`업무 ${selectedTaskCount}개`} />
                <SummaryItem icon={isPublic ? '🌍' : '🔒'} value={isPublic ? '공개' : '비공개'} />
              </View>
            </Card>

            <View style={styles.navRow}>
              <View style={{ flex: 1 }}>
                <Button title="← 이전" onPress={() => setStep(2)} variant="outline" fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="공유하기 🚀"
                  onPress={handleCreate}
                  disabled={creating || !name.trim()}
                  loading={creating}
                  fullWidth
                />
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const SummaryItem: React.FC<{ icon: string; value: string }> = ({ icon, value }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryIcon}>{icon}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.h3, textAlign: 'center' },
  emptyDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  emptyCTA: { marginTop: Spacing.lg },

  // 단계 표시
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.veryLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepCircleDone: { backgroundColor: Colors.secondary },
  stepNum: { ...Typography.caption, fontWeight: '700', color: Colors.gray },
  stepNumActive: { color: Colors.white },
  stepCheck: { fontSize: 13, fontWeight: '700', color: Colors.white },
  stepLabel: { ...Typography.caption, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.primary, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.veryLightGray, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.secondary },

  card: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  sectionDesc: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },

  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectAllBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
  },
  selectAllText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  selectedCount: { ...Typography.caption, color: Colors.textSecondary },

  furnitureCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  furnitureCheckRowActive: {
    backgroundColor: Colors.primaryLight + '55',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  furnitureCheckEmoji: { fontSize: 22, flexShrink: 0 },
  furnitureCheckInfo: { flex: 1 },
  furnitureCheckName: { ...Typography.label },
  furnitureCheckRoom: { ...Typography.caption, color: Colors.textSecondary },
  taskCountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskCountBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  label: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
  },
  textarea: { height: 80, textAlignVertical: 'top' },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    backgroundColor: Colors.white,
    gap: 4,
    ...Shadows.small,
  },
  categoryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryChipIcon: { fontSize: 16 },
  categoryChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  categoryChipTextActive: { color: Colors.primary, fontWeight: '700' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  switchLabel: { flex: 1, marginRight: Spacing.md },
  switchDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  summaryIcon: { fontSize: 18 },
  summaryValue: { ...Typography.label, color: Colors.textPrimary },

  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});

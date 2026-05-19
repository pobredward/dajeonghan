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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { TemplateSharingService } from '@/services/templateSharingService';
import { getHouseLayout } from '@/services/houseService';
import { HouseLayout, Furniture } from '@/types/house.types';
import { TemplateCategory } from '@/types/template.types';
import { useAuth } from '@/contexts/AuthContext';
import { TEMPLATE_CATEGORIES } from '@/constants/TemplateCategories';

type Step = 1 | 2 | 3;

export const CreateFullTemplateScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userId, user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [layout, setLayout] = useState<HouseLayout | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);

  // Step 2: 포함할 가구 선택 (기본 전체 선택)
  const [selectedFurnitureIds, setSelectedFurnitureIds] = useState<Set<string>>(new Set());

  // Step 3: 메타 정보
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
      const templateId = await TemplateMarketplaceService.createFullTemplate(userId, {
        creatorName: user.displayName || '익명',
        creatorAvatar: user.photoURL ?? undefined,
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        category,
        isPublic,
        selectedFurnitureIds: Array.from(selectedFurnitureIds),
      });

      const { url, text } = await TemplateSharingService.generateShareLink(templateId);

      Alert.alert(
        '템플릿 생성 완료! 🎉',
        '이제 다른 사람들과 공유할 수 있습니다.',
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
      </View>
    );
  }

  if (!layout) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🏠</Text>
        <Text style={styles.emptyTitle}>배치도가 없습니다</Text>
        <Text style={styles.emptyDesc}>먼저 내 집 탭에서 배치도를 만들어주세요.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* 단계 표시 */}
      <View style={styles.stepBar}>
        {([1, 2, 3] as Step[]).map(s => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
              {s === 1 ? '미리보기' : s === 2 ? '업무 선택' : '정보 입력'}
            </Text>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* ── Step 1: 배치도 미리보기 ── */}
        {step === 1 && (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>내 배치도 미리보기</Text>
              <Text style={styles.sectionDesc}>
                현재 내 집의 구조입니다. 이 배치도를 템플릿에 포함합니다.
              </Text>
              {layout.rooms.map((room, rIdx) => (
                <View key={rIdx} style={styles.roomRow}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={styles.furnitureRow}>
                    {room.furnitures.map((f, fIdx) => (
                      <Text key={fIdx} style={styles.furnitureEmoji}>{f.emoji}</Text>
                    ))}
                    {room.furnitures.length === 0 && (
                      <Text style={styles.noFurniture}>가구 없음</Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
            <Button title="다음 단계 →" onPress={() => setStep(2)} fullWidth />
          </>
        )}

        {/* ── Step 2: 포함할 업무 선택 ── */}
        {step === 2 && (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>포함할 가구 선택</Text>
              <Text style={styles.sectionDesc}>
                템플릿에 포함할 가구와 업무를 선택하세요. 선택된 가구의 모든 업무가 함께 포함됩니다.
              </Text>

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

              {allFurnitures.map(({ roomName, furniture }) => (
                <TouchableOpacity
                  key={furniture.id}
                  style={styles.furnitureCheckRow}
                  onPress={() => toggleFurniture(furniture.id)}
                >
                  <View style={[styles.checkbox, selectedFurnitureIds.has(furniture.id) && styles.checkboxChecked]}>
                    {selectedFurnitureIds.has(furniture.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.furnitureCheckEmoji}>{furniture.emoji}</Text>
                  <View style={styles.furnitureCheckInfo}>
                    <Text style={styles.furnitureCheckName}>{furniture.name}</Text>
                    <Text style={styles.furnitureCheckRoom}>{roomName} · 업무 {furniture.linkedTaskIds.length}개</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>

            <View style={styles.navRow}>
              <Button title="← 이전" onPress={() => setStep(1)} variant="outline" />
              <Button
                title="다음 단계 →"
                onPress={() => setStep(3)}
                disabled={selectedFurnitureIds.size === 0}
              />
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryChipText, category === cat.id && styles.categoryChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
                  <Text style={styles.switchDesc}>다른 사람들이 이 템플릿을 찾을 수 있습니다</Text>
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
              <Text style={styles.summaryItem}>
                🏠 방 {layout.rooms.length}개 · 가구 {selectedFurnitureIds.size}개
              </Text>
              <Text style={styles.summaryItem}>
                📝 업무 {
                  layout.rooms.reduce(
                    (sum, r) =>
                      sum + r.furnitures
                        .filter(f => selectedFurnitureIds.has(f.id))
                        .reduce((s, f) => s + f.linkedTaskIds.length, 0),
                    0
                  )
                }개 포함
              </Text>
              <Text style={styles.summaryItem}>
                {isPublic ? '🌍 공개' : '🔒 비공개'}
              </Text>
            </Card>

            <View style={styles.navRow}>
              <Button title="← 이전" onPress={() => setStep(2)} variant="outline" />
              <Button
                title={creating ? '생성 중...' : '템플릿 공유하기 🚀'}
                onPress={handleCreate}
                disabled={creating || !name.trim()}
                loading={creating}
              />
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepNum: { ...Typography.caption, fontWeight: '700', color: Colors.textSecondary },
  stepNumActive: { color: Colors.white },
  stepLabel: { ...Typography.caption, color: Colors.textSecondary, marginLeft: 6 },
  stepLabelActive: { color: Colors.primary, fontWeight: '600' },
  stepLine: { width: 24, height: 2, backgroundColor: Colors.lightGray, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: Colors.primary },

  card: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  sectionDesc: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },

  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  roomName: { ...Typography.label, width: 64, color: Colors.textSecondary },
  furnitureRow: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  furnitureEmoji: { fontSize: 20, marginRight: 4 },
  noFurniture: { ...Typography.caption, color: Colors.textSecondary },

  selectAllBtn: { alignSelf: 'flex-end', marginBottom: Spacing.sm },
  selectAllText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },

  furnitureCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  furnitureCheckEmoji: { fontSize: 22, marginRight: Spacing.sm },
  furnitureCheckInfo: { flex: 1 },
  furnitureCheckName: { ...Typography.label },
  furnitureCheckRoom: { ...Typography.caption, color: Colors.textSecondary },

  label: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
  },
  textarea: { height: 80, textAlignVertical: 'top' },

  categoryScroll: { marginVertical: Spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginRight: Spacing.xs,
    backgroundColor: Colors.white,
  },
  categoryChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  categoryChipIcon: { fontSize: 16, marginRight: 4 },
  categoryChipText: { ...Typography.caption, color: Colors.textSecondary },
  categoryChipTextActive: { color: Colors.primary, fontWeight: '600' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  switchLabel: { flex: 1, marginRight: Spacing.md },
  switchDesc: { ...Typography.caption, color: Colors.textSecondary },

  summaryItem: { ...Typography.body, marginBottom: Spacing.xs },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});

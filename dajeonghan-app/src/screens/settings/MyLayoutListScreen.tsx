import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { getHouseLayouts, switchActiveLayout } from '@/services/houseService';
import { hardDeleteTask, getTasks } from '@/services/firestoreService';
import { deleteDoc, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HouseLayout } from '@/types/house.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const MINI_CANVAS_SIZE = 100;

/** HouseLayout → 미니 SVG 프리뷰 */
const MiniPreview: React.FC<{ layout: HouseLayout }> = ({ layout }) => {
  const { canvasSize, rooms } = layout;
  const scale = MINI_CANVAS_SIZE / Math.max(canvasSize.width, canvasSize.height);

  return (
    <Svg
      width={MINI_CANVAS_SIZE}
      height={MINI_CANVAS_SIZE}
      viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
    >
      <Rect
        x={0} y={0}
        width={canvasSize.width}
        height={canvasSize.height}
        fill="#F5F5DC"
        stroke={Colors.lightGray}
        strokeWidth={2}
      />
      {rooms.map((room) => (
        <G key={room.id}>
          <Rect
            x={room.position.x}
            y={room.position.y}
            width={room.size.width}
            height={room.size.height}
            fill={room.color}
            stroke={Colors.darkGray}
            strokeWidth={2}
            rx={6}
          />
          <SvgText
            x={room.position.x + room.size.width / 2}
            y={room.position.y + 16}
            fontSize="14"
            fill={Colors.textSecondary}
            textAnchor="middle"
            fontWeight="bold"
          >
            {room.name}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
};

export const MyLayoutListScreen: React.FC = () => {
  const { userId } = useAuth();
  const navigation = useNavigation();
  const [layouts, setLayouts] = useState<HouseLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const loadLayouts = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await getHouseLayouts(userId);
      setLayouts(list);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadLayouts();
    }, [loadLayouts])
  );

  const handleSwitch = async (layout: HouseLayout) => {
    if (!userId || layout.isActive) return;
    Alert.alert(
      '레이아웃 전환',
      `"${layout.name}"을(를) 현재 집으로 사용할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전환',
          onPress: async () => {
            setSwitching(layout.id);
            try {
              await switchActiveLayout(userId, layout.id);
              await loadLayouts();
              // 내 집 탭으로 이동
              (navigation as any).navigate('HouseMap');
            } catch {
              Alert.alert('오류', '레이아웃 전환 중 문제가 발생했습니다.');
            } finally {
              setSwitching(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (layout: HouseLayout) => {
    if (!userId) return;

    const furnitureIds = layout.rooms.flatMap(r => r.furnitures.map(f => f.id));
    const taskCountHint = furnitureIds.length > 0
      ? '\n이 레이아웃의 가구에 연결된 할 일도 함께 삭제됩니다.'
      : '';
    const activeHint = layout.isActive ? '\n현재 사용 중인 레이아웃입니다.' : '';

    Alert.alert(
      '레이아웃 삭제',
      `"${layout.name}"을(를) 삭제할까요?${activeHint}${taskCountHint}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 연결된 Task 삭제
              if (furnitureIds.length > 0) {
                const allTasks = await getTasks(userId);
                const linkedTasks = allTasks.filter(
                  (t: any) => t.furnitureId && furnitureIds.includes(t.furnitureId)
                );
                await Promise.all(linkedTasks.map((t: any) => hardDeleteTask(userId, t.id)));
              }

              // 레이아웃 문서 삭제
              await deleteDoc(doc(db, `users/${userId}/houseLayouts/${layout.id}`));

              const remaining = layouts.filter(l => l.id !== layout.id);
              setLayouts(remaining);

              // active 레이아웃을 삭제한 경우 → 남은 것 중 첫 번째를 active로 전환
              if (layout.isActive && remaining.length > 0) {
                await switchActiveLayout(userId, remaining[0].id);
                setLayouts(prev =>
                  prev.map(l => ({ ...l, isActive: l.id === remaining[0].id }))
                );
                (navigation as any).navigate('HouseMap');
              } else if (remaining.length === 0) {
                // 마지막 레이아웃 삭제 → 내 집 탭으로 이동해 빈 상태 표시
                (navigation as any).navigate('HouseMap');
              }
            } catch {
              Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (layouts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyText}>저장된 레이아웃이 없습니다.</Text>
          <Text style={styles.emptySubText}>템플릿 탭에서 마음에 드는 템플릿을 적용해보세요.</Text>
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
        <Text style={styles.sectionNote}>
          레이아웃을 탭해 현재 집으로 전환하거나, 삭제할 수 있습니다.
        </Text>

        {layouts.map((layout) => {
          const roomCount = layout.rooms.length;
          const furnitureCount = layout.rooms.reduce((s, r) => s + r.furnitures.length, 0);
          const isProcessing = switching === layout.id;

          return (
            <TouchableOpacity
              key={layout.id}
              style={[styles.card, layout.isActive && styles.cardActive]}
              onPress={() => handleSwitch(layout)}
              activeOpacity={layout.isActive ? 1 : 0.75}
            >
              {/* 활성 뱃지 */}
              {layout.isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>현재 사용 중</Text>
                </View>
              )}

              <View style={styles.cardBody}>
                {/* 미니 프리뷰 */}
                <View style={styles.previewWrap}>
                  <MiniPreview layout={layout} />
                </View>

                {/* 정보 */}
                <View style={styles.info}>
                  <Text style={styles.layoutName} numberOfLines={1}>{layout.name}</Text>

                  {layout.sourceTemplateId && (
                    <Text style={styles.sourceBadge}>📋 템플릿 적용</Text>
                  )}

                  <Text style={styles.metaText}>방 {roomCount}개 · 가구 {furnitureCount}개</Text>
                  <Text style={styles.metaText}>
                    {format(new Date(layout.createdAt), 'yyyy.MM.dd', { locale: ko })} 저장
                  </Text>

                  {!layout.isActive && (
                    <TouchableOpacity
                      style={styles.switchBtn}
                      onPress={() => handleSwitch(layout)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Text style={styles.switchBtnText}>이 레이아웃 사용</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* 삭제 버튼 */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(layout)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    ...Typography.h4,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptySubText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    overflow: 'hidden',
    ...Shadows.small,
  },
  cardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  activeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: BorderRadius.md,
  },
  activeBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  previewWrap: {
    width: MINI_CANVAS_SIZE,
    height: MINI_CANVAS_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  layoutName: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  sourceBadge: {
    ...Typography.caption,
    color: Colors.accent,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  switchBtn: {
    marginTop: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  switchBtnText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: Spacing.sm,
    alignSelf: 'flex-start',
  },
  deleteBtnText: {
    fontSize: 20,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Circle } from 'react-native-svg';
import { SharedHouseLayout, SharedRoom, SharedFurniture } from '@/types/template.types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants';

interface Props {
  houseLayout: SharedHouseLayout;
  containerWidth?: number;
  containerHeight?: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.5;
const ZOOM_STEP = 0.1;

function calcAutoScale(canvasW: number, containerW: number): number {
  if (containerW <= 0) return 1;
  const padding = 32;
  const scale = (containerW - padding) / canvasW;
  return Math.max(Math.min(scale, 1), MIN_SCALE);
}

export const TemplateLayoutPreview: React.FC<Props> = ({
  houseLayout,
  containerWidth,
  containerHeight = 300,
}) => {
  const { canvasSize, rooms, character } = houseLayout;

  const [measuredW, setMeasuredW] = useState(containerWidth ?? 0);
  const resolvedW = containerWidth ?? measuredW;
  const autoScale = calcAutoScale(canvasSize.width, resolvedW);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const currentScale = manualScale ?? autoScale;

  // 가구 이름 툴팁
  const [tooltip, setTooltip] = useState<string | null>(null);

  const scaledW = canvasSize.width * currentScale;
  const scaledH = canvasSize.height * currentScale;

  const renderFurniture = (room: SharedRoom, f: SharedFurniture, fIdx: number) => {
    const absX = room.position.x + f.position.x;
    const absY = room.position.y + f.position.y;
    const taskCount = f.tasks.length;

    return (
      <G key={`f-${fIdx}`}>
        <Rect
          x={absX}
          y={absY}
          width={f.size.width}
          height={f.size.height}
          fill={Colors.surface}
          stroke={taskCount > 0 ? Colors.primary : Colors.lightGray}
          strokeWidth={taskCount > 0 ? 2 : 1.5}
          rx={6}
          opacity={0.92}
        />
        {taskCount > 0 && (
          <>
            <Circle
              cx={absX + f.size.width - 9}
              cy={absY + 9}
              r={9}
              fill={Colors.primary}
            />
            <SvgText
              x={absX + f.size.width - 9}
              y={absY + 13}
              fontSize="9"
              fill={Colors.textInverse}
              textAnchor="middle"
              fontWeight="bold"
            >
              {taskCount}
            </SvgText>
          </>
        )}
      </G>
    );
  };

  const renderRoom = (room: SharedRoom, rIdx: number) => (
    <G key={`r-${rIdx}`}>
      <Rect
        x={room.position.x}
        y={room.position.y}
        width={room.size.width}
        height={room.size.height}
        fill={room.color}
        stroke={Colors.darkGray}
        strokeWidth={2}
        rx={8}
      />
      <SvgText
        x={room.position.x + room.size.width / 2}
        y={room.position.y + 18}
        fontSize="13"
        fill={Colors.textSecondary}
        textAnchor="middle"
        fontWeight="bold"
      >
        {room.name}
      </SvgText>
      {room.furnitures.map((f, fIdx) => renderFurniture(room, f, fIdx))}
    </G>
  );

  return (
    <View
      style={styles.wrapper}
      onLayout={e => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && !containerWidth) setMeasuredW(w);
      }}
    >
      {/* 줌 컨트롤 */}
      <View style={styles.zoomBar}>
        <Text style={styles.zoomHint}>핀치 또는 버튼으로 확대</Text>
        <View style={styles.zoomBtns}>
          <TouchableOpacity
            style={[styles.zoomBtn, currentScale <= MIN_SCALE && styles.zoomBtnDisabled]}
            onPress={() =>
              setManualScale(s =>
                Math.max(MIN_SCALE, Math.round(((s ?? autoScale) - ZOOM_STEP) * 10) / 10)
              )
            }
            disabled={currentScale <= MIN_SCALE}
          >
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.zoomLabel}>{Math.round(currentScale * 100)}%</Text>
          <TouchableOpacity
            style={[styles.zoomBtn, currentScale >= MAX_SCALE && styles.zoomBtnDisabled]}
            onPress={() =>
              setManualScale(s =>
                Math.min(MAX_SCALE, Math.round(((s ?? autoScale) + ZOOM_STEP) * 10) / 10)
              )
            }
            disabled={currentScale >= MAX_SCALE}
          >
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 캔버스 */}
      <ScrollView
        style={[styles.scrollOuter, { maxHeight: containerHeight }]}
        contentContainerStyle={styles.scrollOuterContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollInnerContent}
        >
          <View style={{ width: scaledW, height: scaledH }}>
            <View
              style={{
                position: 'absolute',
                transform: [{ scale: currentScale }],
                left: -(canvasSize.width * (1 - currentScale)) / 2,
                top: -(canvasSize.height * (1 - currentScale)) / 2,
              }}
            >
              <Svg
                width={canvasSize.width}
                height={canvasSize.height}
                viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              >
                {/* 바닥 */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fill={Colors.accentLight}
                  stroke={Colors.lightGray}
                  strokeWidth={2}
                />
                {rooms.map((room, rIdx) => renderRoom(room, rIdx))}
              </Svg>

              {/* 가구 이모지 레이어 */}
              {rooms.map((room, rIdx) =>
                room.furnitures.map((f, fIdx) => {
                  const absX = room.position.x + f.position.x;
                  const absY = room.position.y + f.position.y;
                  const emojiLeft = absX + f.size.width / 2 - 10;
                  const emojiTop = absY + f.size.height / 2 - 12;
                  return (
                    <TouchableOpacity
                      key={`emoji-${rIdx}-${fIdx}`}
                      style={[styles.emojiLabel, { left: emojiLeft, top: emojiTop }]}
                      onPress={() =>
                        setTooltip(t =>
                          t === `${rIdx}-${fIdx}`
                            ? null
                            : `${rIdx}-${fIdx}`
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emojiText}>{f.emoji}</Text>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* 캐릭터 이모지 */}
              {character && (
                <View
                  style={[
                    styles.emojiLabel,
                    {
                      left: character.position.x - 14,
                      top: character.position.y - 16,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={styles.emojiCharacter}>{character.emoji}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* 가구 툴팁 */}
      {tooltip !== null && (() => {
        const [rIdx, fIdx] = tooltip.split('-').map(Number);
        const f = rooms[rIdx]?.furnitures[fIdx];
        if (!f) return null;
        return (
          <TouchableOpacity style={styles.tooltip} onPress={() => setTooltip(null)}>
            <Text style={styles.tooltipText}>
              {f.emoji} {f.name}
              {f.tasks.length > 0 ? ` · 업무 ${f.tasks.length}개` : ''}
            </Text>
          </TouchableOpacity>
        );
      })()}

      {/* 방 색상 범례 */}
      {rooms.length > 0 && (
        <View style={styles.legend}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rooms.map((room, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: room.color }]} />
                <Text style={styles.legendText}>{room.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    ...Shadows.small,
  },
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  zoomHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  zoomBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnDisabled: { backgroundColor: Colors.lightGray },
  zoomBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  zoomLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
  },
  scrollOuter: {},
  scrollOuterContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  scrollInnerContent: {
    flexGrow: 0,
    padding: Spacing.xs,
  },
  emojiLabel: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 18 },
  emojiCharacter: { fontSize: 22 },
  tooltip: {
    backgroundColor: Colors.darkGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    margin: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
  },
  tooltipText: {
    ...Typography.caption,
    color: Colors.white,
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

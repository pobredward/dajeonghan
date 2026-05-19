import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import Svg, { Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { SharedHouseLayout, SharedRoom, SharedFurniture } from '@/types/template.types';
import { Colors, Spacing, Typography } from '@/constants';

interface Props {
  houseLayout: SharedHouseLayout;
  /** 컨테이너 너비 (지정 없으면 canvasSize 기준으로 auto-fit) */
  containerWidth?: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.5;
const ZOOM_STEP = 0.1;

function calcAutoScale(canvasW: number, canvasH: number, containerW: number): number {
  const padding = 32;
  const avail = containerW - padding;
  const scale = avail / canvasW;
  return Math.max(Math.min(scale, 1), MIN_SCALE);
}

export const TemplateLayoutPreview: React.FC<Props> = ({ houseLayout, containerWidth }) => {
  const { canvasSize, rooms, character } = houseLayout;

  const [containerW, setContainerW] = useState(containerWidth ?? 0);
  const autoScale = containerW > 0
    ? calcAutoScale(canvasSize.width, canvasSize.height, containerW)
    : 1;
  const [scale, setScale] = useState<number | null>(null);
  const currentScale = scale ?? autoScale;

  const scaledW = canvasSize.width * currentScale;
  const scaledH = canvasSize.height * currentScale;

  const renderFurniture = (room: SharedRoom, f: SharedFurniture, fIdx: number) => {
    const absX = room.position.x + f.position.x;
    const absY = room.position.y + f.position.y;
    const cx = absX + f.size.width / 2;
    const cy = absY + f.size.height / 2;
    const taskCount = f.tasks.length;

    return (
      <G key={`f-${fIdx}`}>
        <Rect
          x={absX}
          y={absY}
          width={f.size.width}
          height={f.size.height}
          fill={Colors.surface}
          stroke={Colors.primary}
          strokeWidth={1.5}
          rx={6}
          opacity={0.92}
        />
        {taskCount > 0 && (
          <>
            <Circle
              cx={absX + f.size.width - 8}
              cy={absY + 8}
              r={8}
              fill={Colors.primary}
            />
            <SvgText
              x={absX + f.size.width - 8}
              y={absY + 12}
              fontSize="9"
              fill="white"
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

  const renderCharacter = () => {
    if (!character) return null;
    const { x, y } = character.position;
    return (
      <G>
        <Circle
          cx={x}
          cy={y}
          r={28}
          fill={Colors.surface}
          stroke={Colors.primary}
          strokeWidth={2}
          opacity={0.9}
        />
      </G>
    );
  };

  return (
    <View
      style={styles.wrapper}
      onLayout={e => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && !containerWidth) setContainerW(w);
      }}
    >
      {/* 줌 컨트롤 */}
      <View style={styles.zoomBar}>
        <TouchableOpacity
          style={[styles.zoomBtn, currentScale <= MIN_SCALE && styles.zoomBtnDisabled]}
          onPress={() => setScale(s => Math.max(MIN_SCALE, Math.round(((s ?? autoScale) - ZOOM_STEP) * 10) / 10))}
          disabled={currentScale <= MIN_SCALE}
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.zoomLabel}>{Math.round(currentScale * 100)}%</Text>
        <TouchableOpacity
          style={[styles.zoomBtn, currentScale >= MAX_SCALE && styles.zoomBtnDisabled]}
          onPress={() => setScale(s => Math.min(MAX_SCALE, Math.round(((s ?? autoScale) + ZOOM_STEP) * 10) / 10))}
          disabled={currentScale >= MAX_SCALE}
        >
          <Text style={styles.zoomBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 양방향 스크롤 캔버스 */}
      <ScrollView
        style={styles.scrollOuter}
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
                  x={0} y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fill="#F5F5DC"
                  stroke={Colors.lightGray}
                  strokeWidth={2}
                />
                {rooms.map((room, rIdx) => renderRoom(room, rIdx))}
                {renderCharacter()}
              </Svg>

              {/* 가구 이모지 레이어 */}
              {rooms.map((room, rIdx) =>
                room.furnitures.map((f, fIdx) => {
                  const absX = room.position.x + f.position.x + f.size.width / 2;
                  const absY = room.position.y + f.position.y + f.size.height / 2;
                  return (
                    <View
                      key={`emoji-${rIdx}-${fIdx}`}
                      style={[styles.emojiLabel, { left: absX - 14, top: absY - 14 }]}
                      pointerEvents="none"
                    >
                      <Text style={styles.emojiText}>{f.emoji}</Text>
                    </View>
                  );
                })
              )}

              {/* 캐릭터 이모지 */}
              {character && (
                <View
                  style={[styles.emojiLabel, { left: character.position.x - 18, top: character.position.y - 18 }]}
                  pointerEvents="none"
                >
                  <Text style={styles.emojiCharacter}>{character.emoji}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>가구 (숫자 = 업무 수)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
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
  zoomBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  zoomLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  scrollOuter: { maxHeight: 340 },
  scrollOuterContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  scrollInnerContent: { flexGrow: 0, padding: 8 },
  emojiLabel: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 20 },
  emojiCharacter: { fontSize: 24 },
  legend: {
    flexDirection: 'row',
    padding: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { ...Typography.caption, color: Colors.textSecondary },
});

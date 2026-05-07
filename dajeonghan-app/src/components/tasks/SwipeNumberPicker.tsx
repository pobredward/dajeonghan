import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants';

// WheelPicker를 date 모듈 없이 직접 로드 (date-fns 번들 오류 우회)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WheelPicker = require('@quidone/react-native-wheel-picker/dest/commonjs/base').default;

type PickerItem = { value: number; label: string };

interface SwipeNumberPickerProps {
  value: number;
  items: PickerItem[];
  onValueChanged: (value: number) => void;
  unit?: string;
  width?: number;
  accentColor?: string;
  style?: ViewStyle;
}

const SwipeNumberPicker: React.FC<SwipeNumberPickerProps> = ({
  value,
  items,
  onValueChanged,
  unit,
  width = 72,
  accentColor = Colors.primary,
  style,
}) => {
  const pickerData = useMemo(
    () => items.map(item => ({ value: item.value, label: item.label })),
    [items],
  );

  return (
    <View style={[styles.container, style]}>
      <WheelPicker
        data={pickerData}
        value={value}
        onValueChanged={({ item }: { item: PickerItem }) => onValueChanged(item.value)}
        visibleItemCount={3}
        itemHeight={44}
        width={width}
        itemTextStyle={styles.itemText}
        overlayItemStyle={[styles.overlayItem, { borderColor: accentColor + '55' }]}
        renderItem={({ item }: { item: PickerItem }) => (
          <Text style={styles.itemText}>{item.label}</Text>
        )}
      />
      {unit ? <Text style={[styles.unit, { color: accentColor }]}>{unit}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  overlayItem: {
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: Colors.primary + '08',
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 2,
  },
});

export default SwipeNumberPicker;

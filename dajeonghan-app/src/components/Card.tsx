import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
}

export const Card: React.FC<Props> = ({
  children,
  style,
  padding = 'medium',
  shadow = true
}) => {
  const cardStyle = [
    styles.base,
    styles[`padding_${padding}` as keyof typeof styles] as ViewStyle,
    shadow && Shadows.medium,
    style
  ].filter(Boolean) as ViewStyle[];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg
  },
  padding_none: {
    padding: 0
  },
  padding_small: {
    padding: Spacing.sm
  },
  padding_medium: {
    padding: Spacing.md
  },
  padding_large: {
    padding: Spacing.lg
  }
});

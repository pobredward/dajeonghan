import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, BorderRadius } from '@/constants';

interface Props {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
}

export const Badge: React.FC<Props> = ({
  text,
  variant = 'primary',
  size = 'medium'
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[size]]}>
      <Text style={[styles.text, styles[`${size}Text` as keyof typeof styles] as TextStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Variants
  primary: {
    backgroundColor: Colors.primaryLight
  },
  success: {
    backgroundColor: Colors.secondaryLight
  },
  warning: {
    backgroundColor: Colors.accentLight
  },
  error: {
    backgroundColor: '#FFEBEE'
  },

  // Sizes
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 4
  },

  // Text
  text: {
    fontWeight: '600'
  },
  smallText: {
    fontSize: 10,
    color: Colors.primary
  },
  mediumText: {
    fontSize: 12,
    color: Colors.primary
  }
});

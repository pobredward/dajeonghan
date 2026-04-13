import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows } from '@/constants';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false
}) => {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    styles[`${size}Text` as keyof typeof styles] as TextStyle,
    disabled && styles.disabledText
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small
  },
  fullWidth: {
    width: '100%'
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary
  },
  secondary: {
    backgroundColor: Colors.secondary
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary
  },
  text: {
    backgroundColor: 'transparent'
  },

  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32
  },

  // Text styles
  primaryText: {
    color: Colors.white,
    ...Typography.label
  },
  secondaryText: {
    color: Colors.white,
    ...Typography.label
  },
  outlineText: {
    color: Colors.primary,
    ...Typography.label
  },
  textText: {
    color: Colors.primary,
    ...Typography.label
  },

  smallText: {
    ...Typography.labelSmall
  },
  mediumText: {
    ...Typography.label
  },
  largeText: {
    fontSize: 16,
    fontWeight: '600'
  },

  // States
  disabled: {
    opacity: 0.5
  },
  disabledText: {
    color: Colors.textDisabled
  }
});

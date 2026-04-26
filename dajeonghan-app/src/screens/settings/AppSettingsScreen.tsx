import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface SettingRowProps {
  title: string;
  subtitle?: string;
  rightElement: React.ReactNode;
  onPress?: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ title, subtitle, rightElement, onPress }) => {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

export const AppSettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleResetPersona = () => {
    Alert.alert(
      '페르소나 재설정',
      '처음부터 다시 시작하시겠습니까? 현재 설정이 초기화됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '재설정',
          style: 'destructive',
          onPress: () => console.log('Reset persona'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>알림</Text>
        <View style={styles.card}>
          <SettingRow
            title="알림 켜기"
            subtitle="일정과 리마인더를 받아보세요"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.lightGray, true: Colors.primaryLight }}
                thumbColor={notificationsEnabled ? Colors.primary : Colors.gray}
              />
            }
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>외관</Text>
        <View style={styles.card}>
          <SettingRow
            title="다크 모드"
            subtitle="화면을 어둡게 표시합니다"
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: Colors.lightGray, true: Colors.primaryLight }}
                thumbColor={darkModeEnabled ? Colors.primary : Colors.gray}
              />
            }
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>나의 집</Text>
        <View style={styles.card}>
          <SettingRow
            title="페르소나 재설정"
            subtitle="처음부터 다시 시작"
            onPress={handleResetPersona}
            rightElement={<Text style={styles.arrow}>›</Text>}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    padding: Spacing.md,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  rowText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rowTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
});

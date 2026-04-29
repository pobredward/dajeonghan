import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { NotificationService } from '@/services/notifications/NotificationService';
import { NotificationScheduler } from '@/services/notifications/NotificationScheduler';
import { getUserProfile, updateUserProfile } from '@/services/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationMode, UserProfile } from '@/types/user.types';

const NOTIFICATIONS_ENABLED_KEY = '@dajeonghan/notifications_enabled';

interface NotificationModeOption {
  mode: NotificationMode;
  title: string;
  subtitle: string;
}

const NOTIFICATION_MODE_OPTIONS: NotificationModeOption[] = [
  {
    mode: 'immediate',
    title: '즉시 알림',
    subtitle: '할 일이 생기면 바로 알려드려요',
  },
  {
    mode: 'digest',
    title: '하루 2회 모아보기',
    subtitle: '오전·저녁에 한 번에 확인해요',
  },
  {
    mode: 'minimal',
    title: '알림 없음',
    subtitle: '앱 내 배지로만 확인해요',
  },
];

interface SettingRowProps {
  title: string;
  subtitle?: string;
  rightElement: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ title, subtitle, rightElement, onPress, isLast }) => {
  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
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
  const { userId } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [notificationMode, setNotificationMode] = useState<NotificationMode>('digest');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [modeUpdating, setModeUpdating] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY).then((value) => {
      if (value !== null) {
        setNotificationsEnabled(value === 'true');
      }
    });

    if (userId) {
      getUserProfile(userId).then((p) => {
        if (p) {
          setProfile(p);
          setNotificationMode(p.notificationMode);
        }
      });
    }
  }, [userId]);

  const handleNotificationToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          '알림 권한 필요',
          '설정 앱에서 다정한의 알림 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }
    } else {
      await NotificationService.cancelAllNotifications();
      await NotificationService.clearBadge();
    }

    setNotificationsEnabled(enabled);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  }, []);

  const handleModeSelect = useCallback(async (mode: NotificationMode) => {
    if (!userId || !profile || mode === notificationMode || modeUpdating) return;

    setModeUpdating(true);
    try {
      await updateUserProfile(userId, { notificationMode: mode });

      const updatedProfile: UserProfile = { ...profile, notificationMode: mode };
      await NotificationScheduler.initializeNotifications(userId, updatedProfile);

      setNotificationMode(mode);
      setProfile(updatedProfile);
    } catch {
      Alert.alert('오류', '알림 설정을 변경하지 못했어요. 다시 시도해주세요.');
    } finally {
      setModeUpdating(false);
    }
  }, [userId, profile, notificationMode, modeUpdating]);

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
            isLast={!notificationsEnabled}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: Colors.lightGray, true: Colors.primaryLight }}
                thumbColor={notificationsEnabled ? Colors.primary : Colors.gray}
              />
            }
          />
          {notificationsEnabled && (
            <>
              {NOTIFICATION_MODE_OPTIONS.map((option, index) => (
                <SettingRow
                  key={option.mode}
                  title={option.title}
                  subtitle={option.subtitle}
                  isLast={index === NOTIFICATION_MODE_OPTIONS.length - 1}
                  onPress={() => handleModeSelect(option.mode)}
                  rightElement={
                    modeUpdating && notificationMode === option.mode ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={[
                        styles.modeCheck,
                        notificationMode === option.mode && styles.modeCheckActive,
                      ]}>
                        {notificationMode === option.mode ? '✓' : ''}
                      </Text>
                    )
                  }
                />
              ))}
            </>
          )}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>외관</Text>
        <View style={styles.card}>
          <SettingRow
            title="다크 모드"
            subtitle="화면을 어둡게 표시합니다"
            isLast
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
            isLast
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
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
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
  modeCheck: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    width: 20,
    textAlign: 'center',
  },
  modeCheckActive: {
    color: Colors.primary,
  },
});

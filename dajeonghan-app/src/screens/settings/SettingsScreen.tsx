import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card } from '@/components';
import type { NavigationProp } from '@react-navigation/native';

interface Props {
  navigation?: NavigationProp<any>;
}

interface SettingItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ title, subtitle, onPress, rightElement }) => {
  const content = (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
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

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handlePrivacyPolicy = () => {
    navigation?.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation?.navigate('TermsOfService');
  };

  const handleDeleteAccount = () => {
    navigation?.navigate('DeleteAccount');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>알림</Text>
          <Card padding="medium" style={styles.section}>
            <SettingItem
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
          </Card>

          <Text style={styles.sectionTitle}>외관</Text>
          <Card padding="medium" style={styles.section}>
            <SettingItem
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
          </Card>

          <Text style={styles.sectionTitle}>계정</Text>
          <Card padding="medium" style={styles.section}>
            <SettingItem
              title="프로필"
              subtitle="개인 정보 수정"
              onPress={() => console.log('Navigate to profile')}
              rightElement={<Text style={styles.arrow}>›</Text>}
            />
            <View style={styles.divider} />
            <SettingItem
              title="페르소나 재설정"
              subtitle="처음부터 다시 시작"
              onPress={() => console.log('Reset persona')}
              rightElement={<Text style={styles.arrow}>›</Text>}
            />
          </Card>

          <Text style={styles.sectionTitle}>정보</Text>
          <Card padding="medium" style={styles.section}>
            <SettingItem
              title="버전"
              rightElement={<Text style={styles.versionText}>1.0.0</Text>}
            />
            <View style={styles.divider} />
            <SettingItem
              title="개인정보 처리방침"
              onPress={handlePrivacyPolicy}
              rightElement={<Text style={styles.arrow}>›</Text>}
            />
            <View style={styles.divider} />
            <SettingItem
              title="서비스 이용약관"
              onPress={handleTermsOfService}
              rightElement={<Text style={styles.arrow}>›</Text>}
            />
            <View style={styles.divider} />
            <SettingItem
              title="오픈소스 라이선스"
              onPress={() => console.log('Open source licenses')}
              rightElement={<Text style={styles.arrow}>›</Text>}
            />
          </Card>

          <Text style={styles.sectionTitle}>계정 관리</Text>
          <Card padding="medium" style={StyleSheet.flatten([styles.section, styles.dangerSection])}>
            <SettingItem
              title="로그아웃"
              onPress={() => console.log('Logout')}
              rightElement={<Text style={styles.arrow}>›</Text>}
            />
            <View style={styles.divider} />
            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7}>
              <View style={styles.settingItem}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.dangerText}>계정 삭제</Text>
                  <Text style={styles.settingSubtitle}>모든 데이터가 삭제됩니다</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  content: {
    padding: Spacing.md
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs
  },
  section: {
    marginBottom: Spacing.sm
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md
  },
  settingTextContainer: {
    flex: 1,
    marginRight: Spacing.md
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: 2
  },
  settingSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary
  },
  rightElement: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  arrow: {
    ...Typography.h3,
    color: Colors.textSecondary
  },
  versionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary
  },
  divider: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginVertical: Spacing.xs
  },
  dangerSection: {
    marginTop: Spacing.lg
  },
  dangerText: {
    ...Typography.body,
    color: Colors.error,
    marginBottom: 2,
    fontWeight: '600'
  }
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import type { MyInfoStackParamList } from '@/navigation/MyInfoNavigator';

type NavigationProp = StackNavigationProp<MyInfoStackParamList, 'AppInfo'>;

interface Props {
  navigation: NavigationProp;
}

interface InfoRowProps {
  title: string;
  rightElement: React.ReactNode;
  onPress?: () => void;
}

const InfoRow: React.FC<InfoRowProps> = ({ title, rightElement, onPress }) => {
  const content = (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
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

export const AppInfoScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.section}>
        <View style={styles.card}>
          <InfoRow
            title="버전"
            rightElement={<Text style={styles.valueText}>1.0.0</Text>}
          />
          <View style={styles.divider} />
          <InfoRow
            title="개인정보 처리방침"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            rightElement={<Text style={styles.arrow}>›</Text>}
          />
          <View style={styles.divider} />
          <InfoRow
            title="서비스 이용약관"
            onPress={() => navigation.navigate('TermsOfService')}
            rightElement={<Text style={styles.arrow}>›</Text>}
          />
          <View style={styles.divider} />
          <InfoRow
            title="오픈소스 라이선스"
            onPress={() => console.log('Open source licenses')}
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
  rowTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  valueText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  arrow: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginLeft: Spacing.md,
  },
});

import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { EditProfileScreen } from '@/screens/settings/EditProfileScreen';
import { FollowListScreen } from '@/screens/settings/FollowListScreen';
import { UserSearchScreen } from '@/screens/settings/UserSearchScreen';
import { AppSettingsScreen } from '@/screens/settings/AppSettingsScreen';
import { AppInfoScreen } from '@/screens/settings/AppInfoScreen';
import { AccountManagementScreen } from '@/screens/settings/AccountManagementScreen';
import { PrivacyPolicyScreen, TermsOfServiceScreen, DeleteAccountScreen } from '@/screens/legal';
import { Colors } from '@/constants';

export type MyInfoStackParamList = {
  MyInfoMain: undefined;
  EditProfile: undefined;
  FollowList: { tab: 'followers' | 'following' };
  UserSearch: undefined;
  AppSettings: undefined;
  AppInfo: undefined;
  AccountManagement: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  DeleteAccount: undefined;
};

const Stack = createStackNavigator<MyInfoStackParamList>();

export const MyInfoNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          backgroundColor: Colors.surface,
          height: Platform.OS === 'ios' ? 44 + insets.top : undefined,
        },
        headerStatusBarHeight: insets.top,
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.textPrimary,
          fontSize: 18,
        },
        headerBackTitle: '뒤로',
      }}
    >
      <Stack.Screen
        name="MyInfoMain"
        component={SettingsScreen}
        options={{ title: '내정보' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: '프로필 편집' }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={{ title: '팔로워/팔로잉' }}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{ title: '사용자 검색' }}
      />
      <Stack.Screen
        name="AppSettings"
        component={AppSettingsScreen}
        options={{ title: '앱 설정' }}
      />
      <Stack.Screen
        name="AppInfo"
        component={AppInfoScreen}
        options={{ title: '정보' }}
      />
      <Stack.Screen
        name="AccountManagement"
        component={AccountManagementScreen}
        options={{ title: '계정 관리' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: '개인정보 처리방침' }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: '서비스 이용약관' }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{ title: '계정 삭제' }}
      />
    </Stack.Navigator>
  );
};

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { PrivacyPolicyScreen, TermsOfServiceScreen, DeleteAccountScreen } from '@/screens/legal';
import { Colors } from '@/constants';

export type SettingsStackParamList = {
  SettingsList: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  DeleteAccount: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          backgroundColor: Colors.surface
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: '개인정보 처리방침',
          headerBackTitle: '뒤로'
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          title: '서비스 이용약관',
          headerBackTitle: '뒤로'
        }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{
          title: '계정 삭제',
          headerBackTitle: '뒤로'
        }}
      />
    </Stack.Navigator>
  );
};

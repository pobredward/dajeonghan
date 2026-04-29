import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { EmailVerificationScreen } from '@/screens/auth/EmailVerificationScreen';
import { TermsOfServiceScreen } from '@/screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '@/screens/legal/PrivacyPolicyScreen';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  /**
   * fromLogin: true → 로그인 시도 후 미인증 경로 (세션이 살아 있음, 화면 이탈 시 signOut 필요)
   * fromLogin: false(기본) → 회원가입 직후 경로
   */
  EmailVerification: { email: string; fromLogin?: boolean };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
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
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen
        name="Login"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: '회원가입' }}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{ title: '이메일 인증', headerBackVisible: false }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: '서비스 이용약관' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: '개인정보 처리방침' }}
      />
    </Stack.Navigator>
  );
};

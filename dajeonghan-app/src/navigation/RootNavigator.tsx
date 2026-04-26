import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { TermsOfServiceScreen } from '@/screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '@/screens/legal/PrivacyPolicyScreen';
import { useAuth } from '@/contexts/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, userId, loading, isOnboarded, checkOnboardingStatus } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        {!user ? (
          // 비로그인 → 로그인/회원가입 화면
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationEnabled: false }}
          />
        ) : !isOnboarded ? (
          // 로그인 완료 + 온보딩 미완료
          <>
            <Stack.Screen
              name="Onboarding"
              options={{ animationEnabled: false }}
            >
              {(props) => (
                <OnboardingFlow
                  {...props}
                  userId={userId!}
                  onComplete={async () => {
                    console.log('🎉 온보딩 완료, 상태 새로고침');
                    await checkOnboardingStatus();
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{
                headerShown: true,
                headerTitle: '이용약관',
                headerBackTitle: '뒤로',
              }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{
                headerShown: true,
                headerTitle: '개인정보 처리방침',
                headerBackTitle: '뒤로',
              }}
            />
          </>
        ) : (
          // 로그인 + 온보딩 완료 → 메인
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

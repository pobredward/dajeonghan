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
  const {
    user,
    userId,
    loading,
    isOnboarded,
    isGuestOnboarding,
    cancelGuestOnboarding,
    checkOnboardingStatus,
  } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // 온보딩을 보여야 하는 조건:
  // 1. 일반 로그인 후 온보딩 미완료
  // 2. 게스트 온보딩 플래그 활성화 (Firebase 계정 아직 없음)
  const shouldShowOnboarding = (user && !isOnboarded) || isGuestOnboarding;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        {!user && !isGuestOnboarding ? (
          // 비로그인 + 게스트 온보딩도 아님 → 로그인 화면
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationEnabled: false }}
          />
        ) : shouldShowOnboarding ? (
          // 온보딩 필요 (일반 or 게스트)
          <>
            <Stack.Screen
              name="Onboarding"
              options={{ animationEnabled: false }}
            >
              {(props) => (
                <OnboardingFlow
                  {...props}
                  userId={userId ?? ''}
                  isGuestOnboarding={isGuestOnboarding}
                  onBack={() => {
                    if (isGuestOnboarding) {
                      // 게스트 온보딩 취소 → Firebase 계정이 없으므로 단순 플래그 해제
                      cancelGuestOnboarding();
                    }
                    // 일반 로그인 사용자의 뒤로가기는 OnboardingFlow 내에서 signOut 처리
                  }}
                  onComplete={async () => {
                    console.log('🎉 온보딩 완료, 상태 새로고침');
                    if (isGuestOnboarding) {
                      cancelGuestOnboarding();
                    }
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

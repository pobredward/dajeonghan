import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { TabNavigator } from './TabNavigator';
import { TermsOfServiceScreen } from '@/screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '@/screens/legal/PrivacyPolicyScreen';
import { useAuth } from '@/contexts/AuthContext';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { userId, loading, isOnboarded, checkOnboardingStatus } = useAuth();

  // 로딩 중
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // userId가 없으면 에러 (이론상 발생하지 않아야 함)
  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
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
        {!isOnboarded ? (
          <>
            <Stack.Screen 
              name="Onboarding"
              options={{
                animationEnabled: false,
              }}
            >
              {(props) => (
                <OnboardingFlow
                  {...props}
                  userId={userId}  // 실제 Firebase UID 사용!
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
          <Stack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{
              animationEnabled: false,
            }}
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

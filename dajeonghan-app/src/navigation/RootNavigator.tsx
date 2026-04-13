import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { TabNavigator } from './TabNavigator';
import { TermsOfServiceScreen } from '@/screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '@/screens/legal/PrivacyPolicyScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [isOnboarded, setIsOnboarded] = React.useState(false);

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
                  userId="test-user"
                  onComplete={() => setIsOnboarded(true)}
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

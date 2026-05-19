import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants';
import { TemplateMarketplaceScreen } from '@/screens/templates/TemplateMarketplaceScreen';
import { TemplateDetailScreen } from '@/screens/templates/TemplateDetailScreen';
import { CreateFullTemplateScreen } from '@/screens/templates/CreateFullTemplateScreen';

export type TemplateStackParamList = {
  TemplateMarketplace: undefined;
  TemplateDetail: { templateId: string };
  CreateFullTemplate: undefined;
};

const Stack = createStackNavigator<TemplateStackParamList>();

export const TemplateNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
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
        name="TemplateMarketplace"
        component={TemplateMarketplaceScreen}
        options={{ title: '템플릿 마켓플레이스' }}
      />
      <Stack.Screen
        name="TemplateDetail"
        component={TemplateDetailScreen}
        options={{ title: '템플릿 상세' }}
      />
      <Stack.Screen
        name="CreateFullTemplate"
        component={CreateFullTemplateScreen}
        options={{ title: '템플릿 만들기' }}
      />
    </Stack.Navigator>
  );
};

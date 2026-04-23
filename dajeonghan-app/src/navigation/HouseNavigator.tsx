import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants';
import { HouseLayout, FurnitureType } from '@/types/house.types';
import { HouseSetupFlow } from '@/screens/house/HouseSetupFlow';
import { HouseEditorScreen } from '@/screens/house/HouseEditorScreen';
import { HouseLayoutSelectionScreen } from '@/screens/house/HouseLayoutSelectionScreen';
import { FurnitureDetailScreen } from '@/screens/furniture/FurnitureDetailScreen';

export type HouseStackParamList = {
  HouseMain: undefined;
  HouseEditor: { layout: HouseLayout };
  HouseLayoutSelection: undefined;
  FurnitureDetail: { 
    roomId: string; 
    furnitureId: string; 
    furnitureType: FurnitureType 
  };
};

const Stack = createStackNavigator<HouseStackParamList>();

export const HouseNavigator: React.FC = () => {
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
        name="HouseMain"
        component={HouseSetupFlow}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="HouseEditor"
        component={HouseEditorScreen}
        options={{ title: '집 편집' }}
      />
      <Stack.Screen
        name="HouseLayoutSelection"
        component={HouseLayoutSelectionScreen}
        options={{ title: '집 구조 선택' }}
      />
      <Stack.Screen
        name="FurnitureDetail"
        component={FurnitureDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
};

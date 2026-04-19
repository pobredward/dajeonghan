import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '@/constants';
import { HouseLayout, FurnitureType } from '@/types/house.types';
import { HouseMapScreen } from '@/screens/house/HouseMapScreen';
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="HouseMain"
        component={HouseMapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HouseEditor"
        component={HouseEditorScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HouseLayoutSelection"
        component={HouseLayoutSelectionScreen}
        options={{
          title: '집 구조 선택',
          headerBackTitle: '뒤로',
        }}
      />
      <Stack.Screen
        name="FurnitureDetail"
        component={FurnitureDetailScreen}
        options={{
          title: '', // 동적으로 설정됨
          headerBackTitle: '뒤로',
        }}
      />
    </Stack.Navigator>
  );
};

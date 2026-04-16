import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '@/constants';
import { HouseLayout } from '@/types/house.types';
import { HouseMapScreen } from '@/screens/house/HouseMapScreen';
import { HouseEditorScreen } from '@/screens/house/HouseEditorScreen';
import { HouseLayoutSelectionScreen } from '@/screens/house/HouseLayoutSelectionScreen';

export type HouseStackParamList = {
  HouseMain: undefined;
  HouseEditor: { layout: HouseLayout };
  HouseLayoutSelection: undefined;
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
    </Stack.Navigator>
  );
};

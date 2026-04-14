import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { CleaningHomeScreen } from '@/modules/cleaning/screens/CleaningHomeScreen';
import { FridgeHomeScreen } from '@/modules/fridge/screens/FridgeHomeScreen';
import { MedicineHomeScreen } from '@/modules/medicine/screens/MedicineHomeScreen';
import { SettingsNavigator } from './SettingsNavigator';

export type TabParamList = {
  Home: undefined;
  Cleaning: undefined;
  Fridge: undefined;
  Medicine: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8
        },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          height: Platform.OS === 'ios' ? 44 + insets.top : undefined,
        },
        headerStatusBarHeight: insets.top,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '오늘',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="Cleaning"
        component={CleaningHomeScreen}
        options={{
          title: '청소',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🧹</Text>
        }}
      />
      <Tab.Screen
        name="Fridge"
        component={FridgeHomeScreen}
        options={{
          title: '냉장고',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🥗</Text>
        }}
      />
      <Tab.Screen
        name="Medicine"
        component={MedicineHomeScreen}
        options={{
          title: '약',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>💊</Text>
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: '설정',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>⚙️</Text>,
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
};

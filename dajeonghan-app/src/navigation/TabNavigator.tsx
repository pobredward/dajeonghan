import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { CalendarScreen } from '@/screens/calendar/CalendarScreen';
import { HouseNavigator } from './HouseNavigator';
import { SettingsNavigator } from './SettingsNavigator';

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  HouseMap: undefined;
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
          backgroundColor: Colors.surface,
          height: Platform.OS === 'ios' ? 44 + insets.top : undefined,
        },
        headerStatusBarHeight: insets.top,
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.textPrimary,
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '오늘',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>📋</Text>
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: '달력',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="HouseMap"
        component={HouseNavigator}
        options={{
          title: '내 집',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🏠</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: '설정',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

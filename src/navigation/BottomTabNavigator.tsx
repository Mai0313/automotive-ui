import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
// ...可依需求引入其他頁面

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#181A1B',
          borderTopWidth: 0,
          height: 70,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen name="首頁" component={HomeScreen} />
      {/* 之後可加入導航、音樂、車輛資訊、空調、AI 助理頁 */}
    </Tab.Navigator>
  );
}

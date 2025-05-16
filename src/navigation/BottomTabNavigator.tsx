import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import NavigationScreen from '../screens/NavigationScreen';
import MusicScreen from '../screens/MusicScreen';
import VehicleInfoScreen from '../screens/VehicleInfoScreen';
import ClimateScreen from '../screens/ClimateScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof MaterialIcons>['name'] = 'home'; // Default icon

          if (route.name === 'Home') {
            iconName = 'home'; // Use base name
          } else if (route.name === 'Navigation') {
            iconName = 'navigation'; // Use base name
          } else if (route.name === 'Music') {
            iconName = 'music-note'; // Use base name
          } else if (route.name === 'Vehicle') {
            iconName = 'directions-car'; // Use base name
          } else if (route.name === 'Climate') {
            iconName = 'ac-unit'; // Use base name
          } else if (route.name === 'AI') {
            iconName = 'mic'; // Use base name
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 0, 
        },
        headerShown: false, // Hide header for all screens
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Navigation" component={NavigationScreen} />
      <Tab.Screen name="Music" component={MusicScreen} />
      <Tab.Screen name="Vehicle" component={VehicleInfoScreen} />
      <Tab.Screen name="Climate" component={ClimateScreen} />
      <Tab.Screen name="AI" component={AIAssistantScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

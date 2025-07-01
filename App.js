import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './src/screens/Welcome';
import IntroSlider from './src/screens/Welcome/IntroSlider';
import PrivacyScreen from './src/screens/Welcome/Privacy';
import StartScreen from './src/screens/Welcome/Start';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="IntroSlider" component={IntroSlider} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Start" component={StartScreen} />
        {/* 之後可在這裡加入介紹頁面 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './src/screens/Welcome';
import IntroSlider from './src/screens/Welcome/IntroSlider';
import PrivacyScreen from './src/screens/Welcome/Privacy';
import StartScreen from './src/screens/Welcome/Start';
import HomePage from './src/screens/Home/Homepage';
import SignUpScreen from './src/screens/SignUp/SignUp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import HappinessScreen from './src/screens/Game/Happiness'; // ← 新增這行
import ProfileScreen from './src/screens/Profile/Profile';


const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      setInitialRoute(loggedIn === 'true' ? 'HomePage' : 'Welcome');
    };
    checkLogin();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#78A784" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="IntroSlider" component={IntroSlider} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="Happiness" component={HappinessScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 
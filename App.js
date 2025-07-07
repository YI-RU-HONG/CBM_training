import './src/services/firebase'; // 初始化 Firebase
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';

// 畫面元件
import AuthEntry from './src/screens/AuthEntry'; 
import WelcomeScreen from './src/screens/Welcome/Welcome';
import IntroSlider from './src/screens/Welcome/IntroSlider';
import PrivacyScreen from './src/screens/Welcome/Privacy';
import StartScreen from './src/screens/Welcome/Start';
import HomePage from './src/screens/Home/HomePage';
import SignUpScreen from './src/screens/SignUp/SignUp';
import EmotionScreen from './src/screens/Game/Emotion';
import ProfileScreen from './src/screens/Profile/Profile';
import DeepBreathScreen from './src/screens/DeepBreath/DeepBreath';
import QuotesScreen from './src/screens/Profile/Quotes';
import ReasonSelect from './src/screens/Game/ReasonSelect';
import GameScreen from './src/screens/Game/Game';
import Game2Screen from './src/screens/Game/Game2';
import Game3Screen from './src/screens/Game/Game3';
import StatisticsScreen from './src/screens/Statistics/Statistics';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'ArialHebrewScholar-Regular': require('./assets/fonts/arial-hebrew-regular.ttf'), 
        'ArialBlack': require('./assets/fonts/arial_black.ttf'),
        'ArialRoundedMTBold': require('./assets/fonts/arialroundedmtbold.ttf'),
        'PottaOne-Regular': require('./assets/fonts/PottaOne-Regular.ttf'),
        'ArialUnicodeMS': require('./assets/fonts/arial unicode ms.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#78A784" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthEntry" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthEntry" component={AuthEntry} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="IntroSlider" component={IntroSlider} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="Emotion" component={EmotionScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="DeepBreath" component={DeepBreathScreen} />
        <Stack.Screen name="Quotes" component={QuotesScreen} />
        <Stack.Screen name="ReasonSelect" component={ReasonSelect} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Game2" component={Game2Screen} />
        <Stack.Screen name="Game3" component={Game3Screen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

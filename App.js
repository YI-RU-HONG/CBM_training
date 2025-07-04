import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './src/screens/Welcome/Welcome';
import IntroSlider from './src/screens/Welcome/IntroSlider';
import PrivacyScreen from './src/screens/Welcome/Privacy';
import StartScreen from './src/screens/Welcome/Start';
import HomePage from './src/screens/Home/HomePage';
import SignUpScreen from './src/screens/SignUp/SignUp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import EmotionScreen from './src/screens/Game/Emotion'; 
import ProfileScreen from './src/screens/Profile/Profile';
import DeepBreathScreen from './src/screens/DeepBreath/DeepBreath';
import QuotesScreen from './src/screens/Profile/Quotes';
import { useFonts } from 'expo-font';


const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    ArialRoundedMTBold: require('./assets/fonts/arialroundedmtbold.ttf'),
    ArialUnicodeMS: require('./assets/fonts/arial unicode ms.otf'),
    ArialUnicodeMSBold: require('./assets/fonts/arial unicode ms bold.otf'),
    ArialBlack: require('./assets/fonts/arial_black.ttf'),
    PottaOne: require('./assets/fonts/PottaOne-Regular.ttf'),
  });
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      setInitialRoute(loggedIn === 'true' ? 'HomePage' : 'Welcome');
    };
    checkLogin();
  }, []);

  if (!fontsLoaded || !initialRoute) {
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
        <Stack.Screen name="Emotion" component={EmotionScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="DeepBreath" component={DeepBreathScreen} />
        <Stack.Screen name="Quotes" component={QuotesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthEntry({ navigation }) {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkLocalAuth = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem('userLoggedIn');
        const uid = await AsyncStorage.getItem('userUID');
        console.log('🧩 Local login check:', loggedIn, uid);

        if (loggedIn === 'true' && uid) {
          navigation.replace('HomePage');
        } else {
          navigation.replace('SignUp');
        }
      } catch (error) {
        console.log('⚠️ Auth check error:', error);
        navigation.replace('SignUp');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkLocalAuth();
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#78A784" />
      </View>
    );
  }

  return null;
}

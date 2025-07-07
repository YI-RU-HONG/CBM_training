// screens/AuthEntry.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';

export default function AuthEntry({ navigation }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🧩 Firebase auth state:', user?.email || 'No user');

      if (user) {
        await AsyncStorage.setItem('userLoggedIn', 'true');
        await AsyncStorage.setItem('userUID', user.uid);
        navigation.replace('HomePage');
      } else {
        await AsyncStorage.removeItem('userLoggedIn');
        await AsyncStorage.removeItem('userUID');
        navigation.replace('SignUp');
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#78A784" />
      </View>
    );
  }

  return null;
}

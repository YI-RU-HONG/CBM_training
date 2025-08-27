import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function AuthEntry({ navigation }) {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check async-storage content
    AsyncStorage.getAllKeys().then(keys => {
      console.log('🗝️ AsyncStorage keys:', keys);
      if (keys.length > 0) {
        AsyncStorage.multiGet(keys).then(results => {
          console.log('🗝️ AsyncStorage all values:', results);
        });
      }
    });

    console.log('🧩 AuthEntry mounted, starting auth check...');
    
    const auth = getAuth();
    console.log('🧩 Firebase auth instance:', auth);
    
    // Check local storage first
    const checkLocalStorage = async () => {
      const loggedIn = await AsyncStorage.getItem('userLoggedIn');
      const storedUID = await AsyncStorage.getItem('userUID');
      
      console.log('🧩 Initial local storage check:', { loggedIn, storedUID });
      
      // If local storage shows logged in, navigate directly to HomePage
      if (loggedIn === 'true' && storedUID) {
        console.log('🧩 Local storage shows logged in, navigating to HomePage...');
        navigation.navigate('HomePage');
        return true; // Indicates processed
      }
      return false; // Indicates need to wait for Firebase authentication
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('🧩 Firebase auth state changed:', user ? `User logged in (${user.uid})` : 'No user');
        
        if (user) {
          // Firebase user is logged in, update local storage
          const loggedIn = await AsyncStorage.getItem('userLoggedIn');
          const storedUID = await AsyncStorage.getItem('userUID');
          
          console.log('🧩 Local storage check:', { loggedIn, storedUID, firebaseUID: user.uid });
          
                      // Update local storage
          await AsyncStorage.setItem('userLoggedIn', 'true');
          await AsyncStorage.setItem('userUID', user.uid);
          console.log('🧩 Updated local storage with Firebase user');
          
                      // If not currently on HomePage, navigate
          setTimeout(() => {
            console.log('🧩 Navigating to HomePage...');
            try {
              navigation.navigate('HomePage');
              console.log('🧩 Navigation to HomePage successful');
            } catch (navError) {
              console.error('🧩 Navigation error:', navError);
                              // If navigation fails, try using replace
              try {
                navigation.replace('HomePage');
                console.log('🧩 Replace navigation to HomePage successful');
              } catch (replaceError) {
                console.error('🧩 Replace navigation also failed:', replaceError);
              }
            }
          }, 100);
                  } else {
            // Firebase has no user logged in, check local storage
          const loggedIn = await AsyncStorage.getItem('userLoggedIn');
          const storedUID = await AsyncStorage.getItem('userUID');
          
          console.log('🧩 No Firebase user, local storage:', { loggedIn, storedUID });
          
          // If local storage shows logged in, maintain login state (let Firebase recover in background)
          if (loggedIn === 'true' && storedUID) {
            console.log('🧩 Local storage shows logged in, keeping user logged in - Firebase will restore in background');
            // Don't navigate because already on HomePage
            // Or if not yet navigated, navigate to HomePage
            setTimeout(() => {
              try {
                navigation.navigate('HomePage');
                console.log('🧩 Navigation to HomePage from Firebase check');
              } catch (navError) {
                console.log('🧩 Already on HomePage or navigation failed');
              }
            }, 100);
          } else {
            // Local storage also has no login info, navigate to Welcome
            navigation.navigate('Welcome');
          }
        }
      } catch (error) {
        console.log('⚠️ Auth check error:', error);
        // When error occurs, check local storage as backup
        const loggedIn = await AsyncStorage.getItem('userLoggedIn');
        const storedUID = await AsyncStorage.getItem('userUID');
        
        if (loggedIn === 'true' && storedUID) {
          console.log('🧩 Error occurred but local storage shows logged in, navigating to HomePage');
          navigation.navigate('HomePage');
        } else {
          navigation.navigate('Welcome');
        }
      } finally {
        setCheckingAuth(false);
      }
    });

    // Check local storage first, if logged in then navigate immediately
    checkLocalStorage().then(handled => {
      if (!handled) {
                  // If local storage has no login info, wait for Firebase auth check
        console.log('🧩 No local login info, waiting for Firebase auth...');
      }
    });

    // Cleanup function
    return () => {
      console.log('🧩 AuthEntry unmounting, unsubscribing from auth state...');
      unsubscribe();
    };
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

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function AuthEntry({ navigation }) {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // 檢查 async-storage 內容
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
    
    // 先檢查本地儲存
    const checkLocalStorage = async () => {
      const loggedIn = await AsyncStorage.getItem('userLoggedIn');
      const storedUID = await AsyncStorage.getItem('userUID');
      
      console.log('🧩 Initial local storage check:', { loggedIn, storedUID });
      
      // 如果本地儲存顯示已登入，直接導向 HomePage
      if (loggedIn === 'true' && storedUID) {
        console.log('🧩 Local storage shows logged in, navigating to HomePage...');
        navigation.navigate('HomePage');
        return true; // 表示已處理
      }
      return false; // 表示需要等待 Firebase 認證
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('🧩 Firebase auth state changed:', user ? `User logged in (${user.uid})` : 'No user');
        
        if (user) {
          // Firebase 用戶已登入，更新本地儲存
          const loggedIn = await AsyncStorage.getItem('userLoggedIn');
          const storedUID = await AsyncStorage.getItem('userUID');
          
          console.log('🧩 Local storage check:', { loggedIn, storedUID, firebaseUID: user.uid });
          
          // 更新本地儲存
          await AsyncStorage.setItem('userLoggedIn', 'true');
          await AsyncStorage.setItem('userUID', user.uid);
          console.log('🧩 Updated local storage with Firebase user');
          
          // 如果當前不在 HomePage，則導航
          setTimeout(() => {
            console.log('🧩 Navigating to HomePage...');
            try {
              navigation.navigate('HomePage');
              console.log('🧩 Navigation to HomePage successful');
            } catch (navError) {
              console.error('🧩 Navigation error:', navError);
              // 如果導航失敗，嘗試使用 replace
              try {
                navigation.replace('HomePage');
                console.log('🧩 Replace navigation to HomePage successful');
              } catch (replaceError) {
                console.error('🧩 Replace navigation also failed:', replaceError);
              }
            }
          }, 100);
        } else {
          // Firebase 沒有用戶登入，檢查本地儲存
          const loggedIn = await AsyncStorage.getItem('userLoggedIn');
          const storedUID = await AsyncStorage.getItem('userUID');
          
          console.log('🧩 No Firebase user, local storage:', { loggedIn, storedUID });
          
          // 如果本地儲存顯示已登入，保持登入狀態（讓 Firebase 在背景恢復）
          if (loggedIn === 'true' && storedUID) {
            console.log('🧩 Local storage shows logged in, keeping user logged in - Firebase will restore in background');
            // 不導航，因為已經在 HomePage 了
            // 或者如果還沒導航，則導航到 HomePage
            setTimeout(() => {
              try {
                navigation.navigate('HomePage');
                console.log('🧩 Navigation to HomePage from Firebase check');
              } catch (navError) {
                console.log('🧩 Already on HomePage or navigation failed');
              }
            }, 100);
          } else {
            // 本地儲存也沒有登入資訊，導向 Welcome
            navigation.navigate('Welcome');
          }
        }
      } catch (error) {
        console.log('⚠️ Auth check error:', error);
        // 發生錯誤時，檢查本地儲存作為備用
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

    // 先檢查本地儲存，如果已登入則立即導航
    checkLocalStorage().then(handled => {
      if (!handled) {
        // 如果本地儲存沒有登入資訊，等待 Firebase 認證檢查
        console.log('🧩 No local login info, waiting for Firebase auth...');
      }
    });

    // 清理函數
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

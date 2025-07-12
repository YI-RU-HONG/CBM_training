// services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 檢查配置是否完整
const missingConfigs = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfigs.length > 0) {
  console.error('❌ Missing Firebase configs:', missingConfigs);
  console.error('❌ Firebase config:', firebaseConfig);
} else {
  console.log('✅ Firebase config loaded successfully');
}

console.log('🔥 Firebase config:', firebaseConfig);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化認證
let auth;
if (getApps().length === 0) {
  // 第一次初始化
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('🔥 Firebase auth initialized with persistence');
} else {
  // 後續初始化
  auth = getAuth(app);
  console.log('🔥 Firebase auth retrieved from existing app');
}

// 確保持久化設定
setPersistence(auth, getReactNativePersistence(AsyncStorage))
  .then(() => {
    console.log('🔥 Firebase persistence set successfully');
  })
  .catch((error) => {
    console.error('🔥 Firebase persistence error:', error);
  });

const db = getFirestore(app);

export { auth, db };

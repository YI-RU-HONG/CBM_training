import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Dimensions, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
  import { auth } from '../../services/firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignUpScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isFilled = username && email && password;

  // 開啟 app 時自動檢查登入狀態
  useEffect(() => {
    const checkLogin = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (loggedIn === 'true') {
        navigation.replace('HomePage');
      }
    };
    checkLogin();
  }, []);

  // 註冊並設置登入狀態
  const handleSignUp = async () => {
    if (!isFilled) return;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      navigation.replace('HomePage');
    } catch (error) {
      alert(error.message || '註冊失敗，請稍後再試');
    }
  };

  return (
    <View style={styles.container}>
      {/* 角色圖片 */}
      <Image
        source={require('../../../assets/images/log in.png')}
        style={styles.character}
        resizeMode="stretch"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: '100%' }}
        keyboardVerticalOffset={SCREEN_HEIGHT * 0.04}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* User name */}
          <Text style={styles.label}>User name</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#BDBDBD"
            value={username}
            onChangeText={setUsername}
          />
          {/* Email */}
          <Text style={[styles.label, { marginTop: 24 }]}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#BDBDBD"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {/* Password */}
          <Text style={[styles.label, { marginTop: 24 }]}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#BDBDBD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {/* 註冊按鈕 */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isFilled ? 'rgba(245,140,69,1)' : '#ccc' }]}
            onPress={handleSignUp}
            activeOpacity={isFilled ? 0.7 : 1}
            disabled={!isFilled}
          >
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,250,237,1)', // UIColor(red: 1, green: 0.98, blue: 0.93, alpha: 1)
    alignItems: 'center',
  },
  character: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.41,
    zIndex: 1,
  },
  formContainer: {
    marginTop: SCREEN_HEIGHT * 0.41 + 24, // 角色下方
    alignItems: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: SCREEN_WIDTH * 0.1,
    fontSize: SCREEN_HEIGHT * 0.021,
    color: '#222',
    marginBottom: 8,
    fontWeight: '400',
  },
  input: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.06,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    fontSize: SCREEN_HEIGHT * 0.021,
    marginBottom: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: 'rgba(245,140,69,1)', // UIColor(red: 0.96, green: 0.55, blue: 0.27, alpha: 1)
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.017,
    marginTop: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SCREEN_HEIGHT * 0.021,
    textAlign: 'center',
  },
}); 
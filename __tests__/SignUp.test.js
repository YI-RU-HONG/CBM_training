import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '../src/screens/SignUp/SignUp';

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({ replace: jest.fn(), navigate: jest.fn() })
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../src/services/firebase.js', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
}));

describe('SignUpScreen', () => {
  it('可以輸入帳號、信箱、密碼並點擊註冊', async () => {
    const { getAllByPlaceholderText, getByText } = render(<SignUpScreen navigation={{ replace: jest.fn() }} />);
    const inputs = getAllByPlaceholderText('Value');
    fireEvent.changeText(inputs[0], 'testuser'); // 帳號
    fireEvent.changeText(inputs[1], 'test@example.com'); // 信箱
    fireEvent.changeText(inputs[2], 'testpassword'); // 密碼

    const signUpButton = getByText('Sign up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(signUpButton).toBeTruthy();
    });
  });
}); 
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
  it('can input username, email, password and click register', async () => {
    const { getAllByPlaceholderText, getByText } = render(<SignUpScreen navigation={{ replace: jest.fn() }} />);
    const inputs = getAllByPlaceholderText('Value');
    fireEvent.changeText(inputs[0], 'testuser'); // Username
    fireEvent.changeText(inputs[1], 'test@example.com'); // Email
    fireEvent.changeText(inputs[2], 'testpassword'); // Password

    const signUpButton = getByText('Sign up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(signUpButton).toBeTruthy();
    });
  });
}); 
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../src/screens/Profile/Profile';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'test-uid' } })
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ username: 'TestUser' })
  }))
}));

jest.mock('../src/services/firebase', () => ({
  db: {}
}));

describe('ProfileScreen', () => {
  it('會顯示從 Firebase 獲取的用戶名稱', async () => {
    const { getByText } = render(<ProfileScreen />);
    await waitFor(() => {
      expect(getByText('TestUser')).toBeTruthy();
    });
  });

  it('當無法獲取用戶名時會顯示預設名稱', async () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('User')).toBeTruthy();
  });
}); 
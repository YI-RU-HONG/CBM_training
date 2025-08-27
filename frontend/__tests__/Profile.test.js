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
  it('displays username fetched from Firebase', async () => {
    const { getByText } = render(<ProfileScreen />);
    await waitFor(() => {
      expect(getByText('TestUser')).toBeTruthy();
    });
  });

  it('displays default name when unable to get username', async () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('User')).toBeTruthy();
  });
}); 
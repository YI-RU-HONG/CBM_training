import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import StatisticsScreen from '../src/screens/Statistics/Statistics';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id'
    }
  }))
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({
    docs: []
  })),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ username: 'TestUser' })
  })),
  doc: jest.fn()
}));

jest.mock('../src/services/firebase', () => ({
  db: {}
}));

jest.mock('../src/services/openai', () => ({
  getMoodeeMessage: jest.fn(() => Promise.resolve('Test message'))
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn()
};

describe('StatisticsScreen', () => {
  it('renders without crashing', async () => {
    const { getByText } = render(
      <StatisticsScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByText('Your Emotional Journey')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByText } = render(
      <StatisticsScreen navigation={mockNavigation} />
    );
    
    expect(getByText('載入中...')).toBeTruthy();
  });
}); 
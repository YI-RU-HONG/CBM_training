import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Profile from '../src/screens/Profile';
import * as api from '../src/services/api';

jest.spyOn(api, 'fetchUserProfile').mockResolvedValue({ name: 'Moodee' });

describe('Profile', () => {
  it('會顯示 API 回傳的用戶名稱', async () => {
    const { getByText } = render(<Profile userId="123" />);
    await waitFor(() => {
      expect(getByText('Moodee')).toBeTruthy();
    });
  });
}); 
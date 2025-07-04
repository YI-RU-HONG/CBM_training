import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomePage from '../src/screens/Home/HomePage';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() })
}));

describe('HomePage', () => {
  it('應該正確渲染畫面', () => {
    const { getByText } = render(<HomePage navigation={{ navigate: jest.fn() }} />);
    expect(getByText("Hi! Name,\nI'm moodee, your\npersonal coach.")).toBeTruthy();
  });

  it('點擊 stamp 節點可觸發 navigation', () => {
    const navigate = jest.fn();
    const { getByTestId } = render(<HomePage navigation={{ navigate }} />);
    const stamp = getByTestId('stamp-0');
    fireEvent.press(stamp);
    expect(navigate).toHaveBeenCalled();
  });
}); 
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import QuotesScreen from '../src/screens/Profile/Quotes';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));

// Mock QuotesContext
const mockQuotes = [
  { id: '1', text: 'You are doing great!', timestamp: '2024-01-01T00:00:00.000Z' },
  { id: '2', text: 'Keep up the good work!', timestamp: '2024-01-02T00:00:00.000Z' }
];

const mockUseQuotes = {
  quotes: mockQuotes,
  deleteQuote: jest.fn().mockResolvedValue({ success: true, message: 'Quote deleted successfully!' }),
  clearAllQuotes: jest.fn().mockResolvedValue({ success: true, message: 'All quotes have been cleared!' })
};

jest.mock('../src/context/QuotesContext', () => ({
  useQuotes: () => mockUseQuotes
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('QuotesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該正確渲染標題', () => {
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('My Safe Quotes')).toBeTruthy();
  });

  it('應該顯示保存的語句', () => {
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('You are doing great!')).toBeTruthy();
  });

  it('應該顯示操作按鈕', () => {
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('🗑️ 刪除')).toBeTruthy();
    expect(getByText('🗑️ 清空全部')).toBeTruthy();
  });

  it('點擊刪除按鈕會顯示確認對話框', () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 刪除'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      expect.any(Array)
    );
  });

  it('點擊清空全部按鈕會顯示確認對話框', () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 清空全部'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear All Quotes',
      'Are you sure you want to clear all saved quotes? This action cannot be undone.',
      expect.any(Array)
    );
  });

  it('確認刪除會調用 deleteQuote 函數', async () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 刪除'));
    
    // 獲取確認對話框的按鈕並點擊
    const alertCall = Alert.alert.mock.calls[0];
    const confirmButton = alertCall[2].find(button => button.text === 'Delete');
    confirmButton.onPress();
    
    await waitFor(() => {
      expect(mockUseQuotes.deleteQuote).toHaveBeenCalledWith('1');
    });
  });

  it('確認清空會調用 clearAllQuotes 函數', async () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 清空全部'));
    
    // 獲取確認對話框的按鈕並點擊
    const alertCall = Alert.alert.mock.calls[0];
    const confirmButton = alertCall[2].find(button => button.text === 'Clear All');
    confirmButton.onPress();
    
    await waitFor(() => {
      expect(mockUseQuotes.clearAllQuotes).toHaveBeenCalled();
    });
  });

  it('當沒有語句時應該顯示空狀態', () => {
    // 模擬空語句狀態
    mockUseQuotes.quotes = [];
    
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('No quotes saved yet. Tap the heart to save your favorite Moodee quotes!')).toBeTruthy();
  });

  it('當沒有語句時不應該顯示操作按鈕', () => {
    // 模擬空語句狀態
    mockUseQuotes.quotes = [];
    
    const { queryByText } = render(<QuotesScreen />);
    expect(queryByText('🗑️ 刪除')).toBeNull();
    expect(queryByText('🗑️ 清空全部')).toBeNull();
  });
}); 
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

  it('should render title correctly', () => {
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('My Safe Quotes')).toBeTruthy();
  });

  it('should display saved quotes', () => {
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('You are doing great!')).toBeTruthy();
  });

  it('should display action buttons', () => {
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('🗑️ 刪除')).toBeTruthy();
    expect(getByText('🗑️ 清空全部')).toBeTruthy();
  });

  it('clicking delete button shows confirmation dialog', () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 刪除'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      expect.any(Array)
    );
  });

  it('clicking clear all button shows confirmation dialog', () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 清空全部'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear All Quotes',
      'Are you sure you want to clear all saved quotes? This action cannot be undone.',
      expect.any(Array)
    );
  });

  it('confirming delete calls deleteQuote function', async () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 刪除'));
    
    // Get and click confirmation dialog button
    const alertCall = Alert.alert.mock.calls[0];
    const confirmButton = alertCall[2].find(button => button.text === 'Delete');
    confirmButton.onPress();
    
    await waitFor(() => {
      expect(mockUseQuotes.deleteQuote).toHaveBeenCalledWith('1');
    });
  });

  it('confirming clear all calls clearAllQuotes function', async () => {
    const { getByText } = render(<QuotesScreen />);
    
    fireEvent.press(getByText('🗑️ 清空全部'));
    
    // Get and click confirmation dialog button
    const alertCall = Alert.alert.mock.calls[0];
    const confirmButton = alertCall[2].find(button => button.text === 'Clear All');
    confirmButton.onPress();
    
    await waitFor(() => {
      expect(mockUseQuotes.clearAllQuotes).toHaveBeenCalled();
    });
  });

  it('should display empty state when no quotes', () => {
    // Mock empty quotes state
    mockUseQuotes.quotes = [];
    
    const { getByText } = render(<QuotesScreen />);
    expect(getByText('No quotes saved yet. Tap the heart to save your favorite Moodee quotes!')).toBeTruthy();
  });

  it('should not display action buttons when no quotes', () => {
    // Mock empty quotes state
    mockUseQuotes.quotes = [];
    
    const { queryByText } = render(<QuotesScreen />);
    expect(queryByText('🗑️ 刪除')).toBeNull();
    expect(queryByText('🗑️ 清空全部')).toBeNull();
  });
}); 
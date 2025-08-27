import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomePage from '../src/screens/Home/HomePage';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() })
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: null })
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

jest.mock('../../src/services/firebase', () => ({
  db: {}
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock QuotesContext
jest.mock('../src/context/QuotesContext', () => ({
  useQuotes: () => ({
    saveQuote: jest.fn().mockResolvedValue({ success: true, message: 'Quote saved successfully!' })
  })
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('HomePage', () => {
  it('應該正確渲染畫面', () => {
    const { getByText } = render(<HomePage navigation={{ navigate: jest.fn() }} />);
    expect(getByText("Hi! I'm moodee, your personal coach.")).toBeTruthy();
  });

  it('點擊未完成的 stamp 節點可直接開始遊戲', () => {
    const navigate = jest.fn();
    const { getByTestId } = render(<HomePage navigation={{ navigate }} />);
    
    fireEvent.press(getByTestId('stamp-0'));
    expect(navigate).toHaveBeenCalledWith('Emotion');
  });

  it('點擊已完成的 stamp 節點會顯示確認對話框', () => {
    const navigate = jest.fn();
    const { getByTestId } = render(<HomePage navigation={{ navigate }} />);
    
    // 模擬今天的 stamp 已完成
    const todayStamp = getByTestId('stamp-0');
    fireEvent.press(todayStamp);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Restart Training',
      'You have already completed the training today. Are you sure you want to restart?',
      expect.any(Array)
    );
  });

  it('確認重新開始後會清除完成狀態並導航到遊戲', () => {
    const navigate = jest.fn();
    const { getByTestId } = render(<HomePage navigation={{ navigate }} />);
    
    // 模擬今天的 stamp 已完成
    const todayStamp = getByTestId('stamp-0');
    fireEvent.press(todayStamp);
    
    // 獲取確認對話框的按鈕並點擊
    const alertCall = Alert.alert.mock.calls[0];
    const confirmButton = alertCall[2].find(button => button.text === 'Restart');
    confirmButton.onPress();
    
    expect(navigate).toHaveBeenCalledWith('Emotion');
  });

  it('取消重新開始不會導航到遊戲', () => {
    const navigate = jest.fn();
    const { getByTestId } = render(<HomePage navigation={{ navigate }} />);
    
    // 模擬今天的 stamp 已完成
    const todayStamp = getByTestId('stamp-0');
    fireEvent.press(todayStamp);
    
    // 獲取確認對話框的按鈕並點擊取消
    const alertCall = Alert.alert.mock.calls[0];
    const cancelButton = alertCall[2].find(button => button.text === 'Cancel');
    cancelButton.onPress();
    
    expect(navigate).not.toHaveBeenCalled();
  });

  it('愛心按鈕應該存在', () => {
    const { getByText } = render(<HomePage navigation={{ navigate: jest.fn() }} />);
    expect(getByText('🤍')).toBeTruthy();
  });

  it('點擊愛心按鈕會嘗試保存語句', async () => {
    const { getByText } = render(<HomePage navigation={{ navigate: jest.fn() }} />);
    
    const heartButton = getByText('🤍');
    fireEvent.press(heartButton);
    
    // 檢查是否顯示了無法保存的提示
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Cannot Save', 'Only Moodee\'s advice messages can be saved!');
    });
  });
}); 
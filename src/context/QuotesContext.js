import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuotesContext = createContext();

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};

export const QuotesProvider = ({ children }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 從 AsyncStorage 載入語句
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const savedQuotes = await AsyncStorage.getItem('saved_quotes');
      if (savedQuotes) {
        setQuotes(JSON.parse(savedQuotes));
      }
    } catch (error) {
      console.log('載入語句失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存新語句
  const saveQuote = async (quote) => {
    try {
      // 檢查是否已經存在相同的語句
      if (quotes.some(q => q.text === quote)) {
        return { success: false, message: 'This quote has already been saved.' };
      }

      const newQuote = {
        id: Date.now().toString(),
        text: quote,
        timestamp: new Date().toISOString(),
      };

      const updatedQuotes = [...quotes, newQuote];
      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));
      setQuotes(updatedQuotes);
      
      return { success: true, message: 'Quote saved successfully!' };
    } catch (error) {
      console.log('保存語句失敗:', error);
      return { success: false, message: 'Save failed, please try again later.' };
    }
  };

  // 刪除語句
  const deleteQuote = async (quoteId) => {
    try {
      const updatedQuotes = quotes.filter(q => q.id !== quoteId);
      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));
      setQuotes(updatedQuotes);
      return { success: true, message: 'Quote deleted successfully!' };
    } catch (error) {
      console.log('刪除語句失敗:', error);
      return { success: false, message: 'Delete failed, please try again later.' };
    }
  };

  // 清空所有語句
  const clearAllQuotes = async () => {
    try {
      await AsyncStorage.removeItem('saved_quotes');
      setQuotes([]);
      return { success: true, message: 'All quotes have been cleared!' };
    } catch (error) {
      console.log('清空語句失敗:', error);
      return { success: false, message: 'Clear failed, please try again later.' };
    }
  };

  const value = {
    quotes,
    loading,
    saveQuote,
    deleteQuote,
    clearAllQuotes,
    loadQuotes,
  };

  return (
    <QuotesContext.Provider value={value}>
      {children}
    </QuotesContext.Provider>
  );
}; 
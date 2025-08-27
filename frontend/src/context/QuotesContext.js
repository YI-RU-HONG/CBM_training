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

  // Load quotes from AsyncStorage
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
      console.log('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save new quote
  const saveQuote = async (quote) => {
    try {
      // Check if the same quote already exists
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
      console.log('Failed to save quote:', error);
      return { success: false, message: 'Save failed, please try again later.' };
    }
  };

  // Delete quote
  const deleteQuote = async (quoteId) => {
    try {
      const updatedQuotes = quotes.filter(q => q.id !== quoteId);
      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));
      setQuotes(updatedQuotes);
      return { success: true, message: 'Quote deleted successfully!' };
    } catch (error) {
      console.log('Failed to delete quote:', error);
      return { success: false, message: 'Delete failed, please try again later.' };
    }
  };

  // Clear all quotes
  const clearAllQuotes = async () => {
    try {
      await AsyncStorage.removeItem('saved_quotes');
      setQuotes([]);
      return { success: true, message: 'All quotes have been cleared!' };
    } catch (error) {
      console.log('Failed to clear quotes:', error);
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
import React, { createContext, useContext, useState } from 'react';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [aiResponses, setAiResponses] = useState({});
  const [isUpdating, setIsUpdating] = useState({});

  const updateAIResponse = (key, response) => {
    setAiResponses(prev => ({
      ...prev,
      [key]: response
    }));
  };

  const setUpdateStatus = (key, status) => {
    setIsUpdating(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const getAIResponse = (key) => {
    return aiResponses[key] || null;
  };

  const isUpdatingResponse = (key) => {
    return isUpdating[key] || false;
  };

  return (
    <AIContext.Provider value={{
      aiResponses,
      isUpdating,
      updateAIResponse,
      setUpdateStatus,
      getAIResponse,
      isUpdatingResponse
    }}>
      {children}
    </AIContext.Provider>
  );
}; 
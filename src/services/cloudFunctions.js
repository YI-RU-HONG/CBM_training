import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const functions = getFunctions();
const auth = getAuth();

// process all users historical data
export const processAllUsersHistoricalData = async () => {
  try {
    const processHistoricalData = httpsCallable(functions, 'processAllUsersHistoricalData');
    const result = await processHistoricalData();
    console.log('📊 Historical data processing result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error processing historical data:', error);
    throw error;
  }
};

// calculate single user statistics
export const calculateUserStats = async () => {
  try {
    const calculateStats = httpsCallable(functions, 'calculateUserStats');
    const result = await calculateStats();
    console.log('📊 User stats calculation result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error calculating user stats:', error);
    throw error;
  }
};

// get user statistics
export const getUserStatistics = async () => {
  try {
    const getStats = httpsCallable(functions, 'getUserStatistics');
    const result = await getStats();
    console.log('📊 User statistics result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error getting user statistics:', error);
    // return default statistics data instead of throwing error
    return {
      totalGames: 0,
      emotionCounts: {},
      averageReactionTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyCompletion: {},
      lastUpdated: new Date()
    };
  }
};

// calculate all users historical statistics
export const calculateAllUsersHistoricalStats = async () => {
  try {
    const calculateAllStats = httpsCallable(functions, 'calculateAllUsersHistoricalStats');
    const result = await calculateAllStats();
    console.log('📊 All users historical stats result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error calculating all users historical stats:', error);
    throw error;
  }
};

// get Gemini AI message
export const getGeminiMessage = async (data) => {
  try {
    console.log('🤖 Calling getGeminiMessage with data:', data);
    console.log('🤖 Current auth state:', auth.currentUser);
    
    const getGeminiMsg = httpsCallable(functions, 'getGeminiMessage');
    const result = await getGeminiMsg(data);
    console.log('🤖 Gemini message result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error getting Gemini message:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    
    // return default message instead of throwing error
    return 'Sorry, I couldn\'t come up with something helpful this time.';
  }
};



// public Gemini function (HTTP request, no authentication required)
export const publicGeminiMessage = async (data) => {
  const maxRetries = 3; // increase retry times
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Calling public Gemini function (attempt ${attempt}/${maxRetries}) with data:`, data);
      
      // get function URL
      const functionUrl = `https://us-central1-cbm-app-2.cloudfunctions.net/publicGeminiMessage`;
      
      console.log('🤖 Function URL:', functionUrl);
      
      // create timeout controller - increase timeout to 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('🤖 Request timeout, aborting...');
        controller.abort();
      }, 30000); // 30 seconds timeout
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('🤖 Public function response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 Public function error response:', errorText);
        
            // try to parse error response
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            return errorData.message;
          }
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Public Gemini message result:', result);
      
      // directly return the original text, without any processing
      if (result.message) {
        return result.message;
      }
      
      return result.message;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      // if it is AbortError, wait longer before retrying
      if (error.name === 'AbortError') {
        console.log('🤖 Request was aborted due to timeout');
        if (attempt < maxRetries) {
          const delay = 2000 * attempt; // increasing waiting time: 2 seconds, 4 seconds, 6 seconds
          console.log(`🤖 Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        // other errors, use shorter waiting time
        if (attempt < maxRetries) {
          const delay = 1000; // fixed 1 second waiting time
          console.log(`🤖 Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  console.error('❌ All attempts failed, last error:', lastError);
  return 'Sorry, I couldn\'t come up with something helpful this time.';
}; 
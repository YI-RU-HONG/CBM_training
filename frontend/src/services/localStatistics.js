import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// get current user UID helper function
async function getCurrentUID() {
  const auth = getAuth();
  let user = auth.currentUser;
  let uid = null;
  
  if (!user) {
    uid = await AsyncStorage.getItem('userUID');
    console.log('📊 getCurrentUID - Firebase user is null, using UID from AsyncStorage:', uid);
  } else {
    uid = user.uid;
    console.log('📊 getCurrentUID - Using Firebase user UID:', uid);
  }
  
  return uid;
}

// check if it is consecutive days
function isConsecutiveDay(date1Str, date2Str) {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// local calculate user statistics
export async function calculateUserStatisticsLocal() {
  try {
    const uid = await getCurrentUID();
    if (!uid) {
      console.log('No logged in user');
      return getDefaultStatistics();
    }
    
    console.log(`📊 Calculating local statistics for user: ${uid}`);
    
    // 1. get user data
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists) {
      console.log('User not found');
      return getDefaultStatistics();
    }
    const username = userDoc.data().username;
    
    // 2. get all game results
    const gameCollections = ['game1_results', 'game2_results', 'game3_results', 'game4_results', 'game1b_results', 'game2b_results'];
    let totalGames = 0;
    let totalReactionTime = 0;
    let reactionTimeCount = 0;
    
    for (const collectionName of gameCollections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.username === username || doc.id.includes(username)) {
            const recordsRef = collection(collectionRef, doc.id, 'records');
            const recordsSnapshot = await getDocs(recordsRef);
            
            recordsSnapshot.forEach(record => {
              const recordData = record.data();
              if (recordData.username === username) {
                totalGames++;
                if (recordData.reactionTime && typeof recordData.reactionTime === 'number') {
                  totalReactionTime += recordData.reactionTime;
                  reactionTimeCount++;
                }
              }
            });
          }
        }
      } catch (error) {
        console.log(`Error accessing collection ${collectionName}:`, error.message);
      }
    }
    
    // 3. get emotion statistics
    const moodRecordsRef = collection(db, 'users', uid, 'moodRecords');
    const moodSnapshot = await getDocs(moodRecordsRef);
    const emotionCounts = {};
    
    moodSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.emotion) {
        emotionCounts[data.emotion] = (emotionCounts[data.emotion] || 0) + 1;
      }
    });
    
    // 4. calculate consecutive days
    const completionsRef = collection(db, 'users', uid, 'completions');
    const completionsSnapshot = await getDocs(completionsRef);
    const completedDates = [];
    
    completionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.completed && doc.id) {
        completedDates.push(doc.id);
      }
    });
    
    // sort dates and calculate consecutive days
    completedDates.sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < completedDates.length; i++) {
      if (i === 0 || isConsecutiveDay(completedDates[i-1], completedDates[i])) {
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    // 5. calculate the completion status of the past 7 days
    const weeklyCompletion = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      weeklyCompletion[dateStr] = completedDates.includes(dateStr);
    }
    
    // 6. calculate the average reaction time
    const averageReactionTime = reactionTimeCount > 0 ? Math.round(totalReactionTime / reactionTimeCount) : 0;
    
    // 7. combine statistics data
    const statistics = {
      totalGames,
      emotionCounts,
      averageReactionTime,
      currentStreak,
      longestStreak,
      weeklyCompletion,
      lastUpdated: new Date(),
    };
    
    console.log(`📊 Local statistics calculated for ${username}:`, statistics);
    return statistics;
    
  } catch (error) {
    console.error(`📊 Error calculating local statistics:`, error);
    return getDefaultStatistics();
  }
}

  // get default statistics data
function getDefaultStatistics() {
  return {
    totalGames: 0,
    emotionCounts: {},
    averageReactionTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyCompletion: {},
    lastUpdated: new Date(),
  };
}

// get user statistics data (local version)
export async function getUserStatisticsLocal() {
  try {
    console.log('📊 Getting local user statistics...');
    const statistics = await calculateUserStatisticsLocal();
    console.log('📊 Local user statistics result:', statistics);
    return statistics;
  } catch (error) {
    console.error('❌ Error getting local user statistics:', error);
    return getDefaultStatistics();
  }
}

// Local processing of all user historical data
export async function processAllUsersHistoricalDataLocal() {
  try {
    console.log('📊 Starting local historical data processing for all users...');
    
    // get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const results = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`📊 Processing historical data for user: ${userData.username} (${uid})`);
        
        // 1. process emotion records
        const moodRecordsRef = collection(db, 'users', uid, 'moodRecords');
        const moodSnapshot = await getDocs(moodRecordsRef);
        let moodRecordsProcessed = 0;
        
        moodSnapshot.forEach(doc => {
          const data = doc.data();
          moodRecordsProcessed++;
        });
        
        // 2. process game results
        const gameCollections = ['game1_results', 'game2_results', 'game3_results', 'game4_results', 'game1b_results', 'game2b_results'];
        let gameRecordsProcessed = 0;
        
        for (const collectionName of gameCollections) {
          try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            for (const doc of snapshot.docs) {
              const data = doc.data();
              if (data.username === userData.username || doc.id.includes(userData.username)) {
                gameRecordsProcessed++;
              }
            }
          } catch (error) {
            console.log(`Error accessing collection ${collectionName}:`, error.message);
          }
        }
        
        // 3. process completion status
        const completionsRef = collection(db, 'users', uid, 'completions');
        const completionsSnapshot = await getDocs(completionsRef);
        let completionsProcessed = 0;
        
        completionsSnapshot.forEach(doc => {
          const data = doc.data();
          completionsProcessed++;
        });
        
        // 4. recalculate statistics data
        const statistics = await calculateUserStatisticsLocal();
        
        results.push({
          uid,
          username: userData.username,
          success: true,
          processed: {
            moodRecords: moodRecordsProcessed,
            gameRecords: gameRecordsProcessed,
            completions: completionsProcessed,
            statistics: statistics
          }
        });
        
        console.log(`✅ Historical data processed for ${userData.username}:`, {
          moodRecords: moodRecordsProcessed,
          gameRecords: gameRecordsProcessed,
          completions: completionsProcessed
        });
        
      } catch (error) {
        console.error(`❌ Error processing historical data for user ${userData.username}:`, error);
        results.push({
          uid,
          username: userData.username,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('📊 Local historical data processing completed');
    console.log('📊 Results:', results);
    
    return {
      totalUsers: usersSnapshot.size,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
  } catch (error) {
    console.error('📊 Error in local historical data processing:', error);
    return {
      totalUsers: 0,
      successful: 0,
      failed: 1,
      results: [],
      error: error.message
    };
  }
}

// local calculate all users historical statistics
export async function calculateAllUsersHistoricalStatsLocal() {
  try {
    console.log('📊 Starting local historical statistics calculation for all users...');
    
    // get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const results = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`📊 Calculating stats for user: ${userData.username} (${uid})`);
        
          // calculate the statistics data of the user
        const statistics = await calculateUserStatisticsLocal();
        
        results.push({
          uid,
          username: userData.username,
          success: true,
          stats: statistics
        });
        
        console.log(`✅ Stats calculated for ${userData.username}:`, statistics);
        
      } catch (error) {
        console.error(`❌ Error calculating stats for user ${userData.username}:`, error);
        results.push({
          uid,
          username: userData.username,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('📊 Local historical statistics calculation completed');
    console.log('📊 Results:', results);
    
    return {
      totalUsers: usersSnapshot.size,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
  } catch (error) {
    console.error('📊 Error in local historical statistics calculation:', error);
    return {
      totalUsers: 0,
      successful: 0,
      failed: 1,
      results: [],
      error: error.message
    };
  }
} 
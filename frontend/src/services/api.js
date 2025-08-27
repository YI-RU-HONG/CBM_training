import { getFirestore, collection, addDoc, getDoc, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore(app);

// yyyy-MM-dd string
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// get current user UID helper function
async function getCurrentUID() {
  const auth = getAuth();
  let user = auth.currentUser;
  let uid = null;
  
  // if Firebase user is null, try to get UID from AsyncStorage
  if (!user) {
    uid = await AsyncStorage.getItem('userUID');
    console.log('🔍 getCurrentUID - Firebase user is null, using UID from AsyncStorage:', uid);
  } else {
    uid = user.uid;
    console.log('🔍 getCurrentUID - Using Firebase user UID:', uid);
  }
  
  return uid;
}

async function getUsernameFromUID(uid) {
  if (!uid) {
    console.log('🔍 getUsernameFromUID - No UID provided, returning anonymous');
    return 'anonymous';
  }
  
  try {
    console.log('🔍 getUsernameFromUID - Fetching user data for UID:', uid);
    
    // Add timeout for Firestore request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore request timeout')), 10000); // 10 second timeout
    });
    
    const userDocPromise = getDoc(doc(db, 'users', uid));
    const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const username = data.username || 'anonymous';
      console.log('🔍 getUsernameFromUID - User data found:', data);
      console.log('🔍 getUsernameFromUID - Returning username:', username);
      return username;
    } else {
      console.log('🔍 getUsernameFromUID - User document does not exist for UID:', uid);
      return 'anonymous';
    }
  } catch (error) {
    console.log('🔍 getUsernameFromUID - Error fetching user data:', error);
    console.log('🔍 getUsernameFromUID - Returning anonymous due to error');
    return 'anonymous';
  }
}

export async function saveGame1Result({ emotion, reasons, reactionTime, dotIdx, pairIdx, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;

  // save in game1_results/date_username/random_id
  const resultRef = collection(db, 'game1_results', docId, 'records');

  await addDoc(resultRef, {
    username,
    emotion,
    reasons,
    reactionTime,
    dotIdx,
    pairIdx,
    timestamp,
  });
}

export async function saveGame2Result({ emotion, reasons, reactionTime, level, positiveImgIdx, pos, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;

  const resultRef = collection(db, 'game2_results', docId, 'records');

  await addDoc(resultRef, {
    username,
    emotion,
    reasons,
    reactionTime,
    level,
    positiveImgIdx,
    pos,
    timestamp,
  });
}

export async function saveGame3Result({ difficulty, word, wordImg, sentence, sentenceImg, isRelated, reactionTime, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;

  const resultRef = collection(db, 'game3_results', docId, 'records');

  await addDoc(resultRef, {
    username,
    difficulty,
    word,
    // wordImg,
    sentence,
    // sentenceImg,
    isRelated,
    reactionTime,
    timestamp,
  });
}

// import { db } from './firebase';
// import { collection, addDoc } from 'firebase/firestore';

export async function saveGame4Result({ difficulty, question, image, answer, answerText, reactionTime, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;

  const resultRef = collection(db, 'game4_results', docId, 'records');

  await addDoc(resultRef, {
    username,
    difficulty,
    question,
    image,
    answer,
    answerText,
    reactionTime,
    timestamp,
  });
}

// new: save emotion and reasons
export async function saveEmotionAndReasons({ emotion, reasons }) {
  const uid = await getCurrentUID();
  console.log('🔍 saveEmotionAndReasons - Current user UID:', uid);
  
  const username = await getUsernameFromUID(uid);
  console.log('🔍 saveEmotionAndReasons - Retrieved username:', username);
  
  const dateString = getDateString(); // get today's date string
  console.log('🔍 saveEmotionAndReasons - Date string:', dateString);
  
  // save to users/{uid}/moodRecords collection, consistent with Statistics page query path
  const resultRef = collection(db, `users/${uid}/moodRecords`);
  console.log('🔍 saveEmotionAndReasons - Collection path:', `users/${uid}/moodRecords`);
  
  const result = await addDoc(resultRef, {
    username,
    emotion: emotion.toLowerCase(), // use lowercase, consistent with Statistics page
    reasons,
    date: dateString, // add date field
    timestamp: Date.now(),
  });
  
  console.log('🔍 saveEmotionAndReasons - Document saved with ID:', result.id);
}

/**
 * register new user and write to Firestore
 * first 6 users are group A, the rest are group B
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @returns {Promise<{uid: string, group: string}>}
 */
export async function registerUser({ email, password, username }) {
  const auth = getAuth();
  // create Auth account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // check how many users in users collection
  const usersSnap = await getDocs(collection(db, 'users'));
  const userCount = usersSnap.size;
  // first 6 users are group A, the rest are group B
  const group = userCount < 5 ? 'A' : 'B';

  // save to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    username,
    email,
    group,
    createdAt: serverTimestamp(),
  });

  return { uid: user.uid, group };
}

// ========== B version game independent storage function ==========
function filterUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

export async function saveGame1BResult({ emotion, reasons, reactionTime, dotIdx, pairIdx, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;
  const resultRef = collection(db, 'game1b_results', docId, 'records');
  await addDoc(resultRef, filterUndefined({
    username,
    emotion,
    reasons,
    reactionTime,
    dotIdx,
    pairIdx,
    timestamp,
  }));
}

export async function saveGame2BResult({ emotion, reasons, reactionTime, level, positiveImgIdx, pos, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;
  const resultRef = collection(db, 'game2b_results', docId, 'records');
  await addDoc(resultRef, filterUndefined({
    username,
    emotion,
    reasons,
    reactionTime,
    level,
    positiveImgIdx,
    pos,
    timestamp,
  }));
}

export async function saveGame3BResult({ difficulty, word, wordImg, sentence, sentenceImg, isRelated, reactionTime, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;
  const resultRef = collection(db, 'game3b_results', docId, 'records');
  await addDoc(resultRef, filterUndefined({
    username,
    difficulty,
    word,
    // wordImg,
    sentence,
    // sentenceImg,
    isRelated,
    reactionTime,
    timestamp,
  }));
}

export async function saveGame4BResult({ difficulty, question, image, answer, answerText, reactionTime, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;
  const resultRef = collection(db, 'game4b_results', docId, 'records');
  await addDoc(resultRef, filterUndefined({
    username,
    difficulty,
    question,
    image,
    answer,
    answerText,
    reactionTime,
    timestamp,
  }));
}

// new: statistics data related functions
export async function calculateUserStatistics(uid) {
  try {
    console.log('📊 Calculating statistics for user:', uid);
    
    // 1. Get user data to obtain username
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const username = userDoc.data().username;
    
    // 2. Get all game results
    const gameCollections = ['game1_results', 'game2_results', 'game3_results', 'game4_results', 'game1b_results', 'game2b_results'];
    let totalGames = 0;
    let totalReactionTime = 0;
    let reactionTimeCount = 0;
    
    for (const collectionName of gameCollections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        // check if it is the current user's data (according to the date_username format)
        if (data.username === username || doc.id.includes(username)) {
          const recordsRef = collection(db, collectionName, doc.id, 'records');
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
    }
    
    // 3. get emotion statistics
    const moodRecordsRef = collection(db, `users/${uid}/moodRecords`);
    const moodSnapshot = await getDocs(moodRecordsRef);
    const emotionCounts = {};
    
    moodSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.emotion) {
        emotionCounts[data.emotion] = (emotionCounts[data.emotion] || 0) + 1;
      }
    });
    
    // 4. calculate consecutive days
    const completionsRef = collection(db, `users/${uid}/completions`);
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
    
    console.log('📊 Statistics calculated:', statistics);
    return statistics;
    
  } catch (error) {
    console.error('📊 Error calculating statistics:', error);
    throw error;
  }
}

// helper function: check if it is consecutive days
function isConsecutiveDay(date1Str, date2Str) {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

  // new: save statistics data
export async function saveUserStatistics(uid, statistics) {
  try {
    await setDoc(doc(db, 'users', uid, 'statistics', 'summary'), statistics);
    console.log('📊 Statistics saved for user:', uid);
  } catch (error) {
    console.error('📊 Error saving statistics:', error);
    throw error;
  }
}

// new: get statistics data
export async function getUserStatistics(uid) {
  try {
    const statsDoc = await getDoc(doc(db, 'users', uid, 'statistics', 'summary'));
    if (statsDoc.exists()) {
      return statsDoc.data();
    } else {
      // if there is no statistics data, calculate once
      const statistics = await calculateUserStatistics(uid);
      await saveUserStatistics(uid, statistics);
      return statistics;
    }
  } catch (error) {
    console.error('📊 Error getting statistics:', error);
    throw error;
  }
}


export async function updateStatisticsAfterGame(uid) {
  try {
    const statistics = await calculateUserStatistics(uid);
    await saveUserStatistics(uid, statistics);
    return statistics;
  } catch (error) {
    console.error('📊 Error updating statistics:', error);
    throw error;
  }
}

export async function calculateAllUsersHistoricalStats() {
  try {
    console.log('📊 Starting historical statistics calculation for all users...');
    
    // get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const results = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`📊 Calculating stats for user: ${userData.username} (${uid})`);
        
        // calculate statistics for the user
        const statistics = await calculateUserStatistics(uid);
        
        // save statistics
        await saveUserStatistics(uid, statistics);
        
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
    
    console.log('📊 Historical statistics calculation completed');
    console.log('📊 Results:', results);
    
    return {
      totalUsers: usersSnapshot.size,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
  } catch (error) {
    console.error('📊 Error in historical statistics calculation:', error);
    throw error;
  }
}

  // new: manually trigger statistics calculation (can be used during development)
export async function triggerStatisticsCalculation() {
  try {
    const auth = getAuth();
    let user = auth.currentUser;
    let uid = null;
    
    if (!user) {
      uid = await AsyncStorage.getItem('userUID');
    } else {
      uid = user.uid;
    }
    
    if (!uid) {
      throw new Error('No user logged in');
    }
    
    console.log('📊 Manually triggering statistics calculation for user:', uid);
    const statistics = await calculateUserStatistics(uid);
    await saveUserStatistics(uid, statistics);
    
    console.log('📊 Manual statistics calculation completed:', statistics);
    return statistics;
    
  } catch (error) {
    console.error('📊 Error in manual statistics calculation:', error);
    throw error;
  }
}

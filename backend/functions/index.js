const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const db = admin.firestore();

// check if two dates are consecutive
function isConsecutiveDay(date1Str, date2Str) {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// calculate user statistics
async function calculateUserStatistics(uid) {
  try {
    console.log(`📊 Calculating statistics for user: ${uid}`);
    
    // 1. get user data
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    const username = userDoc.data().username;
    
    // 2. get all game results
    const gameCollections = ['game1_results', 'game2_results', 'game3_results', 'game4_results', 'game1b_results', 'game2b_results'];
    let totalGames = 0;
    let totalReactionTime = 0;
    let reactionTimeCount = 0;
    
    for (const collectionName of gameCollections) {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        // check if it is the current user's data
        if (data.username === username || doc.id.includes(username)) {
          const recordsRef = collectionRef.doc(doc.id).collection('records');
          const recordsSnapshot = await recordsRef.get();
          
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
    const moodRecordsRef = db.collection('users').doc(uid).collection('moodRecords');
    const moodSnapshot = await moodRecordsRef.get();
    const emotionCounts = {};
    
    moodSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.emotion) {
        emotionCounts[data.emotion] = (emotionCounts[data.emotion] || 0) + 1;
      }
    });
    
    // 4. calculate consecutive days
    const completionsRef = db.collection('users').doc(uid).collection('completions');
    const completionsSnapshot = await completionsRef.get();
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
    
    // 5. calculate past 7 days completion
    const weeklyCompletion = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      weeklyCompletion[dateStr] = completedDates.includes(dateStr);
    }
    
    // 6. calculate average reaction time
    const averageReactionTime = reactionTimeCount > 0 ? Math.round(totalReactionTime / reactionTimeCount) : 0;
    
    // 7. combine statistics data
    const statistics = {
      totalGames,
      emotionCounts,
      averageReactionTime,
      currentStreak,
      longestStreak,
      weeklyCompletion,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    console.log(`📊 Statistics calculated for ${username}:`, statistics);
    return statistics;
    
  } catch (error) {
    console.error(`📊 Error calculating statistics for user ${uid}:`, error);
    throw error;
  }
}

// Firestore trigger functions for automatic processing
// Cloud Function: when game is completed, automatically update statistics and generate AI analysis
exports.onGameCompleted = functions.firestore
  .document('game1_results/{docId}/records/{recordId}')
  .onCreate(async (snap, context) => {
    try {
      const gameData = snap.data();
      const username = gameData.username;
      
      if (!username) {
        console.log('No username in game data, skipping processing');
        return;
      }
      
      // find the corresponding uid based on username
      const usersSnapshot = await db.collection('users').where('username', '==', username).get();
      if (usersSnapshot.empty) {
        console.log(`No user found with username: ${username}`);
        return;
      }
      
      const uid = usersSnapshot.docs[0].id;
      console.log(`🤖 Game completed for user ${username} (${uid}), processing...`);
      
      // 1. update statistics
      const statistics = await calculateUserStatistics(uid);
      await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
      
      // 2. generate AI analysis in background
      try {
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
        const GEMINI_API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
        
        if (GEMINI_API_KEY) {
          const prompt = `The user just completed a game training session. Generate a brief, encouraging analysis (under 30 words) based on their performance.`;
          
          const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
              const aiMessage = result.candidates[0].content.parts[0].text;
              
              // save AI analysis for later use
              await db.collection('users').doc(uid).collection('aiAnalysis').doc('latest').set({
                message: aiMessage,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                type: 'game_completion'
              });
              
              console.log(`✅ AI analysis generated for user ${username}`);
            }
          }
        }
      } catch (aiError) {
        console.log('AI analysis failed, continuing with statistics update:', aiError.message);
      }
      
      console.log(`✅ Processing completed for user ${username}`);
      
    } catch (error) {
      console.error('❌ Error in onGameCompleted:', error);
    }
  });

// Cloud Function: when emotion record is added, automatically update statistics
exports.onEmotionRecorded = functions.firestore
  .document('users/{uid}/moodRecords/{recordId}')
  .onCreate(async (snap, context) => {
    try {
      const uid = context.params.uid;
      console.log(`📊 Emotion recorded for user ${uid}, updating statistics...`);
      
      // calculate and update statistics data
      const statistics = await calculateUserStatistics(uid);
      await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
      
      console.log(`✅ Statistics updated for user ${uid}`);
      
    } catch (error) {
      console.error('❌ Error in onEmotionRecorded:', error);
    }
  });

// Cloud Function: when completion status is updated, automatically update statistics
exports.onCompletionUpdated = functions.firestore
  .document('users/{uid}/completions/{dateId}')
  .onWrite(async (change, context) => {
    try {
      const uid = context.params.uid;
      const newData = change.after.data();
      const previousData = change.before.data();
      
      // only update statistics when completion status changes
      if (newData && previousData && newData.completed !== previousData.completed) {
        console.log(`📊 Completion status changed for user ${uid}, updating statistics...`);
        
        // calculate and update statistics data
        const statistics = await calculateUserStatistics(uid);
        await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
        
        console.log(`✅ Statistics updated for user ${uid}`);
      }
      
    } catch (error) {
      console.error('❌ Error in onCompletionUpdated:', error);
    }
  });

// Cloud Function: calculate all users' historical statistics data
exports.calculateAllUsersHistoricalStats = functions.https.onCall(async (data, context) => {
  try {
    // check if it is an admin (you can adjust the verification logic as needed)
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    console.log('📊 Starting historical statistics calculation for all users...');
    
    // get all users
    const usersSnapshot = await db.collection('users').get();
    const results = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`📊 Calculating stats for user: ${userData.username} (${uid})`);
        
        // calculate the user's statistics data
        const statistics = await calculateUserStatistics(uid);
        
        // save statistics data
        await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
        
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
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: manually trigger single user statistics calculation
exports.calculateUserStats = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const uid = context.auth.uid;
    console.log(`📊 Manually calculating statistics for user: ${uid}`);
    
    const statistics = await calculateUserStatistics(uid);
    await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
    
    console.log(`✅ Manual statistics calculation completed for user ${uid}:`, statistics);
    return statistics;
    
  } catch (error) {
    console.error('📊 Error in manual statistics calculation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: process all users' historical data
exports.processAllUsersHistoricalData = functions.https.onCall(async (data, context) => {
  try {
    // check if it is an admin (you can adjust the verification logic as needed)
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    console.log('📊 Starting historical data processing for all users...');
    
    // get all users
    const usersSnapshot = await db.collection('users').get();
    const results = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`📊 Processing historical data for user: ${userData.username} (${uid})`);
        
        // 1. process emotion records
        const moodRecordsRef = db.collection('users').doc(uid).collection('moodRecords');
        const moodSnapshot = await moodRecordsRef.get();
        let moodRecordsProcessed = 0;
        
        moodSnapshot.forEach(doc => {
          const data = doc.data();
          // here you can add any data processing logic as needed
          moodRecordsProcessed++;
        });
        
        // 2. process game results
        const gameCollections = ['game1_results', 'game2_results', 'game3_results', 'game4_results', 'game1b_results', 'game2b_results'];
        let gameRecordsProcessed = 0;
        
        for (const collectionName of gameCollections) {
          const collectionRef = db.collection(collectionName);
          const snapshot = await collectionRef.get();
          
          for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.username === userData.username || doc.id.includes(userData.username)) {
              // here you can add any data processing logic as needed
              gameRecordsProcessed++;
            }
          }
        }
        
        // 3. process completion status
        const completionsRef = db.collection('users').doc(uid).collection('completions');
        const completionsSnapshot = await completionsRef.get();
        let completionsProcessed = 0;
        
        completionsSnapshot.forEach(doc => {
          const data = doc.data();
          // here you can add any data processing logic as needed
          completionsProcessed++;
        });
        
        // 4. recalculate statistics data
        const statistics = await calculateUserStatistics(uid);
        await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
        
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
    
    console.log('📊 Historical data processing completed');
    console.log('📊 Results:', results);
    
    return {
      totalUsers: usersSnapshot.size,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
  } catch (error) {
    console.error('📊 Error in historical data processing:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: get user statistics data
exports.getUserStatistics = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const uid = context.auth.uid;
    console.log(`📊 Getting statistics for user: ${uid}`);
    
    // first check if the user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      console.log(`📊 User ${uid} not found, returning default statistics`);
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
    
    // try to get statistics data from cache
    try {
      const statsDoc = await db.collection('users').doc(uid).collection('statistics').doc('summary').get();
      
      if (statsDoc.exists) {
        const stats = statsDoc.data();
        console.log(`✅ Retrieved cached statistics for user ${uid}:`, stats);
        return stats;
      }
    } catch (statsError) {
      console.log(`📊 Error accessing statistics collection for user ${uid}:`, statsError.message);
    }
    
    // if there is no cache or access fails, recalculate
    console.log(`📊 Calculating fresh statistics for user ${uid}...`);
    try {
      const statistics = await calculateUserStatistics(uid);
      await db.collection('users').doc(uid).collection('statistics').doc('summary').set(statistics);
      console.log(`✅ Fresh statistics calculated for user ${uid}:`, statistics);
      return statistics;
    } catch (calcError) {
      console.error(`📊 Error calculating statistics for user ${uid}:`, calcError);
      // return default statistics data instead of throwing an error
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
    
  } catch (error) {
    console.error('📊 Error getting user statistics:', error);
    // return default statistics data instead of throwing an error
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
});

  // Cloud Function: public Gemini AI conversation (no authentication required)
exports.publicGeminiMessage = functions.https.onRequest(async (req, res) => {
  try {
    // set CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    
    // process OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('🤖 Public Gemini function called with data:', req.body);
    
    const data = req.body;
    
    // use the same prompt generation logic as gemini.js
    function getMoodeePrompt(data, type) {
      const today = new Date().toLocaleDateString('en-US');
      switch (type) {
        case 'welcome':
          return `You are Moodee, a friendly and supportive coach helping users reflect on their emotions and improve their mental wellbeing.\nThe user just opened the app. Today is ${today}. This is the first interaction today.\nGreet the user in a warm and motivating way. Encourage them to reflect on how they feel and remind them that small steps matter.\nOutput only 1–2 warm sentences. No emojis. Always reply in English. Limit your reply to 20 words or less.`;
        case 'emotion':
          return `You are Moodee, a caring, emotionally intelligent companion inside a digital wellbeing app.
            The user selected the emotion "${data.emotion}" and the reason "${data.reason}".
            Respond like a supportive friend. Gently acknowledge their feelings, and reflect on the reason without judgment. Avoid advice. Use a warm, conversational tone. Keep the message short and emotionally validating. No emojis.
            Reply in English only. Limit your reply to 20 words or fewer.`;
        case 'game':
          return `The user just completed today's CBM training.

Game performance summary:
- Emotion selected: ${data.emotion}
- Reason: ${data.reasons || data.reason}
- Tasks played: ${data.tasks}
- Positive choice ratio (out of 6): ${data.positiveRatio}
- Average reaction time: ${data.reactionTime}ms

As Moodee, generate a short, friendly, **specific** response based on the user's training performance. Avoid general praise like "well done" or "great job." Instead, reflect directly on:
1. The quality of their responses in the tasks (e.g., speed, positivity ratio).
2. Suggestions for improvement if the ratio is low or the reaction time is long.
3. Encouraging feedback on effort, if appropriate.

Keep the tone emotionally supportive but **tailored and content-aware**.
Reply in English, under 20 words. No emojis.`;
        case 'weekly':
          return `Weekly Summary:\n- Most frequent emotion: ${data.mostEmotion}\n- Common reasons: ${data.commonReasons}\n- Avg positive score across all games: ${data.positiveScore}%\n- Participation: ${data.days} days this week\nAs Moodee, reflect on the week's emotional pattern.\nEncourage the user, recognize their efforts, and offer hope for next week.\nEnd with one small suggestion or thought.\nOutput: 2 sentences in a warm, caring tone. Always reply in English. No emojis. Limit your reply to 20 words or less.`;
        case 'custom':
          return `The user selected the emotion "${data.emotion}" and wrote: "${data.userReason}"\nAs Moodee, respond with understanding and empathy.\nUse their exact words as context, and reflect it back in a kind tone.\nDo NOT give advice or solutions. Just be supportive.\nOutput: 1-2 empathetic sentences. Always reply in English. No emojis. Limit your reply to 20 words or less.
      Examples:
        - Emotion: Sadness, Reason: Workload → "You've been juggling so much. It's okay to feel worn out. Be kind to yourself today."
        - Emotion: Happiness, Reason: Self-awareness → "That spark of insight is powerful. I hope you carry it with you into the day."

        Now generate a short message for:
        Emotion: ${data.emotion}, Reason: ${data.reason}`;
        case 'homepage':
          return `You are Moodee, a warm, emotionally intelligent companion in a mental wellbeing app.

The user just opened the app homepage after training. Here's a summary of their current emotional state and latest training performance:

- Emotion selected: ${data.emotion}
- Reason: ${data.reasons || data.reason}
- Last tasks played: ${data.tasks}
- Positive choice ratio (out of 6): ${data.positiveRatio}
- Average reaction time: ${data.reactionTime}ms

${data.userStats ? `
User's overall progress:
- Total games played: ${data.userStats.totalGames}
- Current streak: ${data.userStats.currentStreak} days
- Longest streak: ${data.userStats.longestStreak} days
- Average reaction time: ${data.userStats.averageReactionTime}ms
- Most frequent emotion: ${data.userStats.emotionCounts ? Object.keys(data.userStats.emotionCounts).reduce((a, b) => data.userStats.emotionCounts[a] > data.userStats.emotionCounts[b] ? a : b) : 'N/A'}
` : ''}

Generate a short, kind, and encouraging message that:
1. Gently reflects on the user's current emotion and reason.
2. Affirms the effort shown in the training session.
3. ${data.userStats ? 'References their progress (streak, consistency, improvement).' : 'Encourages the user to continue at their own pace.'}
4. Provides personalized motivation based on their patterns.

Examples:
        - Emotion: Sadness, Reason: Workload → "You've been juggling so much. It's okay to feel worn out. Be kind to yourself today."
        - Emotion: Happiness, Reason: Self-awareness → "That spark of insight is powerful. I hope you carry it with you into the day."


Avoid general phrases like "Good job" or "Well done." Keep it personalized and emotionally validating.

Output only 1–2 emotionally supportive sentences. No emojis. Always reply in English. Limit your reply to 20 words or less.`;
        case 'statistics':
          return `You are Moodee, a caring emotional coach analyzing the user's emotional patterns.

Based on the user's emotional statistics for this month:
${Object.entries(data.stats).map(([emotion, count]) => `- ${emotion}: ${count} times`).join('\n')}

${data.userStats ? `
User's overall progress:
- Total games played: ${data.userStats.totalGames || 0}
- Current streak: ${data.userStats.currentStreak || 0} days
- Longest streak: ${data.userStats.longestStreak || 0} days
- Average reaction time: ${data.userStats.averageReactionTime || 0}ms
- Most frequent emotion: ${data.userStats.emotionCounts ? Object.keys(data.userStats.emotionCounts).reduce((a, b) => data.userStats.emotionCounts[a] > data.userStats.emotionCounts[b] ? a : b) : 'N/A'}
` : ''}

Generate a personalized, insightful message that:
1. Acknowledges their emotional journey this month
2. Provides gentle observations about their patterns
3. Offers supportive encouragement for continued growth
4. ${data.userStats ? 'References their overall progress and consistency.' : 'Suggests one small, actionable insight or reflection.'}

Keep the tone warm and non-judgmental. Focus on patterns and growth opportunities.
Output only 1-2 sentences. No emojis. Always reply in English. Limit your reply to 25 words or less.`;
        default:
          return 'You are Moodee, a friendly and supportive coach. Always reply in English. No emojis.';
      }
    }

    // automatically determine type based on data and generate prompt
    let prompt = '';
    let type = data.type;
    
    if (type) {
      prompt = getMoodeePrompt(data, type);
    } else if (data.stats) {
      // weekly summary
      prompt = getMoodeePrompt({
        mostEmotion: data.stats.mostEmotion || '',
        commonReasons: data.stats.commonReasons || '',
        positiveScore: data.stats.positiveScore || '',
        days: data.stats.days || '',
      }, 'weekly');
    } else if (data.gameCompleted) {
      // game summary
      prompt = getMoodeePrompt({
        emotion: data.emotion,
        reason: data.reasons || '',
        positiveRatio: data.positiveRatio || '',
        reactionTime: data.reactionTime || '',
        tasks: data.tasks || '',
      }, 'game');
    } else if (data.userReason) {
      // custom reason
      prompt = getMoodeePrompt({
        emotion: data.emotion,
        userReason: data.userReason,
      }, 'custom');
    } else if (data.emotion && Array.isArray(data.reasons) && data.reasons.length > 0) {
      // emotion + reason
      prompt = getMoodeePrompt({
        emotion: data.emotion,
        reason: data.reasons.join(', '),
      }, 'emotion');
    } else {
      // welcome
      prompt = getMoodeePrompt({}, 'welcome');
    }
    
    // call Gemini API
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
    const GEMINI_API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ Gemini API key not configured');
      res.status(500).json({ error: 'Gemini API key not configured' });
      return;
    }
    
    // set timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('🤖 Gemini API request timeout');
      controller.abort();
    }, 45000); // increase to 45 seconds timeout
    
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      
          if (result && result.candidates && result.candidates.length > 0) {
      const message = result.candidates[0].content.parts[0].text;
      console.log('✅ Public Gemini message generated:', message);
      
          // ensure the text is UTF-8 encoded
    const cleanMessage = message
      .replace(/\u0000/g, '') // remove null characters
      .replace(/\uFFFD/g, '') // remove replacement characters
      .trim();
    
    res.json({ message: cleanMessage });
    } else {
      throw new Error('Invalid response from Gemini API');
    }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log('🕐 Gemini API request timed out (normal for trial version), using fallback');
        
        // provide a fallback response based on type
        let fallbackMessage = 'Welcome! How are you feeling today?';
        
        if (data.type === 'welcome') {
          fallbackMessage = 'Welcome back! Take a moment to check in with yourself today.';
        } else if (data.type === 'emotion' && data.emotion) {
          fallbackMessage = `I hear you're feeling ${data.emotion}. That's completely valid and I'm here to support you.`;
        } else if (data.type === 'game') {
          fallbackMessage = 'Great job completing your training! Every step you take towards emotional awareness matters.';
        } else if (data.type === 'homepage') {
          if (data.emotion && data.reasons) {
            fallbackMessage = `I see you're feeling ${data.emotion} today. Remember, your feelings are valid and every moment of self-reflection is progress.`;
          } else {
            fallbackMessage = 'You\'re doing great! Keep up the good work on your emotional journey.';
          }
        } else if (data.type === 'weekly') {
          fallbackMessage = 'You\'ve made it through another week of emotional awareness. That\'s something to be proud of!';
        } else if (data.type === 'statistics') {
          fallbackMessage = 'Thank you for tracking your emotions this month. Your commitment to self-awareness is inspiring.';
        }
        
        res.json({ message: fallbackMessage });
      } else {
        throw fetchError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error in publicGeminiMessage:', error);
    res.status(500).json({ 
      error: 'Failed to generate message',
      details: error.message 
    });
  }
});

// Cloud Function: test function (no authentication required)
exports.testGeminiMessage = functions.https.onCall(async (data, context) => {
  try {
    console.log('🧪 Test function called with data:', data);
    
    // Call Gemini API
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
    const GEMINI_API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new functions.https.HttpsError('internal', 'Gemini API key not configured');
    }
    
    const prompt = `You are Moodee, a friendly and supportive coach. 
The user is testing the system. Please respond with a simple greeting.
Output only 1 sentence. No emojis. Always reply in English.`;
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });
    
    const responseData = await response.json();
    
    if (responseData && responseData.candidates && responseData.candidates.length > 0) {
      const message = responseData.candidates[0].content.parts[0].text;
      console.log('✅ Test Gemini message generated:', message);
      return message;
    } else {
      console.log('❌ No valid response from Gemini');
      return 'Test message: Hello from Moodee!';
    }
    
  } catch (error) {
    console.error('❌ Error in test function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: Gemini AI conversation
exports.getGeminiMessage = functions.https.onCall(async (data, context) => {
  try {
    // temporarily remove authentication check, for testing
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }
    
    const uid = context.auth?.uid || 'anonymous';
    const { type, emotion, reasons, userReason, gameCompleted, positiveRatio, reactionTime, tasks, stats, username } = data;
    
    console.log(`🤖 Getting Gemini message for user ${uid}, type: ${type}`);
    
    // get user statistics data
    let userStats = null;
    try {
      if (context.auth) {
        const statistics = await calculateUserStatistics(uid);
        userStats = statistics;
      }
    } catch (error) {
      console.log('Failed to get user stats for Gemini:', error);
    }
    
    // generate prompt based on type
    let prompt = '';
    const today = new Date().toLocaleDateString('en-US');
    
    switch (type) {
      case 'welcome':
        prompt = `You are Moodee, a friendly and supportive coach helping users reflect on their emotions and improve their mental wellbeing.
The user just opened the app. Today is ${today}. This is the first interaction today.
Greet the user in a warm and motivating way. Encourage them to reflect on how they feel and remind them that small steps matter.
Output only 1–2 warm sentences. No emojis. Always reply in English. Limit your reply to 20 words or less.`;
        break;
        
      case 'emotion':
        prompt = `You are Moodee, a caring, emotionally intelligent companion inside a digital wellbeing app.
The user selected the emotion "${emotion}" and the reason "${reasons}".
Respond like a supportive friend. Gently acknowledge their feelings, and reflect on the reason without judgment. Avoid advice. Use a warm, conversational tone. Keep the message short and emotionally validating. No emojis.
Reply in English only. Limit your reply to 20 words or fewer.`;
        break;
        
      case 'game':
        prompt = `The user just completed today's CBM training.

Game performance summary:
- Emotion selected: ${emotion}
- Reason: ${reasons}
- Tasks played: ${tasks}
- Positive choice ratio (out of 6): ${positiveRatio}
- Average reaction time: ${reactionTime}ms

As Moodee, generate a short, friendly, **specific** response based on the user's training performance. Avoid general praise like "well done" or "great job." Instead, reflect directly on:
1. The quality of their responses in the tasks (e.g., speed, positivity ratio).
2. Suggestions for improvement if the ratio is low or the reaction time is long.
3. Encouraging feedback on effort, if appropriate.

Keep the tone emotionally supportive but **tailored and content-aware**.
Reply in English, under 20 words. No emojis.`;
        break;
        
      case 'weekly':
        prompt = `Weekly Summary:
- Most frequent emotion: ${stats.mostEmotion}
- Common reasons: ${stats.commonReasons}
- Avg positive score across all games: ${stats.positiveScore}%
- Participation: ${stats.days} days this week
As Moodee, reflect on the week's emotional pattern.
Encourage the user, recognize their efforts, and offer hope for next week.
End with one small suggestion or thought.
Output: 2 sentences in a warm, caring tone. Always reply in English. No emojis. Limit your reply to 20 words or less.`;
        break;
        
      case 'custom':
        prompt = `The user selected the emotion "${emotion}" and wrote: "${userReason}"
As Moodee, respond with understanding and empathy.
Use their exact words as context, and reflect it back in a kind tone.
Do NOT give advice or solutions. Just be supportive.
Output: 1-2 empathetic sentences. Always reply in English. No emojis. Limit your reply to 20 words or less.`;
        break;
        
      case 'homepage':
        prompt = `You are Moodee, a warm, emotionally intelligent companion in a mental wellbeing app.

The user just opened the app homepage after training. Here's a summary of their current emotional state and latest training performance:

- Emotion selected: ${emotion}
- Reason: ${reasons}
- Last tasks played: ${tasks}
- Positive choice ratio (out of 6): ${positiveRatio}
- Average reaction time: ${reactionTime}ms

${userStats ? `
User's overall progress:
- Total games played: ${userStats.totalGames}
- Current streak: ${userStats.currentStreak} days
- Longest streak: ${userStats.longestStreak} days
- Average reaction time: ${userStats.averageReactionTime}ms
- Weekly completion: ${Object.values(userStats.weeklyCompletion || {}).filter(Boolean).length}/7 days
- Most frequent emotion: ${userStats.emotionCounts ? Object.keys(userStats.emotionCounts).reduce((a, b) => userStats.emotionCounts[a] > userStats.emotionCounts[b] ? a : b) : 'N/A'}
` : ''}

Generate a short, kind, and encouraging message that:
1. Gently reflects on the user's current emotion and reason.
2. Affirms the effort shown in the training session.
3. ${userStats ? 'References their progress (streak, consistency, improvement, weekly completion).' : 'Encourages the user to continue at their own pace.'}
4. Provides personalized motivation based on their patterns.

Avoid general phrases like "Good job" or "Well done." Keep it personalized and emotionally validating.

Output only 1–2 emotionally supportive sentences. No emojis. Always reply in English. Limit your reply to 20 words or less.`;
        break;
        
      case 'statistics':
        prompt = `You are Moodee, a caring emotional coach analyzing the user's emotional patterns.

Based on the user's emotional statistics for this month:
${Object.entries(stats).map(([emotion, count]) => `- ${emotion}: ${count} times`).join('\n')}

${userStats ? `
User's overall progress:
- Total games played: ${userStats.totalGames || 0}
- Current streak: ${userStats.currentStreak || 0} days
- Longest streak: ${userStats.longestStreak || 0} days
- Average reaction time: ${userStats.averageReactionTime || 0}ms
- Weekly completion: ${Object.values(userStats.weeklyCompletion || {}).filter(Boolean).length}/7 days
- Most frequent emotion: ${userStats.emotionCounts ? Object.keys(userStats.emotionCounts).reduce((a, b) => userStats.emotionCounts[a] > userStats.emotionCounts[b] ? a : b) : 'N/A'}
` : ''}

Generate a personalized, insightful message that:
1. Acknowledges their emotional journey this month
2. Provides gentle observations about their patterns
3. Offers supportive encouragement for continued growth
4. ${userStats ? 'References their overall progress, consistency, and weekly completion patterns.' : 'Suggests one small, actionable insight or reflection.'}

Keep the tone warm and non-judgmental. Focus on patterns and growth opportunities.
Output only 1-2 sentences. No emojis. Always reply in English. Limit your reply to 25 words or less.`;
        break;
        
      default:
        prompt = 'You are Moodee, a friendly and supportive coach. Always reply in English. No emojis.';
    }
    
    // call Gemini API
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
    const GEMINI_API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new functions.https.HttpsError('internal', 'Gemini API key not configured');
    }
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });
    
    const responseData = await response.json();
    
    if (responseData && responseData.candidates && responseData.candidates.length > 0) {
      const message = responseData.candidates[0].content.parts[0].text;
      console.log(`✅ Gemini message generated for user ${uid}:`, message);
      return message;
    } else {
      console.log(`❌ No valid response from Gemini for user ${uid}`);
      return 'Sorry, I couldn\'t come up with something helpful this time.';
    }
    
  } catch (error) {
    console.error('❌ Error getting Gemini message:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 

 
import { EXPO_PUBLIC_GEMINI_API_KEY } from '@env';
import { getGeminiMessage, publicGeminiMessage } from './cloudFunctions';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
const GEMINI_API_KEY = EXPO_PUBLIC_GEMINI_API_KEY;

export async function fetchGeminiResponse(prompt) {
  console.log('GEMINI_API_KEY:', GEMINI_API_KEY); 
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

  console.log('Gemini response status:', response.status);
  const data = await response.json();
  console.log('Gemini response data:', data);

  if (data && data.candidates && data.candidates.length > 0) {
    const message = data.candidates[0].content.parts[0].text;
    
    // directly return the original text, without any processing
    return message || 'Sorry, I couldn\'t come up with something helpful this time.';
  } else {
    return 'Sorry, I couldn\'t come up with something helpful this time.';
  }
}

// generate corresponding English prompt based on type
export function getMoodeePrompt(data, type) {
  const today = new Date().toLocaleDateString('en-US');
  switch (type) {
    case 'welcome':
      return `You are Moodee, a friendly and supportive coach helping users reflect on their emotions and improve their mental wellbeing.\nThe user just opened the app. Today is ${today}. This is the first interaction today.\nGreet the user in a warm and motivating way. Encourage them to reflect on how they feel and remind them that small steps matter.\nOutput only 1–2 warm sentences. No emojis. Always reply in English. Limit your reply to 20 words or less.`;
    case 'emotion':
      return `You are Moodee, a caring, emotionally intelligent companion inside a digital wellbeing app.
            The user selected the emotion “${data.emotion}” and the reason “${data.reason}”.
            Respond like a supportive friend. Gently acknowledge their feelings, and reflect on the reason without judgment. Avoid advice. Use a warm, conversational tone. Keep the message short and emotionally validating. No emojis.
            Reply in English only. Limit your reply to 20 words or fewer.`;
    case 'game':
      return `The user just completed today's CBM training.

Game performance summary:
- Emotion selected: ${data.emotion}
- Reason: ${data.reason}
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
      return `Weekly Summary:\n- Most frequent emotion: ${data.mostEmotion}\n- Common reasons: ${data.commonReasons}\n- Avg positive score across all games: ${data.positiveScore}%\n- Participation: ${data.days} days this week\nAs Moodee, reflect on the week’s emotional pattern.\nEncourage the user, recognize their efforts, and offer hope for next week.\nEnd with one small suggestion or thought.\nOutput: 2 sentences in a warm, caring tone. Always reply in English. No emojis. Limit your reply to 20 words or less.`;
    case 'custom':
      return `The user selected the emotion \"${data.emotion}\" and wrote: \"${data.userReason}\"\nAs Moodee, respond with understanding and empathy.\nUse their exact words as context, and reflect it back in a kind tone.\nDo NOT give advice or solutions. Just be supportive.\nOutput: 1-2 empathetic sentences. Always reply in English. No emojis. Limit your reply to 20 words or less.
      Examples:
        - Emotion: Sadness, Reason: Workload → “You’ve been juggling so much. It’s okay to feel worn out. Be kind to yourself today.”
        - Emotion: Happiness, Reason: Self-awareness → “That spark of insight is powerful. I hope you carry it with you into the day.”

        Now generate a short message for:
        Emotion: ${data.emotion}, Reason: ${data.reason}`;
    case 'homepage':
      return `You are Moodee, a warm, emotionally intelligent companion in a mental wellbeing app.

The user just opened the app homepage after training. Here’s a summary of their current emotional state and latest training performance:

- Emotion selected: ${data.emotion}
- Reason: ${data.reason}
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
        - Emotion: Sadness, Reason: Workload → “You’ve been juggling so much. It’s okay to feel worn out. Be kind to yourself today.”
        - Emotion: Happiness, Reason: Self-awareness → “That spark of insight is powerful. I hope you carry it with you into the day.”


Avoid general phrases like “Good job” or “Well done.” Keep it personalized and emotionally validating.

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

// intelligent local feedback system
const LOCAL_RESPONSES = {
  welcome: [
    "Hi! I'm moodee, your personal coach. Ready to start your emotional journey?",
    "Welcome back! I'm here to support you every step of the way.",
    "Hello! Let's make today a great day for your emotional wellbeing.",
    "Hi there! I'm excited to help you grow and learn about yourself."
  ],
  thinking: [
    "Let me think about that...",
    "Analyzing your patterns...",
    "Processing your data...",
    "Gathering insights..."
  ],
  emotion: {
    happiness: [
      "I see you're feeling happy! That's wonderful. Your positive energy is contagious!",
      "Your happiness is beautiful! Keep spreading that joy around.",
      "Great to see you in such good spirits! Happiness looks great on you.",
      "I love seeing you happy! You deserve all the good feelings."
    ],
    sadness: [
      "I notice you're feeling sad. It's okay to feel this way. I'm here for you.",
      "Sadness is a natural emotion. You're not alone, and it's okay to take time to process.",
      "I understand this feeling. Let's work through it together, one step at a time.",
      "It's okay to feel sad. Your feelings are valid, and I'm here to support you."
    ],
    anger: [
      "I see you're feeling angry. That's a valid emotion. Let's find healthy ways to process it.",
      "Anger can be challenging, but it's also a signal that something matters to you.",
      "I'm here to help you navigate this feeling. Anger is natural, but we can work with it.",
      "Your anger is valid. Let's find constructive ways to express and understand it."
    ],
    fear: [
      "I notice you're feeling afraid. You're safe here, and we can work through this together.",
      "Fear is a natural response to uncertainty. You're not alone in this feeling.",
      "I'm here to support you through this fear. We can face it together.",
      "Fear can be overwhelming, but you're stronger than you think. I'm here for you."
    ],
    surprise: [
      "I see you're feeling surprised! Life can be unexpected, and that's okay.",
      "Surprises can be exciting or challenging. How are you handling this unexpected feeling?",
      "I'm here to help you process this surprise. Sometimes the unexpected leads to growth.",
      "Surprises shake things up! Let's work through this together."
    ],
    disgust: [
      "I notice you're feeling disgusted. That's a strong emotion that can be protective.",
      "Disgust often signals that something doesn't align with your values. Let's understand it.",
      "I'm here to help you work through this feeling. Disgust can be a powerful teacher.",
      "Your disgust is valid. Sometimes it helps us set healthy boundaries."
    ]
  },
  statistics: [
    "Looking at your emotional patterns, I can see your growth journey!",
    "Your monthly data shows real progress in emotional awareness.",
    "I'm impressed by your commitment to tracking your emotions.",
    "Your statistics reveal a thoughtful approach to emotional wellbeing."
  ],
  game: {
    happiness: [
      "Great job completing today's training! Your happiness is a beautiful choice.",
      "Excellent work! Choosing happiness shows your positive mindset.",
      "Wonderful completion! Your happy energy will carry you through the day.",
      "Fantastic! Your happiness choice reflects your inner strength."
    ],
    sadness: [
      "Well done completing today's training. It's brave to acknowledge your sadness.",
      "Great work! Recognizing sadness is the first step to working through it.",
      "Excellent completion! Your honesty about feeling sad shows self-awareness.",
      "Good job! It's okay to feel sad, and you're handling it with courage."
    ],
    anger: [
      "Good work completing today's training. Your anger is valid, and you're processing it well.",
      "Well done! Acknowledging anger is a healthy step toward understanding it.",
      "Great completion! Your anger shows you care about something important.",
      "Excellent work! You're learning to work with your anger constructively."
    ],
    fear: [
      "Good job completing today's training. Your fear is natural, and you're facing it bravely.",
      "Well done! Acknowledging fear takes courage, and you're doing it.",
      "Great completion! Your fear shows you're aware of potential challenges.",
      "Excellent work! You're learning to work through fear with strength."
    ],
    surprise: [
      "Great job completing today's training! Surprises can be opportunities for growth.",
      "Well done! Your surprise shows you're open to unexpected experiences.",
      "Excellent completion! Sometimes surprises lead to the best discoveries.",
      "Good work! You're handling this surprise with curiosity and openness."
    ],
    disgust: [
      "Good job completing today's training. Your disgust shows you have strong values.",
      "Well done! Acknowledging disgust helps you understand your boundaries.",
      "Great completion! Your disgust can guide you toward what truly matters.",
      "Excellent work! You're learning to work with this strong emotion."
    ]
  }
};

function getLocalResponse(type, emotion = null, context = {}) {
  let responses;
  
  if (type === 'emotion' && emotion && LOCAL_RESPONSES.emotion[emotion]) {
    responses = LOCAL_RESPONSES.emotion[emotion];
  } else if (type === 'game' && emotion && LOCAL_RESPONSES.game[emotion]) {
    responses = LOCAL_RESPONSES.game[emotion];
  } else if (LOCAL_RESPONSES[type]) {
    responses = LOCAL_RESPONSES[type];
  } else {
    responses = LOCAL_RESPONSES.welcome;
  }
  
  // adjust response based on context
  let response = responses[Math.floor(Math.random() * responses.length)];
  
  // if there is a username, add personalization
  if (context.username && context.username !== 'User') {
    response = response.replace(/I'm here/g, `${context.username}, I'm here`);
    response = response.replace(/You're/g, `${context.username}, you're`);
  }
  
  return response;
}

// intelligent default message system
const DEFAULT_MESSAGES = {
  welcome: [
    "Hi! I'm moodee, your personal coach.",
    "Welcome back! I'm here to support you.",
    "Hello! Ready for another great day?",
    "Hi there! Let's make today amazing!"
  ],
  thinking: [
    "Let me think about that...",
    "Analyzing your patterns...",
    "Processing your data...",
    "Gathering insights..."
  ],
  emotion: {
    happiness: [
      "I see you're feeling happy! That's wonderful.",
      "Your happiness is contagious!",
      "Great to see you in such good spirits!"
    ],
    sadness: [
      "I notice you're feeling sad. I'm here for you.",
      "It's okay to feel this way. You're not alone.",
      "I understand this feeling. Let's work through it together."
    ],
    anger: [
      "I see you're feeling angry. That's a valid emotion.",
      "Anger can be challenging. Let's find healthy ways to process it.",
      "I'm here to help you navigate this feeling."
    ],
    fear: [
      "I notice you're feeling afraid. You're safe here.",
      "Fear is a natural response. Let's work through it together.",
      "I'm here to support you through this."
    ],
    surprise: [
      "I see you're feeling surprised! Life can be unexpected.",
      "Surprises can be exciting or challenging. How are you handling it?",
      "I'm here to help you process this unexpected feeling."
    ],
    disgust: [
      "I notice you're feeling disgusted. That's a strong emotion.",
      "Disgust can be protective. Let's understand what's behind it.",
      "I'm here to help you work through this feeling."
    ]
  },
  statistics: [
    "Analyzing your emotional patterns...",
    "Looking at your progress...",
    "Reviewing your monthly data...",
    "Processing your statistics..."
  ]
};

function getRandomMessage(category, subcategory = null) {
  let messages;
  if (subcategory && DEFAULT_MESSAGES[category] && DEFAULT_MESSAGES[category][subcategory]) {
    messages = DEFAULT_MESSAGES[category][subcategory];
  } else if (DEFAULT_MESSAGES[category]) {
    messages = DEFAULT_MESSAGES[category];
  } else {
    messages = DEFAULT_MESSAGES.welcome;
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

// simple cache mechanism
const messageCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(data) {
  return JSON.stringify(data);
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_DURATION;
}

export async function getMoodeeMessageGemini(data) {
  console.log('🤖 getMoodeeMessageGemini called with data:', data);
  
  // check cache
  const cacheKey = getCacheKey(data);
  const cached = messageCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('🤖 Using cached response');
    return cached.message;
  }
  
  try {
    // directly use public function (no authentication required)
    console.log('🤖 Using public Gemini function...');
    const message = await publicGeminiMessage(data);
    console.log('🤖 Public function response:', message);
    
    // save to cache
    messageCache.set(cacheKey, {
      message,
      timestamp: Date.now()
    });
    
    return message;
  } catch (error) {
    console.error('❌ Public function failed, trying direct API:', error);
    // if public function fails, directly use Gemini API
    try {
      console.log('🤖 Trying direct API call...');
      let prompt = '';
      
      // generate different prompt based on type
      switch (data.type) {
        case 'welcome':
          prompt = `You are Moodee, a warm, emotionally intelligent companion in a mental wellbeing app. The user ${data.username || 'User'} has just opened the app. Give them a warm, encouraging welcome message. Keep it brief (under 50 words) and positive.`;
          break;
        case 'emotion':
          prompt = `You are Moodee, a warm, emotionally intelligent companion. The user ${data.username || 'User'} is feeling ${data.emotion}. Provide a brief, empathetic response (under 50 words) that acknowledges their emotion and offers gentle support.`;
          break;
        case 'game':
          prompt = `You are Moodee, a warm, emotionally intelligent companion. The user ${data.username || 'User'} just completed a game and selected ${data.emotion} as their emotion. Provide a brief, encouraging response (under 50 words) about their game completion.`;
          break;
        case 'weekly':
          prompt = `You are Moodee, a warm, emotionally intelligent companion. The user ${data.username || 'User'} has completed their weekly activities. Provide a brief, encouraging weekly summary (under 50 words) celebrating their progress.`;
          break;
        case 'custom':
          prompt = `You are Moodee, a warm, emotionally intelligent companion. The user ${data.username || 'User'} is feeling ${data.emotion} because: ${data.userReason}. Provide a brief, empathetic response (under 50 words) that acknowledges their specific reason.`;
          break;
        case 'homepage':
          prompt = `You are Moodee, a warm, emotionally intelligent companion. The user ${data.username || 'User'} is feeling ${data.emotion} and their reasons are: ${data.reasons || 'not specified'}. Provide a brief, encouraging daily message (under 50 words) that acknowledges their emotion and motivates them for the day.`;
          break;
        case 'statistics':
          const statsText = Object.entries(data.stats || {}).map(([emotion, count]) => `${emotion}: ${count}`).join(', ');
          prompt = `You are Moodee, a warm, emotionally intelligent companion. The user ${data.username || 'User'} has the following monthly emotion statistics: ${statsText}. Provide a brief, encouraging response (under 50 words) about their emotional tracking progress.`;
          break;
        default:
          prompt = `You are Moodee, a warm, emotionally intelligent companion. Provide a brief, encouraging message (under 50 words) to the user ${data.username || 'User'}.`;
      }
      
      console.log('🤖 Generated prompt:', prompt);
      const response = await fetchGeminiResponse(prompt);
      console.log('🤖 Direct API response:', response);
      
        // save to cache
      messageCache.set(cacheKey, {
        message: response,
        timestamp: Date.now()
      });
      
      return response;
    } catch (fallbackError) {
      console.error('❌ All methods failed:', fallbackError);
      // return local response as fallback
      const localResponse = getLocalResponse(data.type, data.emotion, data);
      console.log('🤖 Using local response as fallback:', localResponse);
      return localResponse;
    }
  }
}

// export default message function for other components
export function getDefaultMessage(type, emotion = null) {
  if (type === 'emotion' && emotion) {
    return getRandomMessage('emotion', emotion);
  }
  return getRandomMessage(type);
}

// // add limitWords function at the bottom of the file
// function limitWords(text, maxWords = 25) {
//   if (!text) return '';
//   const words = text.split(/\s+/);
//   if (words.length <= maxWords) return text;
//   return words.slice(0, maxWords).join(' ') + '...';
// } 
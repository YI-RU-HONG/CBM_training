import { EXPO_PUBLIC_GEMINI_API_KEY } from '@env';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
const GEMINI_API_KEY = EXPO_PUBLIC_GEMINI_API_KEY;

export async function fetchGeminiResponse(prompt) {
  console.log('GEMINI_API_KEY:', GEMINI_API_KEY); // 應該要印出你的金鑰（部分遮蔽即可）
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
    return data.candidates[0].content.parts[0].text;
  } else {
    return 'Sorry, I couldn’t come up with something helpful this time.';
  }
}

// 根據 type 產生對應英文 prompt
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
      return `The user just completed today’s CBM training.
Game summary:
- Emotion selected: ${data.emotion}
- Reason: ${data.reason}
- Positive choice ratio (out of 6): ${data.positiveRatio}
- Average reaction time: ${data.reactionTime}ms
- Tasks selected: ${data.tasks}
As Moodee, provide a short, kind message based on the user’s emotional state and game performance.
If the positive ratio is low or emotion is negative, gently encourage improvement without judgment.
If positive ratio is high, celebrate small wins.
Reply in English, no emojis. Limit your reply to 20 words or less.`;
    case 'weekly':
      return `Weekly Summary:\n- Most frequent emotion: ${data.mostEmotion}\n- Common reasons: ${data.commonReasons}\n- Avg positive score across all games: ${data.positiveScore}%\n- Participation: ${data.days} days this week\nAs Moodee, reflect on the week’s emotional pattern.\nEncourage the user, recognize their efforts, and offer hope for next week.\nEnd with one small suggestion or thought.\nOutput: 2 sentences in a warm, caring tone. Always reply in English. No emojis. Limit your reply to 20 words or less.`;
    case 'custom':
      return `The user selected the emotion \"${data.emotion}\" and wrote: \"${data.userReason}\"\nAs Moodee, respond with understanding and empathy.\nUse their exact words as context, and reflect it back in a kind tone.\nDo NOT give advice or solutions. Just be supportive.\nOutput: 1-2 empathetic sentences. Always reply in English. No emojis. Limit your reply to 20 words or less.
      Examples:
        - Emotion: Sadness, Reason: Workload → “You’ve been juggling so much. It’s okay to feel worn out. Be kind to yourself today.”
        - Emotion: Happiness, Reason: Self-awareness → “That spark of insight is powerful. I hope you carry it with you into the day.”

        Now generate a short message for:
        Emotion: ${data.emotion}, Reason: ${data.reason}`;
    default:
      return 'You are Moodee, a friendly and supportive coach. Always reply in English. No emojis.';
  }
}

// 自動選擇 prompt 並呼叫 Gemini
export async function getMoodeeMessageGemini(data) {
  let prompt = '';
  // 根據 data 自動判斷 type
  if (data.type) {
    prompt = getMoodeePrompt(data, data.type);
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
      reason: data.reasons ? data.reasons.join(', ') : '',
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

  try {
    const response = await fetchGeminiResponse(prompt);
    return limitWords(response);
  } catch (error) {
    console.error('Failed to get Moodee suggestion:', error);
    throw error;
  }
}

// 在檔案底部加上 limitWords 函式
function limitWords(text, maxWords = 20) {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
} 
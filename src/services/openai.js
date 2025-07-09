// src/services/openai.js
import axios from 'axios';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
import { EXPO_PUBLIC_OPENAI_API_KEY } from '@env';
const OPENAI_API_KEY = EXPO_PUBLIC_OPENAI_API_KEY;

export async function fetchOpenAIResponse(prompt) {
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 256,
      temperature: 0.7,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );
  return response.data.choices[0].message.content;
}

export async function getMoodeeMessage(data) {
  const { emotion, reasons, gameCompleted, username, stats } = data;
  let prompt = '';
  
  if (stats) {
    // Statistics 頁面使用
    const emotionCounts = Object.entries(stats)
      .filter(([_, count]) => count > 0)
      .map(([emotion, count]) => `${emotion}: ${count}次`)
      .join(', ');
    
    prompt = `你是一個名為 Moodee 的個人情緒教練。使用者 ${username || '朋友'} 的情緒統計如下：\n\n${emotionCounts}\n\n請提供一個簡短、溫暖且鼓勵性的建議（最多3行），根據使用者的情緒模式給予正面回饋和建議。語氣要友善、支持，避免診斷性語言。`;
  } else if (gameCompleted) {
    // 遊戲完成後使用
    prompt = `你是一個名為 Moodee 的個人情緒教練。使用者 ${username || '朋友'} 剛完成了一個情緒訓練遊戲。\n\n使用者選擇的情緒: ${emotion}\n使用者選擇的理由: ${reasons.join(', ')}\n\n請提供一個簡短、溫暖且鼓勵性的建議（最多3行），慶祝使用者完成訓練並給予正面回饋。語氣要友善、支持，避免診斷性語言。`;
  } else {
    // 遊戲開始前使用
    prompt = `你是一個名為 Moodee 的個人情緒教練。使用者 ${username || '朋友'} 即將開始情緒訓練遊戲。\n\n使用者選擇的情緒: ${emotion}\n使用者選擇的理由: ${reasons.join(', ')}\n\n請提供一個簡短、溫暖且鼓勵性的建議（最多3行），為使用者即將開始的訓練加油打氣。語氣要友善、支持，避免診斷性語言。`;
  }
  
  try {
    // 這裡要改成 fetchOpenAIResponse
    const response = await fetchOpenAIResponse(prompt);
    return response;
  } catch (error) {
    console.error('取得 Moodee 建議失敗:', error);
    throw error;
  }
} 
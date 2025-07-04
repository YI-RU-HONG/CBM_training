// src/services/openai.js
import axios from 'axios';

const GITHUB_AI_API_URL = 'https://api.github.com/ai-inference/v1/completions';
const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN; 

/**
 * 發送 prompt 至 GitHub AI Inference API
 * @param {string} prompt - 用戶 prompt
 * @returns {Promise<string>} AI 回應
 */
export async function fetchGithubAIResponse(prompt) {
  const response = await axios.post(
    GITHUB_AI_API_URL,
    {
      model: 'gpt-4', // 可根據 GitHub 支援的模型調整
      prompt,
      max_tokens: 256,
      temperature: 0.7,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
  // 根據 GitHub API 回傳格式調整
  return response.data.choices[0].text;
} 
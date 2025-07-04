export async function fetchUserProfile(userId) {
  // 模擬 API 請求
  const response = await fetch(`https://api.example.com/user/${userId}`);
  return response.json();
} 
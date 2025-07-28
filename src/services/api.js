import { getFirestore, collection, addDoc, getDoc, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore(app);

// yyyy-MM-dd 字串
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 獲取當前用戶 UID 的輔助函數
async function getCurrentUID() {
  const auth = getAuth();
  let user = auth.currentUser;
  let uid = null;
  
  // 如果 Firebase 用戶為 null，嘗試從 AsyncStorage 獲取 UID
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
  
  console.log('🔍 getUsernameFromUID - Fetching user data for UID:', uid);
  const userDoc = await getDoc(doc(db, 'users', uid));
  
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
}

export async function saveGame1Result({ emotion, reasons, reactionTime, dotIdx, pairIdx, timestamp }) {
  const uid = await getCurrentUID();
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;

  // 儲存在 game1_results/日期_使用者/random_id
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

// 新增：儲存情緒與理由
export async function saveEmotionAndReasons({ emotion, reasons }) {
  const uid = await getCurrentUID();
  console.log('🔍 saveEmotionAndReasons - Current user UID:', uid);
  
  const username = await getUsernameFromUID(uid);
  console.log('🔍 saveEmotionAndReasons - Retrieved username:', username);
  
  const dateString = getDateString(); // 取得今天的日期字串
  console.log('🔍 saveEmotionAndReasons - Date string:', dateString);
  
  // 儲存到 users/{uid}/moodRecords 集合，與 Statistics 頁面查詢路徑一致
  const resultRef = collection(db, `users/${uid}/moodRecords`);
  console.log('🔍 saveEmotionAndReasons - Collection path:', `users/${uid}/moodRecords`);
  
  const result = await addDoc(resultRef, {
    username,
    emotion: emotion.toLowerCase(), // 統一使用小寫，與 Statistics 頁面一致
    reasons,
    date: dateString, // 添加日期欄位
    timestamp: Date.now(),
  });
  
  console.log('🔍 saveEmotionAndReasons - Document saved with ID:', result.id);
}

/**
 * 註冊新用戶並寫入 Firestore
 * 前6人分配 group A，其餘分配 group B
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
  const group = userCount < 6 ? 'A' : 'B';

  // save to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    username,
    email,
    group,
    createdAt: serverTimestamp(),
  });

  return { uid: user.uid, group };
}

// ========== B 版遊戲獨立儲存 function ==========
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

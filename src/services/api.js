import { getFirestore, collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from './firebase';

const db = getFirestore(app);

// yyyy-MM-dd 字串
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getUsernameFromUID(uid) {
  if (!uid) return 'anonymous';
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return data.username || 'anonymous';
  }
  return 'anonymous';
}

export async function saveGame1Result({ emotion, reasons, reactionTime, dotIdx, pairIdx, timestamp }) {
  const user = getAuth().currentUser;
  const uid = user?.uid;
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
  const user = getAuth().currentUser;
  const uid = user?.uid;
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
  const user = getAuth().currentUser;
  const uid = user?.uid;
  const username = await getUsernameFromUID(uid);
  const docId = `${getDateString()}_${username}`;

  const resultRef = collection(db, 'game3_results', docId, 'records');

  await addDoc(resultRef, {
    username,
    difficulty,
    word,
    wordImg,
    sentence,
    sentenceImg,
    isRelated,
    reactionTime,
    timestamp,
  });
}

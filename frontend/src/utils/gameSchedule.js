import AsyncStorage from '@react-native-async-storage/async-storage';

const GAME_TYPES = ['Game', 'Game2', 'Game3', 'Game4'];
const GAME_QUESTION_COUNTS = {
  Game: 10,   
  Game2: 10,   
  Game3: { easy: 6, medium: 7, hard: 7 }, 
  Game4: { easy: 7, medium: 6, hard: 7 }, 
};

function getDifficultyByDays(userDays) {
  if (userDays >= 7) return 'hard';
  if (userDays >= 4) return 'medium';
  return 'easy';
}

function getShuffledIndices(count) {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A/B version
const GAME_TYPES_A = ['Game', 'Game2', 'Game3', 'Game4'];
const GAME_TYPES_B = ['Game-1', 'Game2-1', 'Game3-1', 'Game4-1'];

// determine today's version based on group/days
export function getTodayVersion(group, days) {
  if (group === 'A') {
    return days % 2 === 1 ? 'A' : 'B';
  } else {
    return days % 2 === 1 ? 'B' : 'A';
  }
}

// add version parameter
export async function getOrCreateTodaySchedule({ userDays = 1, version = 'A' }) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `game_schedule_${today}_v${version}`;
  let schedule = await AsyncStorage.getItem(key);
  if (schedule) return JSON.parse(schedule);

  const difficulty = getDifficultyByDays(userDays);
  const result = [];
  // shuffle each game type
  const shuffled = {
    Game: getShuffledIndices(GAME_QUESTION_COUNTS.Game),
    Game2: getShuffledIndices(GAME_QUESTION_COUNTS.Game2),
    Game3: getShuffledIndices(GAME_QUESTION_COUNTS.Game3[difficulty]),
    Game4: getShuffledIndices(GAME_QUESTION_COUNTS.Game4[difficulty]),
  };
  const used = { Game: 0, Game2: 0, Game3: 0, Game4: 0 };

  // select today's game types
  const GAME_TYPES = version === 'A' ? GAME_TYPES_A : GAME_TYPES_B;

  for (let i = 0; i < 6; i++) {
    const type = GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
    if (type.includes('Game2')) {
      const idx = used.Game2++;
      const questionIdx = shuffled.Game2[idx % shuffled.Game2.length];
      result.push({ type, questionIdx });
    } else if (type.includes('Game3')) {
      const idx = used.Game3++;
      const questionIdx = shuffled.Game3[idx % shuffled.Game3.length];
      result.push({ type, difficulty, questionIdx });
    } else if (type.includes('Game4')) {
      const idx = used.Game4++;
      const questionIdx = shuffled.Game4[idx % shuffled.Game4.length];
      result.push({ type, difficulty, questionIdx });
    } else {
      const idx = used.Game++;
      const questionIdx = shuffled.Game[idx % shuffled.Game.length];
      result.push({ type, questionIdx });
    }
  }
  await AsyncStorage.setItem(key, JSON.stringify(result));
  return result;
}

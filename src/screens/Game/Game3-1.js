import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame3BResult } from '../../services/api';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase'; // 依你的專案路徑調整

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const maxImgSize = Math.min(240, SCREEN_WIDTH * 0.8);

// 題庫
const WSAP_QUESTIONS = [
  // 初階
  {
    difficulty: 'easy',
    sentence: 'You received an email from your teacher.',
    word: 'Praise',
  },
  {
    difficulty: 'easy',
    sentence: 'You saw your friend talking to someone quietly.',
    word: 'Surprise',
  },
  {
    difficulty: 'easy',
    sentence: 'Your boss asked to meet you tomorrow.',
    word: 'Fired',
  },
  // 中階
  {
    difficulty: 'medium',
    sentence: 'Someone laughed after you finished your presentation.',
    word: 'Supportive',
  },
  {
    difficulty: 'medium',
    sentence: 'A message popped up from your manager.',
    word: 'Promotion',
  },
  // 高階
  {
    difficulty: 'hard',
    sentence: 'They didn’t reply after reading your message.',
    word: 'Thoughtful',
  },
  {
    difficulty: 'hard',
    sentence: 'You overheard people mentioning your name.',
    word: 'Curious',
  },
  {
    difficulty: 'hard',
    sentence: 'You weren’t asked to join the final meeting.',
    word: 'Excluded',
  },
];

export default function Game3Screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const questionIdx = route.params?.questionIdx ?? 0;
  const schedule = route.params?.schedule;
  const currentStep = route.params?.currentStep ?? 0;
  const totalSteps = route.params?.totalSteps ?? 6;
  const difficulty = route.params?.difficulty ?? (() => {
    let d = 'easy';
    if (userDays >= 4 && userDays < 7) d = 'medium';
    if (userDays >= 7) d = 'hard';
    return d;
  })();

  const [userDays, setUserDays] = useState(1);

  useEffect(() => {
    async function fetchUserDays() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return; // 尚未登入
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const createdAt = userDoc.data().createdAt;
          if (createdAt && createdAt.toDate) {
            const firstDate = createdAt.toDate();
            const now = new Date();
            const diff = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24)) + 1;
            setUserDays(diff);
          }
        }
      } catch (e) {
        console.log('取得使用天數失敗', e);
      }
    }
    fetchUserDays();
  }, []);

  // 根據 userDays 決定難度
  // let difficulty = 'easy';
  // if (userDays >= 4 && userDays < 7) difficulty = 'medium';
  // if (userDays >= 7) difficulty = 'hard';

  // 過濾出該難度的題目
  const filteredQuestions = WSAP_QUESTIONS.filter(q => q.difficulty === difficulty);
  // 隨機抽一題
  const question = filteredQuestions[questionIdx % filteredQuestions.length];

  // 畫面狀態：0=十字, 1=單詞, 2=情境, 3=問句
  const [screen, setScreen] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    console.log(currentStep, totalSteps) 
    setScreen(0);
    setStartTime(Date.now());
    // 十字 1s
    const t1 = setTimeout(() => setScreen(1), 1500);
    // 單詞 1s
    const t2 = setTimeout(() => setScreen(2), 3000);
    // 情境 1.5s
    const t3 = setTimeout(() => setScreen(3), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [questionIdx]);

  // 點選 O/X
  const handleAnswer = async (isRelated) => {
    const reactionTime = Date.now() - startTime;
    await saveGame3BResult({
      difficulty: question.difficulty,
      word: question.word,
      sentence: question.sentence,
      isRelated,
      reactionTime,
      timestamp: Date.now(),
    });
    navigation.replace('DailyGame', {
      schedule,
      currentStep: currentStep + 1,
    });
  };

  return (
    <View style={styles.container}>
      {/* 進度條 */}
      <View style={styles.progressBarWrap}>
        {[...Array(totalSteps)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              i === currentStep
                ? styles.progressBarActive
                : styles.progressBarInactive,
            ]}
          />
        ))}
      </View>
      {/* 標題 */}
      <Text style={styles.title}>Related or not?</Text>
      {/* 畫面切換 */}
      {screen === 0 && (
        // 十字
        <View style={styles.crossWrap}>
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>
      )}
      {screen === 1 && (
        // 單詞
        <View style={styles.wordWrap}>
          <Text style={styles.word}>{question.word}</Text>
        </View>
      )}
      {screen === 2 && (
        // 情境
        <View style={styles.sentenceWrap}>
          <Text style={styles.sentence}>{question.sentence}</Text>
        </View>
      )}
      {screen === 3 && (
        // 問句+按鈕
        <View style={styles.questionWrap}>
          <Text style={styles.question}>Was the word related to the sentence?</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => handleAnswer(true)}>
              <Image source={require('../../../assets/images/Game/CBM-I/WSAP/_Button_1.png')} style={styles.buttonImg} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAnswer(false)}>
              <Image source={require('../../../assets/images/Game/CBM-I/WSAP/_Button_2.png')} style={styles.buttonImg} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,250,237,1)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16, // 新增
  },
  progressBarWrap: {
    flexDirection: 'row',
    marginTop: 100,
    marginBottom: 20,
    justifyContent: 'center',
  },
  progressBar: {
    width: 48,
    height: 0,
    borderWidth: 5,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  progressBarActive: {
    borderColor: '#616A7F',
  },
  progressBarInactive: {
    borderColor: '#EAE8E2',
  },
  title: {
    fontSize: 30,
    fontFamily: 'ArialRoundedMTBold',
    color: '#42485A',
    marginBottom: 40,
    marginTop: 20,
    textAlign: 'center',
  },
  crossWrap: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 19,
    left: SCREEN_WIDTH / 2 - 19,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 4,
    height: 38,
    backgroundColor: '#42485A',
    left: 17,
    top: 0,
    borderRadius: 2,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 38,
    height: 4,
    backgroundColor: '#42485A',
    top: 17,
    left: 0,
    borderRadius: 2,
  },
  wordWrap: {
    alignItems: 'center',
    marginTop: 60,
    top: SCREEN_HEIGHT * 0.16,
  },
  word: {
    fontSize: 28,
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    marginBottom: 20,
  },
  sentenceWrap: {
    alignItems: 'center',
    marginTop: 40,
    top: SCREEN_HEIGHT * 0.16,
  },
  sentence: {
    fontSize: 24,
    color: '#42485A',
    fontFamily: 'Arial', 
    textAlign: 'center',
    width: 285,
    lineHeight: 28,
    marginBottom: 20,
  },
  questionWrap: {
    alignItems: 'center',
    marginTop: 60,
  },
  question: {
    fontSize: 24,
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonImg: {
    width: Math.min(110, SCREEN_WIDTH * 0.3),
    height: Math.min(110, SCREEN_WIDTH * 0.3),
    marginHorizontal: 16,
    resizeMode: 'contain',
  },
}); 
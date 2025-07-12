import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame4BResult } from '../../services/api'; // B版遊戲呼叫B版function
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_WIDTH = 250;
// const BUTTON_HEIGHT = 41;

// src/screens/Game/Game4.js
const GAME4_QUESTIONS = [
  // 初階
  {
    difficulty: 'easy',
    question: 'You receive a message from your manager.',
    positive: "It’s a routine meeting.",
    negative: "You're in trouble.",
  },
  {
    difficulty: 'easy',
    question: 'You receive a message from your manager: "Come to my office in a bit."',
    positive: "He might want to praise my report today.",
    negative: "He might be upset about something I did.",
  },
  {
    difficulty: 'easy',
    question: "Your friend read your message but didn’t reply.",
    positive: "They’re probably just busy.",
    negative: "They might be mad.",
  },
  {
    difficulty: 'easy',
    question: "You waved at a friend but they didn’t wave back.",
    positive: "They didn’t see you.",
    negative: "They ignored you.",
  },
  {
    difficulty: 'easy',
    question: "You shared an idea in a group chat and got no reply.",
    positive: "Everyone is just busy.",
    negative: "They don’t care about your idea.",
  },
  {
    difficulty: 'easy',
    question: "You receive an email titled “Meeting Tomorrow”.",
    positive: "It’s a regular update.",
    negative: "Something went wrong.",
  },
  {
    difficulty: 'easy',
    question: "You waved at someone, but they didn’t wave back.",
    positive: "They didn’t see you.",
    negative: "They ignored you on purpose.",
  },
  
  // 中階
  {
    difficulty: 'medium',
    question: "You are walking into a room full of strangers.",
    positive: "They might be friendly.",
    negative: "They are judging you.",
  },
  {
    difficulty: 'medium',
    question: "You submitted an assignment yesterday.",
    positive: "You did your best.",
    negative: "It was terrible.",
  },
  {
    difficulty: 'medium',
    question: "You walk into a meeting room and everyone goes quiet and looks at you.",
    positive: "They just happened to finish a topic.",
    negative: "They were probably talking about me.",
  },
  {
    difficulty: 'medium',
    question: "Your friend cancels your weekend plans last minute.",
    positive: "Something urgent came up.",
    negative: "They didn’t want to hang out.",
  },
  {
    difficulty: 'medium',
    question: "You see your coworkers whispering and glancing your way.",
    positive: "They’re planning a surprise.",
    negative: "They’re talking about you.",
  },
  {
    difficulty: 'medium',
    question: "You post something on social media and get few likes.",
    positive: "Maybe the algorithm didn’t show it.",
    negative: "People didn’t like your post.",
  },
  
  // 高階
  {
    difficulty: 'hard',
    question: "You overhear someone talking in low voices.",
    positive: "Not about you.",
    negative: "They're gossiping about you.",
  },
  {
    difficulty: 'hard',
    question: "You see photos of your friends hanging out on Instagram. You weren’t invited.",
    positive: "They might have thought I was busy.",
    negative: "They don’t like me anymore.",
  },
  {
    difficulty: 'hard',
    question: "Your boss didn’t smile or praise you during a meeting.",
    positive: "Maybe they’re just having a tough day.",
    negative: "He thinks I’m not good enough.",
  },
  {
    difficulty: 'hard',
    question: "You are not invited to a group chat.",
    positive: "It may be unintentional.",
    negative: "They excluded you.",
  },
  {
    difficulty: 'hard',
    question: "Someone replies “K.” to your long message.",
    positive: "They were just busy or short on time.",
    negative: "They are annoyed with you.",
  },
  {
    difficulty: 'hard',
    question: "You’re not invited to a team lunch.",
    positive: "It might have been spontaneous.",
    negative: "You were intentionally excluded.",
  },
  {
    difficulty: 'hard',
    question: "You don’t get a response after submitting a job application.",
    positive: "They're still reviewing applications.",
    negative: "They already rejected you silently.",
  },
  
  
];

export default function Game4Screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const questionIdx = route.params?.questionIdx ?? 0;
  const schedule = route.params?.schedule;
  const currentStep = route.params?.currentStep ?? 0;
  const totalSteps = route.params?.totalSteps ?? 6;
  const passedDifficulty = route.params?.difficulty;

  // 取得 userDays，預設 1
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

  // 根據 difficulty 決定題目
  let difficulty = passedDifficulty;
  if (!difficulty) {
    difficulty = 'easy';
    if (userDays >= 4 && userDays < 7) difficulty = 'medium';
    if (userDays >= 7) difficulty = 'hard';
  }
  const filteredQuestions = GAME4_QUESTIONS.filter(q => q.difficulty === difficulty);
  const question = filteredQuestions.length > 0
    ? filteredQuestions[questionIdx % filteredQuestions.length]
    : undefined;

  if (!question) {
    return <Text>找不到題目，請檢查題庫設定</Text>;
  }

  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentStep, difficulty]);

  // 回答
  const handleAnswer = async (answerType) => {
    const reactionTime = Date.now() - startTime;
    await saveGame4BResult({
      difficulty: question.difficulty,
      question: question.question,
      answer: answerType, // 'positive' or 'negative'
      answerText: question[answerType],
      reactionTime,
      timestamp: Date.now(),
    });
    // 跳下一步（可依需求調整）
    navigation.replace('DailyGame', {
      schedule,
      currentStep: currentStep + 1,
    });
  };

  // 計算圖片自適應大小
  const maxImgSize = Math.min(240, SCREEN_WIDTH * 0.8);
  const imgStyle = {
    width: maxImgSize,
    height: maxImgSize,
    resizeMode: 'contain',
    alignSelf: 'center',
  };

  return (
    <View style={styles.container}>
      {/* 階段條 */}
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
      {/* 大標 */}
      <Text style={styles.title}>What do you think?</Text>
      {/* 小標 */}
      <Text style={styles.subtitle}>{question.question}</Text>
      {/* 圖片 */}
      {/* 選項按鈕 */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={styles.optionBtn}
          onPress={() => handleAnswer('positive')}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>{question.positive}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionBtn}
          onPress={() => handleAnswer('negative')}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>{question.negative}</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 0,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#616A7F',
    fontFamily: 'Arial',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 24,
    lineHeight: 28,
  },
  optionBtn: {
    width: SCREEN_WIDTH * 0.65,
    // minWidth: 200,
    // maxWidth: 320,
    backgroundColor: 'rgba(217,217,217,0.5)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 10,
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 18,
    color: '#42485A',
    fontFamily: 'Arial',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame4Result } from '../../services/api'; // 你要在api.js實作這個function
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
    image: require('../../../assets/images/Game/CBM-I/Situation/manager message.png'),
    positive: "It’s a routine meeting.",
    negative: "You're in trouble.",
  },
  {
    difficulty: 'easy',
    question: 'You receive a message from your manager: "Come to my office in a bit."',
    image: require('../../../assets/images/Game/CBM-I/Situation/manager office.png'),
    positive: "He might want to praise my report today.",
    negative: "He might be upset about something I did.",
  },
  {
    difficulty: 'easy',
    question: "Your friend read your message but didn’t reply.",
    image: require('../../../assets/images/Game/CBM-I/WSAP/message read.png'),
    positive: "They’re probably just busy.",
    negative: "They might be mad.",
  },
  {
    difficulty: 'easy',
    question: "	Your classmate walked past without saying hi.",
    image: require('../../../assets/images/Game/CBM-I/Situation/walk pass.png'),
    positive: "They didn’t notice you.",
    negative: "They are ignoring you.",
  }, 
  {
    difficulty: 'easy',
    question: "You were not tagged in a group photo.",
    image: require('../../../assets/images/Game/CBM-I/Situation/photo tag.png'),
    positive: "Maybe it was unintentional.",
    negative: "They didn’t want to include you.",
  },
  {
    difficulty: 'easy',
    question: "A coworker quickly walked away when you approached.",
    image: require('../../../assets/images/Game/CBM-I/Situation/walk away.png'),
    positive: "They were in a rush.",
    negative: "They didn’t want to talk to you.",
  },
  {
    difficulty: 'easy',
    question: "You made a joke, but no one laughed.",
    image: require('../../../assets/images/Game/CBM-I/Situation/joke.png'),
    positive: "Maybe they didn’t hear it clearly.",
    negative: "They think you’re not funny.",
  },
  // 中階
  {
    difficulty: 'medium',
    question: "You are walking into a room full of strangers.",
    image: require('../../../assets/images/Game/CBM-I/Situation/full of strangers.png'),
    positive: "They might be friendly.",
    negative: "They are judging you.",
  },
  {
    difficulty: 'medium',
    question: "You submitted an assignment yesterday.",
    image: require('../../../assets/images/Game/CBM-I/Situation/submit essay.png'),
    positive: "You did your best.",
    negative: "It was terrible.",
  },
  {
    difficulty: 'medium',
    question: "You walk into a meeting room and everyone goes quiet and looks at you.",
    image: require('../../../assets/images/Game/CBM-I/Situation/meeting room.png'),
    positive: "They just happened to finish a topic.",
    negative: "They were probably talking about me.",
  },
  {
    difficulty: 'medium',
    question: "Your message was seen but not replied to for hours.",
    image: require('../../../assets/images/Game/CBM-I/Situation/no reply.png'),
    positive: "They might be busy.",
    negative: "They’re ignoring you.",
  },
  {
    difficulty: 'medium',
    question: "Your friend didn’t invite you to an outing.",
    image: require('../../../assets/images/Game/CBM-I/Situation/friend out.png'),
    positive: "They thought you might be unavailable.",
    negative: "They didn’t want you there.",
  },
  {
    difficulty: 'medium',
    question: "You were interrupted during a meeting.",
    image: require('../../../assets/images/Game/CBM-I/Situation/interrupted.png'),
    positive: "They were excited to share their idea.",
    negative: "They didn’t value your opinion.",
  },
  // 高階
  {
    difficulty: 'hard',
    question: "You overhear someone talking in low voices.",
    image: require('../../../assets/images/Game/CBM-I/Situation/talk secret.png'),
    positive: "Not about you.",
    negative: "They're gossiping about you.",
  },
  {
    difficulty: 'hard',
    question: "You see photos of your friends hanging out on Instagram. You weren’t invited.",
    image: require('../../../assets/images/Game/CBM-I/Situation/instagram.png'),
    positive: "They might have thought I was busy.",
    negative: "They don’t like me anymore.",
  },
  {
    difficulty: 'hard',
    question: "Your boss didn’t smile or praise you during a meeting.",
    image: require('../../../assets/images/Game/CBM-I/Situation/serious boss.png'),
    positive: "Maybe they’re just having a tough day.",
    negative: "He thinks I’m not good enough.",
  },
  {
    difficulty: 'hard',
    question: "You are not invited to a group chat.",
    image: require('../../../assets/images/Game/CBM-I/Situation/group without you.png'),
    positive: "It may be unintentional.",
    negative: "They excluded you.",
  },
  {
    difficulty: 'hard',
    question: "	You were removed from a group chat.",
    image: require('../../../assets/images/Game/CBM-I/Situation/moved from group.png'),
    positive: "Maybe they started a new project group.",
    negative: "They didn’t want you in the group.",
  }, 
  {
    difficulty: 'hard',
    question: "You received critical feedback on your presentation.",
    image: require('../../../assets/images/Game/CBM-I/Situation/critical feedback.png'),
    positive: "It’s meant to help you improve.",
    negative: "They think you’re not competent.",
  }, 
  {
    difficulty: 'hard',
    question: "Someone gave you a short response after you opened up.",
    image: require('../../../assets/images/Game/CBM-I/Situation/short reply.png'),
    positive: "They might not know how to respond.",
    negative: "They don’t care about your feelings.",
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
    await saveGame4Result({
      difficulty: question.difficulty,
      question: question.question,
      image: question.image,
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
    <View style={{flex: 1, backgroundColor: 'rgba(255,250,237,1)'}}>
      {/* 外層View確保背景色與安全區域 */}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
        <Image source={question.image} style={imgStyle} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'rgba(255,250,237,1)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16, 
    paddingBottom: 40, // 增加底部空間避免按鈕被遮
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
    marginTop: 30,
    marginBottom: 10,
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

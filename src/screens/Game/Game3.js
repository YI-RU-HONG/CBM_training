import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame3Result } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 題庫
const WSAP_QUESTIONS = [
  // 初階
  {
    difficulty: 'easy',
    sentence: 'You received an email from your teacher.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/received email.png'),
    word: 'Praise',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/Praise.png'),
  },
  {
    difficulty: 'easy',
    sentence: 'You saw your friend talking to someone quietly.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/talk quiet.png'),
    word: 'Surprise',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/surprise gift.png'),
  },
  {
    difficulty: 'easy',
    sentence: 'Your boss asked to meet you tomorrow.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/boss tomorrow 1.png'),
    word: 'Fired',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/Fired 1.png'),
  },
  // 中階
  {
    difficulty: 'medium',
    sentence: 'Someone laughed after you finished your presentation.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/presentation laugh.png'),
    word: 'Supportive',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/supportive.png'),
  },
  {
    difficulty: 'medium',
    sentence: 'A message popped up from your manager.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/message popped up.png'),
    word: 'Promotion',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/promotion.jpg'),
  },
  // 高階
  {
    difficulty: 'hard',
    sentence: 'They didn’t reply after reading your message.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/message read.png'),
    word: 'Thoughtful',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/thoughtful.png'),
  },
  {
    difficulty: 'hard',
    sentence: 'You overheard people mentioning your name.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/mention name.png'),
    word: 'Curious',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/curious.png'),
  },
  {
    difficulty: 'hard',
    sentence: 'You weren’t asked to join the final meeting.',
    sentenceImg: require('../../../assets/images/Game/CBM-I/WSAP/meeting.png'),
    word: 'Excluded',
    wordImg: require('../../../assets/images/Game/CBM-I/WSAP/excluded.png'),
  },
];

export default function Game3Screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const currentStep = route.params?.currentStep ?? 0;
  const totalSteps = route.params?.totalSteps ?? 6;

  // 依 currentStep 決定難度
  let difficulty = 'easy';
  if (currentStep >= 2 && currentStep < 4) difficulty = 'medium';
  if (currentStep >= 4) difficulty = 'hard';

  // 過濾出該難度的題目
  const filteredQuestions = WSAP_QUESTIONS.filter(q => q.difficulty === difficulty);
  // 隨機抽一題
  const [questionIdx] = useState(Math.floor(Math.random() * filteredQuestions.length));
  const question = filteredQuestions[questionIdx];

  // 畫面狀態：0=十字, 1=單詞, 2=情境, 3=問句
  const [screen, setScreen] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
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
    await saveGame3Result({
      difficulty: question.difficulty,
      word: question.word,
      wordImg: question.wordImg,
      sentence: question.sentence,
      sentenceImg: question.sentenceImg,
      isRelated,
      reactionTime,
      timestamp: Date.now(),
    });
    // 跳下一個遊戲
    navigation.navigate('Game4', {
      currentStep: currentStep + 1,
      totalSteps,
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
        // 單詞+圖
        <View style={styles.wordWrap}>
          <Text style={styles.word}>{question.word}</Text>
          <Image source={question.wordImg} style={styles.wordImg} />
        </View>
      )}
      {screen === 2 && (
        // 情境+圖
        <View style={styles.sentenceWrap}>
          <Text style={styles.sentence}>{question.sentence}</Text>
          <Image source={question.sentenceImg} style={styles.sentenceImg} />
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
    marginTop: 100,
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
  },
  word: {
    fontSize: 28,
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    marginBottom: 20,
  },
  wordImg: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  sentenceWrap: {
    alignItems: 'center',
    marginTop: 40,
  },
  sentence: {
    fontSize: 26,
    color: '#42485A',
    fontFamily: 'Arial', // 修正為系統字型
    textAlign: 'center',
    width: 285,
    lineHeight: 28,
    marginBottom: 20,
  },
  sentenceImg: {
    width: 180,
    height: 140,
    resizeMode: 'contain',
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
    width: 110,
    height: 110,
    marginHorizontal: 16,
    resizeMode: 'contain',
  },
}); 
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Animated } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameDone() {
  const navigation = useNavigation();
  const route = useRoute();
  // 這裡可根據 route.params 或 LLM 回傳語句
  const coachText = route.params?.coachText || "Keep up the great work!";
  const selectedEmotion = route.params?.selectedEmotion;
  const selectedReasons = route.params?.selectedReasons;

  // 動畫設定
  const moodeeAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(moodeeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // 強制長字串自動斷行
  function insertBreaks(str, maxLen = 16) {
    // 每 maxLen 個字插入一個零寬空格
    return str.replace(new RegExp(`(.{${maxLen}})`, 'g'), '$1\u200B');
  }

  const handleContinue = () => {
    // 傳遞遊戲完成資料給 HomePage
    navigation.replace('HomePage', { 
      showCongrats: true,
      gameCompleted: {
        selectedEmotion,
        selectedReasons
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <Text style={styles.title}>You've completed{'\n'}today's training !</Text>
      {/* moodee 對話匡動畫 */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleAnim }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{insertBreaks(coachText)}</Text>
        </View>
      </Animated.View>
      {/* moodee 圖示動畫 */}
      <Animated.View style={[styles.moodee, { transform: [{ translateX: moodeeAnim }] }]}>
        <Image
          source={require('../../../assets/images/Game/GroupEndmoodee.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>
      {/* 按鈕 */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9ED',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    width: 294,
    height: 70,
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: 30,
    textAlign: 'center',
    marginTop: 120,
    marginBottom: 40,
    lineHeight: 34.72,
  },
  bubbleWrap: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.58,
    left: 32,
    zIndex: 2,
    minWidth: 80,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  bubble: {
    backgroundColor: '#F4F2EC',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 80,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  bubbleText: {
    color: '#41424A',
    fontSize: 16,
    fontFamily: 'ArialUnicodeMS',
    textAlign: 'left',
    flexShrink: 1,
  },
  moodee: {
    position: 'absolute',
    right: 0,
    bottom: SCREEN_HEIGHT * 0.17,
    width: SCREEN_WIDTH * 0.62,
    height: SCREEN_WIDTH * 1.1,
  },
  button: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    height: 48,
    backgroundColor: '#F7944D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'ArialRoundedMTBold',
    fontWeight: 'bold',
  },
});

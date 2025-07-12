import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Animated } from 'react-native';
import { getMoodeeMessageGemini } from '../../services/gemini';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameDone() {
  const navigation = useNavigation();
  const route = useRoute();
  // 取得遊戲結果資料
  const selectedEmotion = route.params?.selectedEmotion;
  const selectedReasons = route.params?.selectedReasons;
  const positiveRatio = route.params?.positiveRatio;
  const reactionTime = route.params?.reactionTime;
  const tasks = route.params?.tasks;

  // 狀態
  const [bubbleText, setBubbleText] = useState('');
  const [loading, setLoading] = useState(true);

  // 動畫設定
  const moodeeAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 取得 Gemini 語句
    async function fetchCoachText() {
      setLoading(true);
      try {
        const msg = await getMoodeeMessageGemini({
          emotion: selectedEmotion,
          reasons: selectedReasons,
          positiveRatio,
          reactionTime,
          tasks,
          gameCompleted: true,
        });
        setBubbleText(msg);
      } catch (e) {
        setBubbleText('Keep up the great work!');
      }
      setLoading(false);
    }
    fetchCoachText();
  }, [selectedEmotion, selectedReasons, positiveRatio, reactionTime, tasks]);

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
      <Text style={styles.title}>{"You've completed\ntoday's training !"}</Text>
      {/* moodee 對話匡動畫 */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleAnim }]}> 
        <View style={styles.bubble}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#A8AFBC" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <ScrollView style={styles.bubbleScroll} contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={styles.bubbleText}>{bubbleText}</Text>
            </ScrollView>
          )}
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
    bottom: SCREEN_HEIGHT * 0.53,
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
    minHeight: SCREEN_HEIGHT * 0.09, // 固定高度
    maxHeight: SCREEN_HEIGHT * 0.16, // 固定高度
  },
  bubbleScroll: {
    maxHeight: SCREEN_HEIGHT * 0.16,
    minHeight: SCREEN_HEIGHT * 0.09,
  },
  bubbleText: {
    color: '#41424A',
    fontSize: 16,
    fontFamily: 'ArialUnicodeMS',
    textAlign: 'left',
    flexShrink: 1,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT * 0.09,
  },
  loadingText: {
    marginLeft: 8,
    color: '#A8AFBC',
    fontSize: 16,
    fontFamily: 'ArialUnicodeMS',
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

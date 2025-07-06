import React, { useRef, useEffect, useState } from 'react';
import { fetchGithubAIResponse, getMoodeeMessage } from '../../services/openai.js';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 產生今天起連續15天的日期
function generateStamps() {
  const today = dayjs();
  return Array.from({ length: 20 }, (_, i) => ({
    date: `${today.month() + 1}/${today.date() + i}`,
    completed: false,
  }));
}

export default function HomePage({ navigation }) {
  const route = useRoute();
  // 對話匡內容可動態變化
  const [bubbleText, setBubbleText] = useState("Hi! Name, I'm moodee, your personal coach.");
  const [loading, setLoading] = useState(false);
  // moodee 彈出動畫
  const moodeeAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const [stamps, setStamps] = useState(generateStamps());
  
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

  // 檢查是否有遊戲完成資料，如果有則生成教練建議
  useEffect(() => {
    const gameData = route.params?.gameCompleted;
    if (gameData) {
      generateCoachMessage(gameData);
    }
  }, [route.params]);

  // 生成教練建議
  const generateCoachMessage = async (gameData) => {
    setLoading(true);
    try {
      const message = await getMoodeeMessage({
        emotion: gameData.selectedEmotion,
        reasons: gameData.selectedReasons,
        gameCompleted: true,
      });
      setBubbleText(message);
    } catch (error) {
      setBubbleText("Great job completing the training! Keep up the good work!");
    }
    setLoading(false);
  };

  const completedCount = stamps.filter(d => d.completed).length;

  // 計算滾動區高度：stamp數量*stamp高度+間距
  const scrollContentHeight = SCREEN_WIDTH * 0.18 * stamps.length + SCREEN_HEIGHT * 0.071 * (stamps.length - 1) + SCREEN_HEIGHT * 0.3;

  const handleGameComplete = (date) => {
    setStamps(prev =>
      prev.map(stamp =>
        stamp.date === date ? { ...stamp, completed: true } : stamp
      )
    );
  };

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [stamps.length]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: SCREEN_HEIGHT } // 這行很重要
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../../assets/images/HomePage/background.png')}
          style={[styles.background, { height: scrollContentHeight }]}
          resizeMode="cover"
        />
        {[...stamps].reverse().map((item, idx) => (
          <TouchableOpacity
            key={item.date}
            testID={`stamp-${idx}`}
            style={[styles.dateNodeWrap, { marginVertical: SCREEN_HEIGHT * 0.036 }]} // 60/844
            onPress={() => navigation.navigate('Emotion')}
          >
            <Image
              source={require('../../../assets/images/HomePage/Stamp.png')}
              style={styles.stamp}
            />
            <Text style={[styles.dateText, item.completed && { opacity: 0.5 }]}>{item.date}</Text>
            {item.completed && (
              <Image
                source={require('../../../assets/images/HomePage/check.png')}
                style={styles.checkCenter}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 星星與數字 */}
      <View style={styles.starContainer}>
        <Image
          source={require('../../../assets/images/HomePage/Star.png')}
          style={styles.star}
        />
        <View style={styles.starNumShadowWrap}>
          <Text style={styles.starNum}>{completedCount}</Text>
        </View>
      </View>

      {/* 對話匡動畫分開，內容可動態變化 */}
      <Animated.View style={[
        styles.bubbleContainer,
        { opacity: bubbleAnim }
      ]}>
        <View style={styles.bubbleShadowWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{bubbleText}</Text>
          </View>
        </View>
      </Animated.View>
      {/* moodee */}
      <Animated.View style={[
        styles.moodeeContainer,
        { transform: [{ translateX: moodeeAnim }] }
      ]}>
        <Image
          source={require('../../../assets/images/HomePage/moodee.png')}
          style={styles.moodee}
        />
      </Animated.View>

      {/* 底部導航列 */}
      <View style={styles.navBar}>
        <NavIcon
          icon={require('../../../assets/images/HomePage/Home.png')}
          active={true}
          onPress={() => navigation.navigate('Home')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/quote.png')}
          active={false}
          onPress={() => navigation.navigate('Quotes')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/statistic.png')}
          active={false}
          onPress={() => navigation.navigate('Statistics')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/profile.png')}
          active={false}
          onPress={() => navigation.navigate('Profile')}
        />
      </View>
    </View>
  );
}

// 底部導航icon元件
function NavIcon({ icon, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.navIcon}>
      <Image
        source={icon}
        style={[
          styles.navIconImg,
          { tintColor: active ? 'rgb(120,167,132)' : 'rgb(61,64,79)' }
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(194,227,168)',
  },
  background: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  starContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.08,
    right: SCREEN_WIDTH * 0.08,
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    width: SCREEN_WIDTH * 0.1,
    height: SCREEN_WIDTH * 0.1,
  },
  starNumShadowWrap: {
    marginLeft: SCREEN_WIDTH * 0.015,
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  starNum: {
    color: 'rgb(255,244,157)',
    fontFamily: 'PottaOne',
    fontSize: SCREEN_WIDTH * 0.09,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.12,
    width: SCREEN_WIDTH * 0.13,
    height: SCREEN_WIDTH * 0.13,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    // marginTop: SCREEN_HEIGHT * 0.14,
    // marginBottom: SCREEN_HEIGHT * 0.12,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: SCREEN_HEIGHT * 0.14,
  },
  dateNodeWrap: {
    width: SCREEN_WIDTH * 0.18,
    height: SCREEN_WIDTH * 0.18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SCREEN_HEIGHT * 0.021,
  },
  stamp: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.18,
    height: SCREEN_WIDTH * 0.18,
    left: 0,
    top: 0,
    resizeMode: 'contain',
  },
  dateText: {
    fontSize: SCREEN_WIDTH * 0.056,
    color: '#7A6F5F',
    fontWeight: 'bold',
    zIndex: 2,
  },
  checkCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: SCREEN_WIDTH * 0.09,
    height: SCREEN_WIDTH * 0.09,
    marginLeft: -SCREEN_WIDTH * 0.045,
    marginTop: -SCREEN_WIDTH * 0.055,
    zIndex: 3,
  },
  moodeeContainer: {
    position: 'absolute',
    right: 0,
    top: SCREEN_HEIGHT * 0.2,
    zIndex: 10,
    overflow: 'visible',
  },
  bubbleContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.43,
    top: SCREEN_HEIGHT * 0.12,
    zIndex: 11,
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  bubbleShadowWrap: {
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  bubble: {
    backgroundColor: 'rgb(245,243,237)',
    borderRadius: 20,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    width: SCREEN_WIDTH * 0.48, // 固定寬度
    minHeight: SCREEN_HEIGHT * 0.07,
    justifyContent: 'center',
  },
  bubbleText: {
    color: '#41424A',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '500',
    fontFamily: 'ArialUnicodeMS',
    flexWrap: 'wrap', // 讓文字自動換行
  },
  moodee: {
    width: SCREEN_WIDTH * 0.45,
    height: SCREEN_WIDTH * 0.55,
    marginTop: 0,
  },
  navBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    height: SCREEN_HEIGHT * 0.076,
    backgroundColor: '#fff',
    borderRadius: SCREEN_HEIGHT * 0.038,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    paddingLeft: 50,
    paddingRight: 50,
  },
  navIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconImg: {
    width: 20,
    height: 20,
  },
}); 
import React, { useRef, useEffect, useState } from 'react';
import { fetchGithubAIResponse } from '../../services/openai.js';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STAMP_COUNT = 15;
const STAMP_GAP = 60 / SCREEN_HEIGHT; // 60pt 自適應
const stamps = Array.from({ length: STAMP_COUNT }, (_, i) => ({
  date: `7/${21 + i}`,
  completed: i < 2, // 前兩個打勾
}));

export default function HomePage({ navigation }) {
  // 對話匡內容可動態變化
  const [bubbleText, setBubbleText] = useState("Hi! Name,\nI'm moodee, your\npersonal coach.");
  // moodee 彈出動畫
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

  const completedCount = stamps.filter(d => d.completed).length;

  // 計算滾動區高度：stamp數量*stamp高度+間距
  const scrollContentHeight = SCREEN_WIDTH * 0.18 * STAMP_COUNT + SCREEN_HEIGHT * 0.071 * (STAMP_COUNT - 1) + SCREEN_HEIGHT * 0.3;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { height: scrollContentHeight }]}
        showsVerticalScrollIndicator={false}
        ref={ref => {
          if (ref) {
            setTimeout(() => {
              ref.scrollToEnd({ animated: false });
            }, 100);
          }
        }}
      >
        {/* 背景圖也在 ScrollView 內，與 stamp 一起滾動 */}
        <Image
          source={require('../../../assets/images/HomePage/background.png')}
          style={[styles.background, { height: scrollContentHeight }]}
          resizeMode="cover"
        />
        {/* 日期 stamp 節點 */}
        {stamps.map((item, idx) => (
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
    marginTop: SCREEN_HEIGHT * 0.14,
    marginBottom: SCREEN_HEIGHT * 0.12,
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
    maxWidth: SCREEN_WIDTH * 0.6,
    minWidth: SCREEN_WIDTH * 0.3,
    minHeight: SCREEN_HEIGHT * 0.07,
    justifyContent: 'center',
  },
  bubbleText: {
    color: '#41424A',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '500',
    fontFamily: 'ArialUnicodeMS',
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
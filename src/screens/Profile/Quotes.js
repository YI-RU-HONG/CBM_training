import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, PanResponder, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuotes } from '../../context/QuotesContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.5;
// const CARD_LEFT = SCREEN_WIDTH * 0.0769;
const CARD_TOP = SCREEN_HEIGHT * 0.165;
const TITLE_LEFT = SCREEN_WIDTH * 0.0769;
const TITLE_TOP = SCREEN_HEIGHT * 0.096;
const ARROW_SIZE = SCREEN_WIDTH * 0.08;
const TAKE_BREATH_TOP = SCREEN_HEIGHT * 0.71;

const CARD_IMAGES = [
  require('../../../assets/images/Quotes/Card1.png'),
  require('../../../assets/images/Quotes/Card2.png'),
];
const EMPTY_CARD_IMAGE = require('../../../assets/images/Quotes/Card3.png');

export default function QuotesScreen() {
  const navigation = useNavigation();
  const { quotes } = useQuotes();
  const [currentIdx, setCurrentIdx] = useState(0);
  // 監聽 quotes 變化
  React.useEffect(() => {
    setCurrentIdx(0);
  }, [quotes]);

  // 滑動動畫
  const pan = useRef(new Animated.ValueXY()).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10 && !isAnimating,
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x }
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        const threshold = SCREEN_WIDTH * 0.25;
        if (gesture.dx > threshold) {
          // 右滑到下一張
          swipeOut(1);
        } else if (gesture.dx < -threshold) {
          // 左滑到前一張
          swipeOut(-1);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  function swipeOut(direction) {
    if (!quotes.length) return;
    setIsAnimating(true);
    Animated.timing(pan, {
      toValue: { x: direction * SCREEN_WIDTH * 1.2, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      let newIdx = (currentIdx + direction + quotes.length) % quotes.length;
      setCurrentIdx(newIdx);
      pan.setValue({ x: 0, y: 0 }); // 下一張直接出現於原位
      setIsAnimating(false);
    });
  }

  // 卡片內容
  const showEmpty = quotes.length === 0;
  const cardText = showEmpty ? 'No quotes saved yet. Tap the heart to save your favorite Moodee quotes!' : quotes[currentIdx]?.text || '';
  let cardImg = EMPTY_CARD_IMAGE;
  if (!showEmpty) {
    cardImg = CARD_IMAGES[currentIdx % CARD_IMAGES.length];
  }

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <Text style={styles.title}>My Safe Quotes</Text>
      {/* 卡片區域 */}
      <View style={styles.cardArea}>
        <Animated.View
          {...(!showEmpty ? panResponder.panHandlers : {})}
          style={[styles.cardWrap, !showEmpty && { transform: pan.getTranslateTransform() }]}
        >
          <Image source={cardImg} style={styles.cardImg} resizeMode="contain" />
          <Text style={[styles.cardText, showEmpty && { opacity: 0.5 }]}>{cardText}</Text>
        </Animated.View>
      </View>
      {/* take breath with me 區塊 */}
      <View style={styles.takeBreathWrap}>
        <Image source={require('../../../assets/images/Quotes/TakeBreath.png')} style={styles.takeBreathImg} resizeMode="contain" />
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => navigation.navigate('DeepBreath')}
        >
          <Image source={require('../../../assets/images/button.png')} style={styles.arrowImg} />
        </TouchableOpacity>
      </View>
      {/* 導航列 */}
      <View style={styles.navBar}>
        <NavIcon
          icon={require('../../../assets/images/HomePage/Home.png')}
          active={false}
          onPress={() => navigation.navigate('HomePage')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/quote.png')}
          active={true}
          onPress={() => {}}
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

function NavIcon({ icon, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.navIcon}>
      <Image
        source={icon}
        style={[
          styles.navIconImg,
          { tintColor: active ? 'rgba(120,167,132,1)' : 'rgb(61,64,79)' }
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,250,237,1)',
  },
  title: {
    position: 'absolute',
    left: TITLE_LEFT,
    top: TITLE_TOP,
    fontSize: 30,
    color: 'rgba(66,72,87,1)',
    fontFamily: 'ArialRoundedMTBold',
    fontWeight: 'bold',
    width: 227,
    height: 35,
  },
  actionButtons: {
    position: 'absolute',
    top: TITLE_TOP + 50,
    right: TITLE_LEFT,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(120,167,132,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardArea: {
    position: 'absolute',
    top: CARD_TOP,
    left: 0,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    height: CARD_HEIGHT,
    justifyContent: 'center',
  },
  cardWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  cardText: {
    width: CARD_WIDTH * 0.7,
    fontSize: 24,
    color: '#000',
    fontFamily: 'ArialRoundedMTBold',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28.56,
    zIndex: 2,
  },
  indicatorContainer: {
    position: 'absolute',
    top: CARD_TOP + CARD_HEIGHT + 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(120,167,132,0.3)',
  },
  activeIndicator: {
    backgroundColor: 'rgba(120,167,132,1)',
  },
  takeBreathWrap: {
    position: 'absolute',
    top: TAKE_BREATH_TOP,
    left: 0,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    height: SCREEN_HEIGHT * 0.13,
    justifyContent: 'center',
  },
  takeBreathImg: {
    // width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.18,
    borderRadius: 18,
  },
  arrowButton: {
    position: 'absolute',
    right: '15%',
    bottom: SCREEN_HEIGHT * 0.003,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowImg: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    resizeMode: 'contain',
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
    tintColor: 'rgb(61,64,79)',
  },
});

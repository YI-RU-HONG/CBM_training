import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_WIDTH = SCREEN_WIDTH * 0.44; // 172/390
const BUTTON_MARGIN = SCREEN_WIDTH * 0.02; // 8/390
const PADDING = (SCREEN_WIDTH - BUTTON_WIDTH) / 2;

const EMOTIONS = [
  {
    key: 'Surprise',
    label: 'Surprise',
    bg: 'rgba(237,189,222,1)',
    img: require('../../../assets/images/Game/Surprise.png'),
  },
  {
    key: 'Happiness',
    label: 'Happiness',
    bg: 'rgba(145,176,184,1)',
    img: require('../../../assets/images/Game/Happiness.png'),
  },
  {
    key: 'Sadness',
    label: 'Sadness',
    bg: 'rgba(130,140,171,1)',
    img: require('../../../assets/images/Game/sadness.png'),
  },
  {
    key: 'Fear',
    label: 'Fear',
    bg: 'rgba(255,245,158,1)',
    img: require('../../../assets/images/Game/Fear.png'),
  },
  {
    key: 'Disgust',
    label: 'Disgust',
    bg: 'rgba(224,214,202,1)',
    img: require('../../../assets/images/Game/Disgust.png'),
  },
  {
    key: 'Anger',
    label: 'Anger',
    bg: 'rgba(161,184,224,1)',
    img: require('../../../assets/images/Game/Anger.png'),
  },
];

// 複製三份，方便閉環
const LOOP_EMOTIONS = [...EMOTIONS, ...EMOTIONS, ...EMOTIONS];
const EMOTION_COUNT = EMOTIONS.length;
const INITIAL_INDEX = EMOTION_COUNT; // 中間那組的第一個

export default function HappinessScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null); // 預設不選擇
  const [currentIdx, setCurrentIdx] = useState(1); // 預設顯示第二個（讓左右都半露）
  const scrollRef = useRef(null);

  // 取得目前背景色與角色圖
  const currentEmotion = EMOTIONS[currentIdx];

  // ScrollView 滾動時，根據 scrollX 計算目前中央的 index
  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (BUTTON_WIDTH + BUTTON_MARGIN * 2));
    setCurrentIdx(idx);
  };

  // 進入頁面時自動置中第二個（Happiness）
  React.useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: (BUTTON_WIDTH + BUTTON_MARGIN * 2) * 1, animated: false });
    }, 100);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: currentEmotion.bg }]}>
      {/* 角色圖 */}
      <Image
        source={currentEmotion.img}
        style={styles.character}
        resizeMode="stretch"
      />

      {/* 右上角箭頭按鈕 */}
      <TouchableOpacity
        style={styles.arrowButton}
        onPress={() => {
          if (selected) navigation.navigate('ReasonSelect');
        }}
        disabled={!selected}
      >
        <Image
          source={require('../../../assets/images/button.png')}
          style={[
            styles.arrowImg,
            { opacity: selected ? 1 : 0.4 }
          ]}
        />
      </TouchableOpacity>

      {/* 下方情緒選擇按鈕（橫向 ScrollView，左右半露） */}
      <View style={styles.emotionScrollWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={BUTTON_WIDTH + BUTTON_MARGIN * 2}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: PADDING,
          }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {EMOTIONS.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.emotionButton,
                {
                  backgroundColor: selected === item.key
                    ? 'rgba(245,140,69,1)'
                    : 'rgba(255,255,255,0.5)',
                  borderColor: selected === item.key
                    ? 'rgba(245,140,69,1)'
                    : 'transparent',
                  marginHorizontal: BUTTON_MARGIN,
                  width: BUTTON_WIDTH,
                }
              ]}
              onPress={() => setSelected(selected === item.key ? null : item.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.emotionText,
                { color: selected === item.key ? '#fff' : '#41424A' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text
        style={{
          width: SCREEN_WIDTH * 0.9,
          height: SCREEN_HEIGHT * 0.3,
          color: '#fff',
          fontFamily: 'ArialBlack',
          fontSize: SCREEN_WIDTH * 0.11, // 自適應
          lineHeight: SCREEN_WIDTH * 0.16, // 自適應
          textAlign: 'center',
          position: 'absolute',
          top: SCREEN_HEIGHT * 0.54, // 依照設計稿調整
          left: SCREEN_WIDTH * 0.05,
          fontWeight: 'bold',
        }}
        numberOfLines={0}
      >
        HOW ARE{'\n'}YOU FEELING{'\n'}TODAY?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  character: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  arrowButton: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.055,
    right: SCREEN_WIDTH * 0.064,
    width: SCREEN_WIDTH * 0.10, // 40/390
    height: SCREEN_WIDTH * 0.10, // 40/390
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowImg: {
    top: SCREEN_HEIGHT * 0.055,
    width: SCREEN_WIDTH * 0.10, // 40/390
    height: SCREEN_WIDTH * 0.10, // 40/390
    resizeMode: 'contain',
  },
  emotionScrollWrap: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.07,
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  emotionButton: {
    width: BUTTON_WIDTH,
    height: SCREEN_HEIGHT * 0.06, // 50/844
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emotionText: {
    fontSize: SCREEN_WIDTH * 0.051, // 20/390
    fontWeight: 'bold',
    fontFamily: 'ArialRoundedMTBold',
  },
});
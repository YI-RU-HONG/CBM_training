import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, findNodeHandle, UIManager } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame1BResult } from '../../services/api'; // B版遊戲儲存函數

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 圖片組合
const IMAGE_PAIRS = [
  ['CBM-A dot smile circle.png', 'CBM-A dot Non.png'],
  ['CBM-A dot sunny.png', 'CBM-A dot Cloudy.png'],
  ['CBM-A dot sunny simple.png', 'CBM-A dot Cloudy simple.png'],
  ['CBM-A dot Anger.png', 'CBM-A dot happy.png'],
  ['CBM-A dot Cloud.png', 'CBM-A dot SUN.png'],
  ['CBM-A dot sad.png', 'CBM-A dot smile.png'],
  ['CBM-A dot smile2.png', 'CBM-A dot sad2.png'],
  ['CBM-A dot thumb up.png', 'CBM-A dot thumb down.png'],
  ['CBM-A dot thumb up simple.png', 'CBM-A dot thumb down simple.png'],
  ['CBM-A dot sad simple.png', 'CBM-A dot smile simple.png'],
  ['CBM-A dot happy simple.png', 'CBM-A dot sad simple.png'],
  ['CBM-A dot happy simple2.png', 'CBM-A dot sad simple2.png'],
];

const POSITIVE_IMAGES = [
  'CBM-A dot smile.png',
  'CBM-A dot smile2.png',
  'CBM-A dot smile circle.png',
  'CBM-A dot smile simple.png',
  'CBM-A dot thumb up.png',
  'CBM-A dot thumb up simple.png',
  'CBM-A dot SUN.png',
  'CBM-A dot sunny.png',
  'CBM-A dot sunny simple.png',
  'CBM-A dot happy.png',
  'CBM-A dot happy simple.png',
  'CBM-A dot happy simple2.png',
];

export default function Game1Screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const questionIdx = route.params?.questionIdx ?? 0;
  const schedule = route.params?.schedule;
  const currentStep = route.params?.currentStep ?? 0;
  const totalSteps = route.params?.totalSteps ?? 6;
  const [step, setStep] = useState(0); // 0:十字, 1:兩圖, 2:圓點
  const [startTime, setStartTime] = useState(null);
  const [dotAppearTime, setDotAppearTime] = useState(null);
  const [dotPos, setDotPos] = useState(null);
  const [pairIdx, setPairIdx] = useState(0);
  const [dotIdx, setDotIdx] = useState(0);
  const [imgsReady, setImgsReady] = useState({ left: false, right: false });
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });
  const [leftImgNode, setLeftImgNode] = useState(null);
  const [rightImgNode, setRightImgNode] = useState(null);
  const [leftImgLayout, setLeftImgLayout] = useState(null);
  const [rightImgLayout, setRightImgLayout] = useState(null);
  const [pairWrapY, setPairWrapY] = useState(0);
  
  // 取得情緒與理由
  const selectedEmotion = route.params?.selectedEmotion || 'Unknown';
  const selectedReasons = route.params?.selectedReasons || [];

  // 兩圖隨機左右
  const [leftImg, rightImg] = React.useMemo(() => (
    questionIdx % 2 === 0
      ? IMAGE_PAIRS[questionIdx % IMAGE_PAIRS.length]
      : IMAGE_PAIRS[questionIdx % IMAGE_PAIRS.length].slice().reverse()
  ), [questionIdx]);

  // 圖片 ref
  const leftImgRef = useRef(null);
  const rightImgRef = useRef(null);

  // 進入頁面自動開始
  useEffect(() => {
    setStartTime(Date.now());
    // 隨機選一組圖片
    const idx = Math.floor(Math.random() * IMAGE_PAIRS.length);
    setPairIdx(idx);
    // 隨機選一個點位置
    const dIdx = Math.floor(Math.random() * POSITIVE_IMAGES.length);
    setDotIdx(dIdx);
    setImgsReady({ left: false, right: false }); // 進入新 round 時重置

    // step 0: 十字
    setTimeout(() => setStep(1), 1000); // 1000ms
    // step 1: 兩圖
    setTimeout(() => {
      setStep(2);
      setDotAppearTime(Date.now());
    }, 2000); // 1000+1000ms
  }, []);

  // 進入 step 2 時，量測圖片中心
  useEffect(() => {
    if (step === 2 && imgsReady.left && imgsReady.right) {
      let layout = null;
      let positiveImg = null;
      if (POSITIVE_IMAGES.includes(leftImg)) {
        layout = leftImgLayout;
        positiveImg = leftImg;
      } else if (POSITIVE_IMAGES.includes(rightImg)) {
        layout = rightImgLayout;
        positiveImg = rightImg;
      }
      if (layout) {
        const x = (layout.x || 0) + (layout.width / 2);
        const y = pairWrapY + (layout.y || 0) + (layout.height / 2);
        setDotPos({ x, y });
      } else {
        setDotPos(null);
      }
    }
  }, [step, leftImg, rightImg, imgsReady, leftImgLayout, rightImgLayout, pairWrapY]);

  // 點擊圓點
  const handleDotPress = async () => {
  const reactionTime = Date.now() - dotAppearTime;
    try {
      await saveGame1BResult({
        emotion: selectedEmotion,
        reasons: selectedReasons,
        reactionTime,
        dotIdx,
        pairIdx: questionIdx,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.log('儲存失敗', e);
      // 可選擇顯示提示
    }
    // 新增：將本關結果 push 到 gameResults
    const isPositive = POSITIVE_IMAGES.includes(leftImg) || POSITIVE_IMAGES.includes(rightImg); // 只要有正向臉
    const taskName = 'Game-1';
    navigation.replace('DailyGame', {
      schedule,
      currentStep: currentStep + 1,
      gameResults: [
        ...(route.params?.gameResults || []),
        { isPositive, reactionTime, taskName }
      ],
    });
  };

  const imageMap = {
    'CBM-A dot smile circle.png': require('../../../assets/images/Game/CBM-A/CBM-A dot smile circle.png'),
    'CBM-A dot Non.png': require('../../../assets/images/Game/CBM-A/CBM-A dot Non.png'),
    'CBM-A dot sunny.png': require('../../../assets/images/Game/CBM-A/CBM-A dot sunny.png'),
    'CBM-A dot Cloudy.png': require('../../../assets/images/Game/CBM-A/CBM-A dot Cloudy.png'),
    'CBM-A dot sunny simple.png': require('../../../assets/images/Game/CBM-A/simple/CBM-A dot sunny simple.png'),
    'CBM-A dot Cloudy simple.png': require('../../../assets/images/Game/CBM-A/simple/CBM-A dot Cloudy simple.png'),
    'CBM-A dot Anger.png': require('../../../assets/images/Game/CBM-A/CBM-A dot Anger.png'),
    'CBM-A dot happy.png': require('../../../assets/images/Game/CBM-A/CBM-A dot happy.png'),
    'CBM-A dot Cloud.png': require('../../../assets/images/Game/CBM-A/CBM-A dot Cloud.png'),
    'CBM-A dot SUN.png': require('../../../assets/images/Game/CBM-A/CBM-A dot SUN.png'),
    'CBM-A dot sad.png': require('../../../assets/images/Game/CBM-A/CBM-A dot sad.png'),
    'CBM-A dot smile.png': require('../../../assets/images/Game/CBM-A/CBM-A dot smile.png'),
    'CBM-A dot smile2.png': require('../../../assets/images/Game/CBM-A/CBM-A dot smile2.png'),
    'CBM-A dot sad2.png': require('../../../assets/images/Game/CBM-A/CBM-A dot sad2.png'),
    'CBM-A dot thumb up.png': require('../../../assets/images/Game/CBM-A/CBM-A dot thumb up.png'),
    'CBM-A dot thumb down.png': require('../../../assets/images/Game/CBM-A/CBM-A dot thumb down.png'),
    'CBM-A dot thumb up simple.png': require('../../../assets/images/Game/CBM-A/simple/CBM-A dot thumb up simple.png'),
    'CBM-A dot thumb down simple.png': require('../../../assets/images/Game/CBM-A/simple/CBM-A dot thumb down simple.png'),
    'CBM-A dot sad simple.png': require('../../../assets/images/Game/CBM-A/simple/CBM-A dot sad simple.png'),
    'CBM-A dot smile simple.png': require('../../../assets/images/Game/CBM-A/simple/CBM-A dot smile simple.png'),
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
      {/* 標題 */}
      <Text
        style={styles.title}
        onLayout={e => setTitleLayout({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}
      >
        Watch & Touch “   ●   “
      </Text>

      {/* 十字 */}
      {step === 0 && (
        <View
          style={[
            styles.crossWrap,
            {
              top:
                ((titleLayout.y + titleLayout.height) + SCREEN_HEIGHT) / 2 -80, 
              left: SCREEN_WIDTH / 2 - 19,
            },
          ]}
        >
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>
      )}

      {/* 兩圖 */}
      {step === 1 && (
        <View
          style={styles.pairWrap}
          onLayout={e => setPairWrapY(e.nativeEvent.layout.y)}
        >
          <View
            style={{ alignItems: 'center', justifyContent: 'center' }}
            onLayout={e => {
              setLeftImgLayout(e.nativeEvent.layout); // {x, y, width, height}
              setImgsReady(r => ({ ...r, left: true }));
            }}
          >
            <Image
              source={imageMap[leftImg]}
              style={styles.pairImg}
            />
          </View>
          <View style={{ width: 50 }} />
          <View
            style={{ alignItems: 'center', justifyContent: 'center' }}
            onLayout={e => {
              setRightImgLayout(e.nativeEvent.layout); // {x, y, width, height}
              setImgsReady(r => ({ ...r, right: true }));
            }}
          >
            <Image
              source={imageMap[rightImg]}
              style={styles.pairImg}
            />
          </View>
        </View>
      )}

      {/* 圓點（絕對定位在全螢幕） */}
      {step === 2 && dotPos && typeof dotPos.x === 'number' && typeof dotPos.y === 'number' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.dot,
              { left: dotPos.x - 9.5, top: dotPos.y - 9.5, position: 'absolute' }
            ]}
            onPress={handleDotPress}
          />
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
  pairWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 180, // 可依需求調整
    width: '100%',
  },
  pairImg: {
    width: '30%',
    aspectRatio: 1, // 保持正方形
    maxWidth: 160,
    maxHeight: 160,
    resizeMode: 'contain',
  },
  dot: {
    position: 'absolute',
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#42485A',
  },
}); 
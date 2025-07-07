import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame2Result } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1. 建立配對陣列
const IMAGE_PAIRS = [
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/CBM-A visual happy.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/CBM-A visual sad.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/CBM-A visual happy2.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/CBM-A visual sad2.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/CBM-A visual happy3.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/CBM-A visual sad3.png'),
  },
];

const LEVELS = [
  { size: 3 },
  { size: 4 },
  { size: 5 },
];

export default function Game2Screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [level, setLevel] = useState(0); // 0:3x3, 1:4x4, 2:5x5
  const [matrix, setMatrix] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [positivePos, setPositivePos] = useState({ row: 0, col: 0 });
  const [positiveImgIdx, setPositiveImgIdx] = useState(0);

  // 2. 每一關隨機選一組
  const [pairIdx, setPairIdx] = useState(0);

  // 新增：取得全局階段條資訊
  const currentStep = route.params?.currentStep ?? 0;
  const totalSteps = route.params?.totalSteps ?? 6;

  // 保留情緒與理由
  const selectedEmotion = route.params?.selectedEmotion || 'Unknown';
  const selectedReasons = route.params?.selectedReasons || [];

  // // 階段條數量
  // const progressBarCount = 3;

  useEffect(() => {
    const idx = Math.floor(Math.random() * IMAGE_PAIRS.length);
    setPairIdx(idx);
    generateMatrix(idx);
    setStartTime(Date.now());
  }, [level]);

  const generateMatrix = (idx) => {
    const size = LEVELS[level].size;
    const posIdx = Math.floor(Math.random() * size * size);
    const posRow = Math.floor(posIdx / size);
    const posCol = posIdx % size;
    setPositivePos({ row: posRow, col: posCol });
    setPositiveImgIdx(idx);
    const arr = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        if (r === posRow && c === posCol) {
          row.push({ type: 'positive', img: IMAGE_PAIRS[idx].positive });
        } else {
          row.push({ type: 'negative', img: IMAGE_PAIRS[idx].negative });
        }
      }
      arr.push(row);
    }
    setMatrix(arr);
  };

  const handlePress = (r, c) => {
    if (r === positivePos.row && c === positivePos.col) {
      const reactionTime = Date.now() - startTime;
      // 上傳結果
      saveGame2Result({
        emotion: selectedEmotion,
        reasons: selectedReasons,
        reactionTime,
        level,
        positiveImgIdx,
        pos: positivePos,
        timestamp: Date.now(),
      });
      // 進下一遊戲（或下一關）
      navigation.navigate('Game3', {
        selectedEmotion,
        selectedReasons,
      });
    }
  };

  // 計算圖片大小（自適應，最多 90% 寬度）
  const size = LEVELS[level].size;
  const matrixWidth = Math.min(SCREEN_WIDTH * 0.9, SCREEN_HEIGHT * 0.6);
  const imgSize = matrixWidth / size;

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
      <Text style={styles.title}>Find the happy face!</Text>
      {/* 矩陣 */}
      <View style={[styles.matrixWrap, { width: matrixWidth, height: matrixWidth }]}> 
        {matrix.map((row, r) => (
          <View key={r} style={styles.matrixRow}>
            {row.map((cell, c) => (
              <TouchableOpacity
                key={c}
                style={{ width: imgSize, height: imgSize, margin: 2 }}
                onPress={() => handlePress(r, c)}
                activeOpacity={0.7}
              >
                <Image source={cell.img} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
  matrixWrap: {
    marginTop: 50,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  matrixRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
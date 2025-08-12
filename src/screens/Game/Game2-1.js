import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveGame2BResult } from '../../services/api';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1. create matching array
const IMAGE_PAIRS = [
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual happy simple.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual sad simple.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual happy simple2.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual sad simple2.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual happy simple3.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual sad simple3.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual happy simple4.png'),  
    negative: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual sad simple4.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual happy simple5.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual sad simple5.png'),
  },
  {
    positive: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual happy simple6.png'),
    negative: require('../../../assets/images/Game/CBM-A/visual/simple/CBM-A visual sad simple6.png'),
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
  const questionIdx = route.params?.questionIdx ?? 0;
  const schedule = route.params?.schedule;
  const currentStep = route.params?.currentStep ?? 0;
  const totalSteps = route.params?.totalSteps ?? 6;

  // get userDays
  const [userDays, setUserDays] = useState(1);
  useEffect(() => {
    async function fetchUserDays() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // fix createdAt parsing
          let createdAt;
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (typeof data.createdAt === 'string') {
            createdAt = new Date(data.createdAt);
          } else {
            createdAt = new Date();
          }
          const now = new Date();
          // count as one day if it is across days
          const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diff = Math.floor((nowDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;
          
          setUserDays(diff);
        }
      } catch (e) {
        console.log('failed to get user days', e);
      }
    }
    fetchUserDays();
  }, []);

  // determine level based on userDays
  const level = React.useMemo(() => {
    console.log('userDays:', userDays); // debug
    if (userDays >= 4 && userDays < 7) return 1;
    if (userDays >= 7) return 2;
    return 0;
  }, [userDays]);

  // question image
  const pairIdx = questionIdx % IMAGE_PAIRS.length;

  // keep emotion and reasons
  const selectedEmotion = route.params?.selectedEmotion || 'Unknown';
  const selectedReasons = route.params?.selectedReasons || [];

  // // number of stages
  // const progressBarCount = 3;

  const [matrix, setMatrix] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [positivePos, setPositivePos] = useState({ row: 0, col: 0 });
  const [positiveImgIdx, setPositiveImgIdx] = useState(0);

  // rebuild matrix whenever userDays/level/pairIdx changes
  useEffect(() => {
    if (typeof level === 'number' && pairIdx >= 0) {
      generateMatrix(pairIdx);
      setStartTime(Date.now());
    }
  }, [level, pairIdx, userDays]);

  const generateMatrix = (idx) => {
    const size = LEVELS[level].size;
    console.log('level:', level, 'size:', size); // debug
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
      // upload result
      saveGame2BResult({
        emotion: selectedEmotion,
        reasons: selectedReasons,
        reactionTime,
        level,
        positiveImgIdx: pairIdx,
        pos: positivePos,
        timestamp: Date.now(),
      });
        // add: push current game result to gameResults
      const isPositive = true; // find positive face
      const taskName = 'Game2-1';
      navigation.replace('DailyGame', {
        schedule,
        currentStep: currentStep + 1,
        selectedEmotion,
        selectedReasons,
        gameResults: [
          ...(route.params?.gameResults || []),
          { isPositive, reactionTime, taskName }
        ]
      });
    }
  };

  // calculate image size (adaptive, maximum 90% width)
  const size = LEVELS[level].size;
  const matrixWidth = Math.min(SCREEN_WIDTH * 0.9, SCREEN_HEIGHT * 0.6);
  const imgSize = matrixWidth / size;

  return (
    <View style={styles.container}>
      {/* stage bar */}
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
      {/* title */}
      <Text style={styles.title}>Find the happy face!</Text>
      {/* matrix */}
      <View style={[styles.matrixWrap, { width: matrixWidth, height: matrixWidth }]}>
        {Array.isArray(matrix) && matrix.length > 0 ? (
          matrix.map((row, r) => (
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
          ))
        ) : (
          <Text>Loading...</Text>
        )}
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
import React, { useRef, useEffect, useState } from 'react';
import { fetchGeminiResponse, getMoodeeMessageGemini } from '../../services/gemini.js';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Animated, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';
import { getOrCreateTodaySchedule } from '../../utils/gameSchedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useQuotes } from '../../context/QuotesContext';
import heartAfter from '../../../assets/images/Statistics/heart after.png';
import heartBefore from '../../../assets/images/Statistics/heart before.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 產生連續 20 天的日期（以 first_login_date 為起點）
function generateStampsFrom(startDate) {
  const base = dayjs(startDate);
  return Array.from({ length: 40 }, (_, i) => {
    const dateObj = base.add(i, 'day');
    return {
      date: `${dateObj.month() + 1}/${dateObj.date()}`,
      key: dateObj.format('YYYY-MM-DD'),
      completed: false,
    };
  });
}

export default function HomePage({ navigation, route }) {
  console.log('🏠 HomePage component mounted');
  
  // 對話匡內容可動態變化
  const [bubbleText, setBubbleText] = useState("Hi! I'm moodee, your personal coach.");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  // moodee 彈出動畫
  const moodeeAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const [stamps, setStamps] = useState([]);
  const [firstLoginDate, setFirstLoginDate] = useState(null);
  const [showCongrats, setShowCongrats] = useState(route.params?.showCongrats || false);
  const [isSaved, setIsSaved] = useState(false);
  
  // 使用 Quotes Context
  const { saveQuote } = useQuotes();
  
  // 獲取用戶名
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const auth = getAuth();
        let user = auth.currentUser;
        let uid = null;
        
        // 如果 Firebase 用戶為 null，嘗試從 AsyncStorage 獲取 UID
        if (!user) {
          uid = await AsyncStorage.getItem('userUID');
          console.log('🏠 Firebase user is null, using UID from AsyncStorage:', uid);
        } else {
          uid = user.uid;
        }
        
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userName = userData.username || 'User';
            setUsername(userName);
            setBubbleText(`Hi! ${userName}, I'm moodee, your personal coach.`);
          }
        }
      } catch (error) {
        console.log('獲取用戶名失敗:', error);
        setBubbleText("Hi! I'm moodee, your personal coach.");
      }
    };
    
    fetchUsername();
  }, []);

  // 取代原本的 fetchUsernameAndWelcome useEffect
  useEffect(() => {
    const fetchHomeBubble = async () => {
      try {
        const auth = getAuth();
        let user = auth.currentUser;
        let uid = null;
        let userName = '';
        
        // 如果 Firebase 用戶為 null，嘗試從 AsyncStorage 獲取 UID
        if (!user) {
          uid = await AsyncStorage.getItem('userUID');
          console.log('🏠 Firebase user is null, using UID from AsyncStorage for bubble:', uid);
        } else {
          uid = user.uid;
        }
        
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.username || 'User';
            setUsername(userName);
          }
          
          // // 暫時關閉 Gemini 功能，使用固定訊息
          // setBubbleText(`Hi! ${userName}, I'm moodee, your personal coach.`);
          // setLoading(false);
          
          // 原本的 Gemini 功能（已註解）
          
          setLoading(true);
          // 1. check completions/{today}
          const today = dayjs().format('YYYY-MM-DD');
          const completionDoc = await getDoc(doc(db, 'users', uid, 'completions', today));
          if (completionDoc.exists() && completionDoc.data().completed) {
            // 2. check moodRecords where date === today
            const moodRecordsCol = collection(db, `users/${uid}/moodRecords`);
            const snapshot = await getDocs(moodRecordsCol);
            let todayRecord = null;
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              if (data.date === today) {
                todayRecord = data;
              }
            });
            if (todayRecord && todayRecord.emotion && todayRecord.reasons) {
              // call Gemini to generate homepage message
              const msg = await getMoodeeMessageGemini({
                emotion: todayRecord.emotion,
                reasons: todayRecord.reasons,
                positiveRatio: todayRecord.positiveRatio || '',
                reactionTime: todayRecord.reactionTime || '',
                tasks: todayRecord.tasks || '',
                type: 'homepage',
                username: userName,
              });
              setBubbleText(limitWords(msg));
            } else {
              // no today's detailed content, fallback welcome
              const welcomeMsg = await getMoodeeMessageGemini({ type: 'welcome', username: userName });
              setBubbleText(limitWords(welcomeMsg));
            }
          } else {
            // not completed, show welcome
            const welcomeMsg = await getMoodeeMessageGemini({ type: 'welcome', username: userName });
            setBubbleText(limitWords(welcomeMsg));
          }
          setLoading(false);
        } else {
          // no user login, use default message
          setBubbleText("Hi! I'm moodee, your personal coach.");
          setLoading(false);
        }
        
      } catch (error) {
        console.log('獲取 HomePage 訊息失敗:', error);
        setBubbleText("Hi! I'm moodee, your personal coach.");
        setLoading(false);
      }
    };
    fetchHomeBubble();
  }, []);

  // 初始化 first_login_date 並產生 stamps
  useEffect(() => {
    const initStamps = async () => {
      try {
        let firstLogin = await AsyncStorage.getItem('first_login_date');
        let uid = null;
        if (!firstLogin) {
          // get Firebase user createdAt
          const auth = getAuth();
          let user = auth.currentUser;
          let createdAt = null;
          
          // if Firebase user is null, try to get UID from AsyncStorage
          if (!user) {
            uid = await AsyncStorage.getItem('userUID');
            console.log('🏠 Firebase user is null, using UID from AsyncStorage for stamps:', uid);
          } else {
            uid = user.uid;
          }
          
          if (uid) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // assume createdAt is Firestore Timestamp
              if (userData.createdAt) {
                const ts = userData.createdAt;
                if (typeof ts === 'object' && ts.seconds) {
                  createdAt = dayjs.unix(ts.seconds).format('YYYY-MM-DD');
                } else if (typeof ts === 'string') {
                  // try to parse Firestore string format
                  const parsed = dayjs(ts, 'D MMMM YYYY [at] HH:mm:ss [UTC]Z');
                  if (parsed.isValid()) {
                    createdAt = parsed.format('YYYY-MM-DD');
                  } else {
                    // fallback: use dayjs to parse
                    createdAt = dayjs(ts).format('YYYY-MM-DD');
                  }
                }
              }
            }
          }
          firstLogin = createdAt || dayjs().format('YYYY-MM-DD');
          await AsyncStorage.setItem('first_login_date', firstLogin);
        } else {
          // 取得 uid
          const auth = getAuth();
          let user = auth.currentUser;
          if (user) {
            uid = user.uid;
          } else {
            // 如果 Firebase 用戶為 null，嘗試從 AsyncStorage 獲取 UID
            uid = await AsyncStorage.getItem('userUID');
            console.log('🏠 Firebase user is null, using UID from AsyncStorage for existing firstLogin:', uid);
          }
        }
        setFirstLoginDate(firstLogin);
        // 產生 20 天 stamps
        const stampsArr = generateStampsFrom(firstLogin);
        // Firestore 取得完成狀態
        let completedMap = {};
        if (uid) {
          const completionsCol = collection(db, 'users', uid, 'completions');
          const snapshot = await getDocs(completionsCol);
          snapshot.forEach(docSnap => {
            if (docSnap.data().completed) {
              completedMap[docSnap.id] = true;
            }
          });
        }
        // 合併狀態
        const updatedStamps = stampsArr.map(stamp => ({
          ...stamp,
          completed: !!completedMap[stamp.key],
        }));
        setStamps(updatedStamps);
      } catch (error) {
        console.log('初始化 stamps 失敗:', error);
      }
    };
    initStamps();
  }, []);

  // check and update stamp completion status (Firestore version)
  useEffect(() => {
    const checkTodayCompletion = async () => {
      try {
        const auth = getAuth();
        let user = auth.currentUser;
        let uid = null;
        
        // if Firebase user is null, try to get UID from AsyncStorage
        if (!user) {
          uid = await AsyncStorage.getItem('userUID');
          console.log('🏠 Firebase user is null, using UID from AsyncStorage for completion check:', uid);
        } else {
          uid = user.uid;
        }
        
        if (!uid) return;
        
        const today = dayjs().format('YYYY-MM-DD');
        const completionDoc = await getDoc(doc(db, 'users', uid, 'completions', today));
        if (completionDoc.exists() && completionDoc.data().completed) {
          setStamps(prev =>
            prev.map(stamp => {
              const stampDate = dayjs().format('M/D');
              return stamp.date === stampDate ? { ...stamp, completed: true } : stamp;
            })
          );
        }
      } catch (error) {
        console.log('check completion status failed:', error);
      }
    };
    checkTodayCompletion();
  }, []);

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

  // 檢查是否有遊戲完成資料，如果有則生成教練建議並標記完成
  useEffect(() => {
    const gameData = route.params?.gameCompleted;
    if (gameData) {
      generateCoachMessage(gameData);
      // 取得今天的 key
      const todayKey = dayjs().format('YYYY-MM-DD');
      markDayAsCompleted(todayKey);
    }
  }, [route.params]);

  // 完成 stamp 後，更新狀態（Firestore 版）
  const markDayAsCompleted = async (dateKey) => {
    try {
      const auth = getAuth();
      let user = auth.currentUser;
      let uid = null;
      
      // 如果 Firebase 用戶為 null，嘗試從 AsyncStorage 獲取 UID
      if (!user) {
        uid = await AsyncStorage.getItem('userUID');
        console.log('🏠 Firebase user is null, using UID from AsyncStorage for markDayAsCompleted:', uid);
      } else {
        uid = user.uid;
      }
      
      if (!uid) return;
      
      await setDoc(doc(db, 'users', uid, 'completions', dateKey), {
        completed: true,
        timestamp: new Date(),
      });
      setStamps(prev => prev.map(stamp =>
        stamp.key === dateKey ? { ...stamp, completed: true } : stamp
      ));
    } catch (error) {
      console.log('標記完成狀態失敗:', error);
    }
  };

  // 清除某天的完成狀態（Firestore 版）
  const clearDayCompletion = async (dateKey) => {
    try {
      const auth = getAuth();
      let user = auth.currentUser;
      let uid = null;
      
      // 如果 Firebase 用戶為 null，嘗試從 AsyncStorage 獲取 UID
      if (!user) {
        uid = await AsyncStorage.getItem('userUID');
        console.log('🏠 Firebase user is null, using UID from AsyncStorage for clearDayCompletion:', uid);
      } else {
        uid = user.uid;
      }
      
      if (!uid) return;
      
      await setDoc(doc(db, 'users', uid, 'completions', dateKey), {
        completed: false,
        timestamp: new Date(),
      });
      setStamps(prev => prev.map(stamp =>
        stamp.key === dateKey ? { ...stamp, completed: false } : stamp
      ));
    } catch (error) {
      console.log('清除完成狀態失敗:', error);
    }
  };

  // 生成教練建議
  const generateCoachMessage = async (gameData) => {
    setLoading(true);
    try {
      // // 暫時關閉 Gemini 功能，使用固定訊息
      // setBubbleText("Great job completing the training! Keep up the good work!");
      // setIsSaved(false); // 重置保存狀態
      
      // 原本的 Gemini 功能（已註解）
      
      const message = await getMoodeeMessageGemini({
        emotion: gameData.selectedEmotion,
        reasons: gameData.selectedReasons,
        gameCompleted: true,
        username: username,
      });
      setBubbleText(limitWords(message));
      setIsSaved(false); // 重置保存狀態
      
    } catch (error) {
      setBubbleText("Great job completing the training! Keep up the good work!");
      setIsSaved(false);
    }
    setLoading(false);
  };

  // 保存語句到 Quotes
  const handleSaveQuote = async () => {
    if (!bubbleText || bubbleText === "Hi! I'm moodee, your personal coach." || bubbleText.includes("Hi!") && bubbleText.includes("I'm moodee")) {
      Alert.alert('Cannot Save', 'Only Moodee\'s advice messages can be saved!');
      return;
    }

    const result = await saveQuote(bubbleText);
    if (result.success) {
      setIsSaved(true);
      Alert.alert('Saved Successfully', result.message);
    } else {
      Alert.alert('Save Failed', result.message);
    }
  };

  const completedCount = stamps.filter(d => d.completed).length;

  // 計算滾動區高度：stamp數量*stamp高度+間距
  const scrollContentHeight = SCREEN_WIDTH * 0.18 * stamps.length + SCREEN_HEIGHT * 0.071 * (stamps.length - 1) + SCREEN_HEIGHT * 0.3;

  const handleGameStart = async (stamp) => {
    if (stamp.completed) {
      Alert.alert(
        'Restart Training',
        'You have already completed the training for this day. Are you sure you want to restart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restart',
            onPress: () => {
              clearDayCompletion(stamp.key);
              navigation.navigate('Emotion');
            },
          },
        ]
      );
    } else {
      navigation.navigate('Emotion');
    }
  };

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [stamps.length]);

    //   useEffect(() => {
    //     AsyncStorage.clear(); // 或 removeItem
    // }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: SCREEN_HEIGHT } 
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../../assets/images/HomePage/background.png')}
          style={[styles.background, { height: scrollContentHeight }]}
          resizeMode="cover"
        />
        {stamps.slice().reverse().map((item, idx) => (
          <TouchableOpacity
            key={item.key}
            testID={`stamp-${idx}`}
            style={[styles.dateNodeWrap, { marginVertical: SCREEN_HEIGHT * 0.036 }]} // 60/844
            onPress={() => handleGameStart(item)}
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
      {/* 1. 對話匡內容改為可滑動，並設固定高度 */}
      <Animated.View style={[
        styles.bubbleContainer,
        { opacity: bubbleAnim }
      ]}>
        <View style={styles.bubbleShadowWrap}>
          <View style={styles.bubble}>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={handleSaveQuote}
              disabled={loading}
            >
              <Image
                source={isSaved ? heartAfter : heartBefore}
                style={{ width: SCREEN_WIDTH * 0.07, height: SCREEN_WIDTH * 0.06 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.16, minHeight: SCREEN_HEIGHT * 0.02 }}>
              <Text style={styles.bubbleText}>{bubbleText}</Text>
            </ScrollView>
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
          onPress={() => navigation.navigate('HomePage')}
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

      {/* Congrats Popup */}
      {showCongrats && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupWrap}>
            <Image
              source={require('../../../assets/images/HomePage/GameEnd1.png')}
              style={styles.popupBg}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.popupClose}
              onPress={() => setShowCongrats(false)}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/images/HomePage/GameEnd1Button.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.popupTitle}>CONGRATS!</Text>
            <Text style={styles.popupSub}>Keep up the great work!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// 2. setBubbleText 時自動限制20字（英文單字數）
function limitWords(text, maxWords = 20) {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
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
    fontFamily: 'PottaOne-Regular',
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
    width: SCREEN_WIDTH * 0.51, // 固定寬度
    minHeight: SCREEN_HEIGHT * 0.07,
    justifyContent: 'center',
    position: 'relative',
  },
  bubbleText: {
    color: '#41424A',
    fontSize: SCREEN_WIDTH * 0.042,
    fontWeight: '500',
    fontFamily: 'ArialUnicodeMS',
    flexWrap: 'wrap', // 讓文字自動換行
    paddingRight: SCREEN_WIDTH * 0.08, // 為愛心按鈕留出空間
  },
  heartButton: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.02,
    top: SCREEN_HEIGHT * 0.015,
    width: SCREEN_WIDTH * 0.06,
    height: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: SCREEN_WIDTH * 0.05,
  },
  heartIconSaved: {
    fontSize: SCREEN_WIDTH * 0.05,
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
  popupOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(61,64,79,0.32)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 100,
  },
  popupWrap: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.26,
    left: 45,
    right: 45,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.75,
    minHeight: 220,
    borderRadius: 24,
    overflow: 'visible',
  },
  popupBg: {
    // width: SCREEN_WIDTH - 90,
    height: SCREEN_WIDTH * 0.75,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  popupClose: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.08,
    right: 16,
    zIndex: 10,
  },
  popupTitle: {
    marginTop: SCREEN_HEIGHT * 0.19,
    color: '#78A784',
    fontFamily: 'PottaOne-Regular',
    fontSize: 32,
    textAlign: 'center',
    width: 232,
    height: 44,
    alignSelf: 'center',
    letterSpacing: 1,
  },
  popupSub: {
    marginTop: 12,
    color: '#121717',
    fontFamily: 'ArialUnicodeMS',
    fontSize: 16,
    textAlign: 'center',
    width: 187,
    height: 24,
    alignSelf: 'center',
  },
}); 
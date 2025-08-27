import React, { useRef, useEffect, useState } from 'react';
import { fetchGeminiResponse, getMoodeeMessageGemini, getDefaultMessage } from '../../services/gemini.js';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';
import { getOrCreateTodaySchedule } from '../../utils/gameSchedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useQuotes } from '../../context/QuotesContext';
import { updateStatisticsAfterGame, triggerStatisticsCalculation } from '../../services/api';
import heartAfter from '../../../assets/images/Statistics/heart after.png';
import heartBefore from '../../../assets/images/Statistics/heart before.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  
  // dialog content can be dynamically changed
  const [bubbleText, setBubbleText] = useState("Hi! I'm moodee, your personal coach.");
  const [displayedText, setDisplayedText] = useState("Hi! I'm moodee, your personal coach.");

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  // moodee popup animation
  const moodeeAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const [stamps, setStamps] = useState([]);
  const [firstLoginDate, setFirstLoginDate] = useState(null);
  const [showCongrats, setShowCongrats] = useState(route.params?.showCongrats || false);
  const [isSaved, setIsSaved] = useState(false);
  
  // use Quotes Context
  const { saveQuote } = useQuotes();
  
  // get username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const auth = getAuth();
        let user = auth.currentUser;
        let uid = null;
        
        // if Firebase user is null, try to get UID from AsyncStorage
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
        console.log('failed to get username:', error);
        setBubbleText("Hi! I'm moodee, your personal coach.");
      }
    };
    
    fetchUsername();
  }, []);

  // replace the original fetchUsernameAndWelcome useEffect
  useEffect(() => {
    const fetchHomeBubble = async () => {
      try {
        const auth = getAuth();
        let user = auth.currentUser;
        let uid = null;
        let userName = '';
        
        // if Firebase user is null, try to get UID from AsyncStorage
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
          
          // first show basic welcome message, so user can see the page
          setBubbleText(`Hi! ${userName}, I'm moodee, your personal coach.`);
          setLoading(false);
          
          // then asynchronously get detailed Gemini message
          setTimeout(async () => {
            try {
              // first show thinking message
              setBubbleText(getDefaultMessage('thinking'));
              
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
                  // show analyzing emotion message
                  setBubbleText(getDefaultMessage('emotion', todayRecord.emotion));
                  
                  // get user statistics data
                  let userStats = null;
                  try {
                    const statistics = await getUserStatistics(uid);
                    userStats = statistics;
                  } catch (error) {
                    console.log('Failed to get user stats for Gemini:', error);
                  }

                  // check if there is custom reason
                  const DEFAULT_REASONS = [
                    'Health & Energy', 'Motivation', 'Feeling overwhelmed', 'Sleep', 'Routine',
                    'Interactions with others', 'Self-awareness', 'Overthinking', 'Weather',
                    'Comparisons & Social media', 'Expectations & Pressure', 'Work', 'Studies',
                    'Unexpected events', 'Just feeling this way', 'Not sure yet', 'Something else'
                  ];
                  function extractCustomReason(reasons) {
                    if (!Array.isArray(reasons)) return '';
                    const custom = reasons.find(r => r.startsWith('Something else:'));
                    if (custom) return custom.replace('Something else:', '').trim();
                    return reasons.find(r => !DEFAULT_REASONS.includes(r));
                  }
                  const customReason = extractCustomReason(todayRecord.reasons);

                  // call Gemini to generate homepage message
                  let msg = '';
                  if (customReason) {
                    msg = await getMoodeeMessageGemini({
                      type: 'custom',
                      emotion: todayRecord.emotion,
                      userReason: customReason,
                      username: userName,
                      userStats: userStats,
                    });
                  } else {
                    msg = await getMoodeeMessageGemini({
                      type: 'homepage',
                      emotion: todayRecord.emotion,
                      reasons: todayRecord.reasons.join(', '),
                      positiveRatio: todayRecord.positiveRatio || '',
                      reactionTime: todayRecord.reactionTime || '',
                      tasks: todayRecord.tasks || '',
                      username: userName,
                      userStats: userStats,
                    });
                  }
                  setBubbleText(limitWords(msg));
                } else {
                  // no today's detailed content, fallback welcome
                  setBubbleText(getDefaultMessage('welcome'));
                  const welcomeMsg = await getMoodeeMessageGemini({ 
                    type: 'welcome', 
                    username: userName 
                  });
                  setBubbleText(limitWords(welcomeMsg));
                }
              } else {
                // not completed, show welcome
                setBubbleText(getDefaultMessage('welcome'));
                const welcomeMsg = await getMoodeeMessageGemini({ 
                  type: 'welcome', 
                  username: userName 
                });
                setBubbleText(limitWords(welcomeMsg));
              }
            } catch (error) {
              console.log('failed to get HomePage Gemini message:', error);
              // keep the original welcome message
            }
          }, 500); // delay 500ms so user can see the basic page first
          
        } else {
          // no user login, use default message
          setBubbleText("Hi! I'm moodee, your personal coach.");
          setLoading(false);
        }
        
      } catch (error) {
        console.log('Failed to get HomePage message:', error);
        setBubbleText("Hi! I'm moodee, your personal coach.");
        setLoading(false);
      }
    };
    
    fetchHomeBubble();
  }, []);

  // initialize first_login_date and generate stamps
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
          // get uid
          const auth = getAuth();
          let user = auth.currentUser;
          if (user) {
            uid = user.uid;
          } else {
            // if Firebase user is null, try to get UID from AsyncStorage
            uid = await AsyncStorage.getItem('userUID');
            console.log('🏠 Firebase user is null, using UID from AsyncStorage for existing firstLogin:', uid);
          }
        }
        setFirstLoginDate(firstLogin);
        // generate 20 days stamps
        const stampsArr = generateStampsFrom(firstLogin);
        // get completion status from Firestore
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
        // merge status
        const updatedStamps = stampsArr.map(stamp => ({
          ...stamp,
          completed: !!completedMap[stamp.key],
        }));
        setStamps(updatedStamps);
      } catch (error) {
        console.log('Failed to initialize stamps:', error);
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

  // check if there is game completion data, if so, generate coach advice and mark as completed
  useEffect(() => {
    const gameData = route.params?.gameCompleted;
    if (gameData) {
      generateCoachMessage(gameData);
      // get today's key
      const todayKey = dayjs().format('YYYY-MM-DD');
      markDayAsCompleted(todayKey);
      
      // update statistics data
      const updateStats = async () => {
        try {
          const auth = getAuth();
          let user = auth.currentUser;
          let uid = null;
          
          if (!user) {
            uid = await AsyncStorage.getItem('userUID');
          } else {
            uid = user.uid;
          }
          
          if (uid) {
            await updateStatisticsAfterGame(uid);
            console.log('📊 Statistics updated after game completion');
          }
        } catch (error) {
          console.error('📊 Error updating statistics:', error);
        }
      };
      
      updateStats();
    }
  }, [route.params]);

  // after stamp is completed, update status (Firestore version)
  const markDayAsCompleted = async (dateKey) => {
    try {
      const auth = getAuth();
      let user = auth.currentUser;
      let uid = null;
      
      // if Firebase user is null, try to get UID from AsyncStorage
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
              console.log('Failed to mark completion status:', error);
    }
  };

  // clear the completion status of a specific day (Firestore version)
  const clearDayCompletion = async (dateKey) => {
    try {
      const auth = getAuth();
      let user = auth.currentUser;
      let uid = null;
      
      // if Firebase user is null, try to get UID from AsyncStorage
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
              console.log('Failed to clear completion status:', error);
    }
  };

  // generate coach advice
  const generateCoachMessage = async (gameData) => {
    setLoading(true);
    try {
      // // temporarily close Gemini feature, use fixed message
      // setBubbleText("Great job completing the training! Keep up the good work!");
      // setIsSaved(false); // reset save status
      
      // original Gemini feature (commented out)
      
      const message = await getMoodeeMessageGemini({
        type: 'game',
        emotion: gameData.selectedEmotion,
        reasons: gameData.selectedReasons.join(', '),
        gameCompleted: true,
        positiveRatio: gameData.positiveRatio || '',
        reactionTime: gameData.reactionTime || '',
        tasks: gameData.tasks || '',
        username: username,
      });
      setBubbleText(limitWords(message));
      setIsSaved(false); // reset save status
      
    } catch (error) {
      setBubbleText("Great job completing the training! Keep up the good work!");
      setIsSaved(false);
    }
    setLoading(false);
  };

  // save sentence to Quotes
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

  // typewriter effect
  // remove typewriter effect, directly show text
  useEffect(() => {
    if (bubbleText) {
      setDisplayedText(bubbleText);
    }
  }, [bubbleText]);


  const completedCount = stamps.filter(d => d.completed).length;

  // calculate scroll content height: stamp count * stamp height + spacing
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
    //     AsyncStorage.clear(); // or removeItem
    // }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* simple skeleton screen */}
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonBubble} />
        <View style={styles.skeletonStamps} />
        <ActivityIndicator 
          size="large" 
          color="#A8AFBC" 
          style={styles.loadingIndicator}
        />
      </View>
    );
  }

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

        {/* stars and numbers */}
      <TouchableOpacity 
        style={styles.starContainer}

      >
        <Image
          source={require('../../../assets/images/HomePage/Star.png')}
          style={styles.star}
        />
        <View style={styles.starNumShadowWrap}>
          <Text style={styles.starNum}>{completedCount}</Text>
        </View>
      </TouchableOpacity>

      {/* dialog box animation, content can be dynamically changed */}
      {/* 1. change the dialog box content to be scrollable, and set fixed height */}
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
              <Text style={styles.bubbleText}>
                {displayedText}
              </Text>
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

      {/* bottom navigation bar */}
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

// 2. setBubbleText automatically limit 20 words (English word count)
function limitWords(text, maxWords = 20) {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

// bottom navigation icon component
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
    width: SCREEN_WIDTH * 0.51, // fixed width
    minHeight: SCREEN_HEIGHT * 0.07,
    justifyContent: 'center',
    position: 'relative',
  },
  bubbleText: {
    color: '#41424A',
    fontSize: SCREEN_WIDTH * 0.042,
    fontWeight: '500',
    fontFamily: undefined, // use system default font
    flexWrap: 'wrap', // make text automatically wrap
    paddingRight: SCREEN_WIDTH * 0.08, // leave space for heart button
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(194,227,168)',
  },
  skeletonHeader: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.1,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  skeletonBubble: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.1,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  skeletonStamps: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.2,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  loadingIndicator: {
    marginTop: SCREEN_HEIGHT * 0.05,
  },

}); 
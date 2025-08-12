import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import RNPickerSelect from 'react-native-picker-select';
import dayjs from 'dayjs';
import { getMoodeeMessageGemini, getDefaultMessage } from '../../services/gemini';
import { getUserStatisticsLocal } from '../../services/localStatistics';
import { Easing } from 'react-native';
import { useQuotes } from '../../context/QuotesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// get current user UID helper function
async function getCurrentUID() {
  const auth = getAuth();
  let user = auth.currentUser;
  let uid = null;
  
  // if Firebase user is null, try to get UID from AsyncStorage
  if (!user) {
    uid = await AsyncStorage.getItem('userUID');
    console.log('📊 getCurrentUID - Firebase user is null, using UID from AsyncStorage:', uid);
  } else {
    uid = user.uid;
    console.log('📊 getCurrentUID - Using Firebase user UID:', uid);
  }
  
  return uid;
}

// 1. emotion order: anger, fear, disgust, surprise, sadness, happiness
const EMOTIONS = [
  { key: 'anger', label: 'Anger', img: require('../../../assets/images/Statistics/anger2.png'), bar: '#E27367', icon: require('../../../assets/images/Statistics/anger1.png') },
  { key: 'fear', label: 'Fear', img: require('../../../assets/images/Statistics/fear2.png'), bar: '#8CC19B', icon: require('../../../assets/images/Statistics/fear1.png') },
  { key: 'disgust', label: 'Disgust', img: require('../../../assets/images/Statistics/disgust2.png'), bar: '#D3A49D', icon: require('../../../assets/images/Statistics/disgust1.png') },
  { key: 'surprise', label: 'Surprise', img: require('../../../assets/images/Statistics/surprise2.png'), bar: '#FF9C5C', icon: require('../../../assets/images/Statistics/surprise1.png') },
  { key: 'sadness', label: 'Sadness', img: require('../../../assets/images/Statistics/sadness2.png'), bar: '#A8CBD0', icon: require('../../../assets/images/Statistics/sadness1.png') },
  { key: 'happiness', label: 'Happiness', img: require('../../../assets/images/Statistics/happiness2.png'), bar: '#FCC978', icon: require('../../../assets/images/Statistics/happiness1.png') },
];
const GRAY_CIRCLE = '#D9D9D9';

function getMonthDays(year, month) {
  const days = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).day();
  return { days, firstDay };
}

export default function StatisticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [emotionStats, setEmotionStats] = useState({});
  const [records, setRecords] = useState([]);
  const [bubbleText, setBubbleText] = useState('');
  const [displayedText, setDisplayedText] = useState('');

  const [username, setUsername] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1); // month() returns 0~11, so add 1
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  // emotion stack animation
  const emotionAnims = useRef(EMOTIONS.map(() => ({
    y: new Animated.Value(-200),
    x: new Animated.Value(0),
  }))).current;
  const emotionTargets = [
    { x: SCREEN_WIDTH * 0.18, y: SCREEN_HEIGHT * 0.375 },    // anger
    { x: -SCREEN_WIDTH * 0.05, y: SCREEN_HEIGHT * 0.38 },   // fear
    { x: SCREEN_WIDTH * 0.28, y: SCREEN_HEIGHT * 0.245 },  // disgust
    { x: -SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT * 0.35 }, // surprise
    { x: SCREEN_WIDTH * 0.31, y: SCREEN_HEIGHT * 0.11 },  // sadness
    { x: -SCREEN_WIDTH * 0.03, y: SCREEN_HEIGHT * 0.245 },  // happiness
  ];
  const emotionAngles = [-18, 12, -8, 20, -10, 8]; // according to the order of the characters
  const moodeeAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const [moodeeAnimated, setMoodeeAnimated] = useState(false);
  const moodeeRef = useRef(null);
  const scrollY = useRef(0);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [isFavorite, setIsFavorite] = useState(false);
  const { saveQuote } = useQuotes();

  const handleAddToQuotes = async () => {
    setIsFavorite(true);
    await saveQuote(bubbleText);
    // 可加提示訊息
  };

  // get username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const uid = await getCurrentUID();
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userName = userData.username || 'User';
            setUsername(userName);
          }
        }
      } catch (error) {
        console.log('Failed to get username:', error);
      }
    };
    
    fetchUsername();
  }, []);

  // get data when initializing
  useEffect(() => {
    if (username) {
      fetchData();
    }
  }, [username]);

  // listen to scroll event
  const handleScroll = (e) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    if (!moodeeAnimated && moodeeRef.current) {
      moodeeRef.current.measure((fx, fy, width, height, px, py) => {
        // py: moodee's distance from the top of the screen
        if (py < SCREEN_HEIGHT / 2 && py + height > SCREEN_HEIGHT / 4) {
          setMoodeeAnimated(true);
          Animated.timing(moodeeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
            Animated.timing(bubbleAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          });
        }
      });
    }
  };

  // 3. emotion falling animation in the new order
  useEffect(() => {
    fetchData();
    EMOTIONS.forEach((e, i) => {
      emotionAnims[i].y.setValue(-200);
      emotionAnims[i].x.setValue(0);
      setTimeout(() => {
          // 1. first use timing to do gravity acceleration falling
        Animated.timing(emotionAnims[i].y, {
          toValue: emotionTargets[i].y + 30, // first exceed the target a little
          duration: 700,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }).start(() => {
          // 2. then spring to the final position
          Animated.spring(emotionAnims[i].y, {
            toValue: emotionTargets[i].y,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        });
        Animated.spring(emotionAnims[i].x, {
          toValue: emotionTargets[i].x,
          useNativeDriver: true,
          bounciness: 12,
        }).start();
      }, i * 1000);
    });
    moodeeAnim.setValue(SCREEN_WIDTH);
    bubbleAnim.setValue(0);
    setMoodeeAnimated(false);
  }, [selectedMonth, selectedYear]);

  // preload Gemini message
  useEffect(() => {
    const preloadGeminiMessage = async () => {
      if (username && Object.keys(emotionStats).length > 0) {
        // immediately show the intelligent default message
        setBubbleText(getDefaultMessage('statistics'));
        
        try {
          const msg = await getMoodeeMessageGemini({ 
            type: 'statistics',
            stats: emotionStats, 
            username 
          });
          setBubbleText(msg);
        } catch (error) {
          console.log('Failed to preload Moodee message:', error);
          setBubbleText('Great job tracking your emotions this month! Keep up the good work.');
        }
      }
    };
    
    preloadGeminiMessage();
  }, [username, emotionStats]);


  useEffect(() => {
    if (bubbleText) {
      setDisplayedText(bubbleText);
    }
  }, [bubbleText]);

  async function fetchData() {
    setLoading(true);
    try {
      const uid = await getCurrentUID();
      if (!uid) {
        console.log('No logged in user');
        setLoading(false);
        return;
      }
      
      console.log('🔍 fetchData - Current user UID:', uid);
      console.log('🔍 fetchData - Current username state:', username);
      
      // use local statistics service to get statistics data
      const userStats = await getUserStatisticsLocal();
      console.log('📊 User statistics from local service:', userStats);
      
      // get the monthly mood records
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
      console.log('Query date range:', start, 'to', end);
      console.log('Query path:', `users/${uid}/moodRecords`);
      
      const q = query(
        collection(db, `users/${uid}/moodRecords`),
        where('date', '>=', start),
        where('date', '<=', end)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      console.log('Query results:', data);
      console.log('🔍 fetchData - Number of documents found:', snap.docs.length);
      
      setRecords(data);
      
      // count the monthly emotions
      const stats = {};
      EMOTIONS.forEach(e => { stats[e.key] = 0; });
      data.forEach(r => { 
        console.log('Processing record:', r.emotion, r.date, 'username:', r.username);
        if (stats[r.emotion] !== undefined) stats[r.emotion]++; 
      });
      console.log('Monthly statistics result:', stats);
      setEmotionStats(stats);
      
      // first show the basic data, so the user can see the page
      setLoading(false);
      
      // then asynchronously get Moodee message
      setTimeout(async () => {
        try {
          const msg = await getMoodeeMessageGemini({ 
            type: 'statistics',
            stats, 
            username 
          });
          setBubbleText(msg);
        } catch (error) {
          console.log('Failed to get Moodee message:', error);
          setBubbleText('Great job tracking your emotions this month! Keep up the good work.');
        }
      }, 100);
      
    } catch (e) {
      console.log('Statistics error:', e);
      console.log('Error details:', e.message);
      setLoading(false);
    }
  }



  // calendar data
  const { days, firstDay } = getMonthDays(selectedYear, selectedMonth);
  const calendar = [];
  let day = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++, day++) {
      if (day < 1 || day > days) {
        week.push(null);
      } else {
        week.push(day);
      }
    }
    calendar.push(week);
  }
  // generate dropdown menu options
  const monthItems = Array.from({ length: 12 }, (_, i) => ({ 
    label: dayjs().month(i).format('MMMM'), 
    value: i + 1 
  }));
  const yearItems = Array.from({ length: 5 }, (_, i) => ({ 
    label: `${dayjs().year() - 2 + i}`, 
    value: dayjs().year() - 2 + i 
  }));

  // get three days ago
  const threeDaysAgo = dayjs().subtract(3, 'day');
  const threeDaysAgoStr = threeDaysAgo.format('YYYY-MM-DD');
  // get today's date
  const todayStr = dayjs().format('YYYY-MM-DD');
  // get all records today and three days ago
  const recordsToday = records.filter(r => r.date === todayStr);
  const recordsThreeDaysAgo = records.filter(r => r.date === threeDaysAgoStr);
  // count emotion today and three days ago
  const emotionStatsToday = {};
  const emotionStatsThreeDaysAgo = {};
  EMOTIONS.forEach(e => { 
    emotionStatsToday[e.key] = 0; 
    emotionStatsThreeDaysAgo[e.key] = 0; 
  });
  recordsToday.forEach(r => { if (emotionStatsToday[r.emotion] !== undefined) emotionStatsToday[r.emotion]++; });
  recordsThreeDaysAgo.forEach(r => { if (emotionStatsThreeDaysAgo[r.emotion] !== undefined) emotionStatsThreeDaysAgo[r.emotion]++; });

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#F7F5EF' 
      }}>
        {/* skeleton screen */}
        <View style={styles.skeletonContainer}>
          {/* title skeleton */}
          <View style={styles.skeletonTitle} />
          
          {/* month picker skeleton */}
          <View style={styles.skeletonMonthPicker} />
          
          {/* emotion statistics skeleton */}
          <View style={styles.skeletonEmotionStats}>
            {EMOTIONS.map((_, index) => (
              <View key={index} style={styles.skeletonEmotionItem} />
            ))}
          </View>
          
          {/* calendar skeleton */}
          <View style={styles.skeletonCalendar} />
          
          {/* Moodee skeleton */}
          <View style={styles.skeletonMoodee} />
        </View>
        
        <ActivityIndicator 
          size="large" 
          color="#A8AFBC" 
          style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }}
        />
      </View>
    );
  }

  // 2. character scale according to the emotion ratio
  const max = Math.max(...Object.values(emotionStats), 1);

  const monthName = dayjs().month(selectedMonth - 1).format('MMMM');

  // check if there is data
  const hasData = Object.values(emotionStats).some(count => count > 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F5EF' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* 1. emotion ratio stack area */}
        <View style={styles.topContainer}>
          <Text style={styles.title}>Your Emotional Journey</Text>
          <View style={styles.emotionStack}>
            {EMOTIONS.map((e, i) => {
              const angle = emotionAngles[i] || 0;
              const emotionCount = emotionStats[e.key] || 0;
              const maxCount = Math.max(...Object.values(emotionStats), 1);
              const scale = maxCount > 0 ? 1.3 + (emotionCount / maxCount) * 0.7 : 1.3;
              return (
                <Animated.Image
                  key={e.key}
                  source={e.img}
                  style={[
                    styles.emotionImg,
                    {
                      transform: [
                        { translateY: emotionAnims[i]?.y || new Animated.Value(-150) },
                        { translateX: emotionAnims[i]?.x || new Animated.Value(0) },
                        { scale },
                        { rotate: `${angle}deg` },
                      ],
                      zIndex: 10 - i,
                    },
                  ]}
                  resizeMode="contain"
                />
              );
            })}
          </View>
        </View>


        {/* 3. Your Statistics bar chart area */}
        <Text style={styles.statisticsTitle}>Your Statistics</Text>
        {!hasData ? (
          <View style={{ 
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingVertical: 40,
            marginHorizontal: SCREEN_WIDTH * 0.05
          }}>
            <Text style={{ 
              color: '#A8AFBC', 
              fontSize: 16,
              fontFamily: 'ArialUnicodeMS',
              textAlign: 'center'
            }}>
              No statistics data yet{'\n'}Start recording your emotions!
            </Text>
          </View>
        ) : (
          <View style={styles.barChartWrap}>
            {/* left ratio text */}
            <View style={styles.barChartLabelCol}>
              {[100, 75, 50, 25, 0].map(v => (
                <Text key={v} style={styles.barChartLabel}>{v}</Text>
              ))}
            </View>
            {/* bar chart */}
            <View style={styles.barChartRow}>
              {EMOTIONS.map((e, i) => {
                const value = emotionStats[e.key] || 0;
                const barHeight = 120 * (value / max);
                // arrow logic changed to today vs three days ago
                const valueToday = emotionStatsToday[e.key] || 0;
                const valueThreeDaysAgo = emotionStatsThreeDaysAgo[e.key] || 0;
                let trend = null;
                if (valueToday > valueThreeDaysAgo) trend = 'up';
                else if (valueToday < valueThreeDaysAgo) trend = 'down';
                return (
                  <View key={e.key} style={styles.barCol}>
                    {/* up/down arrow */}
                    {trend === 'up' && (
                      <Image source={require('../../../assets/images/Statistics/increase.png')} style={{ width: 18, height: 18, marginBottom: 2 }} />
                    )}
                    {trend === 'down' && (
                      <Image source={require('../../../assets/images/Statistics/down.png')} style={{ width: 18, height: 18, marginBottom: 2 }} />
                    )}
                    <Image source={e.icon} style={styles.barIcon} />
                    <View style={[styles.bar, { backgroundColor: e.bar + '80', height: barHeight }]} />
                  </View>
                );
              })}
            </View>
          </View>
        )}
        {/* 4. Mood Diary area */}
        <View style={styles.diaryWrap}>
          {/* moodee image animation slide in */}
          <Animated.View
            ref={moodeeRef}
            style={[styles.moodeeOverlayImg, { transform: [{ translateX: moodeeAnim }] }]}
            onLayout={() => {}}
          >
            <Image source={require('../../../assets/images/HomePage/moodee.png')} style={{ width: 250, height: 250, resizeMode: 'contain' }} />
            {/* dialog box absolutely positioned on the top right of moodee */}
            <Animated.View style={[styles.bubbleContainer, { opacity: bubbleAnim }]}> 
              <View style={styles.bubbleShadowWrap}>
                <View style={styles.bubble}>
                  <TouchableOpacity style={styles.heartBtn} onPress={handleAddToQuotes}>
                    <Image
                      source={isFavorite ? require('../../../assets/images/Statistics/heart after.png') : require('../../../assets/images/Statistics/heart before.png')}
                      style={{ width: 24, height: 24 }}
                    />
                  </TouchableOpacity>
                  <ScrollView>
                    <Text style={styles.bubbleText}>
                      {displayedText}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
          <Text style={styles.diaryTitle}>Mood Diary</Text>
          <View style={styles.monthRow}>
            <Text style={styles.monthText} numberOfLines={1} adjustsFontSizeToFit>{monthName}</Text>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <Pressable
              onPress={() => {
                console.log('triangle pressed');
                setMonthPickerVisible(true);
              }}
              hitSlop={20}
              style={styles.triangleBtn}
            >
              <Image
                source={require('../../../assets/images/Statistics/triangle.png')}
                style={{ width: 16, height: 16, marginLeft: 6, zIndex: 20 }}
              />
            </Pressable>
          </View>
          {/* week title */}
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={d + i} style={styles.weekDay}>{d}</Text>
            ))}
          </View>
          {/* calendar grid */}
          <View style={styles.calendarGrid}>
            {calendar.map((week, wi) => (
              <View key={wi} style={styles.calendarRow}>
                {week.map((d, di) => {
                  if (!d) return <View key={di} style={styles.calendarCell} />;
                  const dateStr = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`).format('YYYY-MM-DD');
                  const rec = records.find(r => r.date === dateStr);
                  if (rec && EMOTIONS.find(e => e.key === rec.emotion)) {
                    const e = EMOTIONS.find(e => e.key === rec.emotion);
                    return <View key={di} style={styles.calendarCell}><Image source={e.icon} style={styles.calendarIcon} /></View>;
                  }
                  return <View key={di} style={[styles.calendarCell, { backgroundColor: GRAY_CIRCLE, borderRadius: 20 }]} />;
                })}
              </View>
            ))}
          </View>
        </View>
        {/* month and year picker modal */}
        <Modal visible={monthPickerVisible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 260 }}>
              <Text style={{ fontFamily: 'ArialBlack', fontSize: 16, color: '#B38B7A', textAlign: 'center', marginBottom: 12 }}>Select Month & Year</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <ScrollView style={{ height: 100 }}>
                  {monthItems.map(item => (
                    <Pressable key={item.value} onPress={() => setTempMonth(item.value)}>
                      <Text style={{ fontSize: 16, color: tempMonth === item.value ? '#B38B7A' : '#888', fontFamily: 'ArialBlack', padding: 4 }}>{item.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <ScrollView style={{ height: 100, marginLeft: 16 }}>
                  {yearItems.map(item => (
                    <Pressable key={item.value} onPress={() => setTempYear(item.value)}>
                      <Text style={{ fontSize: 16, color: tempYear === item.value ? '#B38B7A' : '#888', fontFamily: 'ArialBlack', padding: 4 }}>{item.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable onPress={() => setMonthPickerVisible(false)} style={{ padding: 8 }}>
                  <Text style={{ color: '#888', fontSize: 16 }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => { setSelectedMonth(tempMonth); setSelectedYear(tempYear); setMonthPickerVisible(false); }} style={{ padding: 8 }}>
                  <Text style={{ color: '#B38B7A', fontSize: 16, fontWeight: 'bold' }}>OK</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {/* bottom navigation bar */}
      <View style={styles.navBar}>
        <NavIcon
          icon={require('../../../assets/images/HomePage/Home.png')}
          active={false}
          onPress={() => navigation.navigate('HomePage')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/quote.png')}
          active={false}
          onPress={() => navigation.navigate('Quotes')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/statistic.png')}
          active={true}
          onPress={() => {}}
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
          { tintColor: active ? 'rgb(120,167,132)' : 'rgb(61,64,79)' }
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: 'rgba(234,232,226,1)',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.44,
    borderBottomRightRadius: SCREEN_WIDTH * 0.44,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingTop: SCREEN_HEIGHT * 0.05,
    paddingLeft: SCREEN_WIDTH * 0.04,
  },
  title: {
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: SCREEN_WIDTH * 0.08,
    lineHeight: SCREEN_WIDTH * 0.093,
    width: SCREEN_WIDTH * 0.39,
    marginTop: SCREEN_HEIGHT * 0.07,
  },
  emotionStack: {
    flex: 1,
    position: 'relative',
  },
  emotionImg: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.18,
    height: SCREEN_WIDTH * 0.18,
  },
  statisticsTitle: {
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: SCREEN_WIDTH * 0.052,
    marginLeft: SCREEN_WIDTH * 0.06,
    marginTop: SCREEN_HEIGHT * 0.05,
    marginBottom: SCREEN_HEIGHT * 0.013,
  },
  barChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: SCREEN_HEIGHT * 0.22,
    marginLeft: SCREEN_WIDTH * 0.05,
    marginRight: SCREEN_WIDTH * 0.05,
    marginBottom: SCREEN_HEIGHT * 0.013,
  },
  barChartLabelCol: {
    justifyContent: 'space-between',
    height: SCREEN_HEIGHT * 0.18,
    marginRight: SCREEN_WIDTH * 0.02,
  },
  barChartLabel: {
    color: '#A8AFBC',
    fontFamily: 'ArialUnicodeMS',
    fontSize: SCREEN_WIDTH * 0.037,
    textAlign: 'center',
    height: SCREEN_HEIGHT * 0.036,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'space-between',
  },
  barCol: {
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.13,
  },
  barIcon: {
    width: SCREEN_WIDTH * 0.085,
    height: SCREEN_WIDTH * 0.085,
    marginBottom: SCREEN_HEIGHT * 0.005,
  },
  bar: {
    width: SCREEN_WIDTH * 0.075,
    borderRadius: SCREEN_WIDTH * 0.021,
    marginBottom: SCREEN_HEIGHT * 0.003,
  },
  bubbleContainer: {
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.4,
    bottom: SCREEN_HEIGHT * 0.18,
    zIndex: 20,
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
    marginTop: SCREEN_HEIGHT * 0.01,
    backgroundColor: 'rgb(245,243,237)',
    borderRadius: 20,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    width: SCREEN_WIDTH * 0.49,
    minHeight: SCREEN_HEIGHT * 0.07,
    justifyContent: 'center',
    maxHeight: SCREEN_HEIGHT * 0.18, 
  },
  bubbleText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#4A4A4A',
    // textAlign: 'center',
    fontFamily: undefined, // 使用系統默認字體
    lineHeight: SCREEN_WIDTH * 0.06,
  },

  moodeeOverlayImg: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    right: -SCREEN_WIDTH * 0.03,
    top: -SCREEN_HEIGHT * 0.13,
    resizeMode: 'contain',
  },
  diaryWrap: {
    marginTop: SCREEN_HEIGHT * 0.23,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    position: 'relative',
    marginLeft: 0,
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  diaryTitle: {
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: SCREEN_WIDTH * 0.052,
    marginLeft: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  monthText: {
    color: '#D3A49D',
    fontFamily: 'ArialBlack',
    fontSize: SCREEN_WIDTH * 0.037,
    maxWidth: SCREEN_WIDTH * 0.22,
    minWidth: SCREEN_WIDTH * 0.13,
    flexShrink: 1,
    textAlign: 'right',
    lineHeight: SCREEN_HEIGHT * 0.028,
  },
  yearText: {
    color: '#D3A49D',
    fontFamily: 'ArialBlack',
    fontSize: SCREEN_WIDTH * 0.037,
    marginLeft: SCREEN_WIDTH * 0.02,
    minWidth: SCREEN_WIDTH * 0.09,
    textAlign: 'left',
    lineHeight: SCREEN_HEIGHT * 0.028,
  },
  triangleBtn: {
    marginLeft: SCREEN_WIDTH * 0.016,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SCREEN_HEIGHT * 0.01,
  },
  weekDay: {
    width: SCREEN_WIDTH * 0.11,
    textAlign: 'center',
    color: '#A8AFBC',
    fontFamily: 'ArialUnicodeMS',
    fontSize: SCREEN_WIDTH * 0.037,
    marginHorizontal: SCREEN_WIDTH * 0.013,
  },
  calendarGrid: {
    marginTop: SCREEN_HEIGHT * 0.026,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SCREEN_HEIGHT * 0.026,
  },
  calendarCell: {
    width: SCREEN_WIDTH * 0.11,
    height: SCREEN_WIDTH * 0.11,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SCREEN_WIDTH * 0.013,
  },
  calendarIcon: {
    width: SCREEN_WIDTH * 0.10,
    height: SCREEN_WIDTH * 0.10,
  },
  navBar: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.04,
    right: SCREEN_WIDTH * 0.04,
    bottom: SCREEN_HEIGHT * 0.032,
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
    paddingLeft: SCREEN_WIDTH * 0.13,
    paddingRight: SCREEN_WIDTH * 0.13,
  },
  navIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconImg: {
    width: SCREEN_WIDTH * 0.053,
    height: SCREEN_WIDTH * 0.053,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SCREEN_HEIGHT * 0.013,
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#F7F5EF',
    paddingTop: SCREEN_HEIGHT * 0.05,
    paddingLeft: SCREEN_WIDTH * 0.04,
  },
  skeletonTitle: {
    width: SCREEN_WIDTH * 0.39,
    height: SCREEN_HEIGHT * 0.07,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.07,
  },
  skeletonMonthPicker: {
    width: SCREEN_WIDTH * 0.45,
    height: SCREEN_HEIGHT * 0.05,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.05,
    marginBottom: SCREEN_HEIGHT * 0.013,
  },
  skeletonEmotionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SCREEN_HEIGHT * 0.05,
    marginBottom: SCREEN_HEIGHT * 0.013,
  },
  skeletonEmotionItem: {
    width: SCREEN_WIDTH * 0.18,
    height: SCREEN_HEIGHT * 0.18,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  skeletonCalendar: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.2,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.026,
  },
  skeletonMoodee: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.23,
  },
}); 

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 14,
    color: '#B38B7A',
    fontFamily: 'ArialBlack',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  inputAndroid: {
    fontSize: 14,
    color: '#B38B7A',
    fontFamily: 'ArialBlack',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
}; 
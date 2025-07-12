import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import RNPickerSelect from 'react-native-picker-select';
import dayjs from 'dayjs';
import { getMoodeeMessageGemini } from '../../services/gemini';
import { Easing } from 'react-native';
import { useQuotes } from '../../context/QuotesContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// 1. 角色順序 anger, fear, disgust, surprise, sadness, happiness
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
  const [username, setUsername] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1); // month() 回傳 0~11，所以要 +1
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  // 情緒堆疊動畫
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
  const emotionAngles = [-18, 12, -8, 20, -10, 8]; // 依角色順序
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

  // 獲取用戶名
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
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

  // 初始化時獲取數據
  useEffect(() => {
    if (username) {
      fetchData();
    }
  }, [username]);

  // 監聽 scroll 事件
  const handleScroll = (e) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    if (!moodeeAnimated && moodeeRef.current) {
      moodeeRef.current.measure((fx, fy, width, height, px, py) => {
        // py: moodee 距離螢幕頂端的座標
        if (py < SCREEN_HEIGHT / 2 && py + height > SCREEN_HEIGHT / 4) {
          setMoodeeAnimated(true);
          Animated.timing(moodeeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
            Animated.timing(bubbleAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          });
        }
      });
    }
  };

  // 3. 角色掉落動畫依新順序依序執行
  useEffect(() => {
    fetchData();
    EMOTIONS.forEach((e, i) => {
      emotionAnims[i].y.setValue(-200);
      emotionAnims[i].x.setValue(0);
      setTimeout(() => {
        // 1. 先用 timing 做重力加速度掉落
        Animated.timing(emotionAnims[i].y, {
          toValue: emotionTargets[i].y + 30, // 先超過目標一點
          duration: 700,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }).start(() => {
          // 2. 再 spring 彈跳回最終位置
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

  async function fetchData() {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.log('No logged in user');
        setLoading(false);
        return;
      }
      
      console.log('🔍 fetchData - Current user UID:', user.uid);
      console.log('🔍 fetchData - Current username state:', username);
      
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
      console.log('Query date range:', start, 'to', end);
      console.log('Query path:', `users/${user.uid}/moodRecords`);
      
      const q = query(
        collection(db, `users/${user.uid}/moodRecords`),
        where('date', '>=', start),
        where('date', '<=', end)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      console.log('Query results:', data);
      console.log('🔍 fetchData - Number of documents found:', snap.docs.length);
      
      setRecords(data);
      // 統計
      const stats = {};
      EMOTIONS.forEach(e => { stats[e.key] = 0; });
      data.forEach(r => { 
        console.log('Processing record:', r.emotion, r.date, 'username:', r.username);
        if (stats[r.emotion] !== undefined) stats[r.emotion]++; 
      });
      console.log('Statistics result:', stats);
      setEmotionStats(stats);
      // Moodee 語句
      const msg = await getMoodeeMessageGemini({ stats, username });
      setBubbleText(msg);
      setLoading(false);
    } catch (e) {
      console.log('Statistics error:', e);
      console.log('Error details:', e.message);
      setLoading(false);
    }
  }

  // 日曆資料
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
  // 產生下拉選單選項
  const monthItems = Array.from({ length: 12 }, (_, i) => ({ 
    label: dayjs().month(i).format('MMMM'), 
    value: i + 1 
  }));
  const yearItems = Array.from({ length: 5 }, (_, i) => ({ 
    label: `${dayjs().year() - 2 + i}`, 
    value: dayjs().year() - 2 + i 
  }));

  // 取得昨天的日期
  const yesterday = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`).subtract(1, 'day');
  const yesterdayStr = yesterday.format('YYYY-MM-DD');
  // 取得昨天的所有紀錄
  const recordsYesterday = records.filter(r => r.date === yesterdayStr);
  // 統計昨天的情緒
  const emotionStatsYesterday = {};
  EMOTIONS.forEach(e => { emotionStatsYesterday[e.key] = 0; });
  recordsYesterday.forEach(r => { if (emotionStatsYesterday[r.emotion] !== undefined) emotionStatsYesterday[r.emotion]++; });

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F7F5EF' 
      }}>
        <ActivityIndicator size="large" color="#A8AFBC" />
        <Text style={{ 
          marginTop: 16, 
          color: '#A8AFBC', 
          fontSize: 16,
          fontFamily: 'ArialUnicodeMS'
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // 2. 角色 scale 根據情緒比例
  const max = Math.max(...Object.values(emotionStats), 1);

  const monthName = dayjs().month(selectedMonth - 1).format('MMMM');

  // 檢查是否有數據
  const hasData = Object.values(emotionStats).some(count => count > 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F5EF' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* 1. 情緒比例堆疊區 */}
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
        {/* 2. Your Statistics 直條圖區 */}
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
            {/* 左側比例文字 */}
            <View style={styles.barChartLabelCol}>
              {[100, 75, 50, 25, 0].map(v => (
                <Text key={v} style={styles.barChartLabel}>{v}</Text>
              ))}
            </View>
            {/* 直條圖 */}
            <View style={styles.barChartRow}>
              {EMOTIONS.map((e, i) => {
                const value = emotionStats[e.key] || 0;
                const barHeight = 120 * (value / max);
                const valueYesterday = emotionStatsYesterday[e.key] || 0;
                let trend = null;
                if (value > valueYesterday) trend = 'up';
                else if (value < valueYesterday) trend = 'down';
                return (
                  <View key={e.key} style={styles.barCol}>
                    {/* 上升/下降箭頭 */}
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
        {/* 4. Mood Diary 區 */}
        <View style={styles.diaryWrap}>
          {/* moodee 圖片動畫滑入 */}
          <Animated.View
            ref={moodeeRef}
            style={[styles.moodeeOverlayImg, { transform: [{ translateX: moodeeAnim }] }]}
            onLayout={() => {}}
          >
            <Image source={require('../../../assets/images/HomePage/moodee.png')} style={{ width: 250, height: 250, resizeMode: 'contain' }} />
            {/* 對話匡絕對定位在 moodee 右上 */}
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
                      {hasData ? (bubbleText || 'Keep going! Every day is a new start.') : 'Start recording your emotions and let\'s grow together!'}
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
          {/* 星期標題 */}
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={d + i} style={styles.weekDay}>{d}</Text>
            ))}
          </View>
                    {/* 日曆格 */}
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
        {/* 月份年份選單 Modal */}
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
      {/* 底部導航列 */}
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
    color: '#41424A',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '500',
    fontFamily: 'ArialUnicodeMS',
    flexWrap: 'wrap',
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
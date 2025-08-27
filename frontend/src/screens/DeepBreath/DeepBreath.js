import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useFonts } from 'expo-font';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHASE_DURATION = 5; // 5 seconds per phase

export default function DeepBreathScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    ArialRoundedMTBold: require('../../../assets/fonts/arialroundedmtbold.ttf'),
    ArialUnicodeMS: require('../../../assets/fonts/arial unicode ms.otf'),
    ArialUnicodeMSBold: require('../../../assets/fonts/arial unicode ms bold.otf'),
    ArialBlack: require('../../../assets/fonts/arial_black.ttf'),
    PottaOne: require('../../../assets/fonts/PottaOne - Regular.ttf'),
  });

  // animation state
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState('inhale'); // inhale or exhale
  const [countdown, setCountdown] = useState(PHASE_DURATION);

  useEffect(() => {
    // animation loop
    const animate = () => {
      Animated.timing(scaleAnim, {
        toValue: phase === 'inhale' ? 1.18 : 1, // enlarge to 1.18, shrink to 1
        duration: PHASE_DURATION * 1000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setPhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
          setCountdown(PHASE_DURATION);
        }, 0);
      });
    };
    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // countdown
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  if (!fontsLoaded) {
    return null; // or show loading screen
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.phaseText}>{phase === 'inhale' ? 'Inhale' : 'Exhale'}</Text>
        <Text style={styles.countdownText}>{countdown}</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require('../../../assets/images/Profile/Breath.png')}
            style={styles.breathImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.breathText}>Take a deep breath</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#727386',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: SCREEN_HEIGHT * 0.08,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  phaseText: {
    fontFamily: 'ArialRoundedMTBold',
    fontSize: 28,
    color: 'rgb(50, 46, 70)',
    marginBottom: 4,
    marginTop: 10,
    letterSpacing: 1,
  },
  countdownText: {
    fontFamily: 'ArialRoundedMTBold',
    fontSize: 22,
    color: 'rgb(50, 46, 70)',
    marginBottom: 12,
  },
  breathImage: {
    width: SCREEN_WIDTH * (1 - 0.2 - 0.158),
    height: SCREEN_HEIGHT * 0.28,
    marginLeft: SCREEN_WIDTH * 0.2,
    marginRight: SCREEN_WIDTH * 0.158,
    alignSelf: 'center',
  },
  breathText: {
    marginTop: 30,
    width: 185,
    height: 23,
    color: 'rgba(255,251,237,1)',
    fontSize: 20,
    fontFamily: 'ArialRoundedMTBold',
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  button: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: 'rgba(245,140,69,1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.017,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SCREEN_HEIGHT * 0.021,
    textAlign: 'center',
  },
}); 
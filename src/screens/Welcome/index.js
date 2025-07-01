import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


export default function WelcomeScreen() {
  const navigation = useNavigation();
// proportion of the screen height for the bouncing animation
  const topMin = SCREEN_HEIGHT * 0.296;
  const topMax = SCREEN_HEIGHT * 0.319;
  const bounceAnim = useRef(new Animated.Value(topMin)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: topMax,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(bounceAnim, {
          toValue: topMin,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [bounceAnim, topMin, topMax]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: SCREEN_HEIGHT * 0.036 }]}>
        Welcome!
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            width: SCREEN_WIDTH * 0.744,
            fontSize: SCREEN_HEIGHT * 0.028,
            marginTop: SCREEN_HEIGHT * 0.024,
            lineHeight: SCREEN_HEIGHT * 0.038,
          },
        ]}
      >
        Want to get on good terms{`\n`}with your emotions?
      </Text>
      <Animated.Image
        source={require('../../../assets/images/Welcome.png')}
        style={[
          styles.character,
          {
            top: bounceAnim,
            width: SCREEN_WIDTH,
           
          },
        ]}
        resizeMode="stretch"
      />
      <TouchableOpacity
        style={[
          styles.button,
          {
            left: SCREEN_WIDTH * 0.151,
            right: SCREEN_WIDTH * 0.151,
            bottom: SCREEN_HEIGHT * 0.102,
            paddingVertical: SCREEN_HEIGHT * 0.017,
          },
        ]}
        onPress={() => navigation.navigate('IntroSlider')}
      >
        <Text style={[styles.buttonText, { fontSize: SCREEN_HEIGHT * 0.021 }]}>Yes!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(61,64,79)', // Color(red: 0.24, green: 0.25, blue: 0.31)
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    color: '#fff',
    fontFamily: 'ArialRoundedMTBold-Regular',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT * 0.118, // 100/844
    width: 144, 
    height: 35, 
  },
  subtitle: {
    color: '#fff',
    fontFamily: 'ArialUnicodeMS-Regular',
    textAlign: 'center',
    marginBottom: 0,
  },
  character: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  button: {
    position: 'absolute',
    backgroundColor: '#FAF7ED',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#41424A',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 
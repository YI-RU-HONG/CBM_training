import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, FlatList, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: "What's This App For?",
    description: "This app is designed to gently retrain how your brain responds to stress and negativity.",
    image: require('../../../assets/images/whats this app for.png'),
  },
  {
    key: '2',
    title: "What Is CBM?",
    description: "It's a simple, science-backed training that helps you change the way your brain reacts to negative or stressful situations.",
    image3: require('../../../assets/images/what is CBM.png'),
  },
  {
    key: '3',
    title: 'What CBM Does?',
    description: 'CBM helps train your brain to focus on more positive and balanced interpretations.',
    image1: require('../../../assets/images/what CBM does.png'),
  },
  {
    key: '4',
    title: "What You'll Do?",
    description: "You'll complete short, interactive tasks. Your answers help train your brain to respond more positively over time.",
    image2: require('../../../assets/images/What you will do.png'),
  },
];

export default function IntroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const DESCRIPTION_TOP = SCREEN_HEIGHT * 0.277;
  const DESCRIPTION_HEIGHT = SCREEN_HEIGHT * 0.1;

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      {item.key === '4' && (
        <>
          <Text
            style={[
              styles.title,
              {
                fontSize: SCREEN_HEIGHT * 0.033,
                width: SCREEN_WIDTH * 0.54, // 211/390
                top: SCREEN_HEIGHT * 0.605, // 497/844
                left: SCREEN_WIDTH * 0.23, // 90/390
                position: 'absolute',
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.description,
              {
                fontSize: SCREEN_HEIGHT * 0.024,
                width: SCREEN_WIDTH * 0.79,
                top: SCREEN_HEIGHT * 0.675, 
                left: SCREEN_WIDTH * 0.095,
                lineHeight: SCREEN_HEIGHT * 0.032,
                minHeight: SCREEN_HEIGHT * 0.1,
                flexWrap: 'wrap',
                position: 'absolute',
              },
            ]}
          >
            {item.description}
          </Text>
          <Image
            source={item.image2}
            style={[
              styles.image2,
              {
                // left: SCREEN_WIDTH * 0.095,
                right: 0,
                top: SCREEN_HEIGHT * 0.04,
                height: SCREEN_HEIGHT * 0.6,
                position: 'absolute',
              },
            ]}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: SCREEN_HEIGHT * (90 / 844), // 63px 自適應
              right: SCREEN_WIDTH * 0.064, // 約25/390
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
            }}
            onPress={() => navigation.navigate('Privacy')}
          >
            <Image
              source={require('../../../assets/images/button.png')}
              style={{ width: 40, height: 40, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
        </>
      )}
      {item.key !== '4' && (
        <>
          <Text style={[styles.title, { fontSize: SCREEN_HEIGHT * 0.033, width: SCREEN_WIDTH * 0.74, top: SCREEN_HEIGHT * 0.18 }]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.description,
              {
                fontSize: SCREEN_HEIGHT * 0.024,
                width: SCREEN_WIDTH * 0.79,
                top: SCREEN_HEIGHT * 0.25,
                lineHeight: SCREEN_HEIGHT * 0.032,
                minHeight: SCREEN_HEIGHT * 0.1,
                flexWrap: 'wrap',
              },
            ]}
          >
            {item.description}
          </Text>
          {item.image && (
            <Image
              source={item.image}
              style={[
                styles.image,
                {
                  right: 0,
                  // left: SCREEN_WIDTH * 0.08,
                  top: SCREEN_HEIGHT * 0.25 + 50, 
                  height: SCREEN_HEIGHT * 0.6,
                },
              ]}
              resizeMode="contain" 
            />
          )}
          {item.image3 && (
            <Image
              source={item.image3}
              style={[
                styles.image3,
                {
                  // right: SCREEN_WIDTH * 0.05,
                  left: SCREEN_WIDTH * 0.0005,
                  top: SCREEN_HEIGHT * 0.25 + 50, 
                  height: SCREEN_HEIGHT * 0.6,
                },
              ]}
              resizeMode="contain" 
            />
          )}
          {item.image1 && (
            <Image
              source={item.image1}
              style={[
                styles.image1,
                {
                  left: SCREEN_WIDTH * 0.12,
                  right: 0,
                  top: SCREEN_HEIGHT * 0.30, 
                  height: SCREEN_HEIGHT * 0.6,
                },
              ]}
              resizeMode="contain" 
            />
          )}
            {/* {item.image2 && (
            <Image
              source={item.image2}
              style={[
                styles.image2,
                {
                  left: SCREEN_WIDTH * 0.095,
                  right: 0,
                  top: SCREEN_HEIGHT * 0.45, 
                  height: SCREEN_HEIGHT * 0.6,
                },
              ]}
              resizeMode="contain" 
            />
          )} */}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />
      {/* dot indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentIndex === i && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(61,64,79)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    backgroundColor: 'rgb(61,64,79)',
  },
  title: {
    color: '#fff',
    fontFamily: 'ArialRoundedMTBold',
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    left: SCREEN_WIDTH * 0.133, // 52/390
    height: 32,
  },
  description: {
    color: '#fff',
    fontFamily: 'ArialUnicodeMS',
    textAlign: 'center',
    position: 'absolute',
    left: SCREEN_WIDTH * 0.095, // 37/390
  },
  image: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.45,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.045,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#888',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
}); 
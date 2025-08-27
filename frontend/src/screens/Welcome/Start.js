import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PrivacyScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/5 min.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Train your mind, {"\n"}gently and daily</Text>
      <Text style={styles.subtitle}>
        Learn to manage your emotion{"\n"}
        <Text>
          in <Text style={{ fontSize: SCREEN_HEIGHT * 0.022 * 1.2, fontWeight: 'bold', color: '#fff' }}>5</Text> min per day
        </Text>
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.buttonText}>Let's get started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(61,64,79)',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_HEIGHT * 0.27,
    marginTop: SCREEN_HEIGHT * 0.25,
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  title: {
    color: '#fff',
    fontFamily: 'ArialRoundedMTBold',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: SCREEN_HEIGHT * 0.033,
    width: SCREEN_WIDTH * 0.6,
    marginTop: SCREEN_HEIGHT * 0.04,
    marginBottom: SCREEN_HEIGHT * 0.045,
  },
  subtitle: {
    color: '#fff',
    fontFamily: 'ArialUnicodeMS',
    textAlign: 'center',
    fontSize: SCREEN_HEIGHT * 0.022,
    width: SCREEN_WIDTH * 0.79,
    marginBottom: SCREEN_HEIGHT * 0.13,
  },
  button: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.151,
    right: SCREEN_WIDTH * 0.151,
    bottom: SCREEN_HEIGHT * 0.102,
    backgroundColor: '#FAF7ED',
    borderRadius: 8,
    paddingVertical: SCREEN_HEIGHT * 0.017,
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
    fontSize: SCREEN_HEIGHT * 0.021,
    textAlign: 'center',
  },
}); 


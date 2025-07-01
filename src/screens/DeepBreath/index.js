import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeepBreathScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>深呼吸頁面</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // 從路由參數取得情緒和理由資料
  const selectedEmotion = route.params?.selectedEmotion || 'Unknown';
  const selectedReasons = route.params?.selectedReasons || [];

  // 模擬遊戲完成
  const completeGame = () => {
    setGameCompleted(true);
    // 延遲一下再跳轉，讓使用者看到完成狀態
    setTimeout(() => {
      // 將遊戲完成資料傳遞回首頁
      navigation.navigate('HomePage', {
        gameCompleted: {
          selectedEmotion,
          selectedReasons,
        }
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>遊戲頁面</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>選擇的情緒: {selectedEmotion}</Text>
        <Text style={styles.infoText}>選擇的理由:</Text>
        {selectedReasons.map((reason, index) => (
          <Text key={index} style={styles.reasonText}>• {reason}</Text>
        ))}
      </View>

      {!gameCompleted ? (
        <TouchableOpacity style={styles.completeButton} onPress={completeGame}>
          <Text style={styles.completeButtonText}>完成遊戲</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>遊戲完成！</Text>
          <Text style={styles.completedSubText}>正在生成個人化建議...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,250,237,1)',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#42485A',
    marginBottom: 40,
    fontFamily: 'ArialRoundedMTBold',
  },
  infoContainer: {
    backgroundColor: 'rgba(217,217,217,0.3)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 16,
    color: '#42485A',
    marginBottom: 10,
    fontFamily: 'ArialUnicodeMS',
  },
  reasonText: {
    fontSize: 14,
    color: '#42485A',
    marginLeft: 10,
    marginBottom: 5,
    fontFamily: 'ArialUnicodeMS',
  },
  completeButton: {
    backgroundColor: '#F58C45',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#F58C45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'ArialRoundedMTBold',
  },
  completedContainer: {
    alignItems: 'center',
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F58C45',
    marginBottom: 10,
    fontFamily: 'ArialRoundedMTBold',
  },
  completedSubText: {
    fontSize: 16,
    color: '#42485A',
    fontFamily: 'ArialUnicodeMS',
  },
}); 
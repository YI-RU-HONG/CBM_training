import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { saveEmotionAndReasons } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const REASONS = [
  'Health & Energy',
  'Motivation',
  'Feeling overwhelmed',
  'Sleep',
  'Routine',
  'Interactions with others',
  'Self-awareness', 
  'Overthinking',
  'Weather',
  'Comparisons & Social media',
  'Expectations & Pressure',
  'Work',
  'Studies',
  'Unexpected events',
  'Just feeling this way',
  'Not sure yet',
  'Something else',
];

export default function ReasonSelect() {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [customReasonTemp, setCustomReasonTemp] = useState('');

  // 按下 something else 時，彈窗內容保留
  const openCustomModal = () => {
    setCustomReasonTemp(customReason);
    setModalVisible(true);
  };

  // multi-select
  const toggleReason = (reason) => {
    if (reason === 'Something else') {
      openCustomModal();
      return;
    }
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  // modal Enter
  const handleCustomReason = () => {
    setCustomReason(customReasonTemp);
    if (customReasonTemp.trim()) {
      setSelectedReasons((prev) => {
        // only keep one something else
        const filtered = prev.filter((r) => r !== 'Something else');
        return [...filtered, 'Something else'];
      });
    } else {
      setSelectedReasons((prev) => prev.filter((r) => r !== 'Something else'));
    }
    setModalVisible(false);
  };

  // redirect to daily game page
  const handleNext = async () => {
    // get emotion (assume you pass it in or get it from context)
    const selectedEmotion = route.params?.selectedEmotion || 'Unknown';
    // reasons
    const reasons = selectedReasons.map(r =>
      r === 'Something else' && customReason ? customReason : r
    );
    
    // save to firebase
    try {
      await saveEmotionAndReasons({ emotion: selectedEmotion, reasons });
    } catch (e) {
      console.log('save emotion and reasons failed', e);
    }
    // redirect to daily game page and pass the emotion and reasons
    navigation.navigate('DailyGame', { 
      selectedEmotion,
      selectedReasons: reasons,
    });
  };

  // 跳過
  const handleSkip = () => {
    setCustomReason('');
    navigation.navigate('Game');
  };

  // 返回情緒選擇
  const handleBack = () => {
    navigation.goBack();
  };

  // 分組，每兩個一組
  const getRows = (arr, perRow = 2) => {
    const rows = [];
    for (let i = 0; i < arr.length; i += perRow) {
      rows.push(arr.slice(i, i + perRow));
    }
    return rows;
  };
  const BUTTON_MARGIN = 16;
  const BUTTON_FONT_SIZE = Math.round(SCREEN_WIDTH * 0.038); 
  const BUTTON_HEIGHT = 40;
  const BUTTON_MIN_WIDTH = 80;
  const BUTTON_MAX_WIDTH = (SCREEN_WIDTH - 60) / 2; // 兩個按鈕+左右各15+中間30

  // 動態按鈕寬度
  const getBtnWidth = (text) => {
    const base = BUTTON_FONT_SIZE;
    const padding = 20; 
    const textWidth = text.length * base * 0.6 + padding;
    return Math.max(BUTTON_MIN_WIDTH, Math.min(textWidth, SCREEN_WIDTH - 60 - 30 - 10));
  };

  return (
    <View style={styles.container}>
      {/* 左上角返回箭頭 */}
      <TouchableOpacity style={styles.arrowBtn} onPress={handleBack}>
        <Image
          source={require('../../../assets/images/Game/arrowbutton.png')}
          style={styles.arrowImg}
        />
      </TouchableOpacity>

      {/* 右上角 Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* 標題 */}
      <Text style={styles.title}>Any reason behind{"\n"}how you feel?</Text>
      {/* 小標 */}
      <Text style={styles.subtitle}>Select one or more reasons</Text>

      {/* 理由選擇區 */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {getRows(REASONS, 2).map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flexDirection: 'row',
              justifyContent: row.length === 1 ? 'center' : 'center', // 單一按鈕時也置中
              marginBottom: 18,
            }}
          >
            {row.map((reason, idx) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonBtn,
                  {
                    width: getBtnWidth(reason === 'Something else' && customReason ? customReason : reason),
                    marginRight: idx === 0 && row.length > 1 ? BUTTON_MARGIN : 0,
                    height: BUTTON_HEIGHT,
                  },
                  selectedReasons.includes(reason) ? styles.reasonBtnSelected : null,
                ]}
                onPress={() => toggleReason(reason)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReasons.includes(reason) ? styles.reasonTextSelected : null,
                    { fontSize: BUTTON_FONT_SIZE },
                  ]}
                 
                >
                  {reason === 'Something else' && customReason ? customReason : reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* 下方按鈕 */}
      <TouchableOpacity
        style={styles.nextBtn}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextBtnText}>Start training</Text>
      </TouchableOpacity>

      {/* Something else 輸入框 Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            {/* 關閉icon */}
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setModalVisible(false)}
            >
              <View style={styles.closeIconInner}>
                <Text style={{ fontSize: 20, color: '#41424A' }}>×</Text>
              </View>
            </TouchableOpacity>
            {/* 主標 */}
            <Text style={styles.modalTitle}>
              Feel free to tell us{"\n"}what's on your mind
            </Text>
            {/* 輸入欄 */}
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={customReasonTemp}
                onChangeText={setCustomReasonTemp}
                placeholder=""
                placeholderTextColor="#BFBFBF"
                maxLength={50}
              />
            </View>
            {/* 按鈕 */}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleCustomReason}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Enter</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const BTN_MARGIN = SCREEN_WIDTH * 0.025;
const BTN_WIDTH = (SCREEN_WIDTH - BTN_MARGIN * 3 - 30) / 2; // 2欄，左右各15pt

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,250,237,1)',
    paddingTop: SCREEN_HEIGHT * 0.06,
  },
  arrowBtn: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1,
    left: SCREEN_WIDTH * 0.064,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowImg: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  skipBtn: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1,
    right: SCREEN_WIDTH * 0.064,
    zIndex: 10,
  },
  skipText: {
    color: '#42485A',
    fontFamily: 'ArialUnicodeMS',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  title: {
    marginTop: SCREEN_HEIGHT * 0.195 - SCREEN_HEIGHT * 0.06,
    width: 294,
    alignSelf: 'center',
    color: '#42485A',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 35,
  },
  subtitle: {
    marginTop: 30,
    width: 307,
    alignSelf: 'center',
    color: '#42485A',
    fontFamily: 'ArialUnicodeMS',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 27,
  },
  scrollArea: {
    flexGrow: 0,
    marginTop: 30,
    marginHorizontal: 0,
    marginBottom: 50,
    maxHeight: SCREEN_HEIGHT * 0.5, // 可依需求調整
  },
  scrollContent: {
    paddingHorizontal: 15, // 保持外圍間距
    paddingBottom: 10,
  },
  reasonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  verticalWrap: {
    marginTop: 30,
    marginBottom: 120,
    maxHeight: SCREEN_HEIGHT * 0.35, // 可依需求調整
  },
  verticalContent: {
    // 可加 paddingBottom: 30,
  },
  reasonBtn: {
    backgroundColor: 'rgba(217,217,217,0.5)',
    borderRadius: 10,
    minHeight: 40,
    minWidth: 80,
    maxWidth: SCREEN_WIDTH - 60 - 30 - 10, // 再縮小一點
    paddingHorizontal: 10, // 減少 padding
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  reasonBtnSelected: {
    backgroundColor: 'rgba(245,140,69,1)',
  },
  reasonText: {
    color: '#41424A',
    fontFamily: 'ArialUnicodeMS',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'center',
  },
  reasonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nextBtn: {
    position: 'absolute',
    bottom: 40,
    left: '10%',
    width: '80%',
    height: 50,
    backgroundColor: '#F58C45',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F58C45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  nextBtnText: {
    color: '#fff',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: 'rgba(255,250,237,1)',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    marginTop: 10,
    marginBottom: 18,
    color: '#41424A',
    fontFamily: 'ArialUnicodeMS',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 27,
  },
  inputWrap: {
    width: 240,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217,217,217,1)',
    marginBottom: 18,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#41424A',
    fontFamily: 'ArialUnicodeMS',
  },
  modalBtn: {
    width: 240,
    height: 38,
    backgroundColor: '#F58C45',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontFamily: 'ArialRoundedMTBold',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

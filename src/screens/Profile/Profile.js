import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN_H = 30 / SCREEN_WIDTH; // 30pt 自適應
// const CARD_WIDTH = SCREEN_WIDTH - 2 * (SCREEN_WIDTH * CARD_MARGIN_H);
// const CARD_HEIGHT = SCREEN_HEIGHT * 0.14;
const ARROW_SIZE = SCREEN_WIDTH * 0.10;

export default function ProfileScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* 頭像與名稱 */}
      <View style={styles.avatarWrap}>
        <Image
          source={require('../../../assets/images/Profile/photo.png')}
          style={styles.avatar}
        />
        <Text style={styles.name}>Name</Text>
      </View>
      {/* 卡片區域 */}
      <View style={styles.cardsWrap}>
        {[{
          img: require('../../../assets/images/Profile/Safe quote.png'),
          onPress: () => navigation.navigate('Quotes'),
        }, {
          img: require('../../../assets/images/Profile/take breath with me.png'),
          onPress: () => navigation.navigate('DeepBreath'),
        }].map((item, idx, arr) => (
          <View
            key={idx}
            style={[styles.imgCardWrap, idx !== arr.length - 1 && { marginBottom: SCREEN_HEIGHT * (-50 / 844) }]}
          >
            <Image
              source={item.img}
              style={styles.imgCard}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={item.onPress}
            >
              <Image
                source={require('../../../assets/images/button.png')}
                style={styles.arrowImg}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
          active={false}
          onPress={() => navigation.navigate('Statistics')}
        />
        <NavIcon
          icon={require('../../../assets/images/HomePage/profile.png')}
          active={true}
          onPress={() => {}}
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
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,250,237,1)', // UIColor(red: 1, green: 0.98, blue: 0.93, alpha: 1)
    alignItems: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.09,
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  avatar: {
    top: SCREEN_HEIGHT * 0.05,
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28,
    borderRadius: SCREEN_WIDTH * 0.14,
    backgroundColor: '#E6E6E6',
  },
  name: {
    top: SCREEN_HEIGHT * 0.05,
    marginTop: 15,
    fontSize: SCREEN_WIDTH * 0.055,
    color: '#41424A',
    fontWeight: '500',
    textAlign: 'center',
  },
  cardsWrap: {
    width: '100%',
    alignItems: 'center',
  },
  imgCardWrap: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imgCard: {
    top: SCREEN_HEIGHT * 0.03,
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  arrowButton: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.045,
    bottom: SCREEN_HEIGHT * 0.048,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowImg: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    resizeMode: 'contain',
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
    tintColor: 'rgb(61,64,79)',
  },
}); 
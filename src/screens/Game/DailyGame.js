import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrCreateTodaySchedule, getTodayVersion } from '../../utils/gameSchedule';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function DailyGame() {
  const navigation = useNavigation();
  const route = useRoute();
  const { schedule: routeSchedule, currentStep = 0, selectedEmotion, selectedReasons } = route.params || {};
  const [schedule, setSchedule] = useState(routeSchedule);

  useEffect(() => {
    async function getUserGroupAndDays() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return { group: 'A', days: 1 };
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return { group: 'A', days: 1 };
      const data = userDoc.data();
      const group = data.group || 'A';
      // 修正 createdAt 解析
      let createdAt;
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (typeof data.createdAt === 'string') {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      const now = new Date();
      // 跨日就算一天
      const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
      const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const days = Math.floor((nowDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;
      // 加入 debug log
      console.log('【DEBUG】group:', group);
      console.log('【DEBUG】createdAt:', createdAt, 'instanceof Date:', createdAt instanceof Date);
      console.log('【DEBUG】now:', now);
      console.log('【DEBUG】days:', days);
      console.log('【DEBUG】raw createdAt from Firestore:', data.createdAt);
      return { group, days };
    }

    async function init() {
      let finalSchedule = schedule;
      if (!finalSchedule) {
        const { group, days } = await getUserGroupAndDays();
        const version = getTodayVersion(group, days);
        // 加入 debug log
        console.log('【DEBUG】getTodayVersion:', group, days, '=>', version);
        finalSchedule = await getOrCreateTodaySchedule({ userDays: days, version });
        setSchedule(finalSchedule);
      }
      if (!finalSchedule || currentStep >= finalSchedule.length) {
        navigation.replace('GameDone', { 
          coachText: 'Keep up the great work!',
          selectedEmotion,
          selectedReasons
        });
        return;
      }
      const { type, questionIdx, difficulty } = finalSchedule[currentStep];
      navigation.replace(type, {
        questionIdx,
        difficulty,
        currentStep,
        totalSteps: finalSchedule.length,
        schedule: finalSchedule,
        selectedEmotion,
        selectedReasons,
      });
    }
    init();
  }, [schedule, currentStep]);

  return null; // 不顯示畫面，僅負責跳轉
}

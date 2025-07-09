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
      const createdAt = data.createdAt?.toDate?.() || new Date();
      const now = new Date();
      const days = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)) + 1;
      return { group, days };
    }

    async function init() {
      let finalSchedule = schedule;
      if (!finalSchedule) {
        const { group, days } = await getUserGroupAndDays();
        const version = getTodayVersion(group, days);
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

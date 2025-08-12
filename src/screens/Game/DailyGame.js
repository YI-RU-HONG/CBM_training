import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrCreateTodaySchedule, getTodayVersion } from '../../utils/gameSchedule';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getCurrentUID() {
  const auth = getAuth();
  let user = auth.currentUser;
  let uid = null;
  if (!user) {
    uid = await AsyncStorage.getItem('userUID');
    console.log('[DailyGame] Firebase user is null, using UID from AsyncStorage:', uid);
  } else {
    uid = user.uid;
    console.log('[DailyGame] Using Firebase user UID:', uid);
  }
  return uid;
}

export default function DailyGame() {
  const navigation = useNavigation();
  const route = useRoute();
  const { schedule: routeSchedule, currentStep = 0, selectedEmotion, selectedReasons, gameResults: routeGameResults = [] } = route.params || {};
  const gameResults = routeGameResults; // no need to useState
  const [schedule, setSchedule] = useState(routeSchedule);

  useEffect(() => {
    async function getUserGroupAndDays() {
      const uid = await getCurrentUID();
      if (!uid) return { group: 'A', days: 1 };
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return { group: 'A', days: 1 };
      const data = userDoc.data();
      const group = data.group || 'A';
      // fix createdAt parsing
      let createdAt;
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (typeof data.createdAt === 'string') {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      const now = new Date();
      // count as one day if it is across days
      const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
      const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const days = Math.floor((nowDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;
      // add debug log
      
      return { group, days };
    }

    async function init() {
      let finalSchedule = schedule;
      if (!finalSchedule) {
        const { group, days } = await getUserGroupAndDays();
        const version = getTodayVersion(group, days);
        // add debug log

        finalSchedule = await getOrCreateTodaySchedule({ userDays: days, version });
        setSchedule(finalSchedule);
      }
      if (!finalSchedule || currentStep >= finalSchedule.length) {
        // summarize results
        let positiveCount = 0;
        let totalCount = 0;
        let totalReactionTime = 0;
        let tasksArr = [];
        for (const result of gameResults) {
          if (typeof result.isPositive === 'boolean') {
            if (result.isPositive) positiveCount++;
            totalCount++;
          }
          if (typeof result.reactionTime === 'number') {
            totalReactionTime += result.reactionTime;
          }
          if (result.taskName) {
            tasksArr.push(result.taskName);
          }
        }
        const positiveRatio = totalCount > 0 ? (positiveCount / totalCount) : undefined;
        const avgReactionTime = totalCount > 0 ? Math.round(totalReactionTime / totalCount) : undefined;
        const tasks = tasksArr.join(', ');
        navigation.replace('GameDone', { 
          coachText: 'Keep up the great work!',
          selectedEmotion,
          selectedReasons,
          positiveRatio,
          reactionTime: avgReactionTime,
          tasks,
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
        gameResults, // pass gameResults
      });
    }
    init();
  }, [schedule, currentStep, gameResults]); // depend on gameResults

  return null; // do not show screen, only responsible for redirecting
}

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { fetchUserProfile } from '../services/api';

export default function Profile({ userId }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile(userId).then(setProfile);
  }, [userId]);

  if (!profile) return <Text>Loading...</Text>;
  return <Text>{profile.name}</Text>;
} 
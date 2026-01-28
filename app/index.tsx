import { View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);

  useEffect(() => {
    const checkLaunced = async () => {
      try {
        const value = await AsyncStorage.getItem('hasLaunched');
        if (value !== null) {
          setHasLaunched(true);
        }
      } catch (e) {
        console.error('Error reading value', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLaunced();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!hasLaunched) {
    return <Redirect href="/onboarding" />;
  }

  // Check if user is authenticated (we need to potentially access this from AuthContext, 
  // but strictly speaking _layout should handle it. 
  // However, for the initial splash, we can redirect to login if we know they've launched before.)
  
  // Actually, let's just send them to /login if they have launched. 
  // If they are already logged in, the /login page (or layout logic) should perhaps redirect them to /tabs.
  // OR: We need to use useAuth here to make a smart decision.
  // But since we are enforcing strict auth, sending to /login is safe. 
  // If we want auto-login, we need the auth check to finish.
  
  return <Redirect href="/login" />;
}

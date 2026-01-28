import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { CustomThemeProvider, useTheme } from '@/context/ThemeContext';


function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inTabsGroup) {
      // Redirect to the login page if trying to access tabs without auth
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      // Redirect to tabs if already authenticated and trying to access login
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, loading]);
  
  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="submission" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}

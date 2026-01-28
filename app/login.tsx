import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

// Modular Components
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import SocialButton from '@/components/auth/SocialButton';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, setAuthUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google Auth
  const redirectUri = 'https://auth.expo.io/@ecovigyan/client';
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync({ useProxy: true });
      if (result.type === 'success' && result.params.id_token) {
        setLoading(true);
        const { user } = await authService.loginWithGoogleIdToken(result.params.id_token);
        setAuthUser(user);
        router.replace('/(tabs)');
      } else if (result.type === 'error') {
        Alert.alert('Error', 'Google sign in failed');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F8F5] dark:bg-slate-900">
      <StatusBar style="dark" />
      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Logo */}
        <View className="items-center mb-8">
          <View className="shadow-sm bg-white p-4 rounded-2xl mb-4">
            <Image 
              source={require('../assets/logo.png')} 
              className="w-20 h-20"
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-bold text-slate-800 dark:text-white text-center mb-2">
            Eco Vigyan Foundation
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center px-4 leading-5">
            Empowering eco-education and unveiling the hidden world of fungi
          </Text>
          <Text className="text-slate-400 text-xs mt-1">Shimla, India</Text>
        </View>

        {/* Form Fields */}
        <View>
          <AuthInput 
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail" 
          />

          <AuthInput 
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock" 
          />

          <TouchableOpacity className="self-end mb-6" onPress={() => Alert.alert('Reset Password', 'Feature coming soon!')}>
            <Text className="text-[#11d421] font-semibold text-sm">Forgot Password?</Text>
          </TouchableOpacity>

          <AuthButton 
            title="Login" 
            onPress={handleLogin} 
            loading={loading}
            variant="primary"
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700" />
          <Text className="mx-4 text-slate-400 text-xs font-medium">OR</Text>
          <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700" />
        </View>

        {/* Social Login */}
        <SocialButton 
          title="Continue with Google" 
          icon={{ uri: "https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOh8J_26X05E85_l=s137" }}
          onPress={handleGoogleSignIn}
        />

        {/* Signup Link */}
        <View className="flex-row justify-center mt-8">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text className="text-[#11d421] font-bold text-sm">Sign Up</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

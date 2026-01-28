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

export default function SignupScreen() {
  const { setAuthUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  
  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSignup = async () => {
    // Basic Validation
    if (!name || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
    }

    setLoading(true);
    try {
      const { user } = await authService.register({ name, email, username, password });
      setAuthUser(user);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Signup Failed', msg);
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
        <View className="items-center mb-6">
          <View className="shadow-sm bg-white p-3 rounded-2xl mb-3">
            <Image 
              source={require('../assets/logo.png')} 
              className="w-16 h-16"
              resizeMode="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-slate-800 dark:text-white text-center">
            Create Account
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center text-sm mt-1">
            Join the community of nature explorers
          </Text>
        </View>

        {/* Form Fields */}
        <View>
          <AuthInput 
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            icon="person" 
          />
          <AuthInput 
            label="Username"
            placeholder="johndoe123"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon="alternate-email" 
          />

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

          <AuthInput 
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            icon="lock-outline" 
          />

          <View className="mt-4">
            <AuthButton 
              title="Sign Up" 
              onPress={handleSignup} 
              loading={loading}
              variant="primary"
            />
          </View>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700" />
          <Text className="mx-4 text-slate-400 text-xs font-medium">OR</Text>
          <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700" />
        </View>

        {/* Social Login */}
        <SocialButton 
          title="Sign up with Google" 
          icon={{ uri: "https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOh8J_26X05E85_l=s137" }}
          onPress={handleGoogleSignIn}
        />

        {/* Footer Link */}
        <View className="flex-row justify-center mt-8">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-[#11d421] font-bold text-sm">Login</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

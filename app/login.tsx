import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

// Modular Components
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import SocialButton from '@/components/auth/SocialButton';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme, shadows } from '@/constants/app-theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, setAuthUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { user } = await authService.googleSignIn();
      setAuthUser(user);
      router.replace('/(tabs)');
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
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#EEF7ED', '#FBE8EF']} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
            <Image 
              source={require('../assets/logo.png')} 
                style={styles.logo}
              resizeMode="contain"
            />
          </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to keep exploring mushroom mania and trail discoveries.
            </Text>
          </View>

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

          <TouchableOpacity style={styles.forgot} onPress={() => Alert.alert('Reset Password', 'Feature coming soon!')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <AuthButton 
            title="Login" 
            onPress={handleLogin} 
            loading={loading}
            variant="primary"
          />
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <SocialButton 
          title="Continue with Google" 
          icon={{ uri: "https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOh8J_26X05E85_l=s137" }}
          onPress={handleGoogleSignIn}
        />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    ...shadows.soft,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 24,
    marginBottom: 16,
  },
  logo: {
    width: 74,
    height: 74,
  },
  title: {
    color: AppTheme.colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: AppTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    color: AppTheme.colors.primary,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: AppTheme.colors.border,
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#94A69A',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: AppTheme.colors.textMuted,
  },
  footerLink: {
    color: AppTheme.colors.primary,
    fontWeight: '800',
  },
});

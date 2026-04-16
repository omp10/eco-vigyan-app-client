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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join the community of mushroom spotters and trail explorers.</Text>
          </View>

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

          <View style={{ marginTop: 8 }}>
            <AuthButton 
              title="Sign Up" 
              onPress={handleSignup} 
              loading={loading}
              variant="primary"
            />
          </View>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <SocialButton 
          title="Sign up with Google" 
          icon={{ uri: "https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOh8J_26X05E85_l=s137" }}
          onPress={handleGoogleSignIn}
        />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Login</Text>
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
    padding: 12,
    borderRadius: 22,
    marginBottom: 14,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    color: AppTheme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: AppTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
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

import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

interface AuthToggleProps {
  mode: 'login' | 'signup';
  onChange: (mode: 'login' | 'signup') => void;
}

export default function AuthToggle({ mode, onChange }: AuthToggleProps) {
  return (
    <View className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-row mb-6">
      <TouchableOpacity
        className={`flex-1 py-2.5 items-center rounded-lg ${
          mode === 'login' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''
        }`}
        onPress={() => onChange('login')}
      >
        <Text
          className={`font-semibold text-sm ${
            mode === 'login' ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Login
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`flex-1 py-2.5 items-center rounded-lg ${
          mode === 'signup' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''
        }`}
        onPress={() => onChange('signup')}
      >
        <Text
          className={`font-semibold text-sm ${
            mode === 'signup' ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

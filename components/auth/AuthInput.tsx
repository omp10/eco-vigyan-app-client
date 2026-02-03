import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
}

export default function AuthInput({ label, icon, isPassword, ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5 ml-1">{label}</Text>}
      <View 
        className={`flex-row items-center bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 h-12 ${
          isFocused ? 'border-primary' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={isFocused ? '#11d421' : '#94a3b8'} 
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          className="flex-1 text-slate-800 dark:text-white text-base h-full"
          placeholderTextColor="#9ca3af"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
            className="p-1"
          >
            <MaterialIcons 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={22} 
              color={showPassword ? '#11d421' : '#94a3b8'} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

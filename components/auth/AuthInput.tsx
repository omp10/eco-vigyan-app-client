import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/constants/app-theme';

interface AuthInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
}

export default function AuthInput({ label, icon, isPassword, ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const colors = AppTheme.colors;

  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-semibold mb-2 ml-1" style={{ color: colors.textMuted }}>{label}</Text>}
      <View 
        className="flex-row items-center rounded-2xl px-4 h-14"
        style={{
          backgroundColor: isFocused ? '#FFFFFF' : colors.surfaceMuted,
          borderWidth: 1,
          borderColor: isFocused ? colors.primary : colors.border,
        }}
      >
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={isFocused ? colors.primary : '#8AA095'} 
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          key={isPassword ? (showPassword ? 'visible' : 'hidden') : 'standard'}
          className="flex-1 text-base h-full"
          style={{ color: colors.text }}
          placeholderTextColor="#93A59A"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={!isPassword}
          autoCapitalize={isPassword ? "none" : undefined}
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
              color={showPassword ? colors.primary : '#8AA095'} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

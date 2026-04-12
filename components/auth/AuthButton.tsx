import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { AppTheme } from '@/constants/app-theme';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function AuthButton({ title, onPress, loading, variant = 'primary' }: AuthButtonProps) {
  const colors = AppTheme.colors;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="w-full py-4 rounded-2xl items-center justify-center active:opacity-90"
      style={{
        backgroundColor: variant === 'primary' ? colors.primary : colors.surfaceMuted,
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.textMuted} />
      ) : (
        <Text
          className="font-bold text-base"
          style={{ color: variant === 'primary' ? '#FFFFFF' : colors.text }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

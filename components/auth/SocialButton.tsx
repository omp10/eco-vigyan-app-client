import React from 'react';
import { TouchableOpacity, Text, Image } from 'react-native';
import { AppTheme } from '@/constants/app-theme';

interface SocialButtonProps {
  icon: any; // Image source
  title: string;
  onPress: () => void;
  loading?: boolean;
}

export default function SocialButton({ icon, title, onPress, loading }: SocialButtonProps) {
  const colors = AppTheme.colors;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-3 active:opacity-90"
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
    >
      <Image source={icon} className="w-5 h-5" resizeMode="contain" />
      <Text className="font-medium text-sm" style={{ color: colors.text }}>{title}</Text>
    </TouchableOpacity>
  );
}

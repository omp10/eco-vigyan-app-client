import React from 'react';
import { TouchableOpacity, Text, Image, View } from 'react-native';

interface SocialButtonProps {
  icon: any; // Image source
  title: string;
  onPress: () => void;
  loading?: boolean;
}

export default function SocialButton({ icon, title, onPress, loading }: SocialButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl flex-row items-center justify-center gap-3 active:bg-slate-50"
    >
      <Image source={icon} className="w-5 h-5" resizeMode="contain" />
      <Text className="text-slate-700 dark:text-white font-medium text-sm">{title}</Text>
    </TouchableOpacity>
  );
}

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function AuthButton({ title, onPress, loading, variant = 'primary' }: AuthButtonProps) {
  const bgClass = variant === 'primary' ? 'bg-[#11d421]' : 'bg-slate-100 dark:bg-slate-800';
  const textClass = variant === 'primary' ? 'text-white' : 'text-slate-700 dark:text-slate-200';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className={`w-full py-3.5 rounded-xl items-center justify-center shadow-sm ${bgClass} active:opacity-90`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#64748b'} />
      ) : (
        <Text className={`${textClass} font-bold text-base`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

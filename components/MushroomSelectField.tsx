import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface MushroomSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export default function MushroomSelectField({
  label,
  value,
  onChange,
  options,
}: MushroomSelectFieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(value === option ? '' : option)}
            className={`px-3 py-1.5 rounded-full border ${
              value === option
                ? 'bg-primary border-primary'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                value === option
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

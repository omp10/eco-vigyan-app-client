import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TrailScreen() {
  const router = useRouter();

  const trails = [
    {
      id: 1,
      name: "Glen Forest Trail",
      difficulty: "Easy",
      length: "2.5 km",
      mushrooms: 12,
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop"
    },
    {
      id: 2,
      name: "Summer Hill Loop",
      difficulty: "Moderate",
      length: "4.8 km",
      mushrooms: 8,
      image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2682&auto=format&fit=crop"
    },
    {
      id: 3,
      name: "Potter's Hill Path",
      difficulty: "Hard",
      length: "6.2 km",
      mushrooms: 24,
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2664&auto=format&fit=crop"
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-800">My Trails</Text>
        <TouchableOpacity 
          className="bg-[#11d421] px-4 py-2 rounded-full flex-row items-center gap-1"
          onPress={() => router.push('/create-trail')}
        >
          <MaterialIcons name="add" size={18} color="white" />
          <Text className="text-white font-bold text-sm">New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-24">
          {trails.map((trail) => (
             <TouchableOpacity 
                key={trail.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                onPress={() => router.push('/active-trail')}
             >
                <Image 
                    source={{ uri: trail.image }} 
                    className="w-full h-40"
                    resizeMode="cover"
                />
                <View className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full">
                    <Text className="text-slate-800 text-xs font-bold">{trail.difficulty}</Text>
                </View>

                <View className="p-4">
                    <Text className="text-lg font-bold text-slate-800 mb-1">{trail.name}</Text>
                    <View className="flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1">
                            <MaterialIcons name="straighten" size={16} color="#64748b" />
                            <Text className="text-slate-500 text-sm">{trail.length}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <MaterialIcons name="science" size={16} color="#64748b" />
                            <Text className="text-slate-500 text-sm">{trail.mushrooms} species</Text>
                        </View>
                    </View>
                </View>
             </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mushroomService, Mushroom } from '../../services/api';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function UserScreen() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userContributions, setUserContributions] = useState<Mushroom[]>([]);


  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        loadUserContributions();
      }
    }, [user?._id])
  );

  const loadUserContributions = async () => {
    try {
      if (user?._id) {
        const data = await mushroomService.getMushroomsByUser(user._id);
        setUserContributions(data);
      }
    } catch (err) {
      console.error('Failed to load user contributions', err);
    }
  };



  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark justify-center items-center">
        <ActivityIndicator size="large" color="#387a63" />
        <Text className="text-slate-600 dark:text-slate-400 mt-4">Loading...</Text>
      </View>
    );
  }

  // Authenticated User Profile View
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar style="auto" />
      
      {/* Top App Bar */}
      <View className="sticky top-0 z-50">
        <BlurView intensity={80} tint="light" className="px-6 py-4 flex-row items-center justify-between border-b border-[#e5e5e0] dark:border-[#2d3a35]">
          <SafeAreaView edges={['top']} className="w-full flex-row items-center justify-between pt-2">
            <Text className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">Forager Journal</Text>
            <TouchableOpacity 
              onPress={handleSignOut}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#2d3a35] shadow-sm border border-[#e5e5e0] dark:border-[#3a4a44]"
            >
              <MaterialIcons name="settings" size={20} className="text-slate-700 dark:text-slate-200" color="#334155" />
            </TouchableOpacity>
          </SafeAreaView>
        </BlurView>
      </View>

      <ScrollView className="flex-1 max-w-md mx-auto w-full" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Header */}
        <View className="p-6 flex-col items-center">
          <View className="relative mb-4">
            <View className="w-32 h-32 rounded-full border-4 border-white dark:border-[#2d3a35] shadow-lg overflow-hidden bg-gray-200">
              <Image 
                source={{ uri: user?.dp?.url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCC6h5_8SLPYZGSzEj0pty-_HZNXheqmZB6NfKBw1NHLCmdkMM80eImZ00Ar5ztJihUvbQsuCSdgSz10VpZ_4KV1iXLokjbw7rG8krHbZ_pCawuVK6w3FwFWTi0cn6iXDKo-of-JG2_pPQlzOgOvDMDu3nmaILvh34jCbgaeIAvsCMGeaVfiyNdbjYe0-O_cPqk1dQ8i3G9tgQB7ODS7sw4RIxEv9yylAYMOp9Ra8HhJKoVWxdlS3kKLKQmd0laLVHvAzOo6OKVhWBO" }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            {user?.role === 'admin' && (
              <View className="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-[#2d3a35]">
                <MaterialIcons name="verified" size={14} color="white" />
              </View>
            )}
          </View>
          <View className="items-center">
            <Text className="font-display text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</Text>
            <View className="flex-row items-center justify-center gap-2 mt-1">
              <View className="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full">
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Master Forager' : 'Novice Forager'}
                </Text>
              </View>
              <Text className="text-sm text-gray-500 dark:text-gray-400">• Joined {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
            </View>
          </View>
          <TouchableOpacity className="mt-6 w-full py-3 bg-primary rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95">
            <MaterialIcons name="edit" size={18} color="white" />
            <Text className="text-white font-bold">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bento Grid */}
        <View className="px-6 py-2">
          <View className="flex-row flex-wrap gap-4">
            {/* Large Card */}
            <View className="w-full bg-white dark:bg-[#2d3a35] p-5 rounded-xl border border-[#e5e5e0] dark:border-[#3a4a44] flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Mushrooms Found</Text>
                <Text className="font-display text-4xl font-bold text-primary mt-1">{userContributions.length}</Text>
              </View>
              <View className="w-14 h-14 bg-primary/10 rounded-lg items-center justify-center">
                <MaterialIcons name="psychology" size={28} className="text-primary" color="#387a63" />
              </View>
            </View>
            {/* Medium Cards */}
            <View className="flex-1 bg-white dark:bg-[#2d3a35] p-5 rounded-xl border border-[#e5e5e0] dark:border-[#3a4a44]">
              <MaterialIcons name="hiking" size={24} className="text-accent-brown mb-3" color="#9E8C7A" />
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">Miles Walked</Text>
              <Text className="font-display text-2xl font-bold mt-1 text-slate-900 dark:text-white">42.5</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-[#2d3a35] p-5 rounded-xl border border-[#e5e5e0] dark:border-[#3a4a44]">
              <MaterialIcons name="map" size={24} className="text-accent-brown mb-3" color="#9E8C7A" />
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">Trails Completed</Text>
              <Text className="font-display text-2xl font-bold mt-1 text-slate-900 dark:text-white">12</Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View className="py-6">
          <Text className="font-display text-lg font-bold px-6 mb-4 text-slate-900 dark:text-white">Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            
            <View className="items-center gap-2 w-24">
              <View className="w-16 h-16 rounded-full bg-accent-brown/20 items-center justify-center border-2 border-accent-brown/30">
                <MaterialIcons name="visibility" size={30} className="text-accent-brown" color="#9E8C7A" />
              </View>
              <Text className="text-[10px] font-bold text-center uppercase tracking-tighter text-slate-800 dark:text-slate-200">Expert Spotter</Text>
            </View>

            <View className="items-center gap-2 w-24">
              <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center border-2 border-primary/30">
                <MaterialIcons name="nature-people" size={30} className="text-primary" color="#387a63" />
              </View>
              <Text className="text-[10px] font-bold text-center uppercase tracking-tighter text-slate-800 dark:text-slate-200">Forest Guardian</Text>
            </View>

            <View className="items-center gap-2 w-24">
              <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center border-2 border-orange-200">
                <MaterialIcons name="wb-sunny" size={30} color="#fb923c" />
              </View>
              <Text className="text-[10px] font-bold text-center uppercase tracking-tighter text-slate-800 dark:text-slate-200">Early Bird</Text>
            </View>

            <View className="items-center gap-2 w-24 opacity-40">
              <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center border-2 border-gray-300 border-dashed">
                <MaterialIcons name="explore" size={30} color="#9ca3af" />
              </View>
              <Text className="text-[10px] font-bold text-center uppercase tracking-tighter text-gray-400">Pathfinder</Text>
            </View>

          </ScrollView>
        </View>

        {/* Gallery Section */}
        <View className="px-6 py-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-display text-lg font-bold text-slate-900 dark:text-white">Recent Sightings</Text>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-bold">View All</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {userContributions.length === 0 ? (
               <View className="w-full py-8 items-center justify-center bg-gray-50 dark:bg-[#2d3a35] rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                 <Text className="text-gray-500 dark:text-gray-400 mb-2">No contributions yet</Text>
                 <Text className="text-xs text-gray-400 text-center px-8">Your mushroom sightings will appear here.</Text>
               </View>
            ) : (
              <>
                {userContributions.map((mushroom) => (
                  <TouchableOpacity 
                    key={mushroom._id}
                    className="w-[31%] aspect-square rounded-lg bg-gray-200 overflow-hidden relative"
                    // onPress={() => router.push(`/mushroom/${mushroom._id}`)} // Assuming router is available or easy to add
                  >
                    <Image 
                      source={{ uri: mushroom.thumbnail || (mushroom.images && mushroom.images[0]?.url) || 'https://via.placeholder.com/100' }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {mushroom.status === 'pending' && (
                       <View className="absolute top-1 right-1 bg-yellow-400 w-3 h-3 rounded-full border border-white" />
                    )}
                  </TouchableOpacity>
                ))}
                <View className="w-[31%] aspect-square rounded-lg bg-primary/5 border border-dashed border-primary/30 items-center justify-center">
                   <MaterialIcons name="add-a-photo" size={24} className="text-primary/40" color="#387a63" style={{ opacity: 0.4 }} />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Settings Quick List */}
        <View className="px-6 py-8">
          <View className="bg-white dark:bg-[#2d3a35] rounded-xl overflow-hidden border border-[#e5e5e0] dark:border-[#3a4a44]">
            <TouchableOpacity className="w-full flex-row items-center justify-between p-4 border-b border-[#f5f5f4] dark:border-[#3a4a44] active:bg-gray-50 dark:active:bg-[#3a4a44]">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="person" size={20} className="text-gray-400" color="#9ca3af" />
                <Text className="font-medium text-slate-900 dark:text-white">Account Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} className="text-gray-400" color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={toggleTheme}
              className="w-full flex-row items-center justify-between p-4 border-b border-[#f5f5f4] dark:border-[#3a4a44] active:bg-gray-50 dark:active:bg-[#3a4a44]"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name={theme === 'dark' ? 'light-mode' : 'dark-mode'} size={20} className="text-gray-400" color="#9ca3af" />
                <Text className="font-medium text-slate-900 dark:text-white">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
              </View>
              <View className={`w-10 h-6 rounded-full items-center flex-row px-1 ${theme === 'dark' ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}>
                  <View className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSignOut}
              className="w-full flex-row items-center justify-between p-4 active:bg-gray-50 dark:active:bg-[#3a4a44]"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="logout" size={20} color="#ef4444" />
                <Text className="font-medium text-red-500">Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

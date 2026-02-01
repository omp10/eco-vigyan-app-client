import { mushroomService, Mushroom, getFungusImageUrl } from '../../services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ASSETS = {
  USER_PROFILE: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgJSergt3fp5hGV5k8zPVfDuhsS4D-ieGOh00QRM7U_elz82mOcUPCNV5OkB3V4z7A9gxMSIC0mrPtECHHYnUUGVb6FTAnT-n8Cm5zKGrVA9zZMREm4cyGUu4CM_P2b_x4Wj_fX7shwLx1QXGFxuE5bflzLzUGI7seyILFqst2EV7mbp3EetSGqzkN9ZXljwnpQ1QbrTEJLCqI_1cXCuzYGk0geWxxdfUUwjwdtLqww0IjRv6bhM3zqxdLuchqnSNQ9r7linZXYwWb",
  FEATURE_FUNGI: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkC9VRCxEhMvAdZHr4MSLLHBylvrMcsUmPNSECTjqacQlWcEwEhxZEIWKFl6SgwTWCgrx52Tu-x6O4udMXTqD-OhM_ZS0BdPkXD7cFssfzhU8D-Ur6So1APTTnQxLaIT_UlwfJEY0nqOWJMl1KM7HZ8Z3bWJha1Zc61X7hgizk0SeJZqtY6s7CgHXxk6wTvte_sEVmoXNUcCT8DiJI48glt9D-uxw9TLCMdAehXfG4RXUrOLgEMUoVZxYQjN4tcJYAf2dUPeHQ3MHm",
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
// const BASE_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

// Simple time ago helper
function timeAgo(dateParam: string | Date): string {
  if (!dateParam) return '';
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();

  if (seconds < 5) return 'just now';
  else if (seconds < 60) return `${seconds} seconds ago`;
  else if (seconds < 90) return 'about a minute ago';
  else if (minutes < 60) return `${minutes} minutes ago`;
  else if (isToday) return 'Today'; 
  
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} days ago`;
  
  const months = Math.round(days / 30);
  if (months < 12) return `${months} months ago`;
  
  const years = Math.round(days / 365);
  return `${years} years ago`;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [recentSightings, setRecentSightings] = useState<Mushroom[]>([]);
  const [loadingSightings, setLoadingSightings] = useState(true);

  useEffect(() => {
    loadRecentSightings();
  }, []);

  const loadRecentSightings = async () => {
    try {
      setLoadingSightings(true);
      const allMushrooms = await mushroomService.getAllMushrooms();
      
      const sorted = allMushrooms
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);
      
      console.log('Recent Sightings Data:', JSON.stringify(sorted.map(s => ({ id: s._id, name: s.commonName, imgCount: s.images?.length, firstImg: s.images?.[0]?.url, thumb: s.thumbnail })), null, 2));
      setRecentSightings(sorted);
      
    } catch (error) {
      console.error("Failed to load sightings:", error);
    } finally {
      setLoadingSightings(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar style="auto" />
      
      {/* Header */}
      <View className="px-6 pt-4 pb-6 flex-row items-center justify-between bg-background-light/80 dark:bg-background-dark/80 z-40">
        <View className="flex-col">
          <Text className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-1">
            Eco Vigyan Foundation
          </Text>
          <Text className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {user?.name?.split(' ')[0] || user?.username || 'Explorer'}!
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-light">
            <MaterialIcons name="search" size={22} color="#4C7C32" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden">
            <Image 
              key={user?.dp?.url}
              source={{ uri: user?.dp?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'User')}&background=random&color=fff` }} 
              className="w-full h-full"
              contentFit="cover"
              transition={200}
              onError={(e) => console.log('Image Load Error:', e.error)}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} 
      >
        {/* Quote Section */}
        <View className="px-6 mb-6">
          <Text className="text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">
            "Empowering the next generation to nurture biodiversity and understand the microscopic foundations of our ecosystems."
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="px-6 mb-8">
          <View className="flex-row gap-3">
            <View className="flex-1 items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
              <Text className="text-xl font-bold text-primary">200+</Text>
              <Text className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Schools</Text>
            </View>
            <View className="flex-1 items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
              <Text className="text-xl font-bold text-primary">10k+</Text>
              <Text className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Students</Text>
            </View>
            <View className="flex-1 items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
              <Text className="text-xl font-bold text-primary">300+</Text>
              <Text className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Teachers</Text>
            </View>
          </View>
        </View>

        {/* Featured Insight */}
        <View className="px-6 mb-8">
          <View className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-xl bg-slate-900">
            <Image 
              source={{ uri: ASSETS.FEATURE_FUNGI }} 
              className="w-full h-full absolute"
              contentFit="cover"
            />
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' }}
            />
            
            <View className="absolute bottom-0 p-8 w-full">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="h-[1px] w-8 bg-accent" />
                <Text className="text-accent text-xs font-bold uppercase tracking-widest">
                  Featured Insight
                </Text>
              </View>
              <Text className="text-3xl font-bold text-white mb-3 leading-tight">
                Hidden Significance of Fungi
              </Text>
              <Text className="text-white/80 text-sm mb-6 leading-relaxed">
                Discover how the mycelial network acts as nature's internet, recycling nutrients and connecting the forest floor in ways we are only beginning to understand.
              </Text>
              <TouchableOpacity className="bg-primary active:bg-primary/90 px-6 py-3 rounded-full flex-row items-center self-start gap-2 shadow-lg">
                <Text className="text-white font-bold text-sm">Explore Research</Text>
                <MaterialIcons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Sightings Section (Replaces Nature Guide) */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Sightings
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-primary text-sm font-bold">View Map</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {loadingSightings ? (
               <View className="py-8 items-center">
                 <Text className="text-slate-400">Loading recent observations...</Text>
               </View>
            ) : recentSightings.length === 0 ? (
               <Text className="text-slate-400 italic">No recent sightings yet.</Text>
            ) : (
                recentSightings.map((mushroom) => {
                  // Get the image URL with fallback chain
                  const imageUrl = mushroom.images?.[0]?.url || mushroom.thumbnail || '';
                  const resolvedUrl = getFungusImageUrl(imageUrl) || 'https://via.placeholder.com/150';
                  
                  // Debug logging for each mushroom
                  console.log(`[Sighting ${mushroom._id}] Raw image data:`, {
                    hasImages: !!mushroom.images?.length,
                    firstImageUrl: mushroom.images?.[0]?.url,
                    thumbnail: mushroom.thumbnail,
                    resolvedUrl,
                  });

                  return (
                    <TouchableOpacity 
                      key={mushroom._id} 
                      onPress={() => router.push(`/mushroom/${mushroom._id}` as any)}
                      className="flex-row items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm active:opacity-70"
                    >
                      <View className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <RNImage 
                          source={{ uri: resolvedUrl }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                          onError={(e) => {
                            console.error(`[Sighting ${mushroom._id}] Image Load Error:`, {
                              error: e.nativeEvent.error,
                              attemptedUrl: resolvedUrl,
                            });
                          }}
                        />
                      </View>
                    <View className="flex-1 justify-center">
                      <Text className="font-bold text-sm text-slate-900 dark:text-white" numberOfLines={1}>
                        {mushroom.commonName || "Unknown Species"}
                      </Text>
                      <Text className="text-xs text-slate-500 italic mb-1" numberOfLines={1}>
                        {mushroom.scientificName}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <View className="flex-row items-center gap-1">
                          <MaterialIcons name="person-outline" size={12} color="#94a3b8" />
                          <Text className="text-[10px] text-slate-400">
                            {mushroom.submittedBy?.username || "Unknown"}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-slate-300">•</Text>
                         <View className="flex-row items-center gap-1">
                          <MaterialIcons name="access-time" size={12} color="#94a3b8" />
                          <Text className="text-[10px] text-slate-400">
                            {/* Use custom timeAgo instead of date-fns */}
                            {mushroom.createdAt ? timeAgo(mushroom.createdAt) : "Recently"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-full border border-slate-100">
                      <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                    );
                })
            )}
          </View>
        </View>

        {/* Join Mission Section */}
        <View className="px-6 mb-8">
          <View className="bg-primary rounded-[1.5rem] p-8 relative overflow-hidden shadow-xl shadow-primary/20">
            <View className="relative z-10">
              <Text className="text-2xl font-bold text-white mb-2">Join Our Mission</Text>
              <Text className="text-white/80 text-sm mb-6 leading-relaxed">
                Help us expand our network of eco-clubs and reach more students across the globe.
              </Text>
              <View className="flex-col gap-3">
                <TouchableOpacity className="bg-accent px-6 py-3 rounded-full items-center">
                  <Text className="text-primary-dark font-bold text-sm">Register Your School</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/20 px-6 py-3 rounded-full items-center border border-white/30 backdrop-blur-sm">
                  <Text className="text-white font-bold text-sm">Become a Partner</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Background Decoration */}
            <View className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

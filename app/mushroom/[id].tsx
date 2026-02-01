import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Animated, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mushroomService } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 380;

interface MushroomDetails {
  _id: string;
  commonName?: string;
  scientificName?: string;
  images?: Array<{ url: string }>;
  ecologicalRole?: string[];
  texture?: string;
  underside?: string;
  fruitingSurface?: string;
  stemPresence?: string;
  commonUses?: string[];
  description?: string;
  location?: { latitude: number; longitude: number };
  submittedBy?: {
    name: string;
    username: string;
    dp?: { url: string };
  };
}

export default function MushroomDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mushroom, setMushroom] = useState<MushroomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) {
      loadMushroom();
    }
  }, [id]);

  const loadMushroom = async () => {
    try {
      setLoading(true);
      const data = await mushroomService.getMushroomById(id!);
      setMushroom(data);
    } catch (err) {
      console.error('Error loading mushroom:', err);
      setError('Failed to load mushroom details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark justify-center items-center">
        <ActivityIndicator size="large" color="#387a63" />
        <Text className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Identifying species...</Text>
      </View>
    );
  }

  if (error || !mushroom) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark justify-center items-center p-6">
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-slate-900 dark:text-white text-lg font-bold text-center">
          {error || 'Observation not found'}
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 bg-primary rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = mushroom.images?.[0]?.url;
  const userName = mushroom.submittedBy?.name || mushroom.submittedBy?.username || 'Explorer';
  const userDp = mushroom.submittedBy?.dp?.url;

  // Header animations
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar style="light" />
      
      {/* Animated Header Overlay */}
      <Animated.View 
        style={{ opacity: headerOpacity }}
        className="absolute top-0 left-0 right-0 z-50 overflow-hidden"
      >
        <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="light" className="pt-12 pb-4 px-6 border-b border-slate-200 dark:border-slate-800">
           <View className="flex-row items-center justify-between">
             <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <MaterialIcons name="arrow-back" size={20} className="text-slate-900 dark:text-white" color="#334155" />
             </TouchableOpacity>
             <Text className="flex-1 mx-4 text-center font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                {mushroom.commonName}
             </Text>
             <View className="w-8" />
           </View>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        {/* Parallax Image Header */}
        <View className="relative overflow-hidden" style={{ height: HEADER_HEIGHT }}>
          <Animated.View
            style={{
              transform: [
                { scale: imageScale },
                { translateY: Animated.multiply(scrollY, 0.5) }
              ],
            }}
            className="w-full h-full"
          >
            {imageUrl ? (
              <Image 
                source={{ uri: imageUrl }} 
                className="w-full h-full" 
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-slate-200 dark:bg-slate-800 items-center justify-center">
                <MaterialCommunityIcons name="mushroom-off" size={64} className="text-slate-400 dark:text-slate-600" color="#94a3b8" />
              </View>
            )}
          </Animated.View>
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            className="absolute bottom-0 left-0 right-0 h-48"
          />

          {/* Back Button Overlay */}
          <SafeAreaView className="absolute top-0 left-4">
             <TouchableOpacity 
               onPress={() => router.back()} 
               className="w-10 h-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md"
             >
                <MaterialIcons name="arrow-back" size={24} color="white" />
             </TouchableOpacity>
          </SafeAreaView>

          <View className="absolute bottom-6 left-6 right-6">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="bg-primary/90 px-3 py-1 rounded-full border border-primary-light">
                 <Text className="text-white text-[10px] font-bold uppercase tracking-widest">New Sighting</Text>
              </View>
              {mushroom.scientificName && (
                <View className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                  <Text className="text-white/90 text-[10px] font-medium italic">{mushroom.scientificName}</Text>
                </View>
              )}
            </View>
            <Text className="text-3xl font-bold text-white mb-2 leading-tight">
              {mushroom.commonName || 'Unknown Mushroom'}
            </Text>
            
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full border border-white/40 overflow-hidden bg-slate-300">
                {userDp ? (
                  <Image source={{ uri: userDp }} className="w-full h-full" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-primary">
                    <Text className="text-white text-xs font-bold">{userName.charAt(0)}</Text>
                  </View>
                )}
              </View>
              <Text className="text-white/80 text-sm">Observed by <Text className="text-white font-bold">{userName}</Text></Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="-mt-6 bg-background-light dark:bg-background-dark rounded-t-3xl p-6 min-h-[500px]">
          
          {/* Bento Style Grid for Quick Stats */}
          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 py-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <MaterialIcons name="landscape" size={20} className="text-primary mb-3" color="#387a63" />
               <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ecosystem</Text>
               <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                 {mushroom.ecologicalRole?.[0] || 'Unknown'}
               </Text>
            </View>
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 py-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <MaterialIcons name="wb-sunny" size={20} className="text-amber-500 mb-3" color="#f59e0b" />
               <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Exposure</Text>
               <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                 Sub-Tropical
               </Text>
            </View>
          </View>

          {/* Ecological Role Chips */}
          {mushroom.ecologicalRole && mushroom.ecologicalRole.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Ecological Role</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {mushroom.ecologicalRole.map((role, index) => (
                  <View key={index} className="bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-full border border-primary/20">
                    <Text className="text-primary dark:text-primary-light text-xs font-bold">{role}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Physical Characteristics Card */}
          <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 mb-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <View className="flex-row items-center gap-3 mb-6">
              <View className="w-10 h-10 items-center justify-center rounded-xl bg-primary/10">
                <MaterialCommunityIcons name="microscope" size={24} className="text-primary" color="#387a63" />
              </View>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Taxonomy & Features</Text>
            </View>

            <View className="flex-row flex-wrap gap-y-6">
              {[
                { label: 'Surface Texture', value: mushroom.texture, icon: 'texture' },
                { label: 'Underside', value: mushroom.underside, icon: 'layers' },
                { label: 'Fruiting Surface', value: mushroom.fruitingSurface, icon: 'grain' },
                { label: 'Stem Presence', value: mushroom.stemPresence, icon: 'align-vertical-bottom' },
              ].map((item, idx) => item.value && (
                <View key={idx} className="w-1/2 flex-col gap-1">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name={item.icon as any} size={14} className="text-slate-400" color="#94a3b8" />
                    <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-800 dark:text-white ml-6 capitalize">{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Common Uses Chips */}
          {mushroom.commonUses && mushroom.commonUses.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Human Interaction</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {mushroom.commonUses.map((use, index) => (
                  <View key={index} className="bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
                    <Text className="text-blue-600 dark:text-blue-300 text-xs font-bold">{use}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description Card */}
          {mushroom.description && (
            <View className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 mb-8 border border-slate-100 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Narrative</Text>
              <Text className="text-slate-600 dark:text-slate-400 leading-7 text-sm">
                {mushroom.description}
              </Text>
            </View>
          )}

          {/* Location Bar */}
          {mushroom.location && (
            <View className="flex-row items-center justify-between bg-primary/5 dark:bg-primary/10 p-5 rounded-[1.5rem] border border-primary/10">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 items-center justify-center rounded-full bg-primary/20">
                  <MaterialIcons name="location-on" size={20} className="text-primary" color="#387a63" />
                </View>
                <View>
                  <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Discovery Location</Text>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {mushroom.location.latitude.toFixed(6)}°N, {mushroom.location.longitude.toFixed(6)}°E
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <Text className="text-xs font-bold text-primary">View Map</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </Animated.ScrollView>
    </View>
  );
}

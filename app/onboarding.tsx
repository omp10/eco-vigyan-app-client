import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1769000065838-6a76272588f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMG5hdHVyZSUyMGVkdWNhdGlvbiUyMG91dGRvb3J8ZW58MXx8fHwxNzY5Mjc0NTgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Empowering Eco-Education',
    description: 'Join 10,000+ students across 200+ schools in India discovering the wonders of nature through hands-on learning.',
    // from-green-600/80 via-green-700/60 to-transparent
    gradientColors: ['rgba(22, 163, 74, 0.8)', 'rgba(21, 128, 61, 0.6)', 'transparent']
  },
  {
    image: 'https://images.unsplash.com/photo-1667353122098-f5d0c291bbf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdW5naSUyMG11c2hyb29tJTIwZm9yZXN0JTIwY2xvc2V8ZW58MXx8fHwxNzY5Mjc0NTgxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Unveiling the Magic of Fungi',
    description: 'Explore the hidden world of mushrooms and discover their vital role in nature\'s grand tapestry.',
    // from-amber-600/80 via-orange-700/60 to-transparent
    gradientColors: ['rgba(217, 119, 6, 0.8)', 'rgba(194, 65, 12, 0.6)', 'transparent']
  },
  {
    image: 'https://images.unsplash.com/photo-1758685734062-165cc0094e61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBjaGlsZHJlbiUyMGxlYXJuaW5nJTIwc2NpZW5jZXxlbnwxfHx8fDE3NjkyNzQ1ODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Every Child, A Budding Scientist',
    description: 'Nurturing curiosity and fostering a culture of sustainability through experiential learning and eco-club activities.',
    // from-blue-600/80 via-blue-700/60 to-transparent
    gradientColors: ['rgba(37, 99, 235, 0.8)', 'rgba(29, 78, 216, 0.6)', 'transparent']
  },
  {
    image: 'https://images.unsplash.com/photo-1765635550191-a2a2ba9c07ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYSUyMG5hdHVyZSUyMGNvbnNlcnZhdGlvbiUyMGdyZWVufGVufDF8fHx8MTc2OTI3NDU4MXww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Building a Greener Future',
    description: 'Together with 300+ teachers and 100+ community members, we\'re creating a more eco-conscious India.',
    // from-teal-600/80 via-emerald-700/60 to-transparent
    gradientColors: ['rgba(13, 148, 136, 0.8)', 'rgba(4, 120, 87, 0.6)', 'transparent']
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      router.replace('/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/login');
    }
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Full-screen Background Image */}
      <View className="absolute inset-0 w-full h-full">
        <Image
          source={{ uri: SLIDES[currentSlide].image }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Color Gradient Overlay (Uber style) */}
        <LinearGradient
          colors={SLIDES[currentSlide].gradientColors}
          start={{ x: 0.5, y: 1 }} // Bottom
          end={{ x: 0.5, y: 0 }}   // Top
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
        />
        
        {/* Darkening Gradient (Bottom up) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.4)', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
        />
      </View>

      <SafeAreaView className="flex-1 justify-between">
        {/* Top Header: Logo & Skip */}
        <View className="flex-row justify-between items-center px-6 pt-4">
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg">
            <Image 
               source={require('../assets/logo.png')} 
               className="w-10 h-10"
               resizeMode="contain"
            />
          </View>

          {currentSlide < SLIDES.length - 1 && (
            <TouchableOpacity
              onPress={handleSkip}
              className="bg-white/10 px-4 py-2 rounded-full"
            >
              <Text className="text-white/90 font-semibold text-sm">Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Content */}
        <View className="px-6 pb-8">
            {/* Pagination Dots */}
            <View className="flex-row gap-2 mb-8">
              {SLIDES.map((_, index) => (
                <View
                  key={index}
                  className={`h-1 rounded-full ${
                    index === currentSlide
                      ? 'w-8 bg-white'
                      : 'w-1 bg-white/40'
                  }`}
                />
              ))}
            </View>

            {/* Title */}
            <Text className="text-4xl font-bold text-white mb-4 leading-tight shadow-md">
                {SLIDES[currentSlide].title}
            </Text>

            {/* Description */}
            <Text className="text-white/90 text-lg leading-relaxed mb-8 shadow-sm">
                {SLIDES[currentSlide].description}
            </Text>

            {/* Action Button */}
            <TouchableOpacity
                onPress={handleNext}
                className="w-full bg-white rounded-full py-4 px-8 flex-row items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
                <Text className="text-gray-900 font-bold text-lg">
                    {currentSlide < SLIDES.length - 1 ? 'Continue' : 'Get Started'}
                </Text>
                <ChevronRight size={24} color="#111827" strokeWidth={3} />
            </TouchableOpacity>

            {/* Footer Info */}
            {currentSlide === SLIDES.length - 1 && (
                <Text className="text-white/60 text-xs text-center mt-6">
                    Eco Vigyan Foundation • Shimla, India • Since 2022
                </Text>
            )}
        </View>
      </SafeAreaView>
    </View>
  );
}

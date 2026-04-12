import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StatusBar, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme } from '@/constants/app-theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    title: 'Discover the Wild',
    description: 'Explore curated trails and discover the hidden beauty of nature in your backyard.',
  },
  {
    image: 'https://images.unsplash.com/photo-1503516459261-40c66117780a?auto=format&fit=crop&w=1200&q=80',
    title: 'Mushroom Mania',
    description: 'Identify and track unique fungi species. Create your own digital field guide.',
  },
  {
    image: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=1200&q=80',
    title: 'Community Conservation',
    description: 'Join thousands of nature enthusiasts and contribute to local biodiversity mapping.',
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: SLIDES[currentSlide].image }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
           <Text style={styles.brandText}>EcoVigyan</Text>
           <TouchableOpacity onPress={handleSkip}>
             <Text style={styles.skipText}>Skip</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentSlide ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>

          <Text style={styles.title}>{SLIDES[currentSlide].title}</Text>
          <Text style={styles.description}>{SLIDES[currentSlide].description}</Text>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>
              {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  brandText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 24,
    backgroundColor: AppTheme.colors.primary,
  },
  inactiveDot: {
    width: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 40,
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: AppTheme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

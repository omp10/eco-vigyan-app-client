import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Asset URLs
const ASSETS = {
  USER_PROFILE: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgJSergt3fp5hGV5k8zPVfDuhsS4D-ieGOh00QRM7U_elz82mOcUPCNV5OkB3V4z7A9gxMSIC0mrPtECHHYnUUGVb6FTAnT-n8Cm5zKGrVA9zZMREm4cyGUu4CM_P2b_x4Wj_fX7shwLx1QXGFxuE5bflzLzUGI7seyILFqst2EV7mbp3EetSGqzkN9ZXljwnpQ1QbrTEJLCqI_1cXCuzYGk0geWxxdfUUwjwdtLqww0IjRv6bhM3zqxdLuchqnSNQ9r7linZXYwWb",
  FEATURE_FUNGI: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkC9VRCxEhMvAdZHr4MSLLHBylvrMcsUmPNSECTjqacQlWcEwEhxZEIWKFl6SgwTWCgrx52Tu-x6O4udMXTqD-OhM_ZS0BdPkXD7cFssfzhU8D-Ur6So1APTTnQxLaIT_UlwfJEY0nqOWJMl1KM7HZ8Z3bWJha1Zc61X7hgizk0SeJZqtY6s7CgHXxk6wTvte_sEVmoXNUcCT8DiJI48glt9D-uxw9TLCMdAehXfG4RXUrOLgEMUoVZxYQjN4tcJYAf2dUPeHQ3MHm",
  GUIDE_FOREST: "https://lh3.googleusercontent.com/aida-public/AB6AXuBj6IL3Z2Iub5L9H07G0SC8jvH8rp8T23DmPX-JuqwEN5vXIkJyLlsThC8VIWJTuprNjjXWQY967zbrasyMCYUZEQqg4iKxgqwyCOjVk8dSipM8QhDfBqI1mqaEl5dHJuQl4xGw07jemjLHrha_GsLSCEldnqKoH9yyyXtZEHRfXpwO0ss8mI2E6nRiMWsjYsJ5jZrHCq-83KkihYshz0ytF001CnNje9XV-0rrzJH9PznDnskmanzc4RQGjGF4TDza0np48aFKr0Uo",
  GUIDE_FIELD: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfw4xyrwCLK7WJFyLlexwPRbuER9Tj5wBHKiyMiZmnQBHsmoECKvNGgNJ8kL2lT3yUDfkqdmD2cEgfJRcxk9sw1llmW-ZkrA9qRhJLomdhv8GQRU41gjelOoihck468CMhuT6VyT0t_UrQNZ8I2Xrtcp_led7EAa-PuTENR2ml058FQaAec9WzV-L7WkoY10eEPJTGbGH1jpsRVvbznABd7nOODIBKeykh2ZV73Q1dPipe3idDqkozQfKf0NLGlFzYE4tBTyEF7_1D"
};

export default function HomeScreen() {
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
            Eco-Club Portal
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-light">
            <MaterialIcons name="search" size={22} color="#4C7C32" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden">
            <Image 
              source={{ uri: ASSETS.USER_PROFILE }} 
              className="w-full h-full"
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // Space for bottom nav
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

        {/* Nature Guide Section */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Nature Guide for Educators
            </Text>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-bold">View Curriculum</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {/* Guide Card 1 */}
            <View className="flex-row items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <View className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image 
                  source={{ uri: ASSETS.GUIDE_FOREST }} 
                  className="w-full h-full"
                  contentFit="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-slate-900 dark:text-white">Forest Ecology 101</Text>
                <Text className="text-[11px] text-slate-500 mb-2">Lesson plans for middle school clubs</Text>
                <View className="flex-row gap-2">
                  <View className="px-2 py-0.5 bg-primary-light rounded-full">
                    <Text className="text-primary text-[9px] font-bold uppercase">PDF</Text>
                  </View>
                  <View className="px-2 py-0.5 bg-primary-light rounded-full">
                    <Text className="text-primary text-[9px] font-bold uppercase">Video</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full">
                <MaterialIcons name="download" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Guide Card 2 */}
            <View className="flex-row items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <View className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image 
                  source={{ uri: ASSETS.GUIDE_FIELD }} 
                  className="w-full h-full"
                  contentFit="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-slate-900 dark:text-white">Field Identification Guide</Text>
                <Text className="text-[11px] text-slate-500 mb-2">Safe foraging & identification practices</Text>
                <View className="flex-row gap-2">
                  <View className="px-2 py-0.5 bg-primary-light rounded-full">
                    <Text className="text-primary text-[9px] font-bold uppercase">Interactive</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full">
                <MaterialIcons name="chevron-right" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
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

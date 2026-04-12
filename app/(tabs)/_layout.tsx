import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { getAppTheme, shadows } from '@/constants/app-theme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const colors = getAppTheme(theme).colors;
  const primaryColor = colors.primary;

  return (
    <View style={styles.tabBarContainer}>
      <BlurView 
        intensity={Platform.OS === 'ios' ? 70 : 100} 
        tint={theme === 'dark' ? 'dark' : 'light'} 
        style={[styles.blurView, { backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.88)' }]}
      >
        <View style={styles.tabBarInner}>
          <TabBarIcon 
            name="home" 
            label="Home" 
            isActive={state.index === 0} 
            onPress={() => navigation.navigate('index')} 
            colors={colors}
          />
          <TabBarIcon 
            name="map" 
            label="Explore" 
            isActive={state.index === 1} 
            onPress={() => navigation.navigate('explore')} 
            colors={colors}
          />
          
          <View style={styles.centerOuter}>
             <TouchableOpacity 
                style={[styles.centerBtn, { backgroundColor: primaryColor }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('submission')}
             >
                <Ionicons name="add" size={32} color="#fff" />
             </TouchableOpacity>
          </View>

          <TabBarIcon 
            name="alt-route" 
            label="Trails" 
            isActive={state.index === 2} 
            onPress={() => navigation.navigate('trail')} 
            colors={colors}
          />
          <TabBarIcon 
            name="person" 
            label="User" 
            isActive={state.index === 3} 
            onPress={() => navigation.navigate('user')} 
            colors={colors}
          />
        </View>
      </BlurView>
    </View>
  );
}

const TabBarIcon = ({ name, label, isActive, onPress, colors }: any) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.tabButton}
    activeOpacity={0.7}
  >
    <View style={styles.iconContainer}>
      <MaterialIcons 
        name={name} 
        size={24} 
        color={isActive ? colors.primary : colors.textMuted} 
      />
      {isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
    </View>
    <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? '800' : '600' }]}>{label}</Text>
  </TouchableOpacity>
);

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="trail" options={{ title: 'Trail' }} />
      <Tabs.Screen name="user" options={{ title: 'User' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  blurView: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(110,110,110,0.1)',
    ...shadows.floating,
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 72,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  centerOuter: {
    width: 64,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    top: -4,
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
  }
});

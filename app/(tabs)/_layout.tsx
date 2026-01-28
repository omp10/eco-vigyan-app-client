import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMushroom } from '@/context/MushroomContext';


function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const primaryColor = "#4C7C32"; // Updated primary color


  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.blurView}>
        <View className="flex-row justify-between items-end max-w-md mx-auto w-full px-2 pb-2">
          
          {/* Home */}
          <TabBarIcon 
            name="home" 
            label="Home" 
            isActive={state.index === 0} 
            onPress={() => navigation.navigate('index')} 
            primaryColor={primaryColor}
          />

          {/* Map (Explore) */}
          <TabBarIcon 
            name="map" 
            label="Map" 
            isActive={state.index === 1} 
            onPress={() => navigation.navigate('explore')} 
            primaryColor={primaryColor}
          />

          {/* Floating Add Button */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: primaryColor, borderColor: colorScheme === 'dark' ? '#1A1C18' : '#FDFDFB' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('submission')}
            >
              <MaterialIcons name="add" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Trails */}
          <TabBarIcon 
            name="alt-route" 
            label="Trails" 
            isActive={state.index === 2} 
            onPress={() => navigation.navigate('trail')} 
            primaryColor={primaryColor}
          />

          {/* Profile */}
          <TabBarIcon 
            name="account-circle" 
            label="Profile" 
            isActive={state.index === 3} 
            onPress={() => navigation.navigate('user')} 
            primaryColor={primaryColor}
          />

        </View>
      </BlurView>

    </View>
  );
}

const TabBarIcon = ({ name, label, isActive, onPress, primaryColor }: any) => (
  <TouchableOpacity 
    onPress={onPress} 
    className="flex-1 items-center gap-1 py-2"
    activeOpacity={0.7}
  >
    <MaterialIcons 
      name={name} 
      size={24} 
      color={isActive ? primaryColor : "#94a3b8"} 
      style={isActive ? { } : {}}
    />
    <Text 
      style={{ 
        fontSize: 10, 
        fontWeight: isActive ? 'bold' : '500', 
        color: isActive ? primaryColor : "#94a3b8" 
      }}
    >
      {label}
    </Text>
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
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  blurView: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Adjust for Home Indicator
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  addButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    top: -25, // Move up to float
    zIndex: 10,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  }
});

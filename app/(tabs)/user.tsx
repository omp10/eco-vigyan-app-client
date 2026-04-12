import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mushroomService, Mushroom } from '../../services/api';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getAppTheme, shadows } from '@/constants/app-theme';
import { Image } from 'expo-image';

export default function UserScreen() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const colors = getAppTheme(theme).colors;
  
  const [userContributions, setUserContributions] = useState<Mushroom[]>([]);
  const [activeTab, setActiveTab] = useState<'sightings' | 'settings'>('sightings');

  const loadUserContributions = useCallback(async () => {
    try {
      if (user?._id) {
        const data = await mushroomService.getMushroomsByUser(user._id);
        setUserContributions(data);
      }
    } catch (err) {
      console.error('Failed to load user contributions', err);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      if (user?._id) loadUserContributions();
    }, [loadUserContributions, user?._id])
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try { await signOut(); } catch { Alert.alert('Error', 'Failed to sign out'); }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.coverSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200' }}
            style={styles.coverImage}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.coverOverlay} />
          <SafeAreaView edges={['top']} style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleSignOut}>
               <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
           <View style={styles.avatarWrap}>
              <Image
                source={{ uri: user?.dp?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2E7D32&color=fff` }}
                style={styles.avatar}
              />
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
           </View>
           
           <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Explorer'}</Text>
              <Text style={[styles.userBio, { color: colors.textMuted }]}>@{user?.username || 'forager'} • Nature Keeper</Text>
           </View>

           <View style={[styles.statsRow, { backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.statItem}>
                 <Text style={[styles.statVal, { color: colors.text }]}>{userContributions.length}</Text>
                 <Text style={[styles.statLab, { color: colors.textMuted }]}>Sightings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={[styles.statVal, { color: colors.text }]}>84</Text>
                 <Text style={[styles.statLab, { color: colors.textMuted }]}>Species</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={[styles.statVal, { color: colors.text }]}>12k</Text>
                 <Text style={[styles.statLab, { color: colors.textMuted }]}>Points</Text>
              </View>
           </View>

           {/* Tab Navigation */}
           <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'sightings' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                onPress={() => setActiveTab('sightings')}
              >
                 <Text style={[styles.tabText, activeTab === 'sightings' ? { color: colors.primary } : { color: colors.textMuted }]}>GALLERY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'settings' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                onPress={() => setActiveTab('settings')}
              >
                 <Text style={[styles.tabText, activeTab === 'settings' ? { color: colors.primary } : { color: colors.textMuted }]}>SETTINGS</Text>
              </TouchableOpacity>
           </View>

           {/* Dynamic Content */}
           {activeTab === 'sightings' ? (
              <View style={styles.grid}>
                 {userContributions.length === 0 ? (
                   <View style={styles.empty}>
                      <Ionicons name="camera-outline" size={48} color={colors.border} />
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sightings captured yet.</Text>
                   </View>
                 ) : (
                   userContributions.map((item) => (
                      <TouchableOpacity key={item._id} style={styles.gridItem}>
                         <Image source={{ uri: item.images?.[0]?.url || item.thumbnail }} style={styles.gridImg} contentFit="cover" />
                      </TouchableOpacity>
                   ))
                 )}
              </View>
           ) : (
              <View style={styles.settingsList}>
                 <View style={[styles.settingsItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingsInfo}>
                       <Ionicons name="moon-outline" size={20} color={colors.text} />
                       <Text style={[styles.settingsLabel, { color: colors.text }]}>AllTrails Dark Mode</Text>
                    </View>
                    <Switch 
                       value={theme === 'dark'} 
                       onValueChange={toggleTheme}
                       trackColor={{ false: '#eee', true: colors.primary }}
                    />
                 </View>
                 <View style={[styles.settingsItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingsInfo}>
                       <Ionicons name="notifications-outline" size={20} color={colors.text} />
                       <Text style={[styles.settingsLabel, { color: colors.text }]}>Alerts & Map Updates</Text>
                    </View>
                    <Switch value={true} trackColor={{ false: '#eee', true: colors.primary }} />
                 </View>
                 <TouchableOpacity style={styles.dangerBtn}>
                    <Text style={styles.dangerText}>Delete My Data</Text>
                 </TouchableOpacity>
              </View>
           )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 40 },
  coverSection: { height: 260, width: '100%' },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject },
  headerBtns: { position: 'absolute', top: 0, right: 0, padding: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingBottom: 32, flex: 1 },
  avatarWrap: { alignSelf: 'center', marginTop: -55, ...shadows.card },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
  editBtn: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  userInfo: { alignItems: 'center', marginTop: 18 },
  userName: { fontSize: 26, fontWeight: '900' },
  userBio: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderRadius: 24, marginVertical: 28, paddingVertical: 18, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLab: { fontSize: 12, marginTop: 2, fontWeight: '700' },
  statDivider: { width: 1.5, height: 30, backgroundColor: 'rgba(0,0,0,0.05)' },
  tabBar: { flexDirection: 'row', marginBottom: 24, borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  gridImg: { width: '100%', height: '100%' },
  empty: { flex: 1, alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  settingsList: { gap: 4 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1 },
  settingsInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsLabel: { fontSize: 15, fontWeight: '700' },
  dangerBtn: { marginTop: 32, alignItems: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(211,47,47,0.05)' },
  dangerText: { color: '#D32F2F', fontWeight: '800', fontSize: 14 }
});

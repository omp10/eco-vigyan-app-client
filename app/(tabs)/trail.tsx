import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { trailService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getAppTheme, shadows } from '@/constants/app-theme';

export default function TrailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = getAppTheme(theme).colors;
  
  const [trails, setTrails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useFocusEffect(
    useCallback(() => {
      loadTrails();
    }, [])
  );

  const loadTrails = async () => {
    try {
      setLoading(true);
      const data = await trailService.getAllTrails();
      setTrails(data);
    } catch (error) {
      console.error('Error loading trails:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrails = trails.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (diff: string) => {
    const d = diff?.toLowerCase();
    if (d === 'easy') return colors.difficultyEasy;
    if (d === 'moderate') return colors.difficultyModerate;
    if (d === 'hard') return colors.difficultyHard;
    return colors.primary;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <SafeAreaView edges={['top']} style={[styles.headerSafe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.header}>
           <Text style={[styles.headerTitle, { color: colors.text }]}>Discover Trails</Text>
           {user?.role === 'admin' && (
             <TouchableOpacity 
                style={[styles.addBtn, { backgroundColor: colors.primary }]} 
                onPress={() => router.push('/create-trail')}
             >
                <Ionicons name="add" size={24} color="#fff" />
             </TouchableOpacity>
           )}
        </View>
        <View style={styles.searchRow}>
           <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted }]}>
             <Ionicons name="search" size={18} color={colors.textMuted} />
             <TextInput 
               style={[styles.searchInput, { color: colors.text }]}
               placeholder="Find your next path..."
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholderTextColor={colors.textMuted}
             />
           </View>
           <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             <Ionicons name="options-outline" size={20} color={colors.text} />
           </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Mapping coordinates...</Text>
          </View>
        ) : filteredTrails.length === 0 ? (
          <View style={styles.emptyState}>
             <FontAwesome5 name="mountain" size={56} color={colors.border} />
             <Text style={[styles.emptyTitle, { color: colors.text }]}>Trailhead not found</Text>
             <Text style={[styles.emptyBody, { color: colors.textMuted }]}>Try a different search or location.</Text>
          </View>
        ) : (
          filteredTrails.map((trail) => (
            <TouchableOpacity 
              key={trail._id} 
              style={[styles.trailCard, { backgroundColor: colors.surface }]} 
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/active-trail',
                params: { trailId: trail._id, skipLocation: 'true' },
              })}
            >
              <View style={styles.imageBox}>
                <Image
                  source={{
                    uri: trail.image || trail.mushrooms?.[0]?.images?.[0]?.url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800',
                  }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
                <View style={[styles.diffTag, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                   <Text style={[styles.diffLabel, { color: getDifficultyColor(trail.difficulty) }]}>
                      {trail.difficulty ? trail.difficulty.toUpperCase() : 'MODERATE'}
                   </Text>
                </View>
                <TouchableOpacity style={styles.favBtn}>
                   <Ionicons name="heart-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardContent}>
                 <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{trail.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={colors.accent} />
                      <Text style={[styles.ratingText, { color: colors.text }]}>4.8</Text>
                    </View>
                 </View>
                 
                 <Text style={[styles.cardLocation, { color: colors.textMuted }]}>Shimla Forest Reserve • 2.4 km away</Text>
                 
                 <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                       <MaterialIcons name="straighten" size={14} color={colors.primary} />
                       <Text style={[styles.statItem, { color: colors.text }]}>{trail.length || '3.2'} km</Text>
                    </View>
                    <View style={styles.statChip}>
                       <MaterialIcons name="schedule" size={14} color={colors.primary} />
                       <Text style={[styles.statItem, { color: colors.text }]}>1h 45m</Text>
                    </View>
                    <View style={styles.statChip}>
                       <MaterialIcons name="grass" size={14} color={colors.primary} />
                       <Text style={[styles.statItem, { color: colors.text }]}>{trail.mushrooms?.length || 0} stops</Text>
                    </View>
                 </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerSafe: { borderBottomWidth: 1, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  addBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, height: 48, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  filterBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  trailCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, ...shadows.card },
  imageBox: { width: '100%', height: 180 },
  cardImage: { width: '100%', height: '100%' },
  diffTag: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  diffLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  favBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 19, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '800' },
  cardLocation: { fontSize: 13, fontWeight: '600', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46,125,50,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
  statItem: { fontSize: 13, fontWeight: '700' },
  centerState: { paddingVertical: 120, alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, fontWeight: '700' },
  emptyState: { paddingVertical: 100, alignItems: 'center', gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginTop: 10 },
  emptyBody: { fontSize: 14, fontWeight: '600', textAlign: 'center' }
});

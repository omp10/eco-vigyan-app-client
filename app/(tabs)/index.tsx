import { mushroomService, Mushroom, getFungusImageUrl } from '../../services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAppTheme, shadows } from '@/constants/app-theme';

const ASSETS = {
  hero: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  trail1: 'https://images.unsplash.com/photo-1501535033-a59812ad81f4?auto=format&fit=crop&w=800&q=80',
  trail2: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
};

function SightingCard({ mushroom, onPress, colors }: { mushroom: Mushroom; onPress: () => void; colors: any }) {
  const imageUrl = mushroom.images?.[0]?.url || mushroom.thumbnail || '';
  const resolvedUrl = getFungusImageUrl(imageUrl) || 'https://via.placeholder.com/150';

  return (
    <TouchableOpacity style={[styles.sightingCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: resolvedUrl }} style={styles.sightingImage} contentFit="cover" />
      <View style={styles.sightingInfo}>
         <Text style={[styles.sightingName, { color: colors.text }]} numberOfLines={1}>{mushroom.commonName || 'Unknown Species'}</Text>
         <Text style={[styles.sightingMeta, { color: colors.textMuted }]} numberOfLines={1}>Seen by {mushroom.submittedBy?.username || 'Explorer'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function TrailCard({ title, location, difficulty, rating, image, onPress, colors }: any) {
  const diffColor = colors[`difficulty${difficulty}`] || colors.primary;
  
  return (
    <TouchableOpacity style={[styles.trailCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: image }} style={styles.trailCardImage} contentFit="cover" />
      <View style={styles.trailCardContent}>
        <View style={styles.trailCardHeader}>
           <Text style={[styles.difficultyBadge, { color: diffColor }]}>{difficulty.toUpperCase()}</Text>
           <View style={styles.ratingRow}>
             <Ionicons name="star" size={12} color={colors.accent} />
             <Text style={[styles.ratingText, { color: colors.text }]}>{rating}</Text>
           </View>
        </View>
        <Text style={[styles.trailCardTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.trailCardSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{location}</Text>
        <Text style={[styles.trailCardLength, { color: colors.textMuted }]}>Length: 4.2 mi • 2h 15m</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = getAppTheme(theme).colors;
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
        .slice(0, 8);
      setRecentSightings(sorted);
    } catch (error) {
      console.error('Failed to load sightings:', error);
    } finally {
      setLoadingSightings(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <SafeAreaView edges={['top']} style={[styles.headerSafe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.header}>
           <View>
             <Text style={[styles.greeting, { color: colors.textMuted }]}>Good morning,</Text>
             <Text style={[styles.username, { color: colors.text }]}>{user?.name?.split(' ')[0] || user?.username || 'Explorer'}</Text>
           </View>
           <TouchableOpacity onPress={() => router.push('/(tabs)/user')}>
             <Image 
               source={{ uri: user?.dp?.url || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=2E7D32&color=fff` }}
               style={[styles.avatar, { borderColor: colors.primarySoft }]}
             />
           </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={[styles.searchBar, { backgroundColor: colors.surfaceMuted }]} activeOpacity={0.9}>
           <Ionicons name="search" size={20} color={colors.textMuted} />
           <Text style={[styles.searchText, { color: colors.textMuted }]}>Search trails, parks, or species...</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
           {[
             { label: 'Hiking', icon: 'hiking' },
             { label: 'Mushrooms', icon: 'fungus' },
             { label: 'Map View', icon: 'map' },
             { label: 'Wildlife', icon: 'paw' },
             { label: 'Education', icon: 'graduation-cap' }
           ].map((item, i) => (
             <TouchableOpacity key={i} style={styles.filterItem}>
               <View style={[styles.filterIconCircle, { backgroundColor: colors.primarySoft }]}>
                  <FontAwesome5 
                    name={item.icon === 'fungus' ? 'grass' as any : item.icon === 'hiking' ? 'hiking' as any : item.icon === 'map' ? 'map' as any : item.label === 'Wildlife' ? 'paw' as any : 'graduation-cap' as any} 
                    size={20} 
                    color={colors.primary} 
                  />
               </View>
               <Text style={[styles.filterLabel, { color: colors.text }]}>{item.label}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Trails</Text>
           <TouchableOpacity onPress={() => router.push('/(tabs)/trail')}>
             <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
           </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trailsList}>
          <TrailCard 
            title="Cedar Forest Loop"
            location="Upper Shimla District"
            difficulty="Easy"
            rating="4.8"
            image={ASSETS.trail1}
            colors={colors}
            onPress={() => router.push('/(tabs)/trail')}
          />
          <TrailCard 
            title="Valley Vista Path"
            location="Nature Preserve"
            difficulty="Moderate"
            rating="4.5"
            image={ASSETS.trail2}
            colors={colors}
            onPress={() => router.push('/(tabs)/trail')}
          />
        </ScrollView>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent sightings</Text>
           <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
             <Text style={[styles.seeAll, { color: colors.primary }]}>View map</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.sightingsGrid}>
           {loadingSightings ? (
             <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading nature's finds...</Text>
           ) : (
             recentSightings.map(m => (
               <SightingCard 
                 key={m._id} 
                 mushroom={m} 
                 colors={colors}
                 onPress={() => router.push(`/mushroom/${m._id}` as any)} 
               />
             ))
           )}
        </View>

        <LinearGradient 
          colors={[colors.primary, colors.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.impactBanner}
        >
          <View>
             <Text style={styles.bannerTitle}>Support Local Nature</Text>
             <Text style={styles.bannerBody}>Your sightings help scientists track biodiversity in real-time.</Text>
          </View>
          <TouchableOpacity style={styles.bannerButton} onPress={() => router.push('/submission')}>
             <Text style={[styles.bannerButtonText, { color: colors.primary }]}>Submit</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerSafe: { paddingBottom: 16, borderBottomWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: '600' },
  username: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 99, gap: 12 },
  searchText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingTop: 20 },
  filterContainer: { paddingLeft: 20, paddingRight: 10, marginBottom: 28 },
  filterItem: { alignItems: 'center', marginRight: 24, gap: 8 },
  filterIconCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  filterLabel: { fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  seeAll: { fontSize: 14, fontWeight: '800' },
  trailsList: { paddingLeft: 20, paddingRight: 10, marginBottom: 32 },
  trailCard: { width: 280, borderRadius: 24, marginRight: 18, overflow: 'hidden', ...shadows.card },
  trailCardImage: { width: '100%', height: 150 },
  trailCardContent: { padding: 18 },
  trailCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  difficultyBadge: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '800' },
  trailCardTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  trailCardSubtitle: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  trailCardLength: { fontSize: 12, fontWeight: '600' },
  sightingsGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 32 },
  sightingCard: { width: '47%', borderRadius: 20, overflow: 'hidden', ...shadows.soft },
  sightingImage: { width: '100%', height: 130 },
  sightingInfo: { padding: 14 },
  sightingName: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  sightingMeta: { fontSize: 11, fontWeight: '600' },
  impactBanner: { marginHorizontal: 20, borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  bannerBody: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', width: 200 },
  bannerButton: { backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  bannerButtonText: { fontWeight: '900', fontSize: 14 },
  loadingText: { textAlign: 'center', width: '100%', padding: 40, fontWeight: '700' }
});

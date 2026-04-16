import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Animated, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Platform,
  StyleSheet,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mushroomService } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { AppTheme, shadows } from '@/constants/app-theme';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 420;

export default function MushroomDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mushroom, setMushroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) loadMushroom();
  }, [id]);

  const loadMushroom = async () => {
    try {
      setLoading(true);
      const data = await mushroomService.getMushroomById(id!);
      setMushroom(data);
    } catch (err) {
      setError('Failed to load mushroom details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  if (error || !mushroom) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={AppTheme.colors.danger} />
        <Text style={styles.errorText}>Observation not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200, 300],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [1.5, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Floating Sticky Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} tint="light" style={styles.blurHeader}>
           <SafeAreaView edges={['top']} style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                 <Ionicons name="chevron-back" size={24} color={AppTheme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={1}>{mushroom.commonName || 'Mushroom Detail'}</Text>
              <View style={{ width: 44 }} />
           </SafeAreaView>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
           <Animated.View style={[styles.heroImgWrap, { transform: [{ scale: imageScale }] }]}>
              <Image 
                source={{ uri: mushroom.images?.[0]?.url || mushroom.thumbnail }} 
                style={styles.heroImg} 
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
                style={styles.heroOverlay}
              />
           </Animated.View>

           <SafeAreaView edges={['top']} style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBackBtn}>
                 <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
           </SafeAreaView>

           <View style={styles.heroFooter}>
              <View style={styles.tagRow}>
                 <View style={styles.tag}>
                    <Text style={styles.tagText}>NEW SIGHTING</Text>
                 </View>
                 {mushroom.scientificName && (
                   <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={[styles.tagText, { fontStyle: 'italic' }]}>{mushroom.scientificName}</Text>
                   </View>
                 )}
              </View>
              <Text style={styles.mainTitle}>{mushroom.commonName || 'Unknown Mushroom'}</Text>
              <View style={styles.userRow}>
                 <Image 
                    source={{ uri: mushroom.submittedBy?.dp?.url || `https://ui-avatars.com/api/?name=${mushroom.submittedBy?.name || 'User'}&background=2E7D32&color=fff` }} 
                    style={styles.userAvatar} 
                 />
                 <Text style={styles.userName}>Observed by <Text style={{fontWeight: '800'}}>{mushroom.submittedBy?.name || 'Explorer'}</Text></Text>
              </View>
           </View>
        </View>

        {/* Info Content */}
        <View style={styles.infoSection}>
           {/* Bento Stats */}
           <View style={styles.bentoRow}>
              <View style={styles.bentoBox}>
                 <MaterialIcons name="eco" size={20} color={AppTheme.colors.primary} />
                 <Text style={styles.bentoLabel}>ECO ROLE</Text>
                 <Text style={styles.bentoVal}>{mushroom.ecologicalRole?.[0] || 'Saprobic'}</Text>
              </View>
              <View style={[styles.bentoBox, { backgroundColor: AppTheme.colors.accentSoft }]}>
                 <MaterialCommunityIcons name="molecule" size={20} color={AppTheme.colors.accent} />
                 <Text style={styles.bentoLabel}>TYPE</Text>
                 <Text style={styles.bentoVal}>Wild Sample</Text>
              </View>
           </View>

           {/* Taxonomy Card */}
           <View style={styles.card}>
              <View style={styles.cardHead}>
                 <Ionicons name="flask-outline" size={20} color={AppTheme.colors.primary} />
                 <Text style={styles.cardTitle}>Taxonomy & Features</Text>
              </View>
              <View style={styles.taxonomyGrid}>
                 <View style={styles.taxItem}>
                    <Text style={styles.taxLabel}>Surface</Text>
                    <Text style={styles.taxVal}>{mushroom.texture || 'Smooth'}</Text>
                 </View>
                 <View style={styles.taxItem}>
                    <Text style={styles.taxLabel}>Underside</Text>
                    <Text style={styles.taxVal}>{mushroom.underside || 'Gilled'}</Text>
                 </View>
                 <View style={styles.taxItem}>
                    <Text style={styles.taxLabel}>Fruiting</Text>
                    <Text style={styles.taxVal}>{mushroom.fruitingSurface || 'Pores'}</Text>
                 </View>
                 <View style={styles.taxItem}>
                    <Text style={styles.taxLabel}>Stem</Text>
                    <Text style={styles.taxVal}>{mushroom.stemPresence || 'Central'}</Text>
                 </View>
              </View>
           </View>

           {/* Description Section */}
           {mushroom.description && (
             <View style={styles.descSection}>
                <Text style={styles.sectionHeading}>Narrative</Text>
                <Text style={styles.descText}>{mushroom.description}</Text>
             </View>
           )}

           {/* Location Bar */}
           <View style={styles.locBar}>
              <View style={styles.locInfo}>
                 <View style={styles.locIcon}>
                    <Ionicons name="location" size={20} color={AppTheme.colors.primary} />
                 </View>
                 <View>
                    <Text style={styles.locTitle}>Discovery Location</Text>
                    <Text style={styles.locSub}>{mushroom.location?.latitude.toFixed(6)}°N, {mushroom.location?.longitude.toFixed(6)}°E</Text>
                 </View>
              </View>
              <TouchableOpacity style={styles.mapBtn}>
                 <Text style={styles.mapBtnText}>View Map</Text>
              </TouchableOpacity>
           </View>
        </View>
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurHeader: {
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppTheme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  hero: {
    height: HEADER_HEIGHT,
    width: '100%',
  },
  heroImgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 20,
    paddingTop: 10,
  },
  heroBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFooter: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 38,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  userName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  infoSection: {
    marginTop: -30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  bentoBox: {
    flex: 1,
    backgroundColor: AppTheme.colors.primarySoft,
    padding: 20,
    borderRadius: 24,
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: AppTheme.colors.textMuted,
    marginTop: 12,
    letterSpacing: 1,
  },
  bentoVal: {
    fontSize: 16,
    fontWeight: '800',
    color: AppTheme.colors.text,
    marginTop: 2,
  },
  card: {
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppTheme.colors.text,
  },
  taxonomyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  taxItem: {
    width: '45%',
  },
  taxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taxVal: {
    fontSize: 15,
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginTop: 4,
  },
  descSection: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: AppTheme.colors.text,
    marginBottom: 12,
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
    color: AppTheme.colors.textMuted,
  },
  locBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppTheme.colors.surfaceMuted,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  locInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: AppTheme.colors.textMuted,
  },
  locSub: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.colors.text,
    marginTop: 2,
  },
  mapBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    ...shadows.soft,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppTheme.colors.primary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '800',
  }
});

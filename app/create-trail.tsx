import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trailService, mushroomService, Mushroom } from '../services/api';
import { mapService, LatLng } from '../services/mapService';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, shadows } from '@/constants/app-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const mapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export default function CreateTrailScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<MapView>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMushrooms, setLoadingMushrooms] = useState(true);
  const [allMushrooms, setAllMushrooms] = useState<Mushroom[]>([]);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState("Moderate");
  
  const [selectedMushrooms, setSelectedMushrooms] = useState<Mushroom[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);

  const [region, setRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 2,
    longitudeDelta: 2,
  });

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can create trails.', [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingMushrooms(true);
      const mushrooms = await mushroomService.getAllMushrooms();
      setAllMushrooms(mushrooms);
      if (mushrooms.length > 0) {
        setRegion({
          ...mushrooms[0].location,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load mushrooms');
    } finally {
      setLoadingMushrooms(false);
    }
  };

  useEffect(() => {
    const fetchPath = async () => {
      if (selectedMushrooms.length < 2) {
        setTotalDistance(0);
        setRouteCoordinates([]);
        return;
      }
      try {
        const origin = selectedMushrooms[0].location;
        const destination = selectedMushrooms[selectedMushrooms.length - 1].location;
        const waypoints = selectedMushrooms.slice(1, -1).map(m => m.location);
        const result = await mapService.fetchRoute(origin, destination, waypoints);
        if (result) {
          setRouteCoordinates(result.polyline);
          setTotalDistance(result.distanceMeters / 1000);
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
      }
    };
    fetchPath();
  }, [selectedMushrooms]);

  const toggleMushroomSelection = (mushroom: Mushroom) => {
    setSelectedMushrooms(prev => {
      const isSelected = prev.find(m => m._id === mushroom._id);
      if (isSelected) {
        return prev.filter(m => m._id !== mushroom._id);
      } else {
        return [...prev, mushroom];
      }
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter a trail name');
    if (selectedMushrooms.length < 2) return Alert.alert('Error', 'Select at least 2 stops');

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('@ecovigyan_auth_token');
      const lats = selectedMushrooms.map(m => m.location.latitude);
      const longs = selectedMushrooms.map(m => m.location.longitude);
      const payload = {
        name,
        difficulty,
        length: totalDistance.toFixed(1),
        location: {
          type: 'trail',
          currentLocation: selectedMushrooms[0].location,
          center: {
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            longitude: (Math.min(...longs) + Math.max(...longs)) / 2
          }
        },
        mushrooms: selectedMushrooms
      };
      await trailService.createTrail(payload, token!);
      Alert.alert('Success', 'Trail published!', [{ text: 'Awesome', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create trail');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        customMapStyle={mapStyle}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor={AppTheme.colors.primary}
            lineCap="round"
          />
        )}

        {allMushrooms.map((m) => {
          const index = selectedMushrooms.findIndex(s => s._id === m._id);
          const isSelected = index !== -1;
          return (
            <Marker
              key={m._id}
              coordinate={m.location}
              onPress={() => toggleMushroomSelection(m)}
              zIndex={isSelected ? 100 : 1}
            >
               <View style={[styles.marker, isSelected && styles.markerActive]}>
                  {isSelected ? (
                    <Text style={styles.markerText}>{index + 1}</Text>
                  ) : (
                    <View style={styles.markerDot} />
                  )}
               </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']}>
         <View style={styles.headerCard}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
               <Ionicons name="close" size={24} color={AppTheme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
               <TextInput 
                  value={name}
                  onChangeText={setName}
                  placeholder="Untitled Trail"
                  style={styles.nameInput}
                  placeholderTextColor={AppTheme.colors.textMuted}
               />
               <Text style={styles.headerLabel}>Tap markers to add stops</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isSubmitting}>
               {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
         </View>
      </SafeAreaView>

      <View style={styles.footer}>
         <View style={styles.statsRow}>
            <View style={styles.statBox}>
               <Text style={styles.statVal}>{selectedMushrooms.length}</Text>
               <Text style={styles.statLab}>Stops</Text>
            </View>
            <View style={styles.statBox}>
               <Text style={styles.statVal}>{totalDistance.toFixed(1)} km</Text>
               <Text style={styles.statLab}>Distance</Text>
            </View>
            <View style={styles.statBox}>
               <TouchableOpacity onPress={() => setDifficulty(d => d === 'Easy' ? 'Moderate' : d === 'Moderate' ? 'Hard' : 'Easy')}>
                  <Text style={[styles.statVal, { color: AppTheme.colors.primaryDeep }]}>{difficulty}</Text>
                  <Text style={styles.statLab}>Difficulty</Text>
               </TouchableOpacity>
            </View>
         </View>
      </View>

      {loadingMushrooms && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={AppTheme.colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 12,
    gap: 12,
    ...shadows.card,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AppTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '800',
    color: AppTheme.colors.text,
    padding: 0,
  },
  headerLabel: {
    fontSize: 11,
    color: AppTheme.colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    ...shadows.soft,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 24,
    ...shadows.soft,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: AppTheme.colors.text,
  },
  statLab: {
    fontSize: 12,
    color: AppTheme.colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: AppTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  markerActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppTheme.colors.primary,
    borderColor: '#fff',
    borderWidth: 3,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppTheme.colors.textMuted,
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

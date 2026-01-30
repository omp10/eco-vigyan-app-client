import React, { useState, useEffect, useRef } from 'react';
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
  Image
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions'; // Removed
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { trailService, mushroomService, Mushroom } from '../services/api';
import { mapService, LatLng } from '../services/mapService';  // Added mapService
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Helper to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

  export default function CreateTrailScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const params = useLocalSearchParams();
  const skipLocation = params.skipLocation === 'true';

  const mapRef = useRef<MapView>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMushrooms, setLoadingMushrooms] = useState(true);
  const [allMushrooms, setAllMushrooms] = useState<Mushroom[]>([]);
  const [name, setName] = useState("");
  
  // Trail state
  const [selectedMushrooms, setSelectedMushrooms] = useState<Mushroom[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);

  // Initial region (India center or user location)
  const [region, setRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });

  useEffect(() => {
    // Check admin
    if (isAuthenticated && user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can create trails.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    // Fetch mushrooms and location
    loadInitialData();
  }, [user, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoadingMushrooms(true);
      
      // Get user location only if NOT skipping
      if (!skipLocation) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        // Just set a default view or relying on initial state
      }

      // Load mushrooms inside here...

      // Load mushrooms
      console.log('Fetching all mushrooms for map...');
      const mushrooms = await mushroomService.getAllMushrooms();
      console.log('Fetched mushrooms count:', mushrooms.length);
      if (mushrooms.length > 0) {
        console.log('First mushroom location:', mushrooms[0].location);
      }
      setAllMushrooms(mushrooms);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load mushrooms');
    } finally {
      setLoadingMushrooms(false);
    }
  };

  // Update route and total distance when selection changes
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
          setTotalDistance(result.distanceMeters / 1000); // Convert meters to km
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
         // Fallback to straight lines if API fails? Or just show markers.
         // For now, let's just log it.
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
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a trail name');
      return;
    }

    if (selectedMushrooms.length < 2) {
      Alert.alert('Error', 'Please select at least 2 mushrooms to form a trail');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('@ecovigyan_auth_token');
      if (!token) throw new Error('No auth token found');

      const startNode = selectedMushrooms[0];

      // Calculate center based on all points
      const lats = selectedMushrooms.map(m => m.location.latitude);
      const longs = selectedMushrooms.map(m => m.location.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...longs);
      const maxLng = Math.max(...longs);

      const payload = {
        name,
        location: {
          type: 'trail',
          currentLocation: startNode.location, // Start point
          center: {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
          }
        },
        mushrooms: selectedMushrooms // Pass full objects, backend schema supports Mixed
      };

      await trailService.createTrail(payload, token);
      
      Alert.alert('Success', 'Trail created successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            router.back();
          } 
        }
      ]);
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert('Error', error.message || 'Failed to create trail');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={!skipLocation}
        showsMyLocationButton={!skipLocation}
      >
        {/* Draw Line between selected mushrooms */}
        {selectedMushrooms.length > 1 && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={6}
            strokeColor="#4285F4"
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Render markers */}
        {allMushrooms.map((m) => {
          const index = selectedMushrooms.findIndex(sel => sel._id === m._id);
          const isSelected = index !== -1;

          return (
            <Marker
              key={m._id}
              coordinate={m.location}
              onPress={() => toggleMushroomSelection(m)}
              opacity={isSelected ? 1 : 0.6} // Fade unselected if any are selected? Or just style differently.
              zIndex={isSelected ? 100 + index : 1}
            >
              <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
                {isSelected ? (
                  <Text style={styles.markerNumber}>{index + 1}</Text>
                ) : (
                  <View style={styles.markerDot} />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Trail</Text>
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Trail Name"
          style={styles.nameInput}
          placeholderTextColor="#666"
        />
      </View>

      {/* Footer Overlay */}
      <View style={styles.footerOverlay}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>Stops</Text>
            <Text style={styles.statsValue}>{selectedMushrooms.length}</Text>
          </View>
          <View>
            <Text style={styles.statsLabel}>Distance</Text>
            <Text style={styles.statsValue}>{totalDistance.toFixed(2)} km</Text>
          </View>
        </View>
        
        <Text style={styles.instructionText}>
          Tap mushrooms on the map to add them to your trail in order.
        </Text>

        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.submitBtnText}>Create Trail</Text>
          )}
        </TouchableOpacity>
      </View>

      {loadingMushrooms && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#387a63" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    gap: 12
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  nameInput: { 
    backgroundColor: '#f1f5f9', 
    padding: 12, 
    borderRadius: 10, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  footerOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 }
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statsLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  statsValue: { fontSize: 20, color: '#0f172a', fontWeight: '900' },
  instructionText: { textAlign: 'center', color: '#64748b', fontSize: 12, marginBottom: 16 },
  
  submitBtn: {
    backgroundColor: '#387a63',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },

  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#387a63',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: '#387a63',
    borderColor: '#fff',
    transform: [{ scale: 1.2 }]
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#387a63'
  },
  markerNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  }
});

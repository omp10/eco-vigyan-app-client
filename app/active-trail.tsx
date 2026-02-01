import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions'; // Removed
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { trailService, Mushroom } from '../services/api';
import { mapService, LatLng } from '../services/mapService'; // Added
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

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

  export default function ActiveTrailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const trailId = params.trailId as string; 
  const skipLocation = params.skipLocation === 'true';

  const mapRef = useRef<MapView>(null);
  
  const [trail, setTrail] = useState<any>(null); // Ideally separate Trail interface
  const [loading, setLoading] = useState(true);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  
  const [isNavigationStarted, setIsNavigationStarted] = useState(false);

  // Route states
  const [trailCoordinates, setTrailCoordinates] = useState<LatLng[]>([]);
  const [userPathCoordinates, setUserPathCoordinates] = useState<LatLng[]>([]);

  useEffect(() => {
    loadTrail();
    // REMOVED: Automatic startLocationTracking
    // if (!skipLocation) {
    //   startLocationTracking();
    // }
  }, [trailId]);

  // Effect to handle Preview Mode vs Navigation Mode Camera
  useEffect(() => {
     if (!mapRef.current || !trail || !trail.mushrooms || trail.mushrooms.length === 0) return;

     if (!isNavigationStarted) {
         // PREVIEW MODE: Zoom to fit WHOLE TRAIL
         const coordsToFit = trail.mushrooms.map((m: any) => m.location);
         
         // Add some padding manually if only 1 point? map handles array fine.
         mapRef.current.fitToCoordinates(coordsToFit, {
             edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
             animated: true
         });
     } else {
         // NAVIGATION MODE triggered: Initial zoom in
         if (userLocation) {
             mapRef.current.animateCamera({
                center: {
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                },
                pitch: 50, 
                zoom: 19,
                heading: userLocation.coords.heading || 0
            });
         }
     }
  }, [isNavigationStarted, trail, userLocation == null]); // Trigger when these change

  const loadTrail = async () => {
    /* ... existing loadTrail ... */
    try {
      setLoading(true);
      let loadedTrail = null;
      if (params.trailData) {
        loadedTrail = JSON.parse(params.trailData as string);
        setTrail(loadedTrail);
        setLoading(false);
      } else {
         const trails = await trailService.getAllTrails();
         const found = trails.find((t: any) => t._id === trailId);
         if (found) {
            setTrail(found);
            loadedTrail = found;
         } else {
           Alert.alert('Error', 'Trail not found');
           router.back();
         }
         setLoading(false);
      }

      if (loadedTrail && loadedTrail.mushrooms.length > 1) {
          const origin = loadedTrail.mushrooms[0].location;
          const destination = loadedTrail.mushrooms[loadedTrail.mushrooms.length - 1].location;
          const waypoints = loadedTrail.mushrooms.length > 2 
            ? loadedTrail.mushrooms.slice(1, -1).map((m: any) => m.location) 
            : [];
          
          mapService.fetchRoute(origin, destination, waypoints)
            .then(res => {
              if (res) setTrailCoordinates(res.polyline);
            })
            .catch(err => console.error("Error fetching trail route:", err));
      }

    } catch (error) {
      console.error('Error loading trail:', error);
      Alert.alert('Error', 'Failed to load trail');
      setLoading(false);
    }
  };

  const handleStartNavigation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for navigation');
        return;
      }

      setIsNavigationStarted(true);
      startLocationTracking();
  };

  const startLocationTracking = async () => {
    // Permission already checked in handleStartNavigation
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1 
      },
      (location) => {
        setUserLocation(location);

        if (mapRef.current) {
            mapRef.current.animateCamera({
                center: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                pitch: 50, 
                heading: location.coords.heading || 0,
                zoom: 19,
                altitude: 100 
            }, { duration: 1000 });
        }
      }
    );
  };

  // Calculate distance to next stop whenever user moves or index changes
  // Debounce this to avoid excessive API calls
  useEffect(() => {
    const updateUserRoute = async () => {
        if (userLocation && trail && trail.mushrooms && trail.mushrooms[currentStopIndex]) {
            const origin = {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude
            };
            const destination = trail.mushrooms[currentStopIndex].location;

            // Only update if moved more than 20 meters from last fetch
            const dist = getDistanceFromLatLonInKm(
              origin.latitude, 
              origin.longitude, 
              destination.latitude, 
              destination.longitude
            );

            try {
                const result = await mapService.fetchRoute(origin, destination);
                if (result) {
                    setUserPathCoordinates(result.polyline);
                    setDistanceToNext(result.distanceMeters / 1000);
                }
            } catch (err) {
                console.error("Error fetching user route:", err);
            }
        }
    };
    
    // Debounce by 3 seconds to reduce API calls during movement
    const timeoutId = setTimeout(() => {
      updateUserRoute();
    }, 3000);

    return () => clearTimeout(timeoutId);

  }, [userLocation, currentStopIndex, trail]);

  const handleNextStop = () => {
    if (trail && currentStopIndex < trail.mushrooms.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
    } else {
      Alert.alert('Congratulations!', 'You have completed the trail!', [
        { text: 'Awesome!', onPress: () => router.back() }
      ]);
    }
  };

  if (loading || !trail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#387a63" />
        <Text style={{marginTop: 10, color: '#387a63'}}>Loading trail...</Text>
      </View>
    );
  }

  const currentMushroom = trail.mushrooms[currentStopIndex];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: trail.mushrooms?.[0]?.location?.latitude || trail.location?.center?.latitude || 20.5937,
          longitude: trail.mushrooms?.[0]?.location?.longitude || trail.location?.center?.longitude || 78.9629,
          latitudeDelta: 0.005, // Zoomed in closer by default
          longitudeDelta: 0.005,
        }}
        showsUserLocation={!skipLocation}
        followsUserLocation={false} // We handle camera manually for navigation mode
      >
        {/* Trail Route */}
        {trailCoordinates.length > 0 && (
          <Polyline
            coordinates={trailCoordinates}
            strokeWidth={4}
            strokeColor="#387a63"
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* User to Next Stop Routing */}
        {userPathCoordinates.length > 0 && (
           <Polyline
             key="user-path"
             coordinates={userPathCoordinates}
             strokeWidth={6}
             strokeColor="#4285F4"
             lineCap="round"
             lineJoin="round"
             zIndex={100}
           />
        )}

        {trail.mushrooms.map((m: any, index: number) => {
          const isTarget = index === currentStopIndex;
          const isVisited = index < currentStopIndex;
          
          return (
            <Marker
              key={m._id || index}
              coordinate={m.location}
              opacity={isVisited ? 0.5 : 1}
              zIndex={isTarget ? 100 : 1}
            >
              <View style={[
                styles.markerContainer, 
                isTarget && styles.markerTarget,
                isVisited && styles.markerVisited
              ]}>
                <Text style={[
                  styles.markerNumber, 
                  isVisited && { color: '#fff' }
                ]}>{index + 1}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color="#333" />
          </TouchableOpacity>
          <View>
             <Text style={styles.trailName}>{trail.name}</Text>
             <Text style={styles.progressText}>
               Stop {currentStopIndex + 1} of {trail.mushrooms.length}
             </Text>
          </View>
        </View>
      </View>

      {/* Bottom Card / UI Overlay */}
      {isNavigationStarted ? (
        // NAVIGATION UI
        <View style={styles.bottomCard}>
          <View style={styles.mushroomInfo}>
            <Image 
              source={{ uri: currentMushroom.images?.[0]?.url || currentMushroom.thumbnail || 'https://via.placeholder.com/100' }} 
              style={styles.mushroomImage} 
            />
            <View style={styles.mushroomText}>
              <Text style={styles.targetLabel}>TARGET SPECIMEN</Text>
              <Text style={styles.mushroomName}>{currentMushroom.commonName || 'Unknown'}</Text>
              <Text style={styles.scientificName}>{currentMushroom.scientificName}</Text>
              {!skipLocation && distanceToNext !== null && (
                <View style={styles.distanceBadge}>
                  <MaterialIcons name="directions-walk" size={14} color="#387a63" />
                  <Text style={styles.distanceText}>
                    {distanceToNext < 1 
                      ? `${(distanceToNext * 1000).toFixed(0)} m away` 
                      : `${distanceToNext.toFixed(2)} km away`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.foundBtn} onPress={handleNextStop}>
            <Text style={styles.foundBtnText}>
              {currentStopIndex === trail.mushrooms.length - 1 ? 'Finish Trail' : 'Found It! Next Stop'}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        // PREVIEW UI
        <View style={styles.previewContainer}>
            <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>Ready to start?</Text>
                <Text style={styles.previewSubtitle}>
                    {mapService.calculateTotalDistance(trail.mushrooms.map((m:any) => m.location)).toFixed(1)} km trail • {trail.mushrooms.length} stops
                </Text>
                <Text style={styles.previewInstruction}>
                    {skipLocation ? "Explore the trail stops manually." : "Go to the start point shown on the map."}
                </Text>
            </View>
            <TouchableOpacity 
                style={styles.startNavBtn} 
                onPress={handleStartNavigation}
            >
                <MaterialIcons name={skipLocation ? "map" : "navigation"} size={24} color="#fff" />
                <Text style={styles.startNavBtnText}>{skipLocation ? "Start Tour" : "Start Navigation"}</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  trailName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  progressText: { fontSize: 12, color: '#64748b' },

  bottomCard: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  mushroomInfo: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  mushroomImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#f1f5f9' },
  mushroomText: { flex: 1, justifyContent: 'center' },
  targetLabel: { fontSize: 10, fontWeight: '900', color: '#f59e0b', letterSpacing: 1, marginBottom: 4 },
  mushroomName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  scientificName: { fontSize: 14, fontStyle: 'italic', color: '#64748b', marginBottom: 8 },
  distanceBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#dcfce7', 
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#15803d' },

  foundBtn: {
    backgroundColor: '#387a63',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: "#387a63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  foundBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerTarget: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#387a63',
    borderColor: '#fff',
    borderWidth: 3,
    transform: [{ scale: 1.1 }]
  },
  markerVisited: {
    backgroundColor: '#94a3b8',
    borderColor: '#cbd5e1'
  },
  markerNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b'
  },
  
  // Preview UI Styles
  previewContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
    gap: 20
  },
  previewInfo: { alignItems: 'center', gap: 6 },
  previewTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  previewSubtitle: { fontSize: 16, color: '#387a63', fontWeight: '600' },
  previewInstruction: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  
  startNavBtn: {
    backgroundColor: '#387a63',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: "#387a63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startNavBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

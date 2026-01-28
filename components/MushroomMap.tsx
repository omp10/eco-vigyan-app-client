import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Marker, Polygon, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Mushroom } from '@/services/api';

const { width, height } = Dimensions.get('window');

const INDIA_CENTER = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

interface GridCell {
  id: string;
  count: number;
  coordinates: { latitude: number; longitude: number }[];
  center: { latitude: number; longitude: number };
  mushrooms: Mushroom[];
}

interface MushroomMapProps {
  mushrooms: Mushroom[];
  loading?: boolean;
  onMarkerPress?: (mushroom: Mushroom) => void;
  onClusterPress?: (cluster: GridCell) => void;
}

// Get fill color based on mushroom count
function getHeatColor(count: number): string {
  if (count >= 50) return 'rgba(6, 78, 59, 0.85)';
  if (count >= 20) return 'rgba(5, 150, 105, 0.8)';
  if (count >= 10) return 'rgba(16, 185, 129, 0.7)';
  if (count >= 5) return 'rgba(52, 211, 153, 0.6)';
  if (count >= 1) return 'rgba(167, 243, 208, 0.5)';
  return 'rgba(0, 0, 0, 0)';
}

// Create grid heatmap based on zoom level
function createGridHeatmap(mushrooms: Mushroom[], region: Region): { cells: GridCell[]; showMarkers: boolean } {
  const { latitudeDelta, longitudeDelta } = region;
  const zoomFactor = Math.max(latitudeDelta, longitudeDelta);
  const minZoom = 0.5;
  const maxZoom = 20;
  
  if (zoomFactor < minZoom) {
    return { cells: [], showMarkers: true };
  }
  
  const maxGridSize = 1.5;
  const minGridSize = 0.05;
  const t = Math.min(1, Math.max(0, (zoomFactor - minZoom) / (maxZoom - minZoom)));
  const gridSize = minGridSize * Math.pow(maxGridSize / minGridSize, t);
  
  const gridMap: { [key: string]: GridCell } = {};
  
  mushrooms.forEach(mushroom => {
    const lat = mushroom.location.latitude;
    const lng = mushroom.location.longitude;
    const gridX = Math.floor(lng / gridSize);
    const gridY = Math.floor(lat / gridSize);
    const cellKey = `${gridX}_${gridY}`;
    
    if (!gridMap[cellKey]) {
      const minLng = gridX * gridSize;
      const maxLng = (gridX + 1) * gridSize;
      const minLat = gridY * gridSize;
      const maxLat = (gridY + 1) * gridSize;
      
      gridMap[cellKey] = {
        id: cellKey,
        count: 0,
        coordinates: [
          { latitude: minLat, longitude: minLng },
          { latitude: minLat, longitude: maxLng },
          { latitude: maxLat, longitude: maxLng },
          { latitude: maxLat, longitude: minLng },
        ],
        center: {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
        },
        mushrooms: [],
      };
    }
    
    gridMap[cellKey].count++;
    gridMap[cellKey].mushrooms.push(mushroom);
  });
  
  return {
    cells: Object.values(gridMap).filter(cell => cell.count > 0),
    showMarkers: false,
  };
}

export default function MushroomMap({ mushrooms, loading, onMarkerPress, onClusterPress }: MushroomMapProps) {
  const [region, setRegion] = useState<Region>(INDIA_CENTER);

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  const { cells, showMarkers } = useMemo(() => {
    return createGridHeatmap(mushrooms, region);
  }, [mushrooms, region]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#387a63" />
        <Text style={styles.loadingText}>Scouting the forest...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#387a63" style={{ marginLeft: 12 }} />
          <TextInput 
            placeholder="Search species or trails..." 
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity style={[styles.filterTag, styles.filterTagActive]}>
            <MaterialIcons name="eco" size={14} color="#fff" />
            <Text style={styles.filterTextActive}>Edible</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTag}>
            <MaterialIcons name="science" size={14} color="#C98B3B" />
            <Text style={styles.filterText}>Medicinal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTag}>
            <MaterialIcons name="route" size={14} color="#3b82f6" />
            <Text style={styles.filterText}>Trails</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={INDIA_CENTER}
        onRegionChangeComplete={handleRegionChange}
        customMapStyle={mapStyle}
      >
        {!showMarkers && cells.map((cell) => (
          <Polygon
            key={cell.id}
            coordinates={cell.coordinates}
            fillColor={getHeatColor(cell.count)}
            strokeColor="rgba(56, 122, 99, 0.3)"
            strokeWidth={1}
            tappable
            onPress={() => onClusterPress?.(cell)}
          />
        ))}

        {showMarkers && mushrooms.map((m) => (
          <Marker
            key={m._id}
            coordinate={m.location}
            pinColor="#387a63"
            title={m.commonName || 'Unknown Mushroom'}
            description={m.scientificName}
            onPress={() => {
                onMarkerPress?.(m);
            }}
          />
        ))}
      </MapView>

      <View style={styles.sideControls}>
        <TouchableOpacity style={styles.controlBtn}><MaterialIcons name="add" size={20} color="#387a63"/></TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}><MaterialIcons name="remove" size={20} color="#387a63"/></TouchableOpacity>
        <View style={{ height: 16 }} />
        <TouchableOpacity style={styles.controlBtn}><MaterialIcons name="navigation" size={20} color="#387a63"/></TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#387a63' }]}><MaterialIcons name="layers" size={20} color="#fff"/></TouchableOpacity>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  map: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { padding: 8, backgroundColor: 'rgba(56, 122, 99, 0.1)', borderRadius: 8 },
  locationTitle: { fontWeight: 'bold', fontSize: 14 },
  locationSubtitle: { fontSize: 10, color: '#999', letterSpacing: 1 },
  roundBtn: { padding: 8, borderRadius: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 48,
    borderRadius: 12,
    elevation: 5,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 16 },
  filterScroll: { flexDirection: 'row' },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    elevation: 2,
  },
  filterTagActive: { backgroundColor: '#387a63' },
  filterText: { fontWeight: '600', fontSize: 12, color: '#333' },
  filterTextActive: { color: '#fff' },
  sideControls: { position: 'absolute', right: 16, top: height * 0.35, gap: 8 },
  controlBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#387a63' }
});

// Pure white theme, minimal detail map style
const mapStyle = [
  // Hide all POIs
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  // Hide road labels
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  // White roads
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  // Pure white background
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  // Light blue water
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e3f2fd" }] },
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Hide transit
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  // Minimal admin labels
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];
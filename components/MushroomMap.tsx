import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TextInput, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Polygon, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Mushroom } from '@/services/api';
import { AppTheme, shadows } from '@/constants/app-theme';

const { height } = Dimensions.get('window');

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

function getHeatColor(count: number): string {
  if (count >= 50) return 'rgba(47, 107, 63, 0.82)';
  if (count >= 20) return 'rgba(79, 143, 91, 0.75)';
  if (count >= 10) return 'rgba(123, 184, 131, 0.7)';
  if (count >= 5) return 'rgba(245, 184, 200, 0.45)';
  if (count >= 1) return 'rgba(252, 231, 238, 0.45)';
  return 'rgba(0, 0, 0, 0)';
}

function createGridHeatmap(mushrooms: Mushroom[], region: Region): { cells: GridCell[]; showMarkers: boolean } {
  const { latitudeDelta, longitudeDelta } = region;
  const zoomFactor = Math.max(latitudeDelta, longitudeDelta);
  const minZoom = 0.5;
  const maxZoom = 20;

  if (zoomFactor < minZoom) return { cells: [], showMarkers: true };

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
        center: { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2 },
        mushrooms: [],
      };
    }

    gridMap[cellKey].count++;
    gridMap[cellKey].mushrooms.push(mushroom);
  });

  return { cells: Object.values(gridMap).filter(cell => cell.count > 0), showMarkers: false };
}

export default function MushroomMap({ mushrooms, loading, onMarkerPress, onClusterPress }: MushroomMapProps) {
  const [region, setRegion] = useState<Region>(INDIA_CENTER);

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  const { cells, showMarkers } = useMemo(() => createGridHeatmap(mushrooms, region), [mushrooms, region]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
        <Text style={styles.loadingText}>Scouting the forest...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={AppTheme.colors.primary} style={{ marginLeft: 12 }} />
          <TextInput placeholder="Search species or trails..." style={styles.searchInput} placeholderTextColor="#8AA095" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity style={[styles.filterTag, styles.filterTagPrimary]}>
            <MaterialIcons name="eco" size={14} color="#fff" />
            <Text style={styles.filterTextActive}>Edible</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTag}>
            <MaterialIcons name="science" size={14} color="#5B2D3A" />
            <Text style={styles.filterText}>Medicinal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTag}>
            <MaterialIcons name="alt-route" size={14} color={AppTheme.colors.primary} />
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
        {!showMarkers &&
          cells.map(cell => (
            <Polygon
              key={cell.id}
              coordinates={cell.coordinates}
              fillColor={getHeatColor(cell.count)}
              strokeColor="rgba(47,107,63,0.25)"
              strokeWidth={1}
              tappable
              onPress={() => onClusterPress?.(cell)}
            />
          ))}

        {showMarkers &&
          mushrooms.map(m => (
            <Marker
              key={m._id}
              coordinate={m.location}
              pinColor={AppTheme.colors.primary}
              title={m.commonName || 'Unknown Mushroom'}
              description={m.scientificName}
              onPress={() => onMarkerPress?.(m)}
            />
          ))}
      </MapView>

      <View style={styles.sideControls}>
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialIcons name="add" size={20} color={AppTheme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialIcons name="remove" size={20} color={AppTheme.colors.primary} />
        </TouchableOpacity>
        <View style={{ height: 8 }} />
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialIcons name="navigation" size={20} color={AppTheme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.controlBtnPrimary]}>
          <MaterialIcons name="layers" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.colors.background },
  map: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 112 : 92,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    height: 52,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217,230,216,0.95)',
    ...shadows.card,
  },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: AppTheme.colors.text },
  filterScroll: { flexDirection: 'row' },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(217,230,216,0.95)',
  },
  filterTagPrimary: {
    backgroundColor: AppTheme.colors.primary,
    borderColor: AppTheme.colors.primary,
  },
  filterText: { fontWeight: '700', fontSize: 12, color: AppTheme.colors.text },
  filterTextActive: { color: '#fff', fontWeight: '700', fontSize: 12 },
  sideControls: { position: 'absolute', right: 16, top: height * 0.42, gap: 8 },
  controlBtn: {
    width: 46,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  controlBtnPrimary: {
    backgroundColor: AppTheme.colors.primary,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: AppTheme.colors.primary, fontWeight: '700' },
});

const mapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5faf5' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef6ed' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dfeafc' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#90a49a' }] },
];

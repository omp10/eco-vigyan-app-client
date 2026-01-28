import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { mushroomService, Mushroom } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import MushroomMap from '@/components/MushroomMap';
import MushroomPopup from '@/components/MushroomPopup';
import FilterModal, { FilterState, initialFilterState } from '@/components/FilterModal';
import { useMemo } from 'react';

export default function ExploreScreen() {
  const [mushrooms, setMushrooms] = useState<Mushroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMushroom, setSelectedMushroom] = useState<Mushroom | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  useEffect(() => {
    loadMushrooms();
  }, []);

  const loadMushrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mushroomService.getAllMushrooms();
      setMushrooms(data);
    } catch (err) {
      console.error('Failed to load mushrooms:', err);
      setError('Failed to load mushroom data. Please check your connection.');
      Alert.alert(
        'Error',
        'Could not load mushroom observations. Please check if the server is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (mushroom: Mushroom) => {
    setSelectedMushroom(mushroom);
    setPopupVisible(true);
  };

  const handleClusterPress = (cluster: { count: number; mushrooms: Mushroom[] }) => {
    const names = cluster.mushrooms
      .slice(0, 5)
      .map(m => m.commonName || m.scientificName || 'Unknown')
      .join('\n• ');
    
    Alert.alert(
      `${cluster.count} Mushrooms`,
      `• ${names}${cluster.count > 5 ? `\n... and ${cluster.count - 5} more` : ''}\n\nZoom in to see individual markers.`
    );
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedMushroom(null);
  };

  const filteredMushrooms = useMemo(() => {
    return mushrooms.filter(m => {
      // Ecological Role (Array match Array - OR logic within)
      if (filters.ecologicalRole.length > 0) {
        const hasMatch = m.ecologicalRole?.some(role => filters.ecologicalRole.includes(role));
        if (!hasMatch) return false;
      }

      // Common Uses (Array match Array - OR logic within)
      if (filters.commonUses.length > 0) {
        const hasMatch = m.commonUses?.some(use => filters.commonUses.includes(use));
        if (!hasMatch) return false;
      }

      // Texture (Single value check - OR logic within selection)
      if (filters.texture.length > 0) {
        if (!m.texture || !filters.texture.includes(m.texture)) return false;
      }

      // Underside (Single value check)
      if (filters.underside.length > 0) {
        if (!m.underside || !filters.underside.includes(m.underside)) return false;
      }

       // Fruiting Surface (Single value check)
      if (filters.fruitingSurface.length > 0) {
        if (!m.fruitingSurface || !filters.fruitingSurface.includes(m.fruitingSurface)) return false;
      }

      // Stem Presence (Single value check)
      if (filters.stemPresence.length > 0) {
        if (!m.stemPresence || !filters.stemPresence.includes(m.stemPresence)) return false;
      }

      return true;
    });
  }, [mushrooms, filters]);

  const activeFilterCount = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <View className="flex-1">
      <StatusBar style="dark" />
      
      <View className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-slate-900 px-6 pt-12 pb-4 shadow-lg">
        <Text className="text-2xl font-bold text-slate-800 dark:text-white">
          Mushroom Mania
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-sm text-slate-600 dark:text-slate-400">
            {filteredMushrooms.length} mushroom{filteredMushrooms.length !== 1 ? 's' : ''} found
          </Text>
          <TouchableOpacity 
            onPress={() => setFilterModalVisible(true)}
            className={`flex-row items-center px-3 py-1.5 rounded-full ${activeFilterCount > 0 ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            <MaterialIcons name="filter-list" size={16} color={activeFilterCount > 0 ? 'white' : '#64748b'} />
            <Text className={`text-xs ml-1 font-medium ${activeFilterCount > 0 ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MushroomMap
          mushrooms={filteredMushrooms}
          loading={loading}
          onMarkerPress={handleMarkerPress}
          onClusterPress={handleClusterPress}
        />
      </View>

      {error && (
        <View className="absolute bottom-6 left-6 right-6 bg-red-500 p-4 rounded-2xl shadow-lg">
          <Text className="text-white font-semibold text-center">
            {error}
          </Text>
        </View>
      )}

      {/* Mushroom detail popup */}
      <MushroomPopup
        mushroom={selectedMushroom}
        visible={popupVisible}
        onClose={closePopup}
      />

      <FilterModal 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilters}
        initialFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    marginTop: 100,
  },
});

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mushroomService, Mushroom } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import MushroomMap from '@/components/MushroomMap';
import MushroomPopup from '@/components/MushroomPopup';
import FilterModal, { FilterState, initialFilterState } from '@/components/FilterModal';
import { AppTheme, shadows } from '@/constants/app-theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExploreScreen() {
  const router = useRouter();
  const [mushrooms, setMushrooms] = useState<Mushroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMushroom, setSelectedMushroom] = useState<Mushroom | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [searchQuery, setSearchQuery] = useState('');

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
      setError('Connection issues');
    } finally {
      setLoading(false);
    }
  };

  const filteredMushrooms = useMemo(() => {
    return mushrooms.filter(m => {
      const nameMatch = (m.commonName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                       (m.scientificName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      if (!nameMatch) return false;

      if (filters.ecologicalRole.length > 0) {
        const hasMatch = m.ecologicalRole?.some(role => filters.ecologicalRole.includes(role));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [mushrooms, filters, searchQuery]);

  const activeFilterCount = Object.values(filters).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <MushroomMap
        mushrooms={filteredMushrooms}
        loading={loading}
        onMarkerPress={(m) => {
          setSelectedMushroom(m);
          setPopupVisible(true);
        }}
        onClusterPress={(c) => {
          Alert.alert('Sightings', `${c.count} sightings in this area`);
        }}
      />

      <SafeAreaView style={styles.floatingHeader} edges={['top']}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={AppTheme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sightings..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={AppTheme.colors.textMuted}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]} 
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={22} color={activeFilterCount > 0 ? '#fff' : AppTheme.colors.text} />
            {activeFilterCount > 0 && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.chipsContainer}>
           <TouchableOpacity style={styles.chip}>
              <Text style={styles.chipText}>Near me</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.chip}>
              <Text style={styles.chipText}>Recent</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9}
        onPress={() => router.push('/submission')}
      >
        <LinearGradient
          colors={[AppTheme.colors.primary, AppTheme.colors.primaryDeep]}
          style={styles.fabGradient}
        >
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.fabText}>Identify</Text>
        </LinearGradient>
      </TouchableOpacity>

      <MushroomPopup mushroom={selectedMushroom} visible={popupVisible} onClose={() => setPopupVisible(false)} />
      
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  filterBtnActive: {
    backgroundColor: AppTheme.colors.primary,
  },
  filterDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppTheme.colors.accent,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    ...shadows.soft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    ...shadows.floating,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  }
});

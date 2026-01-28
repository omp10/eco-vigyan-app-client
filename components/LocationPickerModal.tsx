import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { geocodeCity } from '../lib/geocoding';
import { BlurView } from 'expo-blur';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: { latitude: number; longitude: number }) => void;
  selectedLocation: { latitude: number; longitude: number } | null;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedLocation,
}: LocationPickerModalProps) {
  const [region, setRegion] = useState({
    latitude: selectedLocation?.latitude || 20.5937,
    longitude: selectedLocation?.longitude || 78.9629,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [marker, setMarker] = useState(selectedLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (marker) {
      onSelect(marker);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const coords = await geocodeCity(searchQuery);
    setIsSearching(false);
    
    if (coords) {
      setRegion({
        ...coords,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
      setMarker(coords);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 relative">
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {marker && <Marker coordinate={marker} />}
          </MapView>
          
          <View className="absolute top-12 left-4 right-4 z-10">
            <View className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-row items-center px-4 py-2">
              <TextInput 
                placeholder="Search city..."
                className="flex-1 h-10 text-base text-slate-900 dark:text-white"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#11d421" />
                ) : (
                  <MaterialIcons name="search" size={24} color="#11d421" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            className="absolute top-12 right-4 z-10 bg-white/90 p-2 rounded-full shadow"
            onPress={onClose}
          >
            <MaterialIcons name="close" size={24} color="#334155" />
          </TouchableOpacity>

          <View className="absolute bottom-10 left-6 right-6">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!marker}
              className={`py-4 rounded-xl shadow-lg items-center ${
                marker ? 'bg-primary' : 'bg-slate-400'
              }`}
            >
              <Text className="text-white font-bold text-lg">Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

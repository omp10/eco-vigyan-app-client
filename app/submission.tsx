import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { uploadToCloudinary } from '../lib/uploadToCloudinary';
import LocationPickerModal from '../components/LocationPickerModal';
import {
  ECOLOGICAL_ROLES,
  TEXTURES,
  UNDERSIDES,
  FRUITING_SURFACES,
  STEM_PRESENCE,
  COMMON_USES,
} from '../lib/mushroomConstants';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Simplified local Picker component to avoid touching other files if possible, 
// or re-use existing if they are safe. Let's assume MushroomSelectField is safe for now, 
// but if it uses className it might trigger issues. 
// Safest bet is to replace it with simple UI here for the test.

export default function SubmissionScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [hasExifGps, setHasExifGps] = useState(false);
  const [exifDateTime, setExifDateTime] = useState<Date | null>(null);
  const [isExtractingExif, setIsExtractingExif] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [ecologicalRole, setEcologicalRole] = useState<string[]>([]);
  const [texture, setTexture] = useState("");
  const [underside, setUnderside] = useState("");
  const [fruitingSurface, setFruitingSurface] = useState("");
  const [stemPresence, setStemPresence] = useState("");
  const [commonUses, setCommonUses] = useState<string[]>([]);
  
  const [internalLocation, setInternalLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleLocationSelect = (location: any) => {
    setInternalLocation(location);
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setExifDateTime(new Date());
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Gallery permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setExifDateTime(new Date());
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to submit an observation.');
      return;
    }

    if (!imageUri) {
      Alert.alert('Error', 'Please take or upload a photo');
      return;
    }

    if (!internalLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    setIsSubmitting(true);

    try {
      const upload = await uploadToCloudinary(imageUri);
      const token = await AsyncStorage.getItem('@ecovigyan_auth_token');
      
      const payload = {
        latitude: internalLocation.latitude,
        longitude: internalLocation.longitude,
        imageUrl: upload.secure_url,
        publicId: upload.public_id,
        photoDateTime: exifDateTime?.toISOString(),
        commonName,
        scientificName,
        ecologicalRole,
        texture,
        underside,
        fruitingSurface,
        stemPresence,
        commonUses,
      };

      const response = await api.post('/mushrooms', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data) {
        Alert.alert('Success', 'Mushroom submitted successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
            } 
          }
        ]);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit mushroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSup}>Citizen Science</Text>
          <Text style={styles.headerTitle}>Add Specimen</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Photo *</Text>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                <MaterialIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActions}>
              <TouchableOpacity onPress={handleCamera} style={styles.photoBtn}>
                 <MaterialIcons name="camera-alt" size={24} color="#11d421" />
                 <Text style={styles.photoBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGallery} style={styles.photoBtn}>
                 <MaterialIcons name="photo-library" size={24} color="#64748b" />
                 <Text style={[styles.photoBtnText, {color: '#64748b'}]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Common Name</Text>
          <TextInput 
            value={commonName}
            onChangeText={setCommonName}
            placeholder="e.g. Fly Agaric"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Scientific Name</Text>
          <TextInput 
            value={scientificName}
            onChangeText={setScientificName}
            placeholder="e.g. Amanita muscaria"
            style={[styles.input, { fontStyle: 'italic' }]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          {internalLocation ? (
             <View style={styles.locationCard}>
               <Text style={{color: '#11d421', fontWeight: 'bold'}}>
                 {internalLocation.latitude.toFixed(5)}, {internalLocation.longitude.toFixed(5)}
               </Text>
               <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
                 <Text style={{fontWeight: 'bold', textDecorationLine: 'underline'}}>Change</Text>
               </TouchableOpacity>
             </View>
          ) : (
            <TouchableOpacity onPress={() => setShowLocationPicker(true)} style={styles.locationBtn}>
              <MaterialIcons name="add-location" size={20} color="#64748b" />
              <Text style={{color: '#64748b', fontWeight: 'bold'}}>Select Location</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionHeader}>Classification Details (Optional)</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Ecological Role</Text>
          <View style={styles.chipContainer}>
            {ECOLOGICAL_ROLES.map(role => (
              <TouchableOpacity
                key={role}
                onPress={() => setEcologicalRole(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                style={[styles.chip, ecologicalRole.includes(role) && styles.chipActive]}
              >
                <Text style={[styles.chipText, ecologicalRole.includes(role) && styles.chipTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
           <Text style={styles.label}>Texture</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: 16}}>
             {TEXTURES.map(t => (
               <TouchableOpacity 
                 key={t} 
                 onPress={() => setTexture(t)}
                 style={[styles.chip, texture === t && styles.chipActive]}
               >
                 <Text style={[styles.chipText, texture === t && styles.chipTextActive]}>{t}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        <View style={styles.section}>
           <Text style={styles.label}>Underside</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: 16}}>
             {UNDERSIDES.map(u => (
               <TouchableOpacity 
                 key={u} 
                 onPress={() => setUnderside(u)}
                 style={[styles.chip, underside === u && styles.chipActive]}
               >
                 <Text style={[styles.chipText, underside === u && styles.chipTextActive]}>{u}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        <View style={styles.section}>
           <Text style={styles.label}>Fruiting Surface</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: 16}}>
             {FRUITING_SURFACES.map(fs => (
               <TouchableOpacity 
                 key={fs} 
                 onPress={() => setFruitingSurface(fs)}
                 style={[styles.chip, fruitingSurface === fs && styles.chipActive]}
               >
                 <Text style={[styles.chipText, fruitingSurface === fs && styles.chipTextActive]}>{fs}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        <View style={styles.section}>
           <Text style={styles.label}>Stem Presence</Text>
           <View style={styles.chipContainer}>
             {STEM_PRESENCE.map(s => (
               <TouchableOpacity 
                 key={s} 
                 onPress={() => setStemPresence(s)}
                 style={[styles.chip, stemPresence === s && styles.chipActive]}
               >
                 <Text style={[styles.chipText, stemPresence === s && styles.chipTextActive]}>{s}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Common Uses</Text>
          <View style={styles.chipContainer}>
            {COMMON_USES.map(use => (
              <TouchableOpacity
                key={use}
                onPress={() => setCommonUses(prev => prev.includes(use) ? prev.filter(u => u !== use) : [...prev, use])}
                style={[styles.chip, commonUses.includes(use) && styles.chipActive]}
              >
                <Text style={[styles.chipText, commonUses.includes(use) && styles.chipTextActive]}>{use}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={isSubmitting || !isAuthenticated}
          style={[
            styles.submitBtn, 
            (isSubmitting || !isAuthenticated) && {backgroundColor: '#ccc', shadowOpacity: 0}
          ]}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.submitBtnText}>
              {isAuthenticated ? 'Submit Observation' : 'Login to Submit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(loc) => {
          handleLocationSelect(loc);
          setShowLocationPicker(false);
        }}
        selectedLocation={internalLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerSup: { fontSize: 10, fontWeight: '900', color: '#11d421', textTransform: 'uppercase' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8, textTransform: 'uppercase' },
  imagePreview: { height: 250, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#11d421' },
  image: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#ef4444', padding: 8, borderRadius: 20 },
  photoActions: { flexDirection: 'row', gap: 12 },
  photoBtn: { 
    flex: 1, height: 120, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc'
  },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: '#11d421', textTransform: 'uppercase' },
  input: { 
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' 
  },
  locationCard: {
    padding: 16, backgroundColor: '#dcfce7', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  locationBtn: {
    width: '100%', backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
  },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },
  sectionHeader: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, backgroundColor: '#fff', marginBottom: 8
  },
  chipActive: { backgroundColor: '#11d421', borderColor: '#11d421' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  footer: { 
    padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' 
  },
  submitBtn: {
    width: '100%', backgroundColor: '#11d421', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#11d421', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }
});

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
  StyleSheet,
  Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
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
import { AppTheme, shadows } from '@/constants/app-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubmissionScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [exifDateTime, setExifDateTime] = useState<Date | null>(null);
  
  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [ecologicalRole, setEcologicalRole] = useState<string[]>([]);
  const [texture, setTexture] = useState("");
  const [underside, setUnderside] = useState("");
  const [fruitingSurface, setFruitingSurface] = useState("");
  const [stemPresence, setStemPresence] = useState("");
  const [commonUses, setCommonUses] = useState<string[]>([]);
  
  const [internalLocation, setInternalLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'Camera permission is required');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setExifDateTime(new Date());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'Gallery permission is required');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setExifDateTime(new Date());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) return Alert.alert('Authentication Required', 'Please login to submit.');
    if (!imageUri) return Alert.alert('Error', 'Please take or upload a photo');
    if (!internalLocation) return Alert.alert('Error', 'Please select a location');

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
      await api.post('/mushrooms', payload, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Success', 'Specimen submitted!', [{ text: 'Great', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit mushroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Section = ({ title, children, icon }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={AppTheme.colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={AppTheme.colors.text} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>New Sighting</Text>
         <View style={{ width: 44 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photo Upload Area */}
        <TouchableOpacity 
          style={[styles.uploadArea, imageUri && styles.uploadAreaActive]} 
          onPress={imageUri ? undefined : handleCamera}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImg} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholder}>
               <View style={styles.placeholderCircle}>
                  <Ionicons name="camera" size={32} color={AppTheme.colors.primary} />
               </View>
               <Text style={styles.placeholderTitle}>Tap to take a photo</Text>
               <Text style={styles.placeholderSub}>Capture the specimen for identification</Text>
               <View style={styles.uploadOptions}>
                  <TouchableOpacity onPress={handleGallery} style={styles.galleryLink}>
                     <Ionicons name="image-outline" size={16} color={AppTheme.colors.textMuted} />
                     <Text style={styles.galleryText}>Choose from gallery</Text>
                  </TouchableOpacity>
               </View>
            </View>
          )}
        </TouchableOpacity>

        <Section title="Specimen Details" icon="leaf-outline">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Common Name</Text>
            <TextInput 
              value={commonName}
              onChangeText={setCommonName}
              placeholder="e.g. Fly Agaric"
              style={styles.input}
              placeholderTextColor={AppTheme.colors.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Scientific Name (Optional)</Text>
            <TextInput 
              value={scientificName}
              onChangeText={setScientificName}
              placeholder="e.g. Amanita muscaria"
              style={[styles.input, { fontStyle: 'italic' }]}
              placeholderTextColor={AppTheme.colors.textMuted}
            />
          </View>
        </Section>

        <Section title="Discovery Location" icon="location-outline">
           {internalLocation ? (
              <View style={styles.locCard}>
                 <View style={styles.locInfo}>
                    <Ionicons name="navigate-circle" size={24} color={AppTheme.colors.primary} />
                    <View>
                       <Text style={styles.locVal}>Coords: {internalLocation.latitude.toFixed(5)}, {internalLocation.longitude.toFixed(5)}</Text>
                       <Text style={styles.locLab}>Automatically pinned from discovery</Text>
                    </View>
                 </View>
                 <TouchableOpacity style={styles.locEdit} onPress={() => setShowLocationPicker(true)}>
                    <Text style={styles.locEditText}>Change</Text>
                 </TouchableOpacity>
              </View>
           ) : (
              <TouchableOpacity style={styles.locBtn} onPress={() => setShowLocationPicker(true)}>
                 <Ionicons name="add-circle-outline" size={20} color={AppTheme.colors.textMuted} />
                 <Text style={styles.locBtnText}>Pin your finding on map</Text>
              </TouchableOpacity>
           )}
        </Section>

        <Section title="Ecology & Characteristics" icon="color-filter-outline">
          <Text style={styles.chipLabel}>Ecological Role</Text>
          <View style={styles.chips}>
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

          <Text style={[styles.chipLabel, { marginTop: 16 }]}>Texture</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
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
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
         <TouchableOpacity 
            style={[styles.sumbitBtn, (isSubmitting || !imageUri) && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting || !imageUri}
         >
            <LinearGradient
               colors={isSubmitting || !imageUri ? ['#ccc', '#bbb'] : [AppTheme.colors.primary, AppTheme.colors.primaryDeep]}
               style={styles.sumbitGradient}
            >
               {isSubmitting ? (
                 <ActivityIndicator color="#fff" />
               ) : (
                 <>
                   <Text style={styles.submitText}>Submit Identification</Text>
                   <Ionicons name="chevron-forward" size={20} color="#fff" />
                 </>
               )}
            </LinearGradient>
         </TouchableOpacity>
      </View>

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(loc) => {
          setInternalLocation(loc);
          setShowLocationPicker(false);
        }}
        selectedLocation={internalLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: AppTheme.colors.border,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceMuted,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppTheme.colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  uploadArea: {
    width: '100%',
    height: 280,
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: AppTheme.colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 32,
  },
  uploadAreaActive: {
    borderStyle: 'solid',
    borderColor: AppTheme.colors.primary,
  },
  imageContainer: {
    flex: 1,
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppTheme.colors.text,
  },
  placeholderSub: {
    fontSize: 13,
    color: AppTheme.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  uploadOptions: {
    marginTop: 20,
  },
  galleryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryText: {
    fontSize: 14,
    color: AppTheme.colors.textMuted,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppTheme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: AppTheme.colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontWeight: '600',
    color: AppTheme.colors.text,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  locCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppTheme.colors.primarySoft,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppTheme.colors.primary,
  },
  locInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locVal: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.colors.primaryDeep,
  },
  locLab: {
    fontSize: 11,
    color: AppTheme.colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  locEdit: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  locEditText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppTheme.colors.primary,
  },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.surfaceMuted,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AppTheme.colors.border,
    gap: 10,
  },
  locBtnText: {
    color: AppTheme.colors.textMuted,
    fontWeight: '700',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  chipActive: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppTheme.colors.textMuted,
  },
  chipTextActive: {
    color: AppTheme.colors.primary,
  },
  hScroll: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.border,
  },
  sumbitBtn: {
    width: '100%',
    ...shadows.card,
  },
  sumbitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  }
});

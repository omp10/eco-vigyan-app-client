import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { mushroomService } from '@/services/api';
import { StatusBar } from 'expo-status-bar';

interface MushroomDetails {
  _id: string;
  commonName?: string;
  scientificName?: string;
  images?: Array<{ url: string }>;
  ecologicalRole?: string[];
  texture?: string;
  underside?: string;
  fruitingSurface?: string;
  stemPresence?: string;
  commonUses?: string[];
  description?: string;
  location?: { latitude: number; longitude: number };
  submittedBy?: {
    name: string;
    username: string;
    dp?: { url: string };
  };
}

export default function MushroomDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mushroom, setMushroom] = useState<MushroomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMushroom();
    }
  }, [id]);

  const loadMushroom = async () => {
    try {
      setLoading(true);
      const data = await mushroomService.getMushroomById(id!);
      setMushroom(data);
    } catch (err) {
      setError('Failed to load mushroom details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (error || !mushroom) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Mushroom not found'}</Text>
      </View>
    );
  }

  const imageUrl = mushroom.images?.[0]?.url;
  const userName = mushroom.submittedBy?.name || mushroom.submittedBy?.username || 'Unknown';
  const userDp = mushroom.submittedBy?.dp?.url;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: mushroom.commonName || 'Mushroom Details',
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: 'white',
        }} 
      />
      <StatusBar style="light" />
      
      <ScrollView style={styles.container}>
        {/* Hero Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>🍄</Text>
          </View>
        )}

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.commonName}>
            {mushroom.commonName || 'Unknown Mushroom'}
          </Text>
          {mushroom.scientificName && (
            <Text style={styles.scientificName}>{mushroom.scientificName}</Text>
          )}

          {/* Contributor */}
          <View style={styles.contributor}>
            {userDp ? (
              <Image source={{ uri: userDp }} style={styles.userDp} />
            ) : (
              <View style={styles.userDpPlaceholder}>
                <Text style={styles.userDpText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.userName}>Observed by {userName}</Text>
          </View>
        </View>

        {/* Ecological Role */}
        {mushroom.ecologicalRole && mushroom.ecologicalRole.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ecological Role</Text>
            <View style={styles.tagContainer}>
              {mushroom.ecologicalRole.map((role, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Physical Characteristics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Characteristics</Text>
          <View style={styles.characteristicsGrid}>
            {mushroom.texture && (
              <View style={styles.characteristicItem}>
                <Text style={styles.characteristicLabel}>Texture</Text>
                <Text style={styles.characteristicValue}>{mushroom.texture}</Text>
              </View>
            )}
            {mushroom.underside && (
              <View style={styles.characteristicItem}>
                <Text style={styles.characteristicLabel}>Underside</Text>
                <Text style={styles.characteristicValue}>{mushroom.underside}</Text>
              </View>
            )}
            {mushroom.fruitingSurface && (
              <View style={styles.characteristicItem}>
                <Text style={styles.characteristicLabel}>Fruiting Surface</Text>
                <Text style={styles.characteristicValue}>{mushroom.fruitingSurface}</Text>
              </View>
            )}
            {mushroom.stemPresence && (
              <View style={styles.characteristicItem}>
                <Text style={styles.characteristicLabel}>Stem</Text>
                <Text style={styles.characteristicValue}>{mushroom.stemPresence}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Common Uses */}
        {mushroom.commonUses && mushroom.commonUses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Uses</Text>
            <View style={styles.tagContainer}>
              {mushroom.commonUses.map((use, index) => (
                <View key={index} style={[styles.tag, styles.useTag]}>
                  <Text style={[styles.tagText, styles.useTagText]}>{use}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {mushroom.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{mushroom.description}</Text>
          </View>
        )}

        {/* Location */}
        {mushroom.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>
              📍 {mushroom.location.latitude.toFixed(4)}°N, {mushroom.location.longitude.toFixed(4)}°E
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  heroPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 80,
  },
  mainInfo: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  commonName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scientificName: {
    fontSize: 18,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  contributor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  userDp: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userDpPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userDpText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    color: '#475569',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '500',
  },
  useTag: {
    backgroundColor: '#e0e7ff',
  },
  useTagText: {
    color: '#4f46e5',
  },
  characteristicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  characteristicItem: {
    width: '50%',
    marginBottom: 16,
  },
  characteristicLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  characteristicValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  locationText: {
    fontSize: 14,
    color: '#475569',
  },
});

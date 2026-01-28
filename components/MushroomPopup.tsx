import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Mushroom } from '@/services/api';

interface MushroomPopupProps {
  mushroom: Mushroom | null;
  visible: boolean;
  onClose: () => void;
}

export default function MushroomPopup({ mushroom, visible, onClose }: MushroomPopupProps) {
  const router = useRouter();

  if (!mushroom) return null;

  const handleCardPress = () => {
    onClose();
    router.push(`/mushroom/${mushroom._id}` as any);
  };

  const imageUrl = mushroom.images?.[0]?.url || mushroom.thumbnail;
  const userName = mushroom.submittedBy?.name || mushroom.submittedBy?.username || 'Unknown';
  const userDp = mushroom.submittedBy?.dp?.url;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={handleCardPress}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Image on left */}
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.mushroomImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>🍄</Text>
                </View>
              )}
            </View>

            {/* Details on right */}
            <View style={styles.details}>
              {/* Mushroom name */}
              <Text style={styles.commonName} numberOfLines={2}>
                {mushroom.commonName || 'Unknown Mushroom'}
              </Text>
              
              {mushroom.scientificName && (
                <Text style={styles.scientificName} numberOfLines={1}>
                  {mushroom.scientificName}
                </Text>
              )}

              {/* Ecological Role */}
              {mushroom.ecologicalRole && mushroom.ecologicalRole.length > 0 && (
                <View style={styles.ecologicalContainer}>
                  {mushroom.ecologicalRole.map((role, index) => (
                    <View key={index} style={styles.ecologicalTag}>
                      <Text style={styles.ecologicalText}>{role}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contributor info */}
              <View style={styles.contributor}>
                {userDp ? (
                  <Image source={{ uri: userDp }} style={styles.userDp} />
                ) : (
                  <View style={styles.userDpPlaceholder}>
                    <Text style={styles.userDpText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 'bold',
  },
  content: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  mushroomImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  placeholderText: {
    fontSize: 40,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  commonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ecologicalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  ecologicalTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  ecologicalText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '500',
  },
  contributor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDp: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  userDpPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userDpText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 13,
    color: '#475569',
  },
});

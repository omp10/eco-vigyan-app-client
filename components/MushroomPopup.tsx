import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Mushroom } from '@/services/api';
import { AppTheme, shadows } from '@/constants/app-theme';

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={handleCardPress}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={18} color={AppTheme.colors.textMuted} />
          </TouchableOpacity>

          <Image
            source={{ uri: imageUrl || 'https://via.placeholder.com/300' }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.content}>
            <Text style={styles.badge}>Wild fungi</Text>
            <Text style={styles.commonName} numberOfLines={2}>
              {mushroom.commonName || 'Unknown mushroom'}
            </Text>
            {mushroom.scientificName ? (
              <Text style={styles.scientificName} numberOfLines={1}>
                {mushroom.scientificName}
              </Text>
            ) : null}

            {mushroom.ecologicalRole && mushroom.ecologicalRole.length > 0 ? (
              <View style={styles.tags}>
                {mushroom.ecologicalRole.slice(0, 3).map(role => (
                  <View key={role} style={styles.tag}>
                    <Text style={styles.tagText}>{role}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.footer}>
              <Text style={styles.userName}>Added by {userName}</Text>
              <View style={styles.openBtn}>
                <Text style={styles.openBtnText}>Open</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
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
    backgroundColor: 'rgba(12,23,16,0.45)',
    justifyContent: 'flex-end',
    paddingBottom: 105,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...shadows.soft,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E7EEE7',
  },
  content: {
    padding: 18,
  },
  badge: {
    color: AppTheme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  commonName: {
    color: AppTheme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  scientificName: {
    color: AppTheme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    fontSize: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tag: {
    backgroundColor: AppTheme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagText: {
    color: AppTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    color: AppTheme.colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  openBtn: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

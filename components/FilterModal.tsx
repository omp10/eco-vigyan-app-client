import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ECOLOGICAL_ROLES,
  TEXTURES,
  UNDERSIDES,
  FRUITING_SURFACES,
  STEM_PRESENCE,
  COMMON_USES,
} from '../lib/mushroomConstants';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export interface FilterState {
  ecologicalRole: string[];
  texture: string[];
  underside: string[];
  fruitingSurface: string[];
  stemPresence: string[];
  commonUses: string[];
}

export const initialFilterState: FilterState = {
  ecologicalRole: [],
  texture: [],
  underside: [],
  fruitingSurface: [],
  stemPresence: [],
  commonUses: [],
};

type FilterCategoryStr = keyof FilterState;

const ICON_MAP: { [key: string]: any } = {
  // Ecological Role
  "decomposer": require('../assets/mushrooms/decomposing mushroom.png'),
  "symbiont": require('../assets/mushrooms/symbiotic.png'),
  "parasite": require('../assets/mushrooms/parasitic mushroom.png'),

  // Texture
  "soft-to-touch": require('../assets/mushrooms/soft to touch.png'),
  "hard-to-touch": require('../assets/mushrooms/hard to touch.png'),
  "jelly-like": require('../assets/mushrooms/Jelly texture.png'),
  "leathery": require('../assets/mushrooms/leather textured mushroom.png'),

  // Underside
  "gills": require('../assets/mushrooms/gills.png'),
  "pores": require('../assets/mushrooms/pores.png'),
  "teeth": require('../assets/mushrooms/teeth.png'),
  "ball-with-no-distinctive-bottom": require('../assets/mushrooms/ball shaped mushroom.png'),
  "cup-with-no-distinctive-bottom": require('../assets/mushrooms/cup shaped.png'),
  "club-with-no-distinctive-bottom": require('../assets/mushrooms/club.png'),
  "crust-on-wood-with-no-distinctive-bottom": require('../assets/mushrooms/crusted.png'),
  "star-with-no-distinctive-bottom": require('../assets/mushrooms/Star shape.png'),
  "jelly-with-no-distinctive-bottom": require('../assets/mushrooms/jelly2.png'),
  "sponge-with-no-distinctive-bottom": require('../assets/mushrooms/sponge.png'),

  // Fruiting Surface
  "ground": require('../assets/mushrooms/underground.png'),
  "leaf": require('../assets/mushrooms/mushroom on leaf.png'),
  "wood": require('../assets/mushrooms/Mushroom on wood.png'),
  "dung": require('../assets/mushrooms/mushroom on dung.png'),

  // Stem Presence
  "has-stem": require('../assets/mushrooms/WITH STEM FINAL.png'),
  "has-no-stem": require('../assets/mushrooms/WITHOUT STEM FINAL.png'),

  // Common Uses
  "edible": require('../assets/mushrooms/edible.png'),
  "inedible": require('../assets/mushrooms/inedible.png'),
  "poisonous": require('../assets/mushrooms/poisonous.png'),
  "medicinal": require('../assets/mushrooms/medicinal.png'),
  "hallucinogenic": require('../assets/mushrooms/magic mushroom.png'),
  "other-uses": require('../assets/mushrooms/other utilities mushroom.png'),
  "mysterious": require('../assets/mushrooms/mysterious.png'),
};

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const toggleFilter = (category: FilterCategoryStr, item: string) => {
    setFilters(prev => {
      const current = prev[category];
      const exists = current.includes(item);
      let updated;
      if (exists) {
        updated = current.filter(i => i !== item);
      } else {
        updated = [...current, item];
      }
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const renderSection = (title: string, data: string[], category: FilterCategoryStr) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipContainer}>
        {data.map((item) => {
          const isSelected = filters[category].includes(item);
          return (
            <TouchableOpacity
              key={item}
              onPress={() => toggleFilter(category, item)}
              style={[styles.chip, isSelected && styles.chipActive]}
            >
              {ICON_MAP[item] && (
                <Image 
                  source={ICON_MAP[item]} 
                  style={{ width: 20, height: 20, marginRight: 6, resizeMode: 'contain' }} 
                />
              )}
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {item.replace(/-/g, ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
             <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Mushrooms</Text>
          <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
             <Text style={[styles.headerBtnText, { color: '#16a34a', fontWeight: 'bold' }]}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resetContainer}>
            <TouchableOpacity onPress={clearFilters} style={styles.resetBtn}>
              <MaterialIcons name="refresh" size={16} color="#64748b" />
              <Text style={styles.resetText}>Reset All filters</Text>
            </TouchableOpacity>
          </View>

          {renderSection('Ecological Role', ECOLOGICAL_ROLES, 'ecologicalRole')}
          {renderSection('Common Uses', COMMON_USES, 'commonUses')}
          {renderSection('Texture', TEXTURES, 'texture')}
          {renderSection('Underside', UNDERSIDES, 'underside')}
          {renderSection('Fruiting Surface', FRUITING_SURFACES, 'fruitingSurface')}
          {renderSection('Stem', STEM_PRESENCE, 'stemPresence')}
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 8,
  },
  applyBtn: {
    padding: 8,
  },
  headerBtnText: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    padding: 24,
  },
  resetContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resetText: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
});

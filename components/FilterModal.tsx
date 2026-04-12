import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ECOLOGICAL_ROLES,
  TEXTURES,
  UNDERSIDES,
  FRUITING_SURFACES,
  STEM_PRESENCE,
  COMMON_USES,
} from '../lib/mushroomConstants';
import { AppTheme } from '@/constants/app-theme';

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
  decomposer: require('../assets/mushrooms/decomposing mushroom.png'),
  symbiont: require('../assets/mushrooms/symbiotic.png'),
  parasite: require('../assets/mushrooms/parasitic mushroom.png'),
  'soft-to-touch': require('../assets/mushrooms/soft to touch.png'),
  'hard-to-touch': require('../assets/mushrooms/hard to touch.png'),
  'jelly-like': require('../assets/mushrooms/Jelly texture.png'),
  leathery: require('../assets/mushrooms/leather textured mushroom.png'),
  gills: require('../assets/mushrooms/gills.png'),
  pores: require('../assets/mushrooms/pores.png'),
  teeth: require('../assets/mushrooms/teeth.png'),
  'ball-with-no-distinctive-bottom': require('../assets/mushrooms/ball shaped mushroom.png'),
  'cup-with-no-distinctive-bottom': require('../assets/mushrooms/cup shaped.png'),
  'club-with-no-distinctive-bottom': require('../assets/mushrooms/club.png'),
  'crust-on-wood-with-no-distinctive-bottom': require('../assets/mushrooms/crusted.png'),
  'star-with-no-distinctive-bottom': require('../assets/mushrooms/Star shape.png'),
  'jelly-with-no-distinctive-bottom': require('../assets/mushrooms/jelly2.png'),
  'sponge-with-no-distinctive-bottom': require('../assets/mushrooms/sponge.png'),
  ground: require('../assets/mushrooms/underground.png'),
  leaf: require('../assets/mushrooms/mushroom on leaf.png'),
  wood: require('../assets/mushrooms/Mushroom on wood.png'),
  dung: require('../assets/mushrooms/mushroom on dung.png'),
  'has-stem': require('../assets/mushrooms/WITH STEM FINAL.png'),
  'has-no-stem': require('../assets/mushrooms/WITHOUT STEM FINAL.png'),
  edible: require('../assets/mushrooms/edible.png'),
  inedible: require('../assets/mushrooms/inedible.png'),
  poisonous: require('../assets/mushrooms/poisonous.png'),
  medicinal: require('../assets/mushrooms/medicinal.png'),
  hallucinogenic: require('../assets/mushrooms/magic mushroom.png'),
  'other-uses': require('../assets/mushrooms/other utilities mushroom.png'),
  mysterious: require('../assets/mushrooms/mysterious.png'),
};

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const toggleFilter = (category: FilterCategoryStr, item: string) => {
    setFilters(prev => {
      const current = prev[category];
      const exists = current.includes(item);
      return { ...prev, [category]: exists ? current.filter(i => i !== item) : [...current, item] };
    });
  };

  const renderSection = (title: string, data: string[], category: FilterCategoryStr) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipContainer}>
        {data.map(item => {
          const isSelected = filters[category].includes(item);
          return (
            <TouchableOpacity key={item} onPress={() => toggleFilter(category, item)} style={[styles.chip, isSelected && styles.chipActive]}>
              {ICON_MAP[item] ? <Image source={ICON_MAP[item]} style={styles.chipImage} /> : null}
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{item.replace(/-/g, ' ')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerGhost}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refine discoveries</Text>
          <TouchableOpacity
            onPress={() => {
              onApply(filters);
              onClose();
            }}
          >
            <Text style={styles.headerAction}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setFilters(initialFilterState)}>
            <MaterialIcons name="refresh" size={16} color={AppTheme.colors.primary} />
            <Text style={styles.resetText}>Reset all filters</Text>
          </TouchableOpacity>

          {renderSection('Ecological Role', ECOLOGICAL_ROLES, 'ecologicalRole')}
          {renderSection('Common Uses', COMMON_USES, 'commonUses')}
          {renderSection('Texture', TEXTURES, 'texture')}
          {renderSection('Underside', UNDERSIDES, 'underside')}
          {renderSection('Fruiting Surface', FRUITING_SURFACES, 'fruitingSurface')}
          {renderSection('Stem', STEM_PRESENCE, 'stemPresence')}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF4EC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: AppTheme.colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  headerGhost: {
    color: AppTheme.colors.textMuted,
    fontSize: 15,
  },
  headerAction: {
    color: AppTheme.colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppTheme.colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 20,
  },
  resetText: {
    color: AppTheme.colors.primary,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: AppTheme.colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: AppTheme.colors.accentSoft,
    borderColor: '#F5B8C8',
  },
  chipImage: {
    width: 18,
    height: 18,
    marginRight: 8,
    resizeMode: 'contain',
  },
  chipText: {
    color: AppTheme.colors.textMuted,
    textTransform: 'capitalize',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: AppTheme.colors.text,
  },
});

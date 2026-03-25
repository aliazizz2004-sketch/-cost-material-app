/**
 * MaterialCatalog – Full material store view.
 * Shows SearchBar, MaterialCard list, and TotalCostBar.
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { colors, darkColors, spacing, typography, radius, shadows } from '../styles/theme';
import AppIcon from './AppIcon';
import SearchBar from './SearchBar';
import MaterialCard from './MaterialCard';
import TotalCostBar from './TotalCostBar';
import materialsData from '../data/materials';

const SAVED_LISTS_KEY = 'costMaterialSavedLists';

export default function MaterialCatalog({ filterPurposes = [], onBack, onOpenEstimation }) {
  const { lang, isRTL, t } = useLanguage();
  const { isDark } = useTheme();
  const { rate } = useExchangeRate();
  const tc = isDark ? darkColors : colors;
  const ku = lang === 'ku';

  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState({});
  const [sortBy, setSortBy] = useState('default');
  const [autoOpenMaterialId, setAutoOpenMaterialId] = useState(null);
  const [forceOpenModal, setForceOpenModal] = useState(0);
  const flatListRef = useRef(null);

  // Category filter based on purpose selection
  const purposeCategoryMap = {
    Structural: ['Concrete', 'Steel & Rebar', 'Cement & Binding'],
    Masonry: ['Masonry', 'Plaster & Bonding'],
    Roofing: ['Insulation', 'Waterproofing'],
    Plumbing: ['Plumbing'],
    Finishing: ['Paint & Coatings', 'Flooring & Finishes', 'Gypsum & Drywall'],
  };

  const filteredByPurpose = useMemo(() => {
    if (!filterPurposes || filterPurposes.length === 0) return materialsData;
    const allowedCategories = new Set();
    filterPurposes.forEach(p => {
      (purposeCategoryMap[p] || []).forEach(c => allowedCategories.add(c));
    });
    if (allowedCategories.size === 0) return materialsData;
    return materialsData.filter(m => allowedCategories.has(m.categoryEN));
  }, [filterPurposes]);

  // Search + sort
  const displayedMaterials = useMemo(() => {
    let result = filteredByPurpose;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.nameEN.toLowerCase().includes(q) ||
        m.nameKU.includes(q) ||
        m.categoryEN.toLowerCase().includes(q) ||
        (m.categoryKU && m.categoryKU.includes(q))
      );
    }
    if (sortBy === 'cheapest') result = [...result].sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'expensive') result = [...result].sort((a, b) => b.basePrice - a.basePrice);
    else if (sortBy === 'good') result = [...result].sort((a, b) => a.thermalConductivity - b.thermalConductivity);
    else if (sortBy === 'bad') result = [...result].sort((a, b) => b.thermalConductivity - a.thermalConductivity);
    return result;
  }, [filteredByPurpose, search, sortBy]);

  const handleQuantityChange = useCallback((id, qty) => {
    setQuantities(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const handleSelectItem = useCallback((id) => {
    setAutoOpenMaterialId(id);
    const idx = displayedMaterials.findIndex(m => m.id === id);
    if (idx >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    }
  }, [displayedMaterials]);

  const clearAutoOpen = useCallback(() => setAutoOpenMaterialId(null), []);

  const handleClearAll = useCallback(() => setQuantities({}), []);

  const handleSaveList = useCallback(async (listData) => {
    try {
      const existing = await AsyncStorage.getItem(SAVED_LISTS_KEY);
      const lists = existing ? JSON.parse(existing) : [];
      const newList = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: listData.items.map(i => ({ id: i.id, qty: i.qty, nameEN: i.nameEN, nameKU: i.nameKU })),
        totalCost: listData.totalCost,
      };
      lists.push(newList);
      await AsyncStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(lists));
      Alert.alert(t('success'), t('listSaved'));
    } catch (e) {
      console.error('Failed to save list', e);
    }
  }, [t]);

  const sortOptions = [
    { id: 'default', label: t('sortDefault') },
    { id: 'cheapest', label: t('sortCheapest') },
    { id: 'expensive', label: t('sortExpensive') },
    { id: 'good', label: t('sortGood') },
    { id: 'bad', label: t('sortBad') },
  ];

  const renderItem = useCallback(({ item }) => (
    <MaterialCard
      material={item}
      quantity={quantities[item.id] || 0}
      onQuantityChange={handleQuantityChange}
      allMaterials={displayedMaterials}
      onSelectItem={handleSelectItem}
      onOpenEstimation={onOpenEstimation}
      autoOpenMaterialId={autoOpenMaterialId}
      clearAutoOpen={clearAutoOpen}
    />
  ), [quantities, displayedMaterials, handleQuantityChange, handleSelectItem, onOpenEstimation, autoOpenMaterialId, clearAutoOpen]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={[styles.container, { backgroundColor: tc.offWhite }]}>
      <StatusBar barStyle="light-content" backgroundColor={tc.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: tc.primary }]}>
        <SafeAreaView>
          <View style={[styles.headerRow, isRTL && styles.rowRTL]}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
              <Text style={styles.backSymbol}>{isRTL ? '›' : '‹'}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
              {ku ? 'کۆگای مادەکان' : 'Material Store'}
            </Text>
            <Text style={styles.headerCount}>
              {displayedMaterials.length} {ku ? 'مادە' : 'items'}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* Sort chips */}
      <View style={styles.sortRow}>
        <FlatList
          horizontal
          data={sortOptions}
          keyExtractor={s => s.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
          renderItem={({ item: s }) => (
            <TouchableOpacity
              style={[styles.sortChip, sortBy === s.id && styles.sortChipActive]}
              onPress={() => setSortBy(s.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortChipText, sortBy === s.id && styles.sortChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Material list */}
      <FlatList
        ref={flatListRef}
        data={displayedMaterials}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 500);
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: tc.mediumGray }]}>{t('noResults')}</Text>
          </View>
        }
      />

      {/* Total cost bar */}
      <TotalCostBar
        quantities={quantities}
        materials={materialsData}
        onQuantityChange={handleQuantityChange}
        onSelectItem={handleSelectItem}
        onSaveList={handleSaveList}
        forceOpenModal={forceOpenModal}
        onClearAll={handleClearAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  backBtn: { padding: spacing.sm },
  backSymbol: { fontSize: 28, color: '#FFF', fontWeight: '300', lineHeight: 32 },
  headerTitle: { ...typography.hero, color: '#FFF', fontSize: 20, flex: 1 },
  headerCount: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  textRTL: { textAlign: 'right' },
  sortRow: { marginBottom: spacing.xs },
  sortScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.searchBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    ...typography.caption,
    color: colors.darkGray,
  },
  sortChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 200,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    ...typography.subtitle,
    fontSize: 16,
  },
});

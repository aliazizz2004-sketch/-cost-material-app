/**
 * MaterialCatalog – Full material store view.
 * Shows SearchBar, MaterialCard list, and TotalCostBar.
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, Alert, Modal
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

export default function MaterialCatalog({ filterPurposes = [], onBack, onOpenEstimation, onNavigate, globalQuantities, setGlobalQuantities }) {
  const { lang, isRTL, t } = useLanguage();
  const { isDark } = useTheme();
  const { rate } = useExchangeRate();
  const tc = isDark ? darkColors : colors;
  const ku = lang === 'ku';

  const [search, setSearch] = useState('');
  const quantities = globalQuantities || {};
  const setQuantities = setGlobalQuantities || (() => {});
  const [sortBy, setSortBy] = useState('default');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showSavedListsModal, setShowSavedListsModal] = useState(false);
  const [savedLists, setSavedLists] = useState([]);
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

  // Category list dynamically built
  const activeCategories = useMemo(() => {
    const catsMap = new Map();
    filteredByPurpose.forEach(m => {
        if (m.categoryEN) {
          catsMap.set(m.categoryEN, m.categoryKU || m.categoryEN);
        }
    });
    return [
      { id: 'All', labelEN: 'All', labelKU: 'هەمووی' },
      ...Array.from(catsMap.entries()).map(([en, kuL]) => ({ id: en, labelEN: en, labelKU: kuL }))
    ];
  }, [filteredByPurpose]);

  // Search, category filter + sort
  const displayedMaterials = useMemo(() => {
    let result = filteredByPurpose;
    if (filterCategory !== 'All') {
      result = result.filter(m => m.categoryEN === filterCategory);
    }
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
  }, [filteredByPurpose, search, sortBy, filterCategory]);

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

  const loadSavedLists = async () => {
    try {
      const existing = await AsyncStorage.getItem(SAVED_LISTS_KEY);
      if (existing) setSavedLists(JSON.parse(existing));
    } catch (e) {}
  };

  const handleSaveList = useCallback(async (listData) => {
    try {
      const existing = await AsyncStorage.getItem(SAVED_LISTS_KEY);
      const lists = existing ? JSON.parse(existing) : [];
      const newList = {
        id: Date.now().toString(),
        name: ku ? "لیستی کۆگا" : "Store List",
        date: new Date().toISOString(),
        items: listData.items.map(i => ({ id: i.id, qty: i.qty, nameEN: i.nameEN, nameKU: i.nameKU, basePrice: i.basePrice })),
        totalCost: listData.totalCost,
      };
      
      lists.unshift(newList);
      await AsyncStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(lists));
      
      Alert.alert(t('success'), ku ? "لیستەکە پاشەکەوت کرا" : "List saved locally");
      setQuantities({});
      await loadSavedLists();
    } catch (e) {
      console.error('Failed to save list', e);
    }
  }, [t, ku]);

  const deleteSavedList = async (listId) => {
    try {
      const updated = savedLists.filter(l => l.id !== listId);
      await AsyncStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(updated));
      setSavedLists(updated);
    } catch (e) {}
  };

  const sortOptions = [
    { id: 'default', label: t('sortDefault'), icon: 'sort' },
    { id: 'cheapest', label: t('sortCheapest'), icon: 'arrow_down' },
    { id: 'expensive', label: t('sortExpensive'), icon: 'arrow_up' },
    { id: 'good', label: t('sortGood'), icon: 'sparkles' },
    { id: 'bad', label: t('sortBad'), icon: 'info' },
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
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                <Text style={styles.headerCount}>
                  {displayedMaterials.length} {ku ? 'مادە' : 'items'}
                </Text>
                {/* Projects Icon (Folder) */}
                <TouchableOpacity style={{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} onPress={() => { if (onNavigate) { onNavigate('projects'); } }}>
                    <AppIcon name="projects" size={20} color="#FFF" />
                </TouchableOpacity>

                {/* Saved Lists Icon (Bookmark) */}
                <TouchableOpacity 
                   style={{ marginLeft: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} 
                   onPress={() => { loadSavedLists(); setShowSavedListsModal(true); }}
                >
                    <AppIcon name="bookmark" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Search and Sort Button */}
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', paddingRight: isRTL ? 0 : spacing.lg, paddingLeft: isRTL ? spacing.lg : 0 }}>
          <View style={{ flex: 1 }}>
             <SearchBar value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity 
             style={{ width: 48, height: 48, backgroundColor: tc.card, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tc.cardBorder, marginTop: spacing.md, marginBottom: spacing.sm, marginLeft: isRTL ? 0 : spacing.sm, marginRight: isRTL ? spacing.sm : 0, ...shadows.card }} 
             onPress={() => setShowSortModal(true)}
             activeOpacity={0.8}
          >
             <AppIcon name="sort" size={20} color={tc.primary} />
          </TouchableOpacity>
      </View>

      {/* Sort & Filter Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
         <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowSortModal(false)}>
             <View style={{ width: '90%', maxWidth: 400, backgroundColor: tc.card, borderRadius: 24, padding: 24, paddingBottom: 30, borderWidth: 1, borderColor: tc.cardBorder, maxHeight: '80%' }}>
                 <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <Text style={{ fontSize: 18, fontWeight: 'bold', color: tc.charcoal, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                         {ku ? "ڕیزبەندی و جۆر" : "Sort & Filter"}
                     </Text>
                     <TouchableOpacity onPress={() => setShowSortModal(false)} style={{ padding: 4 }}>
                         <Text style={{ fontSize: 20, color: tc.mediumGray, fontWeight: 'bold' }}>✕</Text>
                     </TouchableOpacity>
                 </View>
                 
                 <FlatList
                     data={[ { type: 'header', title: ku ? "ڕیزبەندی" : "Sort By" }, ...sortOptions, { type: 'header', title: ku ? "جۆری مادە" : "Material Type" }, ...activeCategories.map(c => {
                       let icon = 'layers';
                       if(c.id === 'Concrete') icon = 'database';
                       else if(c.id === 'Cement & Binding') icon = 'box';
                       else if(c.id === 'Masonry') icon = 'grid';
                       else if(c.id === 'Aggregate') icon = 'triangle';
                       else if(c.id === 'Steel & Rebar') icon = 'link';
                       else if(c.id === 'Wood') icon = 'tree-pine';
                       else if(c.id === 'Plumbing') icon = 'droplet';
                       else if(c.id === 'Electrical') icon = 'zap';
                       else if(c.id === 'Structural') icon = 'home';
                       return { id: c.id, isCategory: true, label: (ku && c.id !== 'All') ? `${c.labelKU} (${c.labelEN})` : (ku && c.id === 'All' ? c.labelKU : c.labelEN), icon };
                     }) ]}
                     keyExtractor={(item, idx) => item.id || 'header-'+idx}
                     showsVerticalScrollIndicator={false}
                     renderItem={({ item }) => {
                       if (item.type === 'header') {
                         return <Text style={{ fontSize: 13, fontWeight: 'bold', color: tc.mediumGray, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', textAlign: isRTL ? 'right' : 'left' }}>{item.title}</Text>;
                       }
                       if (item.isCategory) {
                         const isActive = filterCategory === item.id;
                         return (
                           <TouchableOpacity
                             style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: isActive ? colors.primary + '15' : tc.offWhite, borderWidth: 1, borderColor: isActive ? colors.primary : 'transparent', marginBottom: 8 }}
                             onPress={() => { setFilterCategory(item.id); setShowSortModal(false); }}
                             activeOpacity={0.7}
                           >
                             <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isActive ? colors.primary : colors.white, alignItems: 'center', justifyContent: 'center', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}>
                                 <AppIcon name={item.icon || 'layers'} size={16} color={isActive ? colors.white : tc.primary} />
                             </View>
                             <Text style={{ flex: 1, fontSize: 15, fontWeight: isActive ? '700' : '500', color: tc.charcoal, textAlign: isRTL ? 'right' : 'left' }}>{item.label}</Text>
                             {isActive && <AppIcon name="checklist" size={18} color={colors.primary} />}
                           </TouchableOpacity>
                         );
                       }
                       const isActiveSort = sortBy === item.id;
                       return (
                         <TouchableOpacity
                             style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: isActiveSort ? colors.primary + '15' : tc.offWhite, borderWidth: 1, borderColor: isActiveSort ? colors.primary : tc.cardBorder, marginBottom: 8 }}
                             onPress={() => { setSortBy(item.id); setShowSortModal(false); }}
                             activeOpacity={0.7}
                         >
                             <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isActiveSort ? colors.primary : colors.white, alignItems: 'center', justifyContent: 'center', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}>
                                 <AppIcon name={item.icon} size={16} color={isActiveSort ? colors.white : tc.primary} />
                             </View>
                             <Text style={{ flex: 1, fontSize: 15, fontWeight: isActiveSort ? '700' : '500', color: tc.charcoal, textAlign: isRTL ? 'right' : 'left' }}>
                                 {item.label}
                             </Text>
                             {isActiveSort && (
                                 <AppIcon name="checklist" size={18} color={colors.primary} />
                             )}
                         </TouchableOpacity>
                       );
                     }}
                 />
             </View>
         </TouchableOpacity>
      </Modal>

      {/* Saved Lists Modal */}
      <Modal visible={showSavedListsModal} transparent animationType="slide" onRequestClose={() => setShowSavedListsModal(false)}>
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
             <View style={{ backgroundColor: tc.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
                 <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <Text style={{ fontSize: 20, fontWeight: 'bold', color: tc.charcoal, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                         {ku ? "لیستە پاشەکەوتکراوەکان" : "Saved Lists"}
                     </Text>
                     <TouchableOpacity onPress={() => setShowSavedListsModal(false)} style={{ padding: 4 }}>
                         <Text style={{ fontSize: 24, color: tc.mediumGray, fontWeight: 'bold' }}>✕</Text>
                     </TouchableOpacity>
                 </View>
                 
                 <FlatList
                   data={savedLists}
                   keyExtractor={item => item.id}
                   showsVerticalScrollIndicator={false}
                   contentContainerStyle={{ paddingBottom: 40 }}
                   ListEmptyComponent={<Text style={{ textAlign: 'center', color: tc.mediumGray, marginVertical: 40 }}>{ku ? 'هیچ لیستێکی پاشەکەوتکراو نییە' : 'No saved lists yet.'}</Text>}
                   renderItem={({ item }) => (
                     <View style={{ backgroundColor: tc.offWhite, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: tc.cardBorder }}>
                       <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                         <Text style={{ fontWeight: 'bold', fontSize: 16, color: tc.charcoal, flex: 1 }}>{item.name || (ku ? 'لیست' : 'List')}</Text>
                         <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
                           <TouchableOpacity 
                               onPress={() => {
                                 const newQuantities = {};
                                 item.items.forEach(it => { newQuantities[it.id] = it.qty; });
                                 setQuantities(newQuantities);
                                 setShowSavedListsModal(false);
                               }}
                               style={{ backgroundColor: colors.primary + '15', padding: 8, borderRadius: 8 }}
                           >
                              <AppIcon name="external" size={18} color={colors.primary} />
                           </TouchableOpacity>
                           <TouchableOpacity 
                               onPress={() => deleteSavedList(item.id)}
                               style={{ backgroundColor: colors.danger + '15', padding: 8, borderRadius: 8 }}
                           >
                              <AppIcon name="trash" size={18} color={colors.danger} />
                           </TouchableOpacity>
                         </View>
                       </View>
                       <Text style={{ fontSize: 14, color: tc.charcoal, textAlign: isRTL ? 'right' : 'left', marginBottom: 8 }}>Total: {item.totalCost} IQD</Text>
                       <View style={{ gap: 4 }}>
                         {item.items.slice(0, 3).map((it, idx) => (
                           <Text key={idx} style={{ fontSize: 13, color: tc.mediumGray, textAlign: isRTL ? 'right' : 'left' }}>
                             {it.qty}x {ku ? (it.nameKU || it.nameEN) : it.nameEN}
                           </Text>
                         ))}
                         {item.items.length > 3 && <Text style={{ fontSize: 12, color: colors.primary, textAlign: isRTL ? 'right' : 'left' }}>+{item.items.length - 3} {ku?'زیاتر':'more'}</Text>}
                       </View>
                     </View>
                   )}
                 />
             </View>
         </View>
      </Modal>

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

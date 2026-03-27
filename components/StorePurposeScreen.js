import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { colors, darkColors, spacing, typography, radius, shadows } from '../styles/theme';
import AppIcon from './AppIcon';
import MaterialCatalog from './MaterialCatalog';

export default function StorePurposeScreen({ onBack, onNavigate, globalQuantities, setGlobalQuantities }) {
  const { lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const ku = lang === 'ku';
  const ar = lang === 'ar';

  const [selected, setSelected] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [filterPurposes, setFilterPurposes] = useState([]);

  const toggleSelection = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleContinue = (purposes) => {
    setFilterPurposes(purposes);
    setShowCatalog(true);
  };

  // If catalog is shown, render it
  if (showCatalog) {
    return (
      <MaterialCatalog
        filterPurposes={filterPurposes}
        onBack={() => setShowCatalog(false)}
        onNavigate={onNavigate}
        globalQuantities={globalQuantities}
        setGlobalQuantities={setGlobalQuantities}
      />
    );
  }

  const purposes = [
    { id: 'Structural', icon: 'layers', title: ar ? 'الأساسات والهيكل' : ku ? 'ستراکچەر و بناغە' : 'Foundation & Structure', desc: ar ? 'حديد، إسمنت، خرسانة' : ku ? 'شیش، چیمەنتۆ، کۆنکریت' : 'Steel, cement, concrete' },
    { id: 'Masonry', icon: 'checklist', title: ar ? 'الجدران والبناء' : ku ? 'دیوار و بیناسازی' : 'Walls & Masonry', desc: ar ? 'طابوق، طوب، مونة' : ku ? 'بلۆک، خشت، گەچ' : 'Blocks, bricks, mortar' },
    { id: 'Roofing', icon: 'home', title: ar ? 'التسقيف والعزل' : ku ? 'سەقف و داپۆشین' : 'Roofing & Insulation', desc: ar ? 'قرميد، عازل، إيزوكام' : ku ? 'شینگل، عازل، ئیزۆگام' : 'Shingles, waterproofing, isogam' },
    { id: 'Plumbing', icon: 'settings', title: ar ? 'السباكة والكهرباء' : ku ? 'بۆری و کارەبا' : 'Plumbing & Electrical', desc: ar ? 'أنابيب، أسلاك، كابلات' : ku ? 'بۆری ئاو، وایەر، کەیبڵ' : 'Pipes, wires, cables' },
    { id: 'Finishing', icon: 'sparkles', title: ar ? 'التشطيب والديكور' : ku ? 'پەرداخت و \u0631ووپۆشکردن' : 'Finishing & Decor', desc: ar ? 'أصباغ، سيراميك، ديكورات' : ku ? 'بۆیەی، کاشی، سەقفی مەغریبی' : 'Paint, tiles, gypsum board' },
    { id: 'All', icon: 'store', title: ar ? 'تصفح كافة المواد' : ku ? 'هەموو مادەکان بەپشکنین' : 'Browse All Materials', desc: ar ? 'تخطي واعرض الكتالوج' : ku ? 'بینینی تەواوی کاتەلۆگ' : 'Skip and view catalog', skip: true },
  ];

  return (
    <Animated.View style={[styles.container, { backgroundColor: tc.offWhite }]} entering={FadeIn.duration(300)}>
      <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
      
      <View style={[styles.header, { backgroundColor: tc.primary }]}>
        <SafeAreaView>
          <View style={[styles.headerRow, isRTL && styles.rowRTL]}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
              <Text style={styles.backSymbol}>{isRTL ? '›' : '‹'}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
              {ar ? 'الغرض من المواد' : ku ? 'مەبەستی مادەکان' : 'Material Purpose'}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.titleSection}>
          <Text style={[styles.mainTitle, isRTL && styles.textRTL, { color: tc.charcoal }]}>
            {ar ? 'ما هو الغرض الأساسي للمواد؟' : ku ? 'مادەکەت بۆ چ مەبەستێک پێویستە؟' : 'What is the material for?'}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.textRTL, { color: tc.mediumGray }]}>
            {ar ? 'يمكنك تحديد خيارات متعددة ثم المتابعة.' : ku ? 'دەتوانیت زیاتر لە یەک دانە هەڵبژێریت پاشان بەردەوام بە.' : 'You can select multiple options, then tap continue.'}
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {purposes.map((item, idx) => {
            const isSelected = selected.includes(item.id);
            return (
              <Animated.View key={item.id} entering={FadeInDown.duration(400).delay(150 + idx * 50)} layout={Layout.springify()}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    isRTL && styles.rowRTL,
                    { 
                      backgroundColor: isSelected ? colors.primary + '11' : tc.card, 
                      borderColor: item.skip ? colors.accent : (isSelected ? colors.primary : tc.cardBorder), 
                      borderWidth: isSelected || item.skip ? 1.5 : 1 
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (item.skip) {
                      handleContinue([]);
                    } else {
                      toggleSelection(item.id);
                    }
                  }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.skip ? colors.accent + '22' : (isSelected ? colors.primary + '22' : colors.primary + '15') }]}>
                    <AppIcon name={item.icon} size={24} color={item.skip ? colors.accent : colors.primary} />
                  </View>
                  <View style={[styles.textWrap, isRTL && { alignItems: 'flex-end', marginRight: spacing.md }]}>
                    <Text style={[styles.cardTitle, isRTL && styles.textRTL, { color: tc.charcoal }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.cardDesc, isRTL && styles.textRTL, { color: tc.mediumGray }]}>
                      {item.desc}
                    </Text>
                  </View>
                  {!item.skip && (
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {selected.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.footer, { backgroundColor: tc.offWhite, borderTopColor: tc.cardBorder }]}>
          <TouchableOpacity 
            style={[styles.continueBtn, isRTL && styles.rowRTL]} 
            activeOpacity={0.85}
            onPress={() => handleContinue(selected)}
          >
            <Text style={styles.continueBtnText}>{ar ? 'المتابعة' : ku ? 'بەردەوام بە' : 'Continue'} ({selected.length})</Text>
            <Text style={styles.continueBtnArrow}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
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
  headerTitle: { ...typography.hero, color: '#FFF', fontSize: 20 },
  textRTL: { textAlign: 'right' },
  
  scrollContent: { padding: spacing.xl, paddingBottom: 100 },
  
  titleSection: { marginBottom: spacing.xl },
  mainTitle: { ...typography.hero, fontSize: 24, marginBottom: spacing.xs },
  subtitle: { ...typography.body, lineHeight: 22 },
  
  grid: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  iconWrap: {
    width: 52, height: 52,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrap: { flex: 1 },
  cardTitle: { ...typography.subtitle, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  cardDesc: { ...typography.tiny, fontSize: 13 },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.mediumGray,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  continueBtnText: {
    color: '#FFF',
    ...typography.subtitle,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
  continueBtnArrow: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

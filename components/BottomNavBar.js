/**
 * BottomNavBar – Professional 5-tab navigation bar.
 * Uses real Lucide SVG icons via AppIcon + small descriptive labels.
 * Active tab gets an accent pill indicator with smooth animations.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { colors, darkColors, spacing, typography, radius } from '../styles/theme';
import AppIcon from './AppIcon';

// ─── Nav Item Definitions ────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: 'home',
    icon: 'home',
    labelEN: 'Home',
    labelKU: 'سەرەکی',
    labelAR: 'الرئيسية',
  },
  {
    id: 'store',
    icon: 'store',
    labelEN: 'Materials',
    labelKU: 'مادەکان',
    labelAR: 'المواد',
  },
  {
    id: 'aiHub',
    icon: 'sparkles',
    labelEN: 'AI Tools',
    labelKU: 'ئامرازی AI',
    labelAR: 'أدوات الذكاء',
  },
  {
    id: 'projects',
    icon: 'projects',
    labelEN: 'Projects',
    labelKU: 'پ\u0631ۆژەکان',
    labelAR: 'المشاريع',
  },
  {
    id: 'profile',
    icon: 'profile',
    labelEN: 'Profile',
    labelKU: 'پرۆفایل',
    labelAR: 'حسابي',
  },
];

// Map any currentView → which tab lights up
const VIEW_TO_TAB = {
  home:        'home',
  store:       'store',
  storePurpose:'store',
  aiHub:       'aiHub',
  aiArchitect: 'aiHub',
  arVisualizer:'aiHub',
  estimation:  'home',
  delivery:    'home',
  suppliers:   'home',
  community:   'home',
  projects:    'projects',
  profile:     'profile',
};

// ─── Main component ──────────────────────────────────────────────────────────
export default function BottomNavBar({ currentView, onNavigate }) {
  const { lang, isRTL, kuFont } = useLanguage();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;

  const activeTab = VIEW_TO_TAB[currentView] || 'home';
  const items = isRTL ? [...NAV_ITEMS].reverse() : NAV_ITEMS;

  const accentColor = isDark ? '#60A5FA' : '#0A3D62';
  const inactiveColor = isDark ? '#6B7280' : '#9CA3AF';
  const bgActive = isDark ? 'rgba(96,165,250,0.14)' : 'rgba(10,61,98,0.09)';

  return (
    <BlurView 
      intensity={85} 
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.wrapper,
        {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)',
          borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        }
      ]}
    >
      <View style={styles.navRow}>
        {items.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <NavTab
              key={item.id}
              item={item}
              isActive={isActive}
              isDark={isDark}
              lang={lang}
              kuFont={kuFont}
              accentColor={accentColor}
              inactiveColor={inactiveColor}
              bgActive={bgActive}
              onPress={() => onNavigate(item.id)}
            />
          );
        })}
      </View>
    </BlurView>
  );
}

// ─── Single tab ──────────────────────────────────────────────────────────────
function NavTab({ item, isActive, isDark, lang, kuFont, accentColor, inactiveColor, bgActive, onPress }) {
  const bgAnim   = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnim  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(bgAnim, {
        toValue: isActive ? 1 : 0,
        tension: 160,
        friction: 10,
        useNativeDriver: false,
      }),
      Animated.spring(dotAnim, {
        toValue: isActive ? 1 : 0,
        tension: 200,
        friction: 12,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const pillBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', bgActive],
  });

  const iconColor   = isActive ? accentColor : inactiveColor;
  const labelColor  = isActive ? accentColor : inactiveColor;
  const fontWeight  = isActive ? '700' : '500';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.tabTouchable}
      accessibilityLabel={lang === 'ar' ? item.labelAR : lang === 'ku' ? item.labelKU : item.labelEN}
    >
      <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
        {/* Pill background */}
        <Animated.View style={[styles.pillBg, { backgroundColor: pillBg }]} />

        {/* Icon */}
        <View style={styles.iconWrap}>
          <AppIcon
            name={item.icon}
            size={22}
            color={iconColor}
            strokeWidth={isActive ? 2.2 : 1.7}
          />
        </View>

        {/* Active top-accent bar */}
        <Animated.View style={[
          styles.accentBar,
          {
            backgroundColor: accentColor,
            opacity: dotAnim,
            transform: [{ scaleX: dotAnim }],
          }
        ]} />

        <Text
          style={[styles.tabLabel, { color: labelColor, fontWeight }, lang === 'ku' ? kuFont() : {}]}
          numberOfLines={1}
        >
          {lang === 'ar' ? item.labelAR : lang === 'ku' ? item.labelKU : item.labelEN}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 0,
    // Web shadow
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 -4px 18px rgba(0,0,0,0.06)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
      elevation: 12,
    }),
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 62,
  },
  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 54,
    position: 'relative',
    gap: 3,
  },
  pillBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBar: {
    position: 'absolute',
    top: -1,
    left: '20%',
    right: '20%',
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    textAlign: 'center',
    marginTop: 1,
    fontFamily: Platform.select({
      web: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      default: undefined,
    }),
  },
});

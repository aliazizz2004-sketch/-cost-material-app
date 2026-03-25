import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExchangeRateProvider, useExchangeRate } from "./contexts/ExchangeRateContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import * as ImagePicker from "expo-image-picker";

// Components
import LanguageToggle from "./components/LanguageToggle";
import BottomNavBar from "./components/BottomNavBar";
import AppIcon from "./components/AppIcon";

// Features (Views)
import StorePurposeScreen from "./components/StorePurposeScreen";
import EstimationCalculator from "./components/EstimationCalculator";
import DeliveryCostEstimator from "./components/DeliveryCostEstimator";
import SupplierDirectory from "./components/SupplierDirectory";
import ProjectManager from "./components/ProjectManager";
import CommunityForum from "./components/CommunityForum";
import AIArchitect from "./components/AIArchitect";
import ARVisualizer from "./components/ARVisualizer";
import UserProfile from "./components/UserProfile";

import { colors, darkColors, spacing, typography, radius, shadows } from "./styles/theme";
import materialsData from "./data/materials";
import { recognizeMaterial } from "./services/aiRecognition";
import MaterialResultModal from "./components/MaterialResultModal";

function AppContent() {
  const { t, lang, isRTL } = useLanguage();
  const { rate, loading: rateLoading } = useExchangeRate();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const ku = lang === 'ku';

  const [currentView, setCurrentView] = useState("home");
  
  // Projects State
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // AI Modal
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [capturedImageUri, setCapturedImageUri] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("costMaterialProjects").then((v) => {
      if (v) {
        try { setProjects(JSON.parse(v)); } catch (e) {}
      }
    });
  }, []);

  // Central navigation handler used by BottomNavBar AND sub-screens
  const handleNavNavigate = useCallback((viewId) => {
    if (viewId === 'store') {
      setActiveProjectId(null);
      setCurrentView('storePurpose');
    } else {
      setCurrentView(viewId);
    }
  }, []);

  const openAiCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access needed.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, base64: true });
      if (!result.canceled && result.assets?.[0]) {
        processAiAsset(result.assets[0]);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  const processAiAsset = async (asset) => {
    setCapturedImageUri(asset.uri);
    setAiLoading(true);
    setAiModalVisible(true);
    try {
      const res = await recognizeMaterial(asset.base64);
      setAiResult(res);
    } catch {
      setAiResult({ matched: false, description: "AI failed to process image." });
    } finally {
      setAiLoading(false);
    }
  };

  // UI Datasets — with Kurdish translations
  const topActions = [
    { id: "ai", icon: "scan", title: ku ? "ناسینەوەی AI" : "AI Recognizer", desc: ku ? "سکان بکە بۆ ناسینەوەی مادە" : "Scan materials to identify", color: tc.accent, bg: "rgba(212,168,67,0.15)", onPress: openAiCamera },
    { id: "store", icon: "store", title: ku ? "کۆگای مادەکان" : "Material Store", desc: ku ? "کاتەلۆگ و لیستی مادەکان" : "Catalog & BOQ building", color: tc.info, bg: "rgba(52,152,219,0.15)", onPress: () => setCurrentView("storePurpose") },
    { id: "est", icon: "layers", title: ku ? "ژمێرەری خەمڵاندن" : "Estimation Calc", desc: ku ? "ژمێریاری ئەندازیاری وردەکاری" : "Detailed engineering calc", color: tc.success, bg: "rgba(46,204,113,0.15)", onPress: () => setCurrentView("estimation") },
  ];

  const extraActions = [
    { id: "aiArch", icon: "bot", title: ku ? "AI ئەندازیار" : "AI Architect", desc: ku ? "لیستی تەواوی مادەکان دروست بکە" : "Generate full BOQ list", color: "#DC2626", bg: "rgba(220,38,38,0.15)", onPress: () => setCurrentView("aiArchitect") },
    { id: "arViz", icon: "glasses", title: ku ? "بینەری AR" : "AR Visualizer", desc: ku ? "پێشبینینی ئامرازەکان لە بۆشاییدا" : "Preview tools in space", color: "#7C3AED", bg: "rgba(124,58,237,0.15)", onPress: () => setCurrentView("arVisualizer") },
    { id: "delivery", icon: "truck", title: ku ? "ژمێرەری گواستنەوە" : "Delivery Calc", desc: ku ? "تێچووی بارکردن بۆ شارەکان" : "Shipping across cities", color: "#059669", bg: "rgba(5,150,105,0.15)", onPress: () => setCurrentView("delivery") },
    { id: "suppliers", icon: "book", title: ku ? "دابینکەرەکان" : "Suppliers", desc: ku ? "پەیوەندی کردن بە فرۆشیارەوە" : "Connect with vendors", color: "#0891B2", bg: "rgba(8,145,178,0.15)", onPress: () => setCurrentView("suppliers") },
    { id: "projects", icon: "projects", title: ku ? "پڕۆژەکان" : "Projects", desc: ku ? "بەڕێوەبردنی شوێنەکانت" : "Manage your sites", color: "#D97706", bg: "rgba(217,119,6,0.15)", onPress: () => setCurrentView("projects") },
    { id: "community", icon: "chat", title: ku ? "کۆمەڵگا" : "Community", desc: ku ? "پرسیار بکە لە پسپۆڕەکان" : "Ask experts Q&A", color: tc.primary, bg: "rgba(10,22,40,0.15)", onPress: () => setCurrentView("community") },
  ];

  if (rateLoading && !rate) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tc.primary }]}>
        <ActivityIndicator size="large" color={tc.accent} />
      </View>
    );
  }

  // Router Blocks — each view gets the BottomNavBar unless it's a full-page modal
  const renderBottomNav = () => (
    <BottomNavBar currentView={currentView} onNavigate={handleNavNavigate} />
  );

  if (currentView === "storePurpose") {
    return (
      <View style={{ flex: 1 }}>
        <StorePurposeScreen onSelect={(purposes) => {
          // After selecting purposes, navigate to store or stay (the component handles its own catalog)
          // For now we just stay — StorePurposeScreen internally shows the catalog
        }} onBack={() => setCurrentView("home")} onNavigate={handleNavNavigate} />
      </View>
    );
  }
  if (currentView === "estimation") return <View style={{ flex: 1 }}><EstimationCalculator onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "delivery") return <View style={{ flex: 1 }}><DeliveryCostEstimator onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "suppliers") return <View style={{ flex: 1 }}><SupplierDirectory onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "projects") return <View style={{ flex: 1 }}><ProjectManager projects={projects} activeProjectId={activeProjectId} onNavigate={handleNavNavigate} onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "community") return <View style={{ flex: 1 }}><CommunityForum onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "aiArchitect") return <View style={{ flex: 1 }}><AIArchitect onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "arVisualizer") return <View style={{ flex: 1 }}><ARVisualizer onBack={() => setCurrentView("home")} />{renderBottomNav()}</View>;
  if (currentView === "profile") return <View style={{ flex: 1 }}><UserProfile onBack={() => setCurrentView("home")} projects={projects} />{renderBottomNav()}</View>;
  if (currentView === "aiHub") {
    // AI Hub — show AI tools
    return (
      <View style={[styles.container, { backgroundColor: tc.offWhite }]}>
        <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
        <View style={[styles.hero, { backgroundColor: tc.primary, paddingBottom: 30 }]}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.heroTitle}>{ku ? "ئامرازەکانی AI" : "AI Tools"}</Text>
                <Text style={styles.heroSub}>{ku ? "ئامرازە زیرەکەکان بۆ بیناسازی" : "Smart construction tools"}</Text>
              </View>
              <LanguageToggle />
            </View>
          </SafeAreaView>
        </View>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.mainGrid}>
            {[
              { id: "ai", icon: "scan", title: ku ? "ناسینەوەی AI" : "AI Recognizer", desc: ku ? "سکان بکە بۆ ناسینەوەی مادە" : "Scan materials to identify", color: tc.accent, bg: "rgba(212,168,67,0.15)", onPress: openAiCamera },
              { id: "aiArch", icon: "bot", title: ku ? "AI ئەندازیار" : "AI Architect", desc: ku ? "لیستی تەواوی مادەکان دروست بکە" : "Generate full BOQ list", color: "#DC2626", bg: "rgba(220,38,38,0.15)", onPress: () => setCurrentView("aiArchitect") },
              { id: "arViz", icon: "glasses", title: ku ? "بینەری AR" : "AR Visualizer", desc: ku ? "پێشبینینی ئامرازەکان لە بۆشاییدا" : "Preview tools in space", color: "#7C3AED", bg: "rgba(124,58,237,0.15)", onPress: () => setCurrentView("arVisualizer") },
            ].map(a => (
              <TouchableOpacity key={a.id} style={[styles.mainCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} onPress={a.onPress} activeOpacity={0.8}>
                 <View style={[styles.iconWrap, { backgroundColor: a.bg }]}><AppIcon name={a.icon} size={24} color={a.color} /></View>
                 <View style={styles.textWrap}>
                   <Text style={[styles.cardTitle, { color: tc.charcoal }]}>{a.title}</Text>
                   <Text style={styles.cardDesc}>{a.desc}</Text>
                 </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
        <MaterialResultModal visible={aiModalVisible} onClose={() => setAiModalVisible(false)} result={aiResult} loading={aiLoading} imageUri={capturedImageUri} onAddToList={() => {}} />
        {renderBottomNav()}
      </View>
    );
  }

  // Home Screen
  return (
    <View style={[styles.container, { backgroundColor: tc.offWhite }]}>
      <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: tc.primary }]}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.heroTitle}>{ku ? "زانیاری بیناسازی" : "Construction Intelligence"}</Text>
                <Text style={styles.heroSub}>{ku ? "بەڕێوەبردنی تێچووەکانت" : "Manage your projects seamlessly"}</Text>
              </View>
              <LanguageToggle />
            </View>
          </SafeAreaView>
        </View>

        {/* Stats Row */}
        <View style={styles.statsWrap}>
          <View style={[styles.statBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.statV, { color: tc.primary }]}>{materialsData.length}</Text>
            <Text style={[styles.statL, { color: tc.mediumGray }]}>{ku ? "مادەکان" : "Materials"}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.statV, { color: tc.primary }]}>{rate ? Math.round(rate) : "--"}</Text>
            <Text style={[styles.statL, { color: tc.mediumGray }]}>{ku ? "دینار / دۆلار" : "IQD / USD"}</Text>
          </View>
        </View>

        <View style={styles.mainGrid}>
          <Text style={[styles.sectionTitle, { color: tc.charcoal }]}>{ku ? "ئامرازە سەرەکییەکان" : "Core Tools"}</Text>
          {topActions.map(a => (
            <TouchableOpacity key={a.id} style={[styles.mainCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} onPress={a.onPress} activeOpacity={0.8}>
               <View style={[styles.iconWrap, { backgroundColor: a.bg }]}><AppIcon name={a.icon} size={24} color={a.color} /></View>
               <View style={styles.textWrap}>
                 <Text style={[styles.cardTitle, { color: tc.charcoal }]}>{a.title}</Text>
                 <Text style={styles.cardDesc}>{a.desc}</Text>
               </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.extraGridSection}>
          <Text style={[styles.sectionTitle, { color: tc.charcoal }]}>{ku ? "تایبەتمەندییە پیشەیییەکان" : "Pro Features"}</Text>
          <View style={styles.extraGrid}>
            {extraActions.map(a => (
              <TouchableOpacity key={a.id} style={[styles.extraCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} onPress={a.onPress} activeOpacity={0.8}>
                <View style={[styles.iconWrapSmall, { backgroundColor: a.bg }]}><AppIcon name={a.icon} size={20} color={a.color} /></View>
                <Text style={[styles.extraCardTitle, { color: tc.charcoal }]}>{a.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{a.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* AI Result Modal */}
      <MaterialResultModal visible={aiModalVisible} onClose={() => setAiModalVisible(false)} result={aiResult} loading={aiLoading} imageUri={capturedImageUri} onAddToList={() => {}} />

      {renderBottomNav()}
    </View>
  );
}

export default function App() {
  return (
    <ExchangeRateProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LanguageProvider>
    </ExchangeRateProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 40 },
  hero: { 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statsWrap: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -30, gap: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, ...shadows.card, alignItems: 'center' },
  statV: { fontSize: 22, fontWeight: '700' },
  statL: { fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  mainGrid: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  mainCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, ...shadows.card },
  iconWrap: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748B' },
  extraGridSection: { paddingHorizontal: 20, marginTop: 24 },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  extraCard: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, ...shadows.card },
  iconWrapSmall: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  extraCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
});

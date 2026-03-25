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

import { colors, darkColors, spacing, typography, radius, shadows } from "./styles/theme";
import materialsData from "./data/materials";
import { recognizeMaterial } from "./services/aiRecognition";
import MaterialResultModal from "./components/MaterialResultModal";

function AppContent() {
  const { t, lang, isRTL } = useLanguage();
  const { rate, loading: rateLoading } = useExchangeRate();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;

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

  // UI Datasets
  const topActions = [
    { id: "ai", icon: "scan", title: "AI Recognizer", desc: "Scan materials to identify", color: tc.accent, bg: "rgba(212,168,67,0.15)", onPress: openAiCamera },
    { id: "store", icon: "store", title: "Material Store", desc: "Catalog & BOQ building", color: tc.info, bg: "rgba(52,152,219,0.15)", onPress: () => setCurrentView("storePurpose") },
    { id: "est", icon: "layers", title: "Estimation Calc", desc: "Detailed engineering calc", color: tc.success, bg: "rgba(46,204,113,0.15)", onPress: () => setCurrentView("estimation") },
  ];

  const extraActions = [
    { id: "aiArch", icon: "bot", title: "AI Architect", desc: "Generate full BOQ list", color: "#DC2626", bg: "rgba(220,38,38,0.15)", onPress: () => setCurrentView("aiArchitect") },
    { id: "arViz", icon: "glasses", title: "AR Visualizer", desc: "Preview tools in space", color: "#7C3AED", bg: "rgba(124,58,237,0.15)", onPress: () => setCurrentView("arVisualizer") },
    { id: "delivery", icon: "truck", title: "Delivery Calc", desc: "Shipping across cities", color: "#059669", bg: "rgba(5,150,105,0.15)", onPress: () => setCurrentView("delivery") },
    { id: "suppliers", icon: "book", title: "Suppliers", desc: "Connect with vendors", color: "#0891B2", bg: "rgba(8,145,178,0.15)", onPress: () => setCurrentView("suppliers") },
    { id: "projects", icon: "projects", title: "Projects", desc: "Manage your sites", color: "#D97706", bg: "rgba(217,119,6,0.15)", onPress: () => setCurrentView("projects") },
    { id: "community", icon: "chat", title: "Community", desc: "Ask experts Q&A", color: tc.primary, bg: "rgba(10,22,40,0.15)", onPress: () => setCurrentView("community") },
  ];

  if (rateLoading && !rate) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tc.primary }]}>
        <ActivityIndicator size="large" color={tc.accent} />
      </View>
    );
  }

  // Router Blocks
  if (currentView === "storePurpose") return <StorePurposeScreen onNavigate={handleNavNavigate} onBack={() => setCurrentView("home")} />;
  if (currentView === "estimation") return <EstimationCalculator onBack={() => setCurrentView("home")} />;
  if (currentView === "delivery") return <DeliveryCostEstimator onBack={() => setCurrentView("home")} />;
  if (currentView === "suppliers") return <SupplierDirectory onBack={() => setCurrentView("home")} />;
  if (currentView === "projects") return <ProjectManager projects={projects} activeProjectId={activeProjectId} onNavigate={handleNavNavigate} onBack={() => setCurrentView("home")} />;
  if (currentView === "community") return <CommunityForum onBack={() => setCurrentView("home")} />;
  if (currentView === "aiArchitect") return <AIArchitect onBack={() => setCurrentView("home")} />;
  if (currentView === "arVisualizer") return <ARVisualizer onBack={() => setCurrentView("home")} />;

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
                <Text style={styles.heroTitle}>{lang === "ku" ? "زانیاری بیناسازی" : "Construction Intelligence"}</Text>
                <Text style={styles.heroSub}>{lang === "ku" ? "بەڕێوەبردنی تێچووەکانت" : "Manage your projects seamlessly"}</Text>
              </View>
              <LanguageToggle />
            </View>
          </SafeAreaView>
        </View>

        {/* Stats Row */}
        <View style={styles.statsWrap}>
          <View style={[styles.statBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.statV, { color: tc.primary }]}>{materialsData.length}</Text>
            <Text style={styles.statL}>Materials</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.statV, { color: tc.primary }]}>{rate ? Math.round(rate) : "--"}</Text>
            <Text style={styles.statL}>IQD / USD</Text>
          </View>
        </View>

        <View style={styles.mainGrid}>
          <Text style={[styles.sectionTitle, { color: tc.charcoal }]}>{lang === "ku" ? "ئامرازە سەرەکییەکان" : "Core Tools"}</Text>
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
          <Text style={[styles.sectionTitle, { color: tc.charcoal }]}>{lang === "ku" ? "زیاتر" : "Pro Features"}</Text>
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

      <BottomNavBar activeTab={currentView} onTabPress={setCurrentView} />
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
  statL: { fontSize: 12, color: '#64748B', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
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

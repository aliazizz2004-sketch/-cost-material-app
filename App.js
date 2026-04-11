import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView, Platform, Alert, BackHandler, Modal, TextInput } from "react-native";
import Animated from 'react-native-reanimated';
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
import MaterialCatalog from "./components/MaterialCatalog";
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
import AddToProjectCard from "./components/AddToProjectCard";
import { PageEnter, PageFadeIn } from "./components/animations";

// Wraps any view in a reanimated entering animation
function AnimatedPage({ children, style }) {
  return (
    <Animated.View style={[{ flex: 1 }, style]} entering={PageEnter}>
      {children}
    </Animated.View>
  );
}

function AppContent() {
  const { t, lang, isRTL, kuFont } = useLanguage();
  const { rate, loading: rateLoading, setManualRate } = useExchangeRate();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const ku = lang === 'ku';
  const ar = lang === 'ar';

  const [navStack, setNavStack] = useState(["home"]);
  const currentView = navStack[navStack.length - 1] || "home";

  // Projects State
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Lifted project creation state (persists across navigation)
  const [pendingProjectName, setPendingProjectName] = useState("");
  const [pendingProjectNote, setPendingProjectNote] = useState("");

  // Add-to-Project Cart
  const [projectCartItems, setProjectCartItems] = useState([]);
  const [projectCartSource, setProjectCartSource] = useState("");
  const [projectCartDelivery, setProjectCartDelivery] = useState(null);
  const [projectCartEstimation, setProjectCartEstimation] = useState(null);
  const [showProjectCart, setShowProjectCart] = useState(false);

  // AI Modal
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  const [globalQuantities, setGlobalQuantitiesState] = useState({});

  // *** SEPARATE project-store quantities — NEVER shared with the main store ***
  const [projectStoreQuantities, setProjectStoreQuantitiesState] = useState({});

  // Rate Edit Modal (cross-platform replacement for Alert.prompt)
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [rateInputValue, setRateInputValue] = useState("");

  const setGlobalQuantities = useCallback((value) => {
    setGlobalQuantitiesState(prev => {
      return typeof value === 'function' ? value(prev) : value;
    });
  }, []);

  const setProjectStoreQuantities = useCallback((value) => {
    setProjectStoreQuantitiesState(prev => {
      return typeof value === 'function' ? value(prev) : value;
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("costMaterialProjects").then((v) => {
      if (v) {
        try { setProjects(JSON.parse(v)); } catch (e) { }
      }
    });
  }, []);
  // Central navigation handler used by BottomNavBar AND sub-screens
  const handleNavNavigate = useCallback((viewId, projectId = null) => {
    // When going to main store (no project context), always clear MAIN store quantities
    // but never touch project store quantities
    if ((viewId === 'store' || viewId === 'storePurpose' || viewId === 'storeAll') && !projectId) {
      setActiveProjectId(null);
      setGlobalQuantitiesState({});  // clear main store
      // Do NOT clear projectStoreQuantities
    }

    if (projectId) {
      setActiveProjectId(projectId);
    }
    setNavStack(prev => {
      let nextView = viewId === 'store' ? 'storePurpose' : viewId;
      if (nextView === 'home') return ['home'];
      if (prev[prev.length - 1] === nextView) return prev;

      // If view is already in stack, jump back to it to clear intermediate history steps
      const existingIdx = prev.indexOf(nextView);
      if (existingIdx !== -1) {
        return prev.slice(0, existingIdx + 1);
      }

      // Make all subpages push sequentially for step-by-step back feature
      return [...prev, nextView];
    });
  }, []);

  const handleBack = useCallback(() => {
    setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : ["home"]);
  }, []);

  // Hardware Back Press Listener (Android)
  useEffect(() => {
    const onBackPress = () => {
      // If we are not on the home screen, go back entirely and prevent default
      if (navStack.length > 1) {
        handleBack();
        return true;
      }
      // On home screen, let default behavior happen (exit app)
      return false;
    };
    const backHandlerObj = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandlerObj.remove();
  }, [navStack, handleBack]);

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
    { id: "ai", icon: "scan", title: ar ? "تعرف AI" : ku ? "ناسینەوەی AI" : "AI Recognizer", desc: ar ? "مسح المواد وتحديدها" : ku ? "سکان بکە بۆ ناسینەوەی مادە" : "Scan materials to identify", color: tc.accent, bg: "rgba(212,168,67,0.15)", onPress: openAiCamera },
    { id: "store", icon: "store", title: ar ? "مخزن المواد" : ku ? "کۆگای مادەکان" : "Material Store", desc: ar ? "الكتالوج وبناء جدول الكميات" : ku ? "کاتەلۆگ و لیستی مادەکان" : "Catalog & BOQ building", color: tc.info, bg: "rgba(52,152,219,0.15)", onPress: () => handleNavNavigate("storePurpose") },
    { id: "est", icon: "layers", title: ar ? "حاسبة التقدير" : ku ? "ژمێرەری خەملاندن (زە\u0631عە)" : "Estimation Calc", desc: ar ? "حسابات هندسية تفصيلية" : ku ? "ژمێریاری ئەندازیاری وردەکاری" : "Detailed engineering calc", color: tc.success, bg: "rgba(46,204,113,0.15)", onPress: () => handleNavNavigate("estimation") },
  ];

  const extraActions = [
    { id: "aiArch", icon: "bot", title: ar ? "معمار AI" : ku ? "ئەندازیاری AI" : "AI Architect", desc: ar ? "إنشاء قائمة مواد كاملة" : ku ? "لیستی تەواوی مادەکان دروست بکە" : "Generate full BOQ list", color: "#DC2626", bg: "rgba(220,38,38,0.15)", onPress: () => handleNavNavigate("aiArchitect") },
    { id: "arViz", icon: "glasses", title: ar ? "مشاهد AR" : ku ? "بینەری AR" : "AR Visualizer", desc: ar ? "معاينة المواد قبل الشراء" : ku ? "پێشبینیی ئامرازەکان لە بۆشاییدا" : "Preview tools in space", color: "#7C3AED", bg: "rgba(124,58,237,0.15)", onPress: () => handleNavNavigate("arVisualizer") },
    { id: "delivery", icon: "truck", title: ar ? "حاسبة التوصيل" : ku ? "ژمێرەری گواستنەوە" : "Delivery Calc", desc: ar ? "تكلفة الشحن بين المدن" : ku ? "تێچووی بارکردن بۆ شارەکان" : "Shipping across cities", color: "#059669", bg: "rgba(5,150,105,0.15)", onPress: () => handleNavNavigate("delivery") },
    { id: "suppliers", icon: "book", title: ar ? "الموردون" : ku ? "دابینکەرەکان" : "Suppliers", desc: ar ? "تواصل مع الموردين" : ku ? "پەیوەندی کردن بە فرۆشیارەوە" : "Connect with vendors", color: "#0891B2", bg: "rgba(8,145,178,0.15)", onPress: () => handleNavNavigate("suppliers") },
    { id: "projects", icon: "projects", title: ar ? "المشاريع" : ku ? "پ\u0631ۆژەکان" : "Projects", desc: ar ? "إدارة مشاريعك" : ku ? "بە\u0631ێوەبردنی شوێنەکانت" : "Manage your sites", color: "#D97706", bg: "rgba(217,119,6,0.15)", onPress: () => handleNavNavigate("projects") },
    { id: "community", icon: "chat", title: ar ? "المجتمع" : ku ? "کۆمەڵگا" : "Community", desc: ar ? "اسأل الخبراء" : ku ? "پرسیار بکە لە پسپۆ\u0631ەکان" : "Ask experts Q&A", color: tc.primary, bg: "rgba(10,22,40,0.15)", onPress: () => handleNavNavigate("community") },
  ];

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleSaveDeliveryToProject = useCallback((str, costUSD) => {
    if (!activeProjectId) return;
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          deliveryStr: str,
          deliveryCostUSD: costUSD || 0,
          totalCostUSD: (p.totalCostUSD || 0) + (costUSD || 0) - (p.deliveryCostUSD || 0)
        };
      }
      return p;
    });
    setProjects(updated);
    AsyncStorage.setItem("costMaterialProjects", JSON.stringify(updated));
  }, [activeProjectId, projects]);

  const handleSaveEstimationToProject = useCallback((matId, estStr) => {
    if (!activeProjectId) return;
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const newEsts = { ...p.estimations, [matId]: estStr };
        return { ...p, estimations: newEsts };
      }
      return p;
    });
    setProjects(updated);
    AsyncStorage.setItem("costMaterialProjects", JSON.stringify(updated));
  }, [activeProjectId, projects]);

  // ═══ Unified Add-to-Project handler ═══
  const handleShowProjectCart = useCallback((items, source, delivery = null, estimation = null) => {
    setProjectCartItems(items || []);
    setProjectCartSource(source || "");
    setProjectCartDelivery(delivery);
    setProjectCartEstimation(estimation);
    setShowProjectCart(true);
  }, []);

  const handleConfirmAddToProject = useCallback((items) => {
    if (!activeProjectId) {
      // No active project — create one or show alert
      const msg = lang === 'ar' ? 'الرجاء إنشاء أو فتح مشروع أولاً.' : lang === 'ku' ? 'تکایە سەرەتا پڕۆژەیەک دروست بکە یان کردنەوە بکە.' : 'Please create or open a project first.';
      Alert.alert('⚠️', msg);
      setShowProjectCart(false);
      return;
    }

    // Capture source from state at call time to avoid stale closure bug
    const currentSource = projectCartSource;
    const isStoreSource = currentSource === 'Material Store' || currentSource === 'کۆگای مادەکان' || currentSource === 'مخزن المواد';

    const updated = projects.map(p => {
      if (p.id !== activeProjectId) return p;

      // Merge new material items into existing project items
      let existingItems = [...(p.items || [])];
      
      if (isStoreSource) {
        // Material Store passes the absolute total quantities for the project
        existingItems = items.map(i => ({ id: i.id, qty: i.qty }));
      } else {
        // Other tools (like AI, Estimation, Delivery) pass deltas to add to existing totals
        (items || []).forEach(newItem => {
          const idx = existingItems.findIndex(e => e.id === newItem.id);
          if (idx >= 0) {
            existingItems[idx] = { ...existingItems[idx], qty: existingItems[idx].qty + (newItem.qty || 1) };
          } else {
            existingItems.push({ id: newItem.id, qty: newItem.qty || 1 });
          }
        });
      }

      // Recalculate total cost from items
      let totalCost = 0;
      existingItems.forEach(item => {
        const mat = materialsData.find(m => m.id === item.id);
        if (mat) totalCost += mat.basePrice * item.qty;
      });

      // Add delivery cost if present
      const delivCost = projectCartDelivery ? (projectCartDelivery.costUSD || 0) : (p.deliveryCostUSD || 0);
      const delivStr = projectCartDelivery ? (projectCartDelivery.label || p.deliveryStr) : p.deliveryStr;

      // Add estimation if present
      const ests = { ...(p.estimations || {}) };
      if (projectCartEstimation) {
        ests[Date.now()] = projectCartEstimation;
      }

      return {
        ...p,
        items: existingItems,
        totalCostUSD: totalCost + delivCost,
        deliveryCostUSD: delivCost,
        deliveryStr: delivStr || p.deliveryStr,
        estimations: ests,
        date: new Date().toISOString(),
      };
    });

    setProjects(updated);
    AsyncStorage.setItem("costMaterialProjects", JSON.stringify(updated)).catch(() => {});

    // Update project-store quantities (NOT main store globalQuantities)
    const proj = updated.find(p => p.id === activeProjectId);
    if (proj) {
      const qtys = {};
      proj.items.forEach(it => { qtys[it.id] = it.qty; });
      setProjectStoreQuantitiesState(qtys);  // project store only
    }

    setShowProjectCart(false);
    setProjectCartItems([]);

    // Navigate to projects page automatically and completely clear intermediate history pages
    setNavStack(prev => {
      const pIdx = prev.indexOf('projects');
      if (pIdx !== -1) {
        return prev.slice(0, pIdx + 1);
      }
      return ['home', 'projects'];
    });
  }, [activeProjectId, projects, projectCartDelivery, projectCartEstimation, lang, projectCartSource]);

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

  // Determine active view content
  let pageContent = null;
  switch(currentView) {
    case "storePurpose":
      pageContent = <AnimatedPage key="sp"><StorePurposeScreen onSelect={() => {}} onBack={handleBack} onNavigate={handleNavNavigate} globalQuantities={globalQuantities} setGlobalQuantities={setGlobalQuantities} /></AnimatedPage>;
      break;
    case "storeAll":
      pageContent = <AnimatedPage key="sa"><MaterialCatalog filterPurposes={[]} onBack={handleBack} onNavigate={handleNavNavigate} globalQuantities={activeProjectId ? projectStoreQuantities : globalQuantities} setGlobalQuantities={activeProjectId ? setProjectStoreQuantities : setGlobalQuantities} onAddToProject={handleShowProjectCart} activeProjectId={activeProjectId} materials={materialsData} /></AnimatedPage>;
      break;
    case "estimation":
      pageContent = <AnimatedPage key="est"><EstimationCalculator onBack={handleBack} activeProject={activeProject} onAutoSave={handleSaveEstimationToProject} materials={materialsData} onAddToProject={handleShowProjectCart} activeProjectId={activeProjectId} /></AnimatedPage>;
      break;
    case "delivery":
      pageContent = <AnimatedPage key="del"><DeliveryCostEstimator onBack={handleBack} activeProjectName={activeProject?.name} onAutoSave={handleSaveDeliveryToProject} storeQuantities={activeProject?.items?.reduce((acc, it) => ({ ...acc, [it.id]: it.qty }), {})} storeMaterials={materialsData} onAddToProject={handleShowProjectCart} activeProjectId={activeProjectId} /></AnimatedPage>;
      break;
    case "suppliers":
      pageContent = <AnimatedPage key="sup"><SupplierDirectory onBack={handleBack} /></AnimatedPage>;
      break;
    case "projects":
      pageContent = <AnimatedPage key="proj"><ProjectManager
        projects={projects}
        setProjects={setProjects}
        materials={materialsData}
        currentQuantities={{}}
        setGlobalQuantities={() => {}}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        onNavigate={handleNavNavigate}
        onGoToStore={(pid) => {
          // Load project's saved items into the project store (isolated from main store)
          const proj = projects.find(p => p.id === pid);
          const qtys = {};
          if (proj && proj.items) {
            proj.items.forEach(it => { qtys[it.id] = it.qty; });
          }
          setProjectStoreQuantitiesState(qtys);
          handleNavNavigate('storeAll', pid);
        }}
        onGoToDelivery={(pid) => handleNavNavigate('delivery', pid)}
        onGoToEstimation={(pid) => handleNavNavigate('estimation', pid)}
        onBack={handleBack}
        onLoadProject={(qtys) => {
          // onLoadProject is for project store, load into projectStoreQuantities only
          setProjectStoreQuantitiesState(qtys);
          handleNavNavigate('storeAll');
        }}
        onOpenAiCamera={openAiCamera}
        pendingProjectName={pendingProjectName}
        setPendingProjectName={setPendingProjectName}
        pendingProjectNote={pendingProjectNote}
        setPendingProjectNote={setPendingProjectNote}
      /></AnimatedPage>;
      break;
    case "community":
      pageContent = <AnimatedPage key="com"><CommunityForum onBack={handleBack} /></AnimatedPage>;
      break;
    case "aiArchitect":
      pageContent = <AnimatedPage key="aia"><AIArchitect onBack={handleBack} onViewStore={() => handleNavNavigate("storeAll")} onAddToProject={handleShowProjectCart} activeProjectId={activeProjectId} /></AnimatedPage>;
      break;
    case "arVisualizer":
      pageContent = <AnimatedPage key="arv"><ARVisualizer onBack={handleBack} onAddToStore={(qtys) => { setGlobalQuantities(prev => ({ ...prev, ...qtys })); handleNavNavigate("storeAll"); }} onAddToProject={handleShowProjectCart} activeProjectId={activeProjectId} /></AnimatedPage>;
      break;
    case "profile":
      pageContent = <AnimatedPage key="prof"><UserProfile onBack={handleBack} projects={projects} /></AnimatedPage>;
      break;
    case "aiHub":
      pageContent = (
        <View style={[{ flex: 1, backgroundColor: tc.offWhite }]}>
          <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
          <View style={[styles.hero, { backgroundColor: tc.primary, paddingBottom: 30 }]}>
            <SafeAreaView>
              <View style={styles.headerTop}>
                <View style={styles.headerRow}>
                  <Text style={[styles.heroTitle]}>
                    {ar ? "أدوات AI" : ku ? "ئامرازەکانی AI" : "AI Tools"}
                  </Text>
                </View>
                <View style={styles.headerRow}>
                  <Text style={styles.heroSub}>
                    {ar ? "أدوات بناء ذكية" : ku ? "ئامرازە زیرەکەکان بۆ بیناسازی" : "Smart construction tools"}
                  </Text>
                  <LanguageToggle />
                </View>
              </View>
            </SafeAreaView>
          </View>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.mainGrid}>
              {[
                { id: "ai", icon: "scan", title: ar ? "تعرف AI" : ku ? "ناسینەوەی AI" : "AI Recognizer", desc: ar ? "مسح المواد" : ku ? "سکان بکە بۆ ناسینەوەی مادە" : "Scan materials to identify", color: tc.accent, bg: "rgba(212,168,67,0.15)", onPress: openAiCamera },
                { id: "aiArch", icon: "bot", title: ar ? "معمار AI" : ku ? "ئەندازیاری AI" : "AI Architect", desc: ar ? "إنشاء قائمة مواد كاملة" : ku ? "لیستی تەواوی مادەکان دروست بکە" : "Generate full BOQ list", color: "#DC2626", bg: "rgba(220,38,38,0.15)", onPress: () => handleNavNavigate("aiArchitect") },
                { id: "arViz", icon: "glasses", title: ar ? "مشاهد AR" : ku ? "بینەری AR" : "AR Visualizer", desc: ar ? "معاينة المواد قبل الشراء" : ku ? "پێشبینیی ئامرازەکان لە بۆشاییدا" : "Preview tools in space", color: "#7C3AED", bg: "rgba(124,58,237,0.15)", onPress: () => handleNavNavigate("arVisualizer") },
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
        </View>
      );
      break;
    default:
      // home
      pageContent = (
        <View style={[{ flex: 1, backgroundColor: tc.offWhite }]}>
          <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Hero Header */}
            <View style={[styles.hero, { backgroundColor: tc.primary }]}>
              <SafeAreaView>
                <View style={styles.headerTop}>
                  <View style={styles.headerRow}>
                    <Text style={[styles.heroTitle, kuFont()]} numberOfLines={1} adjustsFontSizeToFit>
                      {ar ? "ذكاء البناء" : ku ? "زانیاری بیناسازی" : "Construction Intelligence"}
                    </Text>
                  </View>
                  <View style={styles.headerRow}>
                    <Text style={[styles.heroSub, kuFont()]}>
                      {ar ? "إدارة مشاريعك بسهولة" : ku ? "بەریوەبردنی تێچووەکانت" : "Manage your projects seamlessly"}
                    </Text>
                    <LanguageToggle />
                  </View>
                </View>
              </SafeAreaView>
            </View>

            {/* Stats Row */}
            <View style={styles.statsWrap}>
              <View style={[styles.statBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[styles.statV, { color: tc.primary }]}>{materialsData.length}</Text>
                <Text style={[styles.statL, { color: tc.mediumGray }, kuFont()]}>{ar ? "المواد" : ku ? "مادەکان" : "Materials"}</Text>
              </View>
              <TouchableOpacity style={[styles.statBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} activeOpacity={0.7} onPress={() => {
                const currentStr = rate ? Math.round(rate * 100).toString() : "155000";
                if (Platform.OS === 'web') {
                  const val = window.prompt(ar ? "سعر الصرف دينار لـ 100$:" : ku ? "نرخی 100$ بە دینار:" : "IQD for $100:", currentStr);
                  if (val && !isNaN(Number(val)) && Number(val) > 0) setManualRate(Number(val) / 100);
                } else {
                  setRateInputValue(currentStr);
                  setRateModalVisible(true);
                }
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: rate ? '#22c55e' : '#f97316' }} />
                  <Text style={{ fontSize: 9, color: rate ? '#22c55e' : '#f97316', fontWeight: '800', letterSpacing: 0.5 }}>
                    {rate ? (ar ? 'مباشر' : ku ? 'ڕاستەوخۆ' : 'LIVE') : (ar ? 'غير متصل' : ku ? 'ئۆفلاین' : 'OFFLINE')}
                  </Text>
                </View>
                <Text style={[styles.statV, { color: tc.primary, fontSize: 20 }]}>
                  {rate ? Math.round(rate * 100).toLocaleString() : "--"}
                </Text>
                <Text style={[styles.statL, { color: tc.mediumGray }, kuFont()]}>{ar ? "دينار / 100$" : ku ? "دینار / 100$" : "IQD / $100"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainGrid}>
              <Text style={[styles.sectionTitle, { color: tc.charcoal }, kuFont()]}>{ar ? "الأدوات الرئيسية" : ku ? "ئامرازە سەرەکییەکان" : "Core Tools"}</Text>
              {topActions.map(a => (
                <TouchableOpacity key={a.id} style={[styles.mainCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} onPress={a.onPress} activeOpacity={0.8}>
                  <View style={[styles.iconWrap, { backgroundColor: a.bg }]}><AppIcon name={a.icon} size={24} color={a.color} /></View>
                  <View style={styles.textWrap}>
                    <Text style={[styles.cardTitle, { color: tc.charcoal }, kuFont()]}>{a.title}</Text>
                    <Text style={[styles.cardDesc, kuFont()]}>{a.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.extraGridSection}>
              <Text style={[styles.sectionTitle, { color: tc.charcoal }, kuFont()]}>{ar ? "ميزات احترافية" : ku ? "تایبەتمەندییە پیشەیییەکان" : "Pro Features"}</Text>
              <View style={styles.extraGrid}>
                {extraActions.map(a => (
                  <TouchableOpacity key={a.id} style={[styles.extraCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} onPress={a.onPress} activeOpacity={0.8}>
                    <View style={[styles.iconWrapSmall, { backgroundColor: a.bg }]}><AppIcon name={a.icon} size={20} color={a.color} /></View>
                    <Text style={[styles.extraCardTitle, { color: tc.charcoal }, kuFont()]}>{a.title}</Text>
                    <Text style={[styles.cardDesc, kuFont()]} numberOfLines={2}>{a.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      );
      break;
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.offWhite }]}>
      {/* 1. Main Content */}
      {pageContent}

      {/* 2. Global AI Result Modal (available everywhere) */}
      <MaterialResultModal visible={aiModalVisible} onClose={() => setAiModalVisible(false)} result={aiResult} loading={aiLoading} imageUri={capturedImageUri} onAddToList={(matId) => {
        const mat = materialsData.find(m => m.id === matId);
        if (mat && activeProjectId) {
          handleShowProjectCart([{ id: mat.id, name: mat.nameEN, nameKU: mat.nameKU, qty: 1, unitPrice: mat.basePrice, unit: mat.unit }], lang === 'ar' ? 'تعرف AI' : lang === 'ku' ? 'ناسینەوەی AI' : 'AI Recognizer');
        }
        setGlobalQuantities(prev => ({ ...prev, [matId]: (prev[matId] || 0) + 1 }));
        setAiModalVisible(false);
      }} />

      {/* 3. Global Add to Project Cart (available everywhere) */}
      <AddToProjectCard visible={showProjectCart} onClose={() => setShowProjectCart(false)} items={projectCartItems} onConfirm={handleConfirmAddToProject} source={projectCartSource} deliveryCost={projectCartDelivery} estimationText={projectCartEstimation} />

      {/* 4. Global Cross-platform Exchange Rate Edit Modal */}
      <Modal visible={rateModalVisible} transparent animationType="fade" onRequestClose={() => setRateModalVisible(false)}>
        <View style={styles.rateModalOverlay}>
          <View style={[styles.rateModalBox, { backgroundColor: tc.card }]}>
            <Text style={[styles.rateModalTitle, { color: tc.charcoal }]}>
              {ar ? "تغيير سعر الصرف" : ku ? "گۆ\u0631ینی نرخی دۆلار" : "Change Exchange Rate"}
            </Text>
            <Text style={[styles.rateModalSubtitle, { color: tc.mediumGray }]}>
              {ar ? 'أدخل قيمة 100$ بالدينار العراقي' : ku ? 'نرخی 100$ بە دینارێکی عێراقی بنووسە' : 'Enter IQD value for $100'}
            </Text>
            <TextInput
              style={[styles.rateModalInput, { color: tc.charcoal, borderColor: tc.cardBorder, backgroundColor: tc.offWhite }]}
              value={rateInputValue}
              onChangeText={setRateInputValue}
              keyboardType="numeric"
              placeholder="155000"
              placeholderTextColor={tc.mediumGray}
              autoFocus
            />
            <View style={styles.rateModalBtns}>
              <TouchableOpacity style={[styles.rateModalBtn, styles.rateModalBtnCancel, { borderColor: tc.cardBorder }]} onPress={() => setRateModalVisible(false)} activeOpacity={0.8}>
                <Text style={[styles.rateModalBtnText, { color: tc.mediumGray }]}>{ku ? "پاشگەزبوونەوە" : ar ? "إلغاء" : "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rateModalBtn, styles.rateModalBtnOk, { backgroundColor: tc.primary }]} onPress={() => {
                const val = rateInputValue.trim();
                if (val && !isNaN(Number(val)) && Number(val) > 0) {
                  setManualRate(Number(val) / 100); // IQD per $100 → rate per $1
                }
                setRateModalVisible(false);
              }} activeOpacity={0.85}>
                <Text style={[styles.rateModalBtnText, { color: '#FFF' }]}>{ku ? "باشە" : ar ? "موافق" : "OK"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Bottom Nav */}
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
  headerTop: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', flexShrink: 1 },
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
  // Rate Modal
  rateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  rateModalBox: { width: '100%', borderRadius: 20, padding: 24, ...shadows.card },
  rateModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  rateModalSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  rateModalInput: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  rateModalBtns: { flexDirection: 'row', gap: 12 },
  rateModalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  rateModalBtnCancel: { borderWidth: 1.5 },
  rateModalBtnOk: {},
  rateModalBtnText: { fontSize: 15, fontWeight: '700' },
});

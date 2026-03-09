import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ExchangeRateProvider, useExchangeRate } from "./contexts/ExchangeRateContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import SearchBar from "./components/SearchBar";
import MaterialCard from "./components/MaterialCard";
import TotalCostBar from "./components/TotalCostBar";
import LanguageToggle from "./components/LanguageToggle";
import CameraButton from "./components/CameraButton";
import MaterialResultModal from "./components/MaterialResultModal";
import { recognizeMaterial } from "./services/aiRecognition";
import materialsData from "./data/materials";
import { colors, spacing, typography, radius, shadows } from "./styles/theme";

function AppContent() {
  const { t, lang, isRTL } = useLanguage();
  const { rate, loading } = useExchangeRate();
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState({});
  const [activeSort, setActiveSort] = useState("default");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const flatListRef = useRef(null);

  // AI Camera state
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [capturedImageUri, setCapturedImageUri] = useState(null);

  const materialCategories = [
    { id: "Wood", label: "🪵 " + t("wood") },
    { id: "Concrete", label: "🏗️ " + t("concrete") },
    { id: "Binding", label: "📦 " + t("binding") },
    { id: "Masonry", label: "🧱 " + t("masonry") },
    { id: "Plumbing", label: "🚰 " + t("plumbing") },
    { id: "Electrical", label: "⚡ " + t("electrical") },
  ];

  const sortDirections = [
    { id: "default", label: "📋 " + t("sortDefault") },
    { id: "cheap", label: "💰 " + t("sortCheapest") },
    { id: "expensive", label: "💎 " + t("sortExpensive") },
    { id: "good", label: "✅ " + t("sortGood") },
    { id: "bad", label: "❌ " + t("sortBad") },
  ];

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleQuantityChange = useCallback((id, newQty) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, newQty),
    }));
  }, []);

  const filteredMaterials = useMemo(() => {
    let result = [...materialsData];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.nameEN.toLowerCase().includes(q) ||
          m.nameKU.includes(q) ||
          m.categoryEN.toLowerCase().includes(q) ||
          m.categoryKU.includes(q)
      );
    }

    // 2. Multi-Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter(m =>
        selectedCategories.includes(m.categoryEN) ||
        selectedCategories.some(cat => m.materials?.some(mat => mat.toLowerCase().includes(cat.toLowerCase())))
      );
    }

    // 3. Sorting
    if (activeSort === "cheap") {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (activeSort === "expensive") {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (activeSort === "good") {
      result.sort((a, b) => a.thermalConductivity - b.thermalConductivity);
    } else if (activeSort === "bad") {
      result.sort((a, b) => b.thermalConductivity - a.thermalConductivity);
    }

    return result;
  }, [searchQuery, activeSort, selectedCategories]);

  const handleSelectItem = useCallback((id) => {
    const index = filteredMaterials.findIndex(m => m.id === id);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }
  }, [filteredMaterials]);

  const totalItemsSelected = useMemo(() => {
    return Object.values(quantities).filter((v) => v > 0).length;
  }, [quantities]);

  const clearAll = useCallback(() => {
    setQuantities({});
  }, []);

  const handleCameraPress = useCallback(async () => {
    try {
      const isWeb = Platform.OS === "web";
      let result;

      if (isWeb) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (libStatus.status !== "granted") {
            Alert.alert(
              lang === "ku" ? "ڕێگەپێدان پێویستە" : "Permission Required",
              lang === "ku"
                ? "تکایە ڕێگە بە کامێرا یان گالێری بدە"
                : "Please allow camera or gallery access"
            );
            return;
          }
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          });
        } else {
          result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          });
        }
      }

      if (result && !result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedImageUri(asset.uri);
        setAiResult(null);
        setAiLoading(true);
        setAiModalVisible(true);

        try {
          const aiResponse = await recognizeMaterial(asset.base64);
          setAiResult(aiResponse);
        } catch (aiError) {
          console.error("AI recognition error:", aiError);
          setAiResult({
            matched: false,
            material: null,
            confidence: 0,
            description: "AI analysis failed. Please check your internet connection and try again.",
            engine: "error",
          });
        } finally {
          setAiLoading(false);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      setAiLoading(false);
      setAiModalVisible(false);
      Alert.alert(
        lang === "ku" ? "هەڵە" : "Error",
        lang === "ku"
          ? "کێشە لە کردنەوەی کامێرا"
          : "Failed to open camera: " + error.message
      );
    }
  }, [lang]);

  const handleAddToList = useCallback((materialId) => {
    setQuantities((prev) => ({
      ...prev,
      [materialId]: (prev[materialId] || 0) + 1,
    }));
    setAiModalVisible(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setAiModalVisible(false);
    setAiResult(null);
    setAiLoading(false);
  }, []);

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (loading && !rate) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
          <Text style={styles.loadingSubtext}>{t("poweredBy")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <SafeAreaView>
          <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
            <View style={isRTL ? styles.headerTextRTL : undefined}>
              <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t("appTitle")}</Text>
              <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>{t("appSubtitle")}</Text>
            </View>
            <LanguageToggle />
          </View>
        </SafeAreaView>
      </View>

      <View style={[styles.searchRow, isRTL && styles.rowRTL]}>
        <View style={{ flex: 1 }}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity
          style={styles.sortIconButton}
          onPress={() => setIsSortModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.sortIconEmoji}>⚖️</Text>
          <Text style={styles.sortIconText}>{t("sortBy")}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSortModalVisible(false)}
        >
          <View style={styles.sortModalContent}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>{t("sortBy")}</Text>
              <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                <Text style={styles.sortModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalColumns, isRTL && styles.rowRTL]}>
              <View style={styles.modalColumn}>
                <Text style={[styles.columnLabel, isRTL && styles.textRTL]}>
                  {lang === "ku" ? "مادەکان" : "Materials"}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {materialCategories.map((item) => {
                    const isActive = selectedCategories.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.sortModalItem, isActive && styles.sortModalItemActive]}
                        onPress={() => toggleCategory(item.id)}
                      >
                        <Text style={[styles.sortModalItemText, isActive && styles.sortModalItemTextActive]} numberOfLines={1}>
                          {item.label}
                        </Text>
                        {isActive && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnDivider} />

              <View style={styles.modalColumn}>
                <Text style={[styles.columnLabel, isRTL && styles.textRTL]}>
                  {lang === "ku" ? "ڕیزکردن" : "Price/Order"}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {sortDirections.map((item) => {
                    const isActive = activeSort === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.sortModalItem, isActive && styles.sortModalItemActive]}
                        onPress={() => setActiveSort(item.id)}
                      >
                        <Text style={[styles.sortModalItemText, isActive && styles.sortModalItemTextActive]} numberOfLines={1}>
                          {item.label}
                        </Text>
                        {isActive && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsSortModalVisible(false)}>
              <Text style={styles.applyBtnText}>{lang === "ku" ? "جێبەجێکردن" : "Apply Filters"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.listHeader, isRTL && styles.listHeaderRTL]}>
        <Text style={[styles.listTitle, isRTL && styles.textRTL]}>
          {t("materials")} ({filteredMaterials.length})
        </Text>
        {totalItemsSelected > 0 && (
          <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
            <Text style={styles.clearText}>{t("clearAll")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredMaterials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("noResults")}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredMaterials}
          renderItem={({ item }) => (
            <MaterialCard
              material={item}
              quantity={quantities[item.id] || 0}
              onQuantityChange={handleQuantityChange}
              allMaterials={materialsData}
              onSelectItem={handleSelectItem}
            />
          )}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(data, index) => ({ length: 220, offset: 220 * index, index })}
        />
      )}

      <CameraButton onPress={handleCameraPress} />

      <MaterialResultModal
        visible={aiModalVisible}
        onClose={handleCloseModal}
        result={aiResult}
        loading={aiLoading}
        imageUri={capturedImageUri}
        onAddToList={handleAddToList}
      />

      <TotalCostBar quantities={quantities} materials={materialsData} />
    </View>
  );
}

export default function App() {
  return (
    <ExchangeRateProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ExchangeRateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    ...typography.subtitle,
    color: colors.accent,
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    ...typography.tiny,
    color: colors.mediumGray,
    marginTop: spacing.sm,
  },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 40 : 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
  },
  headerContentRTL: {
    flexDirection: "row-reverse",
  },
  headerTextRTL: {
    alignItems: "flex-end",
  },
  headerTitle: {
    ...typography.hero,
    color: colors.white,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.mediumGray,
    marginTop: 2,
  },
  textRTL: {
    textAlign: "right",
  },

  // List header
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  listHeaderRTL: {
    flexDirection: "row-reverse",
  },
  listTitle: {
    ...typography.subtitle,
    color: colors.charcoal,
  },
  clearText: {
    ...typography.caption,
    color: colors.error,
  },

  // List
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.mediumGray,
  },

  // Sort & Search Row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  sortIconButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  sortIconEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  sortIconText: {
    ...typography.caption,
    color: colors.darkGray,
    fontWeight: "600",
  },

  // Sort Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sortModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "85%",
  },
  sortModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  sortModalTitle: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  sortModalClose: {
    fontSize: 20,
    color: colors.mediumGray,
    padding: 4,
  },
  modalColumns: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  modalColumn: {
    flex: 1,
  },
  columnLabel: {
    ...typography.tiny,
    color: colors.mediumGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    fontWeight: "700",
  },
  columnDivider: {
    width: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  sortModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  sortModalItemActive: {
    backgroundColor: colors.offWhite,
  },
  sortModalItemText: {
    ...typography.caption,
    color: colors.charcoal,
  },
  sortModalItemTextActive: {
    color: colors.accent,
    fontWeight: "700",
  },
  checkIcon: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
  },
  applyBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    ...shadows.card,
  },
  applyBtnText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
  },
});

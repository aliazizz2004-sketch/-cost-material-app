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
import { colors, spacing, typography, radius } from "./styles/theme";

function AppContent() {
  const { t, lang, isRTL } = useLanguage();
  const { rate, loading } = useExchangeRate();
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState({});
  const [sortBy, setSortBy] = useState("default"); // default, cheap, expensive, good, bad
  const flatListRef = useRef(null);

  // AI Camera state
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [capturedImageUri, setCapturedImageUri] = useState(null);

  const handleQuantityChange = useCallback((id, newQty) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, newQty),
    }));
  }, []);

  const filteredMaterials = useMemo(() => {
    let result = [...materialsData];

    // Search
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

    // Sort
    if (sortBy === "cheap") {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "expensive") {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === "good") {
      result.sort((a, b) => a.thermalConductivity - b.thermalConductivity);
    } else if (sortBy === "bad") {
      result.sort((a, b) => b.thermalConductivity - a.thermalConductivity);
    }

    return result;
  }, [searchQuery, sortBy]);

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

  // Camera AI - works immediately, no setup needed
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

        // Send to AI for recognition
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

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
            <View style={isRTL ? styles.headerTextRTL : undefined}>
              <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t("appTitle")}</Text>
              <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>
                {t("appSubtitle")}
              </Text>
            </View>
            <LanguageToggle />
          </View>
        </SafeAreaView>
      </View>

      {/* Search */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Sorting */}
      <View style={styles.sortContainer}>
        <Text style={[styles.sortTitle, isRTL && styles.textRTL]}>{t("sortBy")}:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.sortScroll, isRTL && styles.sortScrollRTL]}
        >
          {[
            { id: "default", label: t("materials") },
            { id: "cheap", label: t("sortCheapest") },
            { id: "expensive", label: t("sortExpensive") },
            { id: "good", label: t("sortGood") },
            { id: "bad", label: t("sortBad") },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.sortChip,
                sortBy === item.id && styles.sortChipActive,
              ]}
              onPress={() => setSortBy(item.id)}
            >
              <Text style={[styles.sortChipText, sortBy === item.id && styles.sortChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Material count & clear */}
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

      {/* Material list */}
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
          getItemLayout={(data, index) => (
            { length: 220, offset: 220 * index, index }
          )}
        />
      )}

      {/* Camera AI FAB */}
      <CameraButton onPress={handleCameraPress} />

      {/* AI Result Modal */}
      <MaterialResultModal
        visible={aiModalVisible}
        onClose={handleCloseModal}
        result={aiResult}
        loading={aiLoading}
        imageUri={capturedImageUri}
        onAddToList={handleAddToList}
      />

      {/* Bottom total bar */}
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

  // Sort
  sortContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sortTitle: {
    ...typography.tiny,
    color: colors.mediumGray,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sortScroll: {
    paddingVertical: 4,
  },
  sortScrollRTL: {
    flexDirection: "row-reverse",
  },
  sortChip: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
  },
  sortChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sortChipText: {
    ...typography.caption,
    color: colors.darkGray,
    fontWeight: "600",
  },
  sortChipTextActive: {
    color: colors.white,
  },
});

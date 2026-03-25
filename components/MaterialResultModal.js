import React, { useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { getBrandLinks } from "../data/brandLinks";
import materials from "../data/materials";

export default function MaterialResultModal({
  visible,
  onClose,
  result,
  loading,
  imageUri,
  onAddToList,
  onSelectItem,
}) {
  const { lang, t, isRTL } = useLanguage();
  const { rate } = useExchangeRate();

  const copy = useMemo(
    () =>
      lang === "ku"
        ? {
            analyzingTitle: "AI خەریکی شیکردنەوەی مادەکەیە",
            analyzingSteps: [
              "ناسینەوەی جۆری مادە و پێکهاتەکەی",
              "هەڵسەنگاندنی تایبەتمەندی و بەکارهێنانەکانی",
              "ئامادەکردنی پێشنیار و هەڵبژاردەی باشتر بە کوردی",
            ],
            confidence: "ئاستی دڵنیایی",
            category: "پۆل",
            details: "ناساندن",
            usage: "بەکارهێنانە سەرەکییەکان",
            properties: "تایبەتمەندییە سەرەکییەکان",
            visual: "نیشانە دیارەکان",
            alternatives: "هاوشێوەکان",
            cheaper: "هەڵبژاردەی هەرزانتر",
            recommended: "پێشنیاری باشتر",
            add: "زیادکردن بۆ لیستی تێچوو",
            noMatchTitle: "نەناسراو",
            noMatchBody: "AI نەتوانی مادەکە بە دڵنیایی دیاری بکات. تکایە وێنەیەکی ڕوونتر بگرە.",
            priceIqd: "نرخی سەرچاوە (د.ع)",
            priceUsd: "نرخی سەرچاوە (دۆلار)",
            weight: "کێش",
            thermal: "گەرمی",
            scanImage: "وێنەی هەڵگیراو",
            reference: "زانیاری سەرچاوە لە کاتەلۆگ",
            availability: "براندە بەردەستەکان و شوێنی فرۆشتن",
            visitWebsite: "ماڵپەڕ",
            viewLocation: "نەخشە",
          }
        : {
            analyzingTitle: "AI is analyzing the material",
            analyzingSteps: [
              "Identifying the material family and visible composition",
              "Reviewing properties, uses, and engineering context",
              "Preparing recommendations and lower-cost alternatives",
            ],
            confidence: "Confidence",
            category: "Category",
            details: "Identification",
            usage: "Common uses",
            properties: "Key properties",
            visual: "Visible indicators",
            alternatives: "Common alternatives",
            cheaper: "Lower-cost option",
            recommended: "Recommended option",
            add: "Add to Cost List",
            noMatchTitle: "Not identified",
            noMatchBody: "AI could not identify the material confidently. Please try a clearer photo.",
            priceIqd: "Reference price (IQD)",
            priceUsd: "Reference price (USD)",
            weight: "Weight",
            thermal: "Thermal",
            scanImage: "Captured image",
            reference: "Catalog reference",
            availability: "Available Brands & Locations",
            visitWebsite: "Website",
            viewLocation: "Map",
          },
    [lang]
  );

  const material = result?.material;
  const materialName = lang === "ku" ? result?.materialNameKU || material?.nameKU || result?.materialNameEN || material?.nameEN : result?.materialNameEN || material?.nameEN || result?.materialNameKU || material?.nameKU;
  const categoryName = lang === "ku" ? result?.categoryKU || material?.categoryKU || result?.categoryEN || material?.categoryEN : result?.categoryEN || material?.categoryEN || result?.categoryKU || material?.categoryKU;
  const localizedDescription = lang === "ku" ? result?.descriptionKU || result?.description : result?.description || result?.descriptionKU;
  const localizedUseCases = lang === "ku" ? result?.useCasesKU || result?.useCasesEN : result?.useCasesEN || result?.useCasesKU;
  const localizedProperties = lang === "ku" ? result?.keyPropertiesKU || result?.keyPropertiesEN : result?.keyPropertiesEN || result?.keyPropertiesKU;
  const localizedIndicators = lang === "ku" ? result?.keyVisualIndicatorsKU || result?.keyVisualIndicators : result?.keyVisualIndicators || result?.keyVisualIndicatorsKU;
  const localizedAlternatives = lang === "ku" ? result?.commonAlternativesKU || result?.commonAlternatives : result?.commonAlternatives || result?.commonAlternativesKU;
  const localizedCheaper = lang === "ku" ? result?.cheaperAlternativeKU || result?.cheaperAlternativeEN : result?.cheaperAlternativeEN || result?.cheaperAlternativeKU;
  const localizedRecommended = lang === "ku" ? result?.recommendedOptionKU || result?.recommendedOptionEN : result?.recommendedOptionEN || result?.recommendedOptionKU;
  const priceIQD = material && rate ? Math.round(material.basePrice * rate) : 0;
  const confidencePercent = Math.round((result?.confidence || 0) * 100);
  const formatNumber = (value) => String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const openLink = (url) => {
    if (!url) return;
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url).catch((err) => console.error("Could not open URL", err));
    }
  };

  if (!visible) return null;

  const renderListSection = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <View style={styles.infoBox}>
        <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{title}</Text>
        {items.map((item, index) => (
          <View key={`${title}-${index}`} style={[styles.stepRow, isRTL && styles.stepRowRTL]}>
            <View style={styles.stepDot} />
            <Text style={[styles.infoText, isRTL && styles.textRTL]}>
              {typeof item === "string" ? item : item?.name || ""}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderOptionCard = (title, option, englishName) => {
    if (!option?.name) return null;

    // Check if this material exists in the store
    const foundMaterial = materials?.find(
      m =>
        m.nameEN?.toLowerCase() === option.name?.toLowerCase() ||
        m.nameKU === option.name ||
        (englishName && m.nameEN?.toLowerCase() === englishName?.toLowerCase()) ||
        (option.id && m.id === option.id)
    );
    const inStore = !!foundMaterial;

    const actionLabel = lang === "ku"
      ? (inStore ? "بینینی کارتی مادەکە ←" : "گەڕانی وێب بۆ ئەم مادەیە 🔍")
      : (inStore ? "View material card →" : "Search the web for this material 🔍");

    const handlePress = () => {
      if (inStore) {
        // Navigate to that material's card in the store
        if (onSelectItem) {
          onClose();
          onSelectItem(foundMaterial.id);
        }
      } else {
        // Always search in English for better results
        const searchName = englishName || foundMaterial?.nameEN || option.name || "";
        const query = encodeURIComponent(searchName + " building material price");
        const url = `https://www.google.com/search?q=${query}`;
        if (Platform.OS === "web") {
          window.open(url, "_blank");
        } else {
          Linking.openURL(url).catch(err => console.error("Could not open URL", err));
        }
      }
    };

    return (
      <View style={styles.infoBox}>
        <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{title}</Text>
        <TouchableOpacity
          style={[styles.optionCard, inStore ? styles.optionCardInStore : styles.optionCardNotInStore]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={[styles.optionCardHeader, isRTL && styles.rowRTL]}>
            <Text style={[styles.optionName, isRTL && styles.textRTL]}>{option.name}</Text>
            <View style={[styles.optionBadge, inStore ? styles.optionBadgeInStore : styles.optionBadgeWeb]}>
              <Text style={styles.optionBadgeText}>{inStore ? (lang === "ku" ? "بەردەستە" : "In Store") : (lang === "ku" ? "نابەردەست" : "Not in Store")}</Text>
            </View>
          </View>
          {option.reason ? (
            <Text style={[styles.optionReason, isRTL && styles.textRTL]}>{option.reason}</Text>
          ) : null}
          {option.estimatedSavings ? (
            <Text style={[styles.optionSavings, isRTL && styles.textRTL]}>{option.estimatedSavings}</Text>
          ) : null}
          <Text style={[styles.optionActionLabel, isRTL && styles.textRTL, inStore ? styles.optionActionLabelStore : styles.optionActionLabelWeb]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAvailability = () => {
    if (!material?.localBrands || material.localBrands.length === 0) return null;

    return (
      <View style={styles.infoBox}>
        <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{copy.availability}</Text>
        {material.localBrands.map((brandName, index) => {
          const links = getBrandLinks(brandName);
          return (
            <View key={brandName + index} style={[styles.brandRow, isRTL && styles.brandRowRTL]}>
              <View style={[styles.brandInfo, isRTL && styles.brandInfoRTL]}>
                <View style={styles.stepDot} />
                <Text style={[styles.brandNameText, isRTL && styles.textRTL]}>{brandName}</Text>
              </View>
              {(links?.website || links?.mapUrl) && (
                <View style={[
                  styles.brandLinksRow, 
                  isRTL ? styles.brandLinksRowRTL : styles.brandLinksRowLTR,
                  isRTL && styles.rowRTL
                ]}>
                  {links?.website && (
                    <TouchableOpacity
                      style={styles.brandLinkPill}
                      onPress={() => openLink(links.website)}
                    >
                      <Text style={styles.brandLinkText}>🌐 {copy.visitWebsite}</Text>
                    </TouchableOpacity>
                  )}
                  {links?.mapUrl && (
                    <TouchableOpacity
                      style={[styles.brandLinkPill, styles.brandLinkPillMap]}
                      onPress={() => openLink(links.mapUrl)}
                    >
                      <Text style={styles.brandLinkText}>📍 {copy.viewLocation}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const content = (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingOrb}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
            <Text style={[styles.loadingTitle, isRTL && styles.textRTL]}>{copy.analyzingTitle}</Text>
            <View style={styles.loadingSteps}>
              {copy.analyzingSteps.map((step) => (
                <View key={step} style={[styles.stepRow, isRTL && styles.stepRowRTL]}>
                  <View style={styles.stepDot} />
                  <Text style={[styles.stepText, isRTL && styles.textRTL]}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : result ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {imageUri ? (
              <View style={styles.imageCard}>
                <Text style={[styles.scanLabel, isRTL && styles.textRTL]}>{copy.scanImage}</Text>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              </View>
            ) : null}

            <View style={styles.confidenceCard}>
              <Text style={[styles.confidenceLabel, isRTL && styles.textRTL]}>{copy.confidence}</Text>
              <View style={styles.confidenceBarBg}>
                <View style={[styles.confidenceBarFill, { width: `${confidencePercent}%` }]} />
              </View>
              <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
            </View>

            {result.matched ? (
              <>
                <View style={[styles.headerRow, isRTL && styles.headerRowRTL]}>
                  {material?.image ? (
                    <Image
                      source={typeof material.image === "string" ? { uri: material.image } : material.image}
                      style={[styles.materialImage, isRTL && styles.materialImageRTL]}
                    />
                  ) : (
                    <View style={[styles.materialImageFallback, isRTL && styles.materialImageRTL]}>
                      <Text style={styles.materialImageFallbackText}>AI</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.headerTextWrap} 
                    onPress={() => material?.id && onSelectItem && onSelectItem(material.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.materialName, isRTL && styles.textRTL]}>{materialName || copy.noMatchTitle}</Text>
                    <Text style={[styles.materialCategory, isRTL && styles.textRTL]}>
                      {copy.category}: {categoryName || "-"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {localizedDescription ? (
                  <View style={styles.infoBox}>
                    <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{copy.details}</Text>
                    <Text style={[styles.infoText, isRTL && styles.textRTL]}>{localizedDescription}</Text>
                  </View>
                ) : null}

                {renderAvailability()}
                {renderListSection(copy.usage, localizedUseCases)}
                {renderListSection(copy.properties, localizedProperties)}
                {renderListSection(copy.visual, localizedIndicators)}

                {Array.isArray(localizedAlternatives) && localizedAlternatives.length > 0 ? (
                  <View style={styles.infoBox}>
                    <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{copy.alternatives}</Text>
                    {localizedAlternatives.map((item, index) => (
                      <View key={`${item?.name || "alt"}-${index}`} style={styles.alternativeCard}>
                        <Text style={[styles.alternativeName, isRTL && styles.textRTL]}>{item?.name}</Text>
                        {item?.reason ? (
                          <Text style={[styles.alternativeReason, isRTL && styles.textRTL]}>{item.reason}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {renderOptionCard(copy.cheaper, localizedCheaper, result?.cheaperAlternativeEN?.name)}
                {renderOptionCard(copy.recommended, localizedRecommended, result?.recommendedOptionEN?.name)}

                {material ? (
                  <>
                    <View style={styles.referenceHeader}>
                      <Text style={[styles.referenceTitle, isRTL && styles.textRTL]}>{copy.reference}</Text>
                    </View>
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, styles.statCardAccent]}>
                        <Text style={styles.statLabelAccent}>{copy.priceIqd}</Text>
                        <Text style={styles.statValueAccent}>{formatNumber(priceIQD)}</Text>
                        <Text style={styles.statUnitAccent}>{lang === "ku" ? material.unitKU : material.unitEN}</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{copy.priceUsd}</Text>
                        <Text style={styles.statValue}>${material.basePrice}</Text>
                        <Text style={styles.statUnit}>{lang === "ku" ? material.unitKU : material.unitEN}</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{copy.thermal}</Text>
                        <Text style={styles.statValue}>{material.thermalConductivity}</Text>
                        <Text style={styles.statUnit}>{t("wPerMK")}</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{copy.weight}</Text>
                        <Text style={styles.statValue}>{formatNumber(material.weight)}</Text>
                        <Text style={styles.statUnit}>{t("kgPerM3")}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={() => onAddToList && onAddToList(material.id)}>
                      <Text style={styles.addButtonText}>{copy.add}</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{copy.noMatchTitle}</Text>
                <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
                  {localizedDescription || copy.noMatchBody}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );

  if (Platform.OS === "web") {
    return content;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    maxHeight: "92%",
    minHeight: 320,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? spacing.xxxl : 48,
    zIndex: 10000,
  },
  closeButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.offWhite,
    zIndex: 10,
  },
  closeButtonText: {
    color: colors.darkGray,
    fontWeight: "700",
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl * 1.5,
  },
  loadingOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.offWhite,
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    ...typography.title,
    color: colors.charcoal,
    marginBottom: spacing.lg,
  },
  loadingSteps: {
    width: "100%",
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  stepRowRTL: {
    flexDirection: "row-reverse",
  },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  stepText: {
    flex: 1,
    ...typography.body,
    color: colors.darkGray,
    lineHeight: 21,
  },
  imageCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scanLabel: {
    ...typography.caption,
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    resizeMode: "cover",
  },
  confidenceCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  confidenceLabel: {
    ...typography.caption,
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  confidenceBarBg: {
    height: 10,
    backgroundColor: "#D7E1F0",
    borderRadius: radius.full,
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  confidenceValue: {
    marginTop: spacing.sm,
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  headerRowRTL: {
    flexDirection: "row-reverse",
  },
  materialImage: {
    width: 76,
    height: 76,
    borderRadius: 18,
    marginRight: spacing.md,
  },
  materialImageRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  materialImageFallback: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  materialImageFallbackText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  headerTextWrap: {
    flex: 1,
  },
  materialName: {
    ...typography.title,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  materialCategory: {
    ...typography.body,
    color: colors.darkGray,
  },
  infoBox: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  brandRow: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  brandRowRTL: {
    // handled by sub-elements
  },
  brandInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandInfoRTL: {
    flexDirection: "row-reverse",
  },
  brandNameText: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  brandLinksRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  brandLinksRowLTR: {
    paddingLeft: spacing.xl,
  },
  brandLinksRowRTL: {
    paddingRight: spacing.xl,
  },
  brandLinkPill: {
    backgroundColor: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lightGray,
    ...shadows.card,
  },
  brandLinkPillMap: {
    borderColor: colors.accentLight,
  },
  brandLinkText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: "700",
  },
  infoTitle: {
    ...typography.subtitle,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: "700",
  },
  infoText: {
    ...typography.body,
    color: colors.charcoal,
    lineHeight: 22,
  },
  alternativeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  alternativeName: {
    ...typography.subtitle,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  alternativeReason: {
    ...typography.body,
    color: colors.darkGray,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  optionCardInStore: {
    borderColor: colors.accent,
  },
  optionCardNotInStore: {
    borderColor: "#B0BEC5",
  },
  optionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    flexWrap: "wrap",
    gap: 6,
  },
  optionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  optionBadgeInStore: {
    backgroundColor: "#E8F5E9",
  },
  optionBadgeWeb: {
    backgroundColor: "#FFF3E0",
  },
  optionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.darkGray,
  },
  optionName: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: "700",
    flex: 1,
  },
  optionReason: {
    ...typography.body,
    color: colors.charcoal,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  optionSavings: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: spacing.sm,
    fontWeight: "700",
  },
  optionActionLabel: {
    ...typography.caption,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  optionActionLabelStore: {
    color: colors.accent,
  },
  optionActionLabelWeb: {
    color: "#F57C00",
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  referenceHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  referenceTitle: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statCardAccent: {
    backgroundColor: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  statUnit: {
    ...typography.caption,
    color: colors.darkGray,
    marginTop: spacing.xs,
  },
  statLabelAccent: {
    ...typography.caption,
    color: colors.accentLight,
    marginBottom: spacing.xs,
  },
  statValueAccent: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
  },
  statUnitAccent: {
    ...typography.caption,
    color: colors.white,
    marginTop: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadows.cardLifted,
  },
  addButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.darkGray,
    lineHeight: 22,
    textAlign: "center",
  },
  textRTL: {
    textAlign: "right",
  },
});

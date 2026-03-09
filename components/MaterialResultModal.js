import React from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    Linking,
} from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import BrandChip from "./BrandChip";

export default function MaterialResultModal({
    visible,
    onClose,
    result,
    loading,
    imageUri,
    onAddToList,
}) {
    const { lang, t, isRTL } = useLanguage();
    const { rate } = useExchangeRate();

    const formatNumber = (num) =>
        num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const material = result?.material;
    const priceIQD = material && rate ? Math.round(material.basePrice * rate) : 0;

    const getEngineLabel = () => {
        if (!result) return "";
        switch (result.engine) {
            case "gemini-ai": return "🤖 CHECKARCH AI";
            case "gemini-poliigon": return "🤖 POLIIGON AI";
            case "mobilenet-ai": return "🧠 NEURAL AI";
            case "color-analysis": return "🎨 COLOR ANALYSIS";
            case "poliigon-dna": return "🏗️ POLIIGON DNA";
            case "gemini": return "CHECKARCH AI";
            default: return "AI VISION";
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <View style={styles.scanningAnimation}>
                                <View style={styles.scanRing1} />
                                <View style={styles.scanRing2} />
                                <View style={styles.scanCenter}>
                                    <Text style={styles.scanIcon}>🤖</Text>
                                </View>
                            </View>
                            <Text style={styles.loadingTitle}>
                                {lang === "ku" ? "شیکاری Gemini AI..." : "Gemini AI Analyzing..."}
                            </Text>
                            <Text style={styles.loadingSubtext}>
                                {lang === "ku"
                                    ? "ناسینەوەی مادەی بیناسازی بە یارمەتی AI"
                                    : "Identifying Kurdistan construction material with AI"}
                            </Text>
                            <ActivityIndicator
                                size="small"
                                color={colors.accent}
                                style={{ marginTop: spacing.md }}
                            />
                        </View>
                    ) : result ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Captured image */}
                            {imageUri && (
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: imageUri }} style={styles.capturedImage} />
                                    <View style={styles.aiBadge}>
                                        <Text style={styles.aiBadgeText}>
                                            {getEngineLabel()}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Confidence bar */}
                            <View style={styles.confidenceRow}>
                                <Text style={styles.confidenceLabel}>
                                    {lang === "ku" ? "متمانە" : "Confidence"}
                                </Text>
                                <View style={styles.confidenceBarBg}>
                                    <View
                                        style={[
                                            styles.confidenceBarFill,
                                            {
                                                width: `${Math.round((result.confidence || 0) * 100)}%`,
                                                backgroundColor:
                                                    result.confidence > 0.7
                                                        ? colors.success
                                                        : result.confidence > 0.4
                                                            ? colors.warning
                                                            : colors.error,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.confidenceValue}>
                                    {Math.round((result.confidence || 0) * 100)}%
                                </Text>
                            </View>

                            {result.matched && material ? (
                                <>
                                    {/* Material Header (Name + Photo) */}
                                    <View style={[styles.headerRow, isRTL && styles.headerRowRTL]}>
                                        {material.image && (
                                            <Image
                                                source={typeof material.image === 'string' ? { uri: material.image } : material.image}
                                                style={styles.materialThumbnail}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <Text style={[styles.materialName, isRTL && styles.textRTL, { flex: 1 }]}>
                                            {lang === "ku" ? material.nameKU : material.nameEN}
                                        </Text>
                                    </View>

                                    {/* Category + Origin badges */}
                                    <View style={styles.badgeRow}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>
                                                {lang === "ku" ? material.categoryKU : material.categoryEN}
                                            </Text>
                                        </View>
                                        {material.origin && (
                                            <View style={[styles.categoryBadge, styles.originBadge]}>
                                                <Text style={[styles.categoryText, styles.originText]}>
                                                    {material.origin === "local"
                                                        ? (lang === "ku" ? "🏭 خۆماڵی" : "🏭 Local")
                                                        : (lang === "ku" ? "📦 ھاوردە" : "📦 Imported")}
                                                </Text>
                                            </View>
                                        )}
                                        {/* Poliigon Category Badge */}
                                        {result.poliigonCategory && result.poliigonCategory !== "none" && (
                                            <TouchableOpacity
                                                style={[styles.categoryBadge, styles.poliigonBadge]}
                                                onPress={() => result.poliigonUrl && Linking.openURL(result.poliigonUrl)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.categoryText, styles.poliigonText]}>
                                                    🌿 {result.poliigonCategory}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* AI Description */}
                                    {result.description && (
                                        <Text style={[styles.description, isRTL && styles.textRTL]}>
                                            {result.description}
                                        </Text>
                                    )}

                                    {/* Material Details */}
                                    {(material.descEN || material.descKU) && (
                                        <View style={styles.detailsBox}>
                                            <Text style={styles.detailsTitle}>
                                                {lang === "ku" ? "📋 زانیاری" : "📋 Details"}
                                            </Text>
                                            <Text style={[styles.detailsText, isRTL && styles.textRTL]}>
                                                {lang === "ku" ? material.descKU : material.descEN}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Local Brands */}
                                    {material.localBrands && material.localBrands.length > 0 && (
                                        <View style={styles.brandsBox}>
                                            <Text style={styles.brandsTitle}>
                                                {lang === "ku" ? "🏷️ براندەکان" : "🏷️ Available Brands"}
                                            </Text>
                                            <View style={styles.brandsWrap}>
                                                {material.localBrands.map((brand, i) => (
                                                    <BrandChip key={i} brand={brand} />
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Stats grid */}
                                    <View style={styles.statsGrid}>
                                        {/* Price IQD */}
                                        <View style={[styles.statCard, styles.statCardAccent]}>
                                            <Text style={[styles.statLabel, styles.statLabelAccent]}>
                                                {lang === "ku" ? "نرخ (د.ع)" : "Price (IQD)"}
                                            </Text>
                                            <Text style={[styles.statValue, styles.statValueAccent]}>
                                                {formatNumber(priceIQD)}
                                            </Text>
                                            <Text style={[styles.statUnit, styles.statUnitAccent]}>
                                                {lang === "ku" ? material.unitKU : material.unitEN}
                                            </Text>
                                        </View>

                                        {/* USD Price */}
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>
                                                {lang === "ku" ? "نرخ (دۆلار)" : "Price (USD)"}
                                            </Text>
                                            <Text style={styles.statValue}>${material.basePrice}</Text>
                                            <Text style={styles.statUnit}>
                                                {lang === "ku" ? material.unitKU : material.unitEN}
                                            </Text>
                                        </View>

                                        {/* Thermal */}
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>{t("thermalValue")}</Text>
                                            <Text style={styles.statValue}>
                                                {material.thermalConductivity}
                                            </Text>
                                            <Text style={styles.statUnit}>{t("wPerMK")}</Text>
                                        </View>

                                        {/* Weight */}
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>{t("weight")}</Text>
                                            <Text style={styles.statValue}>
                                                {formatNumber(material.weight)}
                                            </Text>
                                            <Text style={styles.statUnit}>{t("kgPerM3")}</Text>
                                        </View>
                                    </View>

                                    {/* Key Visual Indicators */}
                                    {result.keyVisualIndicators && result.keyVisualIndicators.length > 0 && (
                                        <View style={styles.indicatorsBox}>
                                            <Text style={styles.indicatorsTitle}>
                                                {lang === "ku" ? "🔍 نیشانەکانی دیتنی" : "🔍 Key Visual Indicators"}
                                            </Text>
                                            {result.keyVisualIndicators.map((indicator, i) => (
                                                <View key={i} style={styles.indicatorRow}>
                                                    <View style={styles.indicatorBullet} />
                                                    <Text style={styles.indicatorText}>{indicator}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Common Alternatives */}
                                    {result.commonAlternatives && result.commonAlternatives.length > 0 && (
                                        <View style={styles.alternativesBox}>
                                            <Text style={styles.alternativesTitle}>
                                                {lang === "ku" ? "⚠️ مادەی هاوشێوە" : "⚠️ Common Alternatives"}
                                            </Text>
                                            {result.commonAlternatives.map((alt, i) => (
                                                <View key={i} style={styles.alternativeCard}>
                                                    <Text style={styles.alternativeName}>{alt.name}</Text>
                                                    {alt.reason && (
                                                        <Text style={styles.alternativeReason}>{alt.reason}</Text>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Top matches (fallback / color analysis / poliigon-dna) */}
                                    {(result.engine === "color-analysis" || result.engine === "poliigon-dna") && result.topMatches && result.topMatches.length > 1 && (
                                        <View style={styles.topMatchesContainer}>
                                            <Text style={[styles.topMatchesTitle, isRTL && styles.textRTL]}>
                                                {lang === "ku" ? "ئەنجامەکانی تر:" : "Other possibilities:"}
                                            </Text>
                                            {result.topMatches.slice(1, 4).map((m, i) => (
                                                <View key={i} style={styles.topMatchRow}>
                                                    <View style={styles.topMatchDot} />
                                                    <Text style={styles.topMatchName}>{m.name}</Text>
                                                    <Text style={styles.topMatchScore}>{m.score}%</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Add to list button */}
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => onAddToList && onAddToList(material.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.addButtonText}>
                                            {lang === "ku"
                                                ? "زیادکردن بۆ لیستی تێچوو  ✓"
                                                : "Add to Cost List  ✓"}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.noMatchContainer}>
                                    <Text style={styles.noMatchIcon}>❓</Text>
                                    <Text style={[styles.noMatchTitle, isRTL && styles.textRTL]}>
                                        {lang === "ku"
                                            ? "مادە نەناسرایەوە"
                                            : "Material Not Recognized"}
                                    </Text>
                                    <Text style={[styles.noMatchText, isRTL && styles.textRTL]}>
                                        {result.description ||
                                            (lang === "ku"
                                                ? "تکایە وێنەیەکی ڕوون بگرە لە مادەی بیناسازی"
                                                : "Please take a clear photo of a construction material")}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.xl + 4,
        borderTopRightRadius: radius.xl + 4,
        maxHeight: "90%",
        minHeight: 300,
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    closeBtn: {
        position: "absolute",
        top: spacing.md,
        right: spacing.lg,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.offWhite,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    closeBtnText: {
        fontSize: 16,
        color: colors.darkGray,
        fontWeight: "600",
    },

    // Loading
    loadingContainer: {
        alignItems: "center",
        paddingVertical: spacing.xxxl * 2,
    },
    scanningAnimation: {
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    scanRing1: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: colors.accent,
        opacity: 0.3,
    },
    scanRing2: {
        position: "absolute",
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: colors.accent,
        opacity: 0.6,
    },
    scanCenter: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.offWhite,
        justifyContent: "center",
        alignItems: "center",
    },
    scanIcon: {
        fontSize: 24,
    },
    loadingTitle: {
        ...typography.title,
        color: colors.charcoal,
    },
    loadingSubtext: {
        ...typography.caption,
        color: colors.mediumGray,
        marginTop: spacing.xs,
        textAlign: "center",
    },

    // Image
    scrollContent: {
        paddingBottom: spacing.lg,
    },
    imageContainer: {
        borderRadius: radius.lg,
        overflow: "hidden",
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
        position: "relative",
    },
    capturedImage: {
        width: "100%",
        height: 200,
        borderRadius: radius.lg,
    },
    aiBadge: {
        position: "absolute",
        top: spacing.sm,
        left: spacing.sm,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
    },
    aiBadgeText: {
        ...typography.tiny,
        color: colors.accentLight,
        fontWeight: "800",
        letterSpacing: 1,
    },

    // Confidence
    confidenceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    confidenceLabel: {
        ...typography.caption,
        color: colors.mediumGray,
        marginRight: spacing.sm,
        width: 70,
    },
    confidenceBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.lightGray,
        borderRadius: 3,
        overflow: "hidden",
        marginRight: spacing.sm,
    },
    confidenceBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    confidenceValue: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "700",
        width: 40,
        textAlign: "right",
    },

    // Material info
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    headerRowRTL: {
        flexDirection: "row-reverse",
    },
    materialThumbnail: {
        width: 60,
        height: 60,
        borderRadius: radius.md,
        marginRight: spacing.md,
        backgroundColor: colors.lightGray, // Fallback background if image fails
    },
    materialName: {
        ...typography.hero,
        color: colors.charcoal,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    categoryBadge: {
        alignSelf: "flex-start",
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 1,
        borderRadius: radius.sm,
    },
    categoryText: {
        ...typography.tiny,
        color: colors.accentLight,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: "700",
    },
    originBadge: {
        backgroundColor: colors.primaryLight,
    },
    originText: {
        color: colors.accentLight,
    },
    poliigonBadge: {
        backgroundColor: "#064E3B",
    },
    poliigonText: {
        color: "#6EE7B7",
    },

    description: {
        ...typography.body,
        color: colors.darkGray,
        lineHeight: 20,
        marginBottom: spacing.md,
        backgroundColor: colors.offWhite,
        padding: spacing.md,
        borderRadius: radius.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
    },

    // Details box
    detailsBox: {
        backgroundColor: "#F0F4FF",
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.info,
    },
    detailsTitle: {
        ...typography.caption,
        color: colors.info,
        fontWeight: "700",
        marginBottom: spacing.xs,
    },
    detailsText: {
        ...typography.body,
        color: colors.darkGray,
        lineHeight: 20,
    },

    // Brands
    brandsBox: {
        marginBottom: spacing.md,
    },
    brandsTitle: {
        ...typography.caption,
        color: colors.darkGray,
        fontWeight: "700",
        marginBottom: spacing.sm,
    },
    brandsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
    },
    brandChip: {
        backgroundColor: colors.lightGray,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
    },
    brandChipText: {
        ...typography.tiny,
        color: colors.charcoal,
        fontWeight: "600",
    },

    // Stats
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: "center",
    },
    statCardAccent: {
        backgroundColor: colors.primary,
    },
    statLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    statLabelAccent: {
        color: colors.mediumGray,
    },
    statValue: {
        ...typography.title,
        color: colors.charcoal,
        marginBottom: 2,
    },
    statValueAccent: {
        color: colors.accent,
    },
    statUnit: {
        ...typography.tiny,
        color: colors.mediumGray,
    },
    statUnitAccent: {
        color: colors.mediumGray,
    },

    // Key Visual Indicators
    indicatorsBox: {
        backgroundColor: "#EFF6FF",
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: "#3B82F6",
    },
    indicatorsTitle: {
        ...typography.caption,
        color: "#1D4ED8",
        fontWeight: "700",
        marginBottom: spacing.sm,
    },
    indicatorRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: spacing.xs,
    },
    indicatorBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#3B82F6",
        marginTop: 5,
        marginRight: spacing.sm,
        flexShrink: 0,
    },
    indicatorText: {
        ...typography.caption,
        color: "#1E40AF",
        flex: 1,
        lineHeight: 18,
    },

    // Common Alternatives
    alternativesBox: {
        backgroundColor: "#FFFBEB",
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: "#F59E0B",
    },
    alternativesTitle: {
        ...typography.caption,
        color: "#92400E",
        fontWeight: "700",
        marginBottom: spacing.sm,
    },
    alternativeCard: {
        backgroundColor: "#FEF3C7",
        borderRadius: radius.sm,
        padding: spacing.sm,
        marginBottom: spacing.xs,
    },
    alternativeName: {
        ...typography.caption,
        color: "#78350F",
        fontWeight: "700",
        marginBottom: 2,
    },
    alternativeReason: {
        ...typography.tiny,
        color: "#92400E",
        lineHeight: 16,
    },

    // Top matches
    topMatchesContainer: {
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    topMatchesTitle: {
        ...typography.caption,
        color: colors.darkGray,
        fontWeight: "600",
        marginBottom: spacing.sm,
    },
    topMatchRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    topMatchDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.mediumGray,
        marginRight: spacing.sm,
    },
    topMatchName: {
        ...typography.caption,
        color: colors.darkGray,
        flex: 1,
    },
    topMatchScore: {
        ...typography.tiny,
        color: colors.mediumGray,
    },

    // Add button
    addButton: {
        backgroundColor: colors.accent,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        alignItems: "center",
        ...shadows.card,
    },
    addButtonText: {
        ...typography.subtitle,
        color: colors.white,
        fontWeight: "700",
        letterSpacing: 0.5,
    },

    // No match
    noMatchContainer: {
        alignItems: "center",
        paddingVertical: spacing.xxxl,
    },
    noMatchIcon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    noMatchTitle: {
        ...typography.title,
        color: colors.charcoal,
        marginBottom: spacing.sm,
    },
    noMatchText: {
        ...typography.body,
        color: colors.mediumGray,
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: spacing.xl,
    },
    textRTL: {
        textAlign: "right",
    },
});

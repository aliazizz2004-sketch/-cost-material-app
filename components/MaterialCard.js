import React, { memo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal } from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import BrandChip from "./BrandChip";

function MaterialCard({ material, quantity, onQuantityChange, allMaterials = [] }) {
    const { lang, t, isRTL } = useLanguage();
    const { rate } = useExchangeRate();
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);

    const name = lang === "ku" ? material.nameKU : material.nameEN;
    const category = lang === "ku" ? material.categoryKU : material.categoryEN;
    const unitLabel = lang === "ku" ? material.unitKU : material.unitEN;
    const priceIQD = rate ? Math.round(material.basePrice * rate) : 0;
    const subtotal = priceIQD * (quantity || 0);

    // Find Recommendations
    const recommendations = allMaterials
        .filter(m => m.id !== material.id && m.categoryEN === material.categoryEN)
        .sort((a, b) => {
            // Price Comparison (Primary)
            const priceCompare = a.basePrice - b.basePrice;
            if (priceCompare !== 0) return priceCompare;

            // Thermal Efficiency (Secondary - for Insulation/Masonry/Binding)
            if (material.categoryEN === "Insulation" || material.categoryEN === "Masonry") {
                return a.thermalConductivity - b.thermalConductivity;
            }
            return 0;
        })
        .slice(0, 3); // Top 3 recommendations

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const increment = () => onQuantityChange(material.id, (quantity || 0) + 1);
    const decrement = () => {
        if ((quantity || 0) > 0) onQuantityChange(material.id, quantity - 1);
    };

    const hasQuantity = quantity > 0;

    return (
        <TouchableOpacity
            style={[styles.card, hasQuantity && styles.cardActive]}
            activeOpacity={0.9}
            onPress={() => setIsImageModalVisible(true)}
        >
            {/* Image Preview Modal (Detail Mini-Page) */}
            <Modal
                visible={isImageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsImageModalVisible(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity
                        style={styles.imageModalCloseArea}
                        activeOpacity={1}
                        onPress={() => setIsImageModalVisible(false)}
                    />
                    <View style={styles.imageModalContent}>
                        <TouchableOpacity style={styles.imageModalCloseButton} onPress={() => setIsImageModalVisible(false)}>
                            <Text style={styles.imageModalCloseText}>✕</Text>
                        </TouchableOpacity>

                        {material.image && (
                            <Image
                                source={typeof material.image === 'string' ? { uri: material.image } : material.image}
                                style={styles.largePreviewImage}
                                resizeMode="cover"
                            />
                        )}

                        <View style={styles.previewDetailContainer}>
                            <View style={styles.previewHeader}>
                                <View style={styles.previewCategoryBadge}>
                                    <Text style={styles.previewCategoryText}>{category}</Text>
                                </View>
                                <Text style={styles.previewPriceText}>{formatNumber(priceIQD)} {t("currency")}</Text>
                            </View>

                            <Text style={[styles.previewImageName, isRTL && styles.textRTL]}>{name}</Text>
                            <Text style={[styles.previewUnitText, isRTL && styles.textRTL]}>{unitLabel}</Text>

                            <View style={[styles.previewSpecsGrid, isRTL && styles.previewSpecsGridRTL]}>
                                <View style={styles.previewSpecBox}>
                                    <Text style={styles.previewSpecLabel}>{t("thermalValue")}</Text>
                                    <Text style={styles.previewSpecValue}>{material.thermalConductivity}</Text>
                                </View>
                                <View style={styles.previewSpecBox}>
                                    <Text style={styles.previewSpecLabel}>{t("weight")}</Text>
                                    <Text style={styles.previewSpecValue}>{formatNumber(material.weight)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.previewAddBtn}
                                onPress={() => {
                                    increment();
                                    setIsImageModalVisible(false);
                                }}
                            >
                                <Text style={styles.previewAddBtnText}>{lang === "ku" ? "زیادکردن بۆ لیست ✓" : "Add to Cost List ✓"}</Text>
                            </TouchableOpacity>

                            {/* Recommendations Section */}
                            {recommendations.length > 0 && (
                                <View style={styles.recSection}>
                                    <View style={styles.recHeaderRow}>
                                        <Text style={[styles.recLabel, isRTL && styles.textRTL]}>
                                            {lang === "ku" ? "پێشنیارەکان (باشتر یان هەرزانتر)" : "Recommendations (Better or Cheaper)"}
                                        </Text>
                                    </View>
                                    {recommendations.map((rec) => {
                                        const recName = lang === "ku" ? rec.nameKU : rec.nameEN;
                                        const recPrice = rate ? Math.round(rec.basePrice * rate) : 0;
                                        const isCheaper = rec.basePrice < material.basePrice;
                                        const isBetterThermal = rec.thermalConductivity < material.thermalConductivity;

                                        return (
                                            <View key={rec.id} style={[styles.recItem, isRTL && styles.rowRTL]}>
                                                <View style={styles.recTextContainer}>
                                                    <Text style={[styles.recName, isRTL && styles.textRTL]}>{recName}</Text>
                                                    <View style={[styles.tagRow, isRTL && styles.rowRTL]}>
                                                        {isCheaper && (
                                                            <View style={styles.cheaperTag}>
                                                                <Text style={styles.tagText}>{lang === "ku" ? "هەرزانتر" : "Cheaper"}</Text>
                                                            </View>
                                                        )}
                                                        {isBetterThermal && (category === "Insulation" || category === "Masonry") && (
                                                            <View style={styles.betterTag}>
                                                                <Text style={styles.tagText}>{lang === "ku" ? "کاراتر" : "Better Specs"}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <Text style={styles.recPrice}>{formatNumber(recPrice)} IQD</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Header row */}
            <View style={[styles.header, isRTL && styles.headerRTL]}>
                <View style={[styles.categoryBadge]}>
                    <Text style={styles.categoryText}>{category}</Text>
                </View>
                <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>
                        {formatNumber(priceIQD)} {t("currency")}
                    </Text>
                </View>
            </View>

            {/* Material name and Photo */}
            <View style={[styles.titleRow, isRTL && styles.titleRowRTL]}>
                {material.image && (
                    <View>
                        <Image
                            source={typeof material.image === 'string' ? { uri: material.image } : material.image}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    </View>
                )}
                <View style={[styles.titleTextContainer, isRTL && styles.titleTextContainerRTL]}>
                    <Text style={[styles.name, isRTL && styles.textRTL]}>{name}</Text>
                    <Text style={[styles.unitLabel, isRTL && styles.textRTL]}>{unitLabel}</Text>
                </View>
            </View>

            {/* Specs row */}
            <View style={[styles.specsRow, isRTL && styles.specsRowRTL]}>
                <View style={styles.specItem}>
                    <Text style={styles.specLabel}>{t("thermalValue")}</Text>
                    <Text style={styles.specValue}>
                        {material.thermalConductivity} {t("wPerMK")}
                    </Text>
                </View>
                <View style={styles.specDivider} />
                <View style={styles.specItem}>
                    <Text style={styles.specLabel}>{t("weight")}</Text>
                    <Text style={styles.specValue}>
                        {formatNumber(material.weight)} {t("kgPerM3")}
                    </Text>
                </View>
            </View>

            {/* Brands row */}
            {material.localBrands && material.localBrands.length > 0 && (
                <View style={styles.brandsSection}>
                    <Text style={styles.brandsLabel}>
                        {lang === "ku" ? "براند:" : "Brands:"}
                    </Text>
                    <View style={styles.brandsWrap}>
                        {material.localBrands.map((brand, i) => (
                            <BrandChip key={i} brand={brand} />
                        ))}
                    </View>
                </View>
            )}

            {/* Quantity controls */}
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={[styles.quantityRow, isRTL && styles.quantityRowRTL]}>
                    <View style={[styles.quantityControls, isRTL && styles.quantityControlsRTL]}>
                        <TouchableOpacity
                            style={[styles.qtyBtn, styles.qtyBtnMinus]}
                            onPress={decrement}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.qtyInput}
                            value={quantity ? String(quantity) : ""}
                            onChangeText={(text) => {
                                const num = parseInt(text) || 0;
                                onQuantityChange(material.id, num);
                            }}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.mediumGray}
                        />

                        <TouchableOpacity
                            style={[styles.qtyBtn, styles.qtyBtnPlus]}
                            onPress={increment}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.qtyBtnText, styles.qtyBtnPlusText]}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {hasQuantity && (
                        <View style={[styles.subtotalWrap, isRTL && styles.subtotalWrapRTL]}>
                            <Text style={styles.subtotalLabel}>{t("subtotal")}</Text>
                            <Text style={styles.subtotalValue}>
                                {formatNumber(subtotal)} {t("currency")}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default memo(MaterialCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.card,
    },
    cardActive: {
        borderColor: colors.accent,
        borderWidth: 1.5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    headerRTL: {
        flexDirection: "row-reverse",
    },
    categoryBadge: {
        backgroundColor: colors.searchBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
    },
    categoryText: {
        ...typography.tiny,
        color: colors.darkGray,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    priceBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.sm,
    },
    priceText: {
        ...typography.caption,
        color: colors.accentLight,
        fontWeight: "700",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    titleRowRTL: {
        flexDirection: "row-reverse",
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: radius.md,
        marginRight: spacing.md,
        backgroundColor: colors.searchBg,
    },
    titleTextContainer: {
        flex: 1,
        justifyContent: "center",
    },
    titleTextContainerRTL: {
        alignItems: "flex-end",
        marginRight: 0,
        marginLeft: spacing.md,
    },
    name: {
        ...typography.subtitle,
        color: colors.charcoal,
        marginBottom: 2,
    },
    nameRTL: {
        textAlign: "right",
    },
    textRTL: {
        textAlign: "right",
    },
    unitLabel: {
        ...typography.caption,
        color: colors.mediumGray,
    },
    specsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    specsRowRTL: {
        flexDirection: "row-reverse",
    },
    specItem: {
        flex: 1,
        alignItems: "center",
    },
    specDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.cardBorder,
        marginHorizontal: spacing.sm,
    },
    specLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginBottom: 2,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    specValue: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "600",
    },
    brandsSection: {
        marginBottom: spacing.sm,
    },
    brandsLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    brandsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    quantityRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    quantityRowRTL: {
        flexDirection: "row-reverse",
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        overflow: "hidden",
    },
    quantityControlsRTL: {
        flexDirection: "row-reverse",
    },
    qtyBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    qtyBtnMinus: {
        backgroundColor: colors.lightGray,
    },
    qtyBtnPlus: {
        backgroundColor: colors.accent,
    },
    qtyBtnText: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.darkGray,
    },
    qtyBtnPlusText: {
        color: colors.white,
    },
    qtyInput: {
        width: 56,
        height: 40,
        textAlign: "center",
        ...typography.subtitle,
        color: colors.charcoal,
        backgroundColor: colors.white,
    },
    subtotalWrap: {
        alignItems: "flex-end",
    },
    subtotalWrapRTL: {
        alignItems: "flex-start",
    },
    subtotalLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginBottom: 2,
    },
    subtotalValue: {
        ...typography.subtitle,
        color: colors.accent,
        fontWeight: "700",
    },
    // Image Preview Modal (Mini-Page) Styles
    imageModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(10, 22, 40, 0.7)", // Semi-transparent navy to see background
        justifyContent: "center",
        alignItems: "center",
    },
    imageModalCloseArea: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    imageModalContent: {
        width: "85%",
        backgroundColor: colors.white,
        borderRadius: radius.xl,
        overflow: "hidden", // Clip image to corners
        ...shadows.cardLifted,
    },
    imageModalCloseButton: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    imageModalCloseText: {
        fontSize: 14,
        color: colors.darkGray,
        fontWeight: "bold",
    },
    largePreviewImage: {
        width: "100%",
        height: 200,
    },
    previewDetailContainer: {
        padding: spacing.lg,
    },
    previewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    previewCategoryBadge: {
        backgroundColor: colors.searchBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    previewCategoryText: {
        ...typography.tiny,
        color: colors.mediumGray,
        textTransform: "uppercase",
    },
    previewPriceText: {
        ...typography.subtitle,
        color: colors.primary,
        fontWeight: "800",
    },
    previewImageName: {
        ...typography.title,
        color: colors.charcoal,
        marginBottom: 2,
    },
    previewUnitText: {
        ...typography.caption,
        color: colors.mediumGray,
        marginBottom: spacing.md,
    },
    previewSpecsGrid: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    previewSpecsGridRTL: {
        flexDirection: "row-reverse",
    },
    previewSpecBox: {
        flex: 1,
        backgroundColor: colors.offWhite,
        padding: spacing.sm,
        borderRadius: radius.md,
        alignItems: "center",
    },
    previewSpecLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginBottom: 2,
        textTransform: "uppercase",
    },
    previewSpecValue: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "700",
    },
    previewAddBtn: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: "center",
        ...shadows.card,
    },
    previewAddBtnText: {
        ...typography.subtitle,
        color: colors.white,
        fontWeight: "700",
    },
    recSection: {
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
    },
    recLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: spacing.sm,
    },
    recItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        padding: spacing.sm,
        borderRadius: radius.md,
        marginBottom: spacing.xs,
    },
    recTextContainer: {
        flex: 1,
    },
    recName: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "600",
    },
    recPrice: {
        ...typography.caption,
        color: colors.accent,
        fontWeight: "700",
    },
    tagRow: {
        flexDirection: "row",
        marginTop: 4,
        gap: 6,
    },
    cheaperTag: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    betterTag: {
        backgroundColor: "#E3F2FD",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 10,
        fontWeight: "700",
        color: colors.mediumGray,
    },
    rowRTL: {
        flexDirection: "row-reverse",
    },
});

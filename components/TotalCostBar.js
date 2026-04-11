import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, ScrollView, Modal, SafeAreaView } from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import AppIcon from "./AppIcon";

export default function TotalCostBar({ quantities, materials, onQuantityChange, onSelectItem, onSaveList, forceOpenModal, onClearAll, activeProjectId, onAddToProject }) {
    const { t, isRTL, lang } = useLanguage();
    const { rate, lastUpdated, loading, error, refresh } = useExchangeRate();
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        if (forceOpenModal > 0) {
            setIsModalVisible(true);
        }
    }, [forceOpenModal]);

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Calculate totals — check both numeric and string keys to be safe
    let totalItems = 0;
    let totalCost = 0;
    let selectedItems = [];
    const effectiveRate = rate || 1310; // fallback so list always shows
    materials.forEach((m) => {
        const qty = quantities[m.id] || quantities[String(m.id)] || 0;
        if (qty > 0) {
            totalItems += 1;
            totalCost += Math.round(m.basePrice * effectiveRate) * qty;
            selectedItems.push({ ...m, qty });
        }
    });

    const timeStr = lastUpdated
        ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "--:--";

    return (
        <View style={styles.container}>


            {/* Selected Items preview removed based on user request to make it smaller */}

            {/* Total row */}
            <TouchableOpacity 
                style={[styles.totalRow, isRTL && styles.rowRTL]}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.8}
            >
                <View>
                    <Text style={[styles.totalLabel, isRTL && styles.textRTL]}>{t("totalCost")}</Text>
                    <Text style={[styles.itemCount, isRTL && styles.textRTL]}>
                        {totalItems} {t("items")}
                    </Text>
                </View>
                <Text style={styles.totalValue}>
                    {formatNumber(totalCost)} {t("currency")}
                </Text>
            </TouchableOpacity>

            {/* Safe Area Spacer for Bottom Mobile Navigation */}
            {Platform.OS !== "web" && <View style={styles.safeSpacer} />}

            {/* Selected Items Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setIsModalVisible(false)} />
                    <SafeAreaView style={styles.modalContent}>
                        <View style={[styles.modalHeader, isRTL && styles.rowRTL]}>
                            <Text style={[styles.modalTitle, isRTL && styles.textRTL, { flex: 1 }]}>
                                {t("selectedMaterials")}
                            </Text>
                            <View style={[styles.modalHeaderActions, isRTL && styles.rowRTL]}>
                                {activeProjectId && onAddToProject ? (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            const itemsArr = selectedItems.map(item => ({
                                                id: item.id, name: item.nameEN, nameKU: item.nameKU, qty: item.qty, unitPrice: item.basePrice, unit: item.unit
                                            }));
                                            const src = lang === 'ku' ? 'کۆگای مادەکان' : lang === 'ar' ? 'مخزن المواد' : 'Material Store';
                                            onAddToProject(itemsArr, src);
                                        }} 
                                        style={[styles.modalSaveBtnProfessional, { backgroundColor: colors.accent }, isRTL && styles.rowRTL]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0, fontSize: 16 }}>📁</Text>
                                        <Text style={styles.modalSaveBtnTextProfessional}>{lang === 'ar' ? 'إضافة للمشروع' : lang === 'ku' ? 'زیادکردن بۆ پ\u0631ۆژە' : 'Add to Project'}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            if (onSaveList) onSaveList({ items: selectedItems, totalCost });
                                        }} 
                                        style={[styles.modalSaveBtnProfessional, isRTL && styles.rowRTL]}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                                            <AppIcon name="bookmark" size={18} color={colors.white} />
                                        </View>
                                        <Text style={styles.modalSaveBtnTextProfessional}>{t("save")}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    onPress={() => {
                                        if (onClearAll) onClearAll();
                                        setIsModalVisible(false);
                                    }} 
                                    style={styles.modalClearBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.modalClearBtnText}>{t("clearAll")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
                                    <Text style={styles.modalCloseText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalList}>
                            {selectedItems.map((item) => {
                                const itemPriceIQD = rate ? Math.round(item.basePrice * rate) : 0;
                                const itemSubtotal = itemPriceIQD * item.qty;
                                return (
                                    <View key={item.id} style={[styles.modalItem, isRTL && styles.rowRTL]}>
                                        <TouchableOpacity 
                                            style={[styles.modalItemTouchable, isRTL && styles.rowRTL]}
                                            onPress={() => {
                                                setIsModalVisible(false);
                                                if (onSelectItem) onSelectItem(item.id);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            {item.image && (
                                                <Image
                                                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                                                    style={[styles.modalItemImage, isRTL ? { marginLeft: spacing.md } : { marginRight: spacing.md }]}
                                                />
                                            )}
                                            <View style={styles.modalItemInfo}>
                                                <Text style={[styles.modalItemName, isRTL && styles.textRTL]}>
                                                    {lang === "ku" ? item.nameKU : item.nameEN} ({lang === "ku" ? item.categoryKU : item.categoryEN})
                                                </Text>
                                                <Text style={[styles.modalItemDetail, isRTL && styles.textRTL]}>
                                                    {lang === "ku" ? "ب\u0631:" : "Qty:"} {item.qty} {lang === "ku" ? item.unitKU : item.unitEN}
                                                </Text>
                                                <Text style={[styles.modalItemPrice, isRTL && styles.textRTL]}>
                                                    {formatNumber(itemSubtotal)} {t("currency")}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        
                                        <View style={[styles.modalQtyControls, isRTL && styles.modalQtyControlsRTL]}>
                                            <TouchableOpacity 
                                                style={[styles.modalQtyBtn, styles.modalQtyBtnMinus]}
                                                onPress={() => onQuantityChange && onQuantityChange(item.id, item.qty - 1)}
                                            >
                                                <Text style={styles.modalQtyBtnText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.modalQtyText}>{item.qty}</Text>
                                            <TouchableOpacity 
                                                style={[styles.modalQtyBtn, styles.modalQtyBtnPlus]}
                                                onPress={() => onQuantityChange && onQuantityChange(item.id, item.qty + 1)}
                                            >
                                                <Text style={[styles.modalQtyBtnText, styles.modalQtyBtnPlusText]}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        
                        {/* Conclusion of the cost */}
                        <View style={[styles.modalConclusion, isRTL && styles.rowRTL]}>
                            <View>
                                <Text style={[styles.modalConclusionLabel, isRTL && styles.textRTL]}>{t("totalCost")}</Text>
                                <Text style={[styles.modalConclusionItems, isRTL && styles.textRTL]}>
                                    {totalItems} {t("items")}
                                </Text>
                            </View>
                            <Text style={styles.modalConclusionValue}>
                                {formatNumber(totalCost)} {t("currency")}
                            </Text>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.xl, // Adjusted for both platforms
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        ...shadows.bottomBar,
    },
    safeSpacer: {
        height: Platform.OS === "ios" ? 20 : 35, // Increased safe area height for Android devices like S25 Ultra
        width: "100%",
    },
    rateRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    rowRTL: {
        flexDirection: "row-reverse",
    },
    rateInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    rateDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    rateDotLTR: {
        marginRight: spacing.sm,
    },
    rateDotRTL: {
        marginLeft: spacing.sm,
    },
    rateDotOk: {
        backgroundColor: colors.success,
    },
    rateDotError: {
        backgroundColor: colors.error,
    },
    rateText: {
        ...typography.caption,
        color: colors.accentLight,
    },
    rateTextLTR: {
        marginRight: spacing.sm,
    },
    rateTextRTL: {
        marginLeft: spacing.sm,
    },
    timeText: {
        ...typography.tiny,
        color: colors.mediumGray,
    },
    refreshBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    refreshText: {
        fontSize: 18,
        color: colors.accentLight,
    },
    totalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    totalLabel: {
        ...typography.caption,
        color: colors.mediumGray,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    textRTL: {
        textAlign: "right",
    },
    itemCount: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginTop: 2,
    },
    totalValue: {
        ...typography.hero,
        color: colors.accent,
    },
    selectedItemsWrapper: {
        marginBottom: spacing.md,
    },
    selectedItemsScroll: {
        gap: spacing.sm,
    },
    selectedItemChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primaryLight,
        borderRadius: radius.md,
        padding: spacing.xs,
        paddingRight: spacing.md,
        paddingLeft: spacing.md,
        marginRight: spacing.sm,
    },
    selectedItemImage: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
    },
    selectedItemInfo: {
        justifyContent: "center",
        maxWidth: 160,
    },
    selectedItemName: {
        ...typography.tiny,
        color: colors.white,
        fontWeight: "bold",
    },
    selectedItemDetail: {
        fontSize: 10,
        color: colors.accentLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalCloseArea: {
        position: "absolute",
        top: 0, bottom: 0, left: 0, right: 0,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        maxHeight: "80%",
        paddingBottom: Platform.OS === "ios" ? spacing.xl : 35, // Increased paddingBottom for modal to avoid soft keys coverage
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
        ...typography.title,
        color: colors.charcoal,
    },
    modalCloseBtn: {
        backgroundColor: colors.offWhite,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    modalCloseText: {
        fontSize: 16,
        color: colors.darkGray,
        fontWeight: "bold",
    },
    modalList: {
        padding: spacing.xl,
    },
    modalItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    modalItemTouchable: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    modalItemImage: {
        width: 60,
        height: 60,
        borderRadius: radius.sm,
    },
    modalItemInfo: {
        flex: 1,
        justifyContent: "center",
    },
    modalItemName: {
        ...typography.subtitle,
        color: colors.charcoal,
        marginBottom: 4,
    },
    modalItemDetail: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginBottom: 4,
    },
    modalItemPrice: {
        ...typography.caption,
        color: colors.accent,
        fontWeight: "bold",
    },
    modalQtyControls: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginLeft: spacing.sm,
    },
    modalQtyControlsRTL: {
        marginLeft: 0,
        marginRight: spacing.sm,
        flexDirection: "row-reverse",
    },
    modalQtyBtn: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    modalQtyBtnMinus: {
        backgroundColor: colors.offWhite,
    },
    modalQtyBtnPlus: {
        backgroundColor: colors.accent,
    },
    modalQtyBtnText: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.darkGray,
    },
    modalQtyBtnPlusText: {
        color: colors.white,
    },
    modalQtyText: {
        width: 28,
        textAlign: "center",
        ...typography.subtitle,
        color: colors.charcoal,
    },
    modalHeaderActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    modalSaveBtnProfessional: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.xl,
        flexDirection: "row",
        alignItems: "center",
        ...shadows.sm,
        marginRight: spacing.sm,
    },
    modalSaveBtnTextProfessional: {
        ...typography.caption,
        color: colors.white,
        fontWeight: "bold",
    },
    modalClearBtn: {
        paddingHorizontal: spacing.sm,
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    modalClearBtnText: {
        ...typography.tiny,
        color: colors.error,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    modalConclusion: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.primary,
        margin: spacing.xl,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
    },
    modalConclusionLabel: {
        ...typography.caption,
        color: colors.mediumGray,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    modalConclusionItems: {
        ...typography.tiny,
        color: colors.white,
        marginTop: 2,
    },
    modalConclusionValue: {
        ...typography.title,
        color: colors.accent,
    },
});

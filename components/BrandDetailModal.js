import React, { useEffect, useRef, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Linking,
    Platform,
    Animated,
    Dimensions,
    StatusBar,
    Image,
} from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import materialsData from "../data/materials";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function openUrl(url) {
    if (!url) return;
    if (Platform.OS === "web") {
        window.open(url, "_blank");
    } else {
        Linking.openURL(url).catch(() => { });
    }
}

export default function BrandDetailModal({ visible, onClose, brandName, brandData }) {
    const { lang, isRTL } = useLanguage();

    // Find all materials that reference this brand
    const brandMaterials = useMemo(() => {
        if (!brandName) return [];
        return materialsData.filter(m =>
            m.localBrands && m.localBrands.some(b =>
                b.toLowerCase() === brandName.toLowerCase()
            )
        );
    }, [brandName]);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!brandData) return null;

    const descText = lang === "ku" && brandData.descKU ? brandData.descKU : brandData.descEN;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.sheet,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                {/* ── Header Bar ── */}
                <View style={styles.headerBar}>
                    <View style={styles.headerHandle} />
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* ── Brand Hero ── */}
                    <View style={styles.heroSection}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>{brandData.logoEmoji || "🏢"}</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>{brandData.category || "Brand"}</Text>
                        </View>
                        <Text style={styles.brandNameText}>{brandName}</Text>
                        {brandData.tagline && (
                            <Text style={styles.taglineText}>"{brandData.tagline}"</Text>
                        )}
                    </View>

                    {/* ── Divider ── */}
                    <View style={styles.divider} />

                    {/* ── Info Cards Row ── */}
                    <View style={[styles.infoRow, isRTL && styles.rowRTL]}>
                        {brandData.founded && (
                            <View style={styles.infoCard}>
                                <Text style={styles.infoCardIcon}>📅</Text>
                                <Text style={styles.infoCardLabel}>
                                    {lang === "ku" ? "دامەزراوە" : "Founded"}
                                </Text>
                                <Text style={styles.infoCardValue}>{brandData.founded}</Text>
                            </View>
                        )}
                        {brandData.headquarters && (
                            <View style={styles.infoCard}>
                                <Text style={styles.infoCardIcon}>🌍</Text>
                                <Text style={styles.infoCardLabel}>
                                    {lang === "ku" ? "بەرپرسایەتی سەرەکی" : "Headquarters"}
                                </Text>
                                <Text style={styles.infoCardValue} numberOfLines={2}>
                                    {brandData.headquarters}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── About Section ── */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                            {lang === "ku" ? "📋 دەربارەی براند" : "📋 About the Brand"}
                        </Text>
                        <Text style={[styles.descText, isRTL && styles.textRTL]}>
                            {descText}
                        </Text>
                    </View>

                    {/* ── Key Facts ── */}
                    {brandData.keyFacts && brandData.keyFacts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                                {lang === "ku" ? "✅ ئەو ئامارانەی دەزانیت" : "✅ Key Facts"}
                            </Text>
                            <View style={styles.factsList}>
                                {(lang === "ku" && brandData.keyFactsKU ? brandData.keyFactsKU : brandData.keyFacts).map((fact, i) => (
                                    <View key={i} style={[styles.factItem, isRTL && styles.factItemRTL]}>
                                        <View style={styles.factDot} />
                                        <Text style={[styles.factText, isRTL && styles.textRTL]}>{fact}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Materials by this Brand ── */}
                    {brandMaterials.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                                {lang === "ku" ? `🏗️ مادەکانی ${brandName}` : `🏗️ Materials by ${brandName}`}
                            </Text>
                            <Text style={[styles.materialsSectionSubtitle, isRTL && styles.textRTL]}>
                                {lang === "ku"
                                    ? `${brandMaterials.length} مادە لە ئەپەکەماندا ئەم براندە بەکاردەهێنن`
                                    : `${brandMaterials.length} material${brandMaterials.length > 1 ? 's' : ''} in our catalog use this brand`}
                            </Text>
                            <View style={styles.materialsList}>
                                {brandMaterials.map((mat) => (
                                    <View key={mat.id} style={[styles.materialItem, isRTL && styles.materialItemRTL]}>
                                        {mat.image && (
                                            <View style={styles.materialThumb}>
                                                <Image
                                                    source={typeof mat.image === 'string' ? { uri: mat.image } : mat.image}
                                                    style={styles.materialThumbImg}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        )}
                                        <View style={styles.materialInfo}>
                                            <Text style={[styles.materialName, isRTL && styles.textRTL]} numberOfLines={2}>
                                                {lang === "ku" ? mat.nameKU : mat.nameEN}
                                            </Text>
                                            <View style={[styles.materialMeta, isRTL && styles.materialMetaRTL]}>
                                                <View style={styles.materialCatBadge}>
                                                    <Text style={styles.materialCatText}>
                                                        {lang === "ku" ? mat.categoryKU : mat.categoryEN}
                                                    </Text>
                                                </View>
                                                <Text style={styles.materialPrice}>
                                                    ${mat.basePrice} / {mat.unit}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Action Buttons ── */}
                    <View style={styles.actionsSection}>
                        {brandData.website && (
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => openUrl(brandData.website)}
                                activeOpacity={0.82}
                            >
                                <Text style={styles.actionBtnIcon}>🌐</Text>
                                <View style={styles.actionBtnTextWrap}>
                                    <Text style={styles.actionBtnTitle}>
                                        {lang === "ku" ? "ماڵپە\u0631ی فەرمی" : "Official Website"}
                                    </Text>
                                    <Text style={styles.actionBtnSub} numberOfLines={1}>
                                        {brandData.website.replace(/^https?:\/\//, "")}
                                    </Text>
                                </View>
                                <Text style={styles.actionBtnArrow}>›</Text>
                            </TouchableOpacity>
                        )}

                        {brandData.mapUrl && (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnMap]}
                                onPress={() => openUrl(brandData.mapUrl)}
                                activeOpacity={0.82}
                            >
                                <Text style={styles.actionBtnIcon}>📍</Text>
                                <View style={styles.actionBtnTextWrap}>
                                    <Text style={[styles.actionBtnTitle, { color: colors.white }]}>
                                        {lang === "ku" ? "شوێن لەسەر نەخشە" : "Find on Map"}
                                    </Text>
                                    <Text style={[styles.actionBtnSub, { color: "rgba(255,255,255,0.7)" }]}>
                                        {lang === "ku" ? "بکەرەوە لە گووگڵ مەپس" : "Open in Google Maps"}
                                    </Text>
                                </View>
                                <Text style={[styles.actionBtnArrow, { color: colors.white }]}>›</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── Footer note ── */}
                    <View style={styles.footerNote}>
                        <Text style={styles.footerNoteText}>
                            {lang === "ku"
                                ? "زانیاریەکان لە ماڵپە\u0631ی فەرمی براند وەرگیراون"
                                : "Information sourced from the brand's official website"}
                        </Text>
                    </View>
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(10,22,40,0.65)",
    },
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.92,
        ...shadows.cardLifted,
    },
    headerBar: {
        alignItems: "center",
        paddingTop: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
        zIndex: 10,
        elevation: 10,
    },
    headerHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.lightGray,
        borderRadius: 2,
        marginBottom: spacing.sm,
    },
    closeBtn: {
        position: "absolute",
        right: spacing.lg,
        top: spacing.md + 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.lightGray,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        elevation: 100,
    },
    closeBtnText: {
        fontSize: 14,
        color: colors.darkGray,
        fontWeight: "700",
    },
    scrollContent: {
        paddingBottom: 48,
    },

    // Hero
    heroSection: {
        alignItems: "center",
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    logoCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
        ...shadows.card,
    },
    logoEmoji: {
        fontSize: 38,
    },
    heroBadge: {
        backgroundColor: colors.accent + "22",
        borderWidth: 1,
        borderColor: colors.accent + "55",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs - 1,
        borderRadius: radius.full,
        marginBottom: spacing.sm,
    },
    heroBadgeText: {
        ...typography.tiny,
        color: colors.accentDark,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.2,
    },
    brandNameText: {
        ...typography.title,
        color: colors.primary,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    taglineText: {
        ...typography.caption,
        color: colors.mediumGray,
        fontStyle: "italic",
        textAlign: "center",
        marginTop: 2,
    },

    divider: {
        height: 1,
        backgroundColor: colors.cardBorder,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },

    // Info Row
    infoRow: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    rowRTL: {
        flexDirection: "row-reverse",
    },
    infoCard: {
        flex: 1,
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    infoCardIcon: {
        fontSize: 20,
        marginBottom: spacing.xs,
    },
    infoCardLabel: {
        ...typography.tiny,
        color: colors.mediumGray,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 4,
        textAlign: "center",
    },
    infoCardValue: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "700",
        textAlign: "center",
    },

    // Sections
    section: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    descText: {
        ...typography.body,
        color: colors.charcoal,
        lineHeight: 22,
    },
    textRTL: {
        textAlign: "right",
    },

    // Key Facts
    factsList: {
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: spacing.sm,
    },
    factItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
    },
    factItemRTL: {
        flexDirection: "row-reverse",
    },
    factDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.accent,
        marginTop: 5,
        flexShrink: 0,
    },
    factText: {
        ...typography.body,
        color: colors.charcoal,
    },

    // Materials section
    materialsSectionSubtitle: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginBottom: spacing.md,
    },
    materialsList: {
        gap: spacing.sm,
    },
    materialItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: spacing.sm,
        gap: spacing.md,
    },
    materialItemRTL: {
        flexDirection: "row-reverse",
    },
    materialThumb: {
        width: 52,
        height: 52,
        borderRadius: radius.sm,
        overflow: "hidden",
        backgroundColor: colors.lightGray,
        flexShrink: 0,
    },
    materialThumbImg: {
        width: 52,
        height: 52,
    },
    materialInfo: {
        flex: 1,
    },
    materialName: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "700",
        marginBottom: 4,
    },
    materialMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    materialMetaRTL: {
        flexDirection: "row-reverse",
    },
    materialCatBadge: {
        backgroundColor: colors.accent + "22",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    materialCatText: {
        ...typography.tiny,
        color: colors.accentDark,
        fontWeight: "600",
        fontSize: 10,
    },
    materialPrice: {
        ...typography.tiny,
        color: colors.mediumGray,
        fontWeight: "600",
        flex: 1,
        lineHeight: 20,
    },

    // Actions
    actionsSection: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderWidth: 1.5,
        borderColor: colors.cardBorder,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.md,
    },
    actionBtnMap: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    actionBtnIcon: {
        fontSize: 22,
        width: 30,
        textAlign: "center",
    },
    actionBtnTextWrap: {
        flex: 1,
    },
    actionBtnTitle: {
        ...typography.caption,
        color: colors.charcoal,
        fontWeight: "700",
    },
    actionBtnSub: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginTop: 2,
    },
    actionBtnArrow: {
        fontSize: 22,
        color: colors.mediumGray,
        fontWeight: "300",
    },

    // Footer
    footerNote: {
        alignItems: "center",
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
    },
    footerNoteText: {
        ...typography.tiny,
        color: colors.mediumGray,
        textAlign: "center",
        fontStyle: "italic",
    },
});

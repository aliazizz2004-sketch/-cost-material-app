import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Platform,
    Modal,
    Animated,
    ScrollView,
    Dimensions,
} from "react-native";
import { getBrandLinks } from "../data/brandLinks";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import BrandDetailModal from "./BrandDetailModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function openUrl(url) {
    if (!url) return;
    if (Platform.OS === "web") {
        window.open(url, "_blank");
    } else {
        Linking.openURL(url).catch(() => { });
    }
}

export default function BrandChip({ brand }) {
    const { lang, isRTL } = useLanguage();
    const links = getBrandLinks(brand);
    const hasMap = !!(links && links.mapUrl);
    const hasWeb = !!(links && links.website);
    const hasDetails = !!(links && (links.descEN || links.keyFacts));

    const [popupVisible, setPopupVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    function showPopup(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!links) return; // no brand data — nothing to show
        setPopupVisible(true);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 80,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();
    }

    function hidePopup() {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 140,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 140,
                useNativeDriver: true,
            }),
        ]).start(() => setPopupVisible(false));
    }

    function openDetail(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        hidePopup();
        setTimeout(() => setDetailVisible(true), 160);
    }

    const descText = links
        ? (lang === "ku" && links.descKU ? links.descKU : links.descEN)
        : null;
    const shortDesc = descText
        ? descText.substring(0, 120) + (descText.length > 120 ? "…" : "")
        : null;

    return (
        <>
            {/* ── The Chip ── */}
            <TouchableOpacity
                style={[styles.chip, links && styles.chipClickable]}
                onPress={showPopup}
                activeOpacity={links ? 0.72 : 1}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                accessibilityLabel={`${brand} — tap for details`}
            >
                {links && links.logoEmoji && (
                    <Text style={styles.chipEmoji}>{links.logoEmoji}</Text>
                )}
                <Text style={styles.brandName} numberOfLines={1}>{brand}</Text>
                {links && (
                    <View style={styles.infoIndicator}>
                        <Text style={styles.infoIndicatorText}>ℹ</Text>
                    </View>
                )}
                {hasMap && !links && (
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={(e) => { if (e && e.stopPropagation) e.stopPropagation(); openUrl(links.mapUrl); }}
                        activeOpacity={0.65}
                        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                        accessibilityLabel="Open map location"
                        accessibilityRole="link"
                    >
                        <Text style={styles.icon}>📍</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* ── Brand Popup Tooltip ── */}
            {popupVisible && (
                <Modal
                    transparent
                    visible={popupVisible}
                    animationType="none"
                    onRequestClose={hidePopup}
                    statusBarTranslucent
                >
                    {/* Backdrop */}
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={hidePopup}
                    />

                    {/* Popup Card */}
                    <View style={styles.popupWrapper} pointerEvents="box-none">
                        <Animated.View
                            style={[
                                styles.popup,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            {/* Popup Header */}
                            <View style={styles.popupHeader}>
                                <View style={styles.popupLogoWrap}>
                                    <Text style={styles.popupLogo}>
                                        {links?.logoEmoji || "🏢"}
                                    </Text>
                                </View>
                                <View style={styles.popupHeaderText}>
                                    <Text style={styles.popupBrandName} numberOfLines={1}>
                                        {brand}
                                    </Text>
                                    {links?.category && (
                                        <Text style={styles.popupCategory}>
                                            {links.category}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.popupCloseBtn}
                                    onPress={hidePopup}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={styles.popupCloseBtnText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Founded / HQ row */}
                            {(links?.founded || links?.headquarters) && (
                                <View style={styles.popupMeta}>
                                    {links.founded && (
                                        <View style={styles.popupMetaItem}>
                                            <Text style={styles.popupMetaIcon}>📅</Text>
                                            <Text style={styles.popupMetaText}>
                                                {lang === "ku" ? "دامەزراوە " : "Est. "}{links.founded}
                                            </Text>
                                        </View>
                                    )}
                                    {links.headquarters && (
                                        <View style={styles.popupMetaItem}>
                                            <Text style={styles.popupMetaIcon}>🌍</Text>
                                            <Text style={styles.popupMetaText} numberOfLines={1}>
                                                {links.headquarters.split(",")[0]}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Divider */}
                            <View style={styles.popupDivider} />

                            {/* Short description */}
                            {shortDesc && (
                                <Text style={[styles.popupDesc, isRTL && styles.textRTL]}>
                                    {shortDesc}
                                </Text>
                            )}

                            {/* Tagline */}
                            {links?.tagline && (
                                <Text style={styles.popupTagline}>
                                    "{links.tagline}"
                                </Text>
                            )}

                            {/* Action buttons row */}
                            <View style={[styles.popupActions, isRTL && styles.rowRTL]}>
                                {hasWeb && (
                                    <TouchableOpacity
                                        style={styles.popupActionBtn}
                                        onPress={(e) => {
                                            if (e && e.stopPropagation) e.stopPropagation();
                                            openUrl(links.website);
                                        }}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={styles.popupActionIcon}>🌐</Text>
                                        <Text style={styles.popupActionLabel}>
                                            {lang === "ku" ? "ماڵپە\u0631" : "Website"}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {hasMap && (
                                    <TouchableOpacity
                                        style={styles.popupActionBtn}
                                        onPress={(e) => {
                                            if (e && e.stopPropagation) e.stopPropagation();
                                            openUrl(links.mapUrl);
                                        }}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={styles.popupActionIcon}>📍</Text>
                                        <Text style={styles.popupActionLabel}>
                                            {lang === "ku" ? "نەخشە" : "Map"}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {hasDetails && (
                                    <TouchableOpacity
                                        style={[styles.popupActionBtn, styles.popupMoreBtn]}
                                        onPress={openDetail}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.popupMoreIcon}>→</Text>
                                        <Text style={[styles.popupActionLabel, styles.popupMoreLabel]}>
                                            {lang === "ku" ? "زیاتر" : "More"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Animated.View>
                    </View>
                </Modal>
            )}

            {/* ── Full Brand Detail Page ── */}
            <BrandDetailModal
                visible={detailVisible}
                onClose={() => setDetailVisible(false)}
                brandName={brand}
                brandData={links}
            />
        </>
    );
}

const styles = StyleSheet.create({
    // ── Chip ────────────────────────────────────────────────────────────────────
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        paddingLeft: spacing.sm,
        paddingRight: spacing.xs + 2,
        paddingVertical: spacing.xs,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    chipClickable: {
        borderColor: colors.accent + "66",
        backgroundColor: colors.accent + "10",
    },
    chipEmoji: {
        fontSize: 11,
        marginRight: 4,
    },
    brandName: {
        ...typography.tiny,
        color: colors.charcoal,
        fontWeight: "600",
        maxWidth: 100,
    },
    infoIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.accent + "33",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
    },
    infoIndicatorText: {
        fontSize: 9,
        color: colors.accentDark,
        fontWeight: "800",
    },
    iconBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 2,
        backgroundColor: "rgba(0,0,0,0.04)",
    },
    icon: { fontSize: 13 },

    // ── Popup ───────────────────────────────────────────────────────────────────
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(10,22,40,0.50)",
    },
    popupWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    popup: {
        width: "100%",
        maxWidth: 380,
        backgroundColor: colors.white,
        borderRadius: radius.xl,
        padding: spacing.lg,
        ...shadows.cardLifted,
    },

    // Header
    popupHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    popupLogoWrap: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
        flexShrink: 0,
    },
    popupLogo: {
        fontSize: 22,
    },
    popupHeaderText: {
        flex: 1,
    },
    popupBrandName: {
        ...typography.subtitle,
        color: colors.primary,
        fontWeight: "800",
    },
    popupCategory: {
        ...typography.tiny,
        color: colors.mediumGray,
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    popupCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.lightGray,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: spacing.sm,
    },
    popupCloseBtnText: {
        fontSize: 12,
        color: colors.darkGray,
        fontWeight: "700",
    },

    // Meta row
    popupMeta: {
        flexDirection: "row",
        gap: spacing.lg,
        marginBottom: spacing.sm,
    },
    popupMetaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    popupMetaIcon: {
        fontSize: 11,
    },
    popupMetaText: {
        ...typography.tiny,
        color: colors.darkGray,
        fontWeight: "600",
    },

    popupDivider: {
        height: 1,
        backgroundColor: colors.cardBorder,
        marginVertical: spacing.sm,
    },

    // Description
    popupDesc: {
        ...typography.body,
        color: colors.charcoal,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    textRTL: {
        textAlign: "right",
    },

    // Tagline
    popupTagline: {
        ...typography.tiny,
        color: colors.mediumGray,
        fontStyle: "italic",
        textAlign: "center",
        marginBottom: spacing.md,
    },

    // Actions
    popupActions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    rowRTL: {
        flexDirection: "row-reverse",
    },
    popupActionBtn: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.sm,
        backgroundColor: colors.offWhite,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: 4,
    },
    popupMoreBtn: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        flex: 1.3,
    },
    popupActionIcon: {
        fontSize: 18,
    },
    popupMoreIcon: {
        fontSize: 20,
        color: colors.white,
        fontWeight: "300",
    },
    popupActionLabel: {
        ...typography.tiny,
        color: colors.darkGray,
        fontWeight: "700",
        textAlign: "center",
    },
    popupMoreLabel: {
        color: colors.white,
    },
});

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";

export default function TotalCostBar({ quantities, materials }) {
    const { t, isRTL } = useLanguage();
    const { rate, lastUpdated, loading, error, refresh } = useExchangeRate();

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Calculate totals
    let totalItems = 0;
    let totalCost = 0;
    if (rate) {
        materials.forEach((m) => {
            const qty = quantities[m.id] || 0;
            if (qty > 0) {
                totalItems += 1;
                totalCost += Math.round(m.basePrice * rate) * qty;
            }
        });
    }

    const timeStr = lastUpdated
        ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "--:--";

    return (
        <View style={styles.container}>
            {/* Rate info row */}
            <View style={[styles.rateRow, isRTL && styles.rowRTL]}>
                <View style={[styles.rateInfo, isRTL && styles.rowRTL]}>
                    <View style={[styles.rateDot, error ? styles.rateDotError : styles.rateDotOk]} />
                    <Text style={styles.rateText}>
                        {t("usdToIqd")}: {rate ? formatNumber(Math.round(rate)) : "..."}{" "}
                    </Text>
                    <Text style={styles.timeText}>
                        {t("lastUpdated")}: {timeStr}
                    </Text>
                </View>
                <TouchableOpacity onPress={refresh} style={styles.refreshBtn} activeOpacity={0.7}>
                    <Text style={styles.refreshText}>↻</Text>
                </TouchableOpacity>
            </View>

            {/* Total row */}
            <View style={[styles.totalRow, isRTL && styles.rowRTL]}>
                <View>
                    <Text style={[styles.totalLabel, isRTL && styles.textRTL]}>{t("totalCost")}</Text>
                    <Text style={[styles.itemCount, isRTL && styles.textRTL]}>
                        {totalItems} {t("items")}
                    </Text>
                </View>
                <Text style={styles.totalValue}>
                    {formatNumber(totalCost)} {t("currency")}
                </Text>
            </View>

            {/* Safe Area Spacer for Bottom Mobile Navigation */}
            {Platform.OS !== "web" && <View style={styles.safeSpacer} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.md, // Adjusted for safeSpacer
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        ...shadows.bottomBar,
    },
    safeSpacer: {
        height: Platform.OS === "ios" ? 20 : 15,
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
        marginRight: spacing.sm,
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
        marginRight: spacing.sm,
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
});

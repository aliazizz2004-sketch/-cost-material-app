import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from "react-native";
import { getBrandLinks } from "../data/brandLinks";
import { colors, spacing, radius, typography } from "../styles/theme";

function openUrl(url) {
    if (!url) return;
    if (Platform.OS === "web") {
        window.open(url, "_blank");
    } else {
        Linking.openURL(url).catch(() => { });
    }
}

export default function BrandChip({ brand }) {
    const links = getBrandLinks(brand);
    const hasMap = !!(links && links.mapUrl);
    const hasWeb = !!(links && links.website);

    return (
        <View style={styles.chip}>
            <Text style={styles.brandName} numberOfLines={1}>{brand}</Text>

            {hasMap && (
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => openUrl(links.mapUrl)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                    <Text style={styles.icon}>📍</Text>
                </TouchableOpacity>
            )}

            {hasWeb && (
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => openUrl(links.website)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                    <Text style={styles.icon}>🌐</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.offWhite,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        paddingLeft: spacing.sm + 2,
        paddingRight: spacing.xs,
        paddingVertical: spacing.xs,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    brandName: {
        ...typography.tiny,
        color: colors.charcoal,
        fontWeight: "600",
        maxWidth: 110,
        marginRight: 2,
    },
    iconBtn: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 2,
    },
    icon: { fontSize: 12 },
});

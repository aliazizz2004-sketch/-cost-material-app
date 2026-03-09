import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";

export default function SearchBar({ value, onChangeText }) {
    const { t, isRTL } = useLanguage();

    return (
        <View style={styles.container}>
            <View style={styles.iconWrap}>
                <View style={styles.searchIcon}>
                    <View style={[styles.circle]} />
                    <View style={styles.handle} />
                </View>
            </View>
            <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("searchPlaceholder")}
                placeholderTextColor={colors.mediumGray}
                value={value}
                onChangeText={onChangeText}
                textAlign={isRTL ? "right" : "left"}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        height: 50,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconWrap: {
        marginRight: spacing.sm,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    searchIcon: {
        width: 16,
        height: 16,
    },
    circle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.mediumGray,
    },
    handle: {
        width: 2,
        height: 6,
        backgroundColor: colors.mediumGray,
        position: "absolute",
        bottom: 0,
        right: 1,
        borderRadius: 1,
        transform: [{ rotate: "45deg" }],
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.charcoal,
        height: "100%",
    },
    inputRTL: {
        textAlign: "right",
    },
});

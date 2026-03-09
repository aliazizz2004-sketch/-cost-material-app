import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { colors, spacing, radius, typography } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageToggle() {
    const { lang, toggleLanguage, t } = useLanguage();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={toggleLanguage}
            activeOpacity={0.7}
        >
            <View style={styles.inner}>
                <View style={[styles.option, lang === "en" && styles.optionActive]}>
                    <Text style={[styles.optionText, lang === "en" && styles.optionTextActive]}>
                        EN
                    </Text>
                </View>
                <View style={[styles.option, lang === "ku" && styles.optionActive]}>
                    <Text style={[styles.optionText, lang === "ku" && styles.optionTextActive]}>
                        کو
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: radius.full,
        overflow: "hidden",
    },
    inner: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: radius.full,
        padding: 3,
    },
    option: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 1,
        borderRadius: radius.full,
    },
    optionActive: {
        backgroundColor: colors.accent,
    },
    optionText: {
        ...typography.caption,
        color: "rgba(255,255,255,0.6)",
        fontWeight: "600",
    },
    optionTextActive: {
        color: colors.white,
        fontWeight: "700",
    },
});

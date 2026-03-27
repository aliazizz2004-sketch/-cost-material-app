import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, Platform } from "react-native";
import { colors, spacing, radius } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";

const LANGS = [
    { id: "en",  label: "EN" },
    { id: "ku",  label: "کوردی" },
    { id: "ar",  label: "عربي" },
];

export default function LanguageToggle() {
    const { lang, setLang } = useLanguage();

    return (
        <View style={styles.container}>
            {LANGS.map((l) => {
                const isActive = lang === l.id;
                const isRTLLabel = l.id === "ku" || l.id === "ar";
                return (
                    <TouchableOpacity
                        key={l.id}
                        style={[styles.option, isActive && styles.optionActive]}
                        onPress={() => setLang(l.id)}
                        activeOpacity={0.75}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                isActive && styles.optionTextActive,
                                isRTLLabel && styles.rtlText,
                            ]}
                            numberOfLines={1}
                        >
                            {l.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: radius.full,
        padding: 3,
        gap: 2,
    },
    option: {
        paddingHorizontal: Platform.OS === "web" ? 12 : 8,
        paddingVertical: 5,
        borderRadius: radius.full,
        minWidth: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    optionActive: {
        backgroundColor: colors.accent,
    },
    optionText: {
        fontSize: 11,
        color: "rgba(255,255,255,0.7)",
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    optionTextActive: {
        color: "#fff",
        fontWeight: "700",
    },
    rtlText: {
        // Force correct rendering for Arabic/Kurdish glyphs on all platforms
        writingDirection: "rtl",
        ...Platform.select({
            web: { direction: "rtl", unicodeBidi: "embed" },
            default: {},
        }),
    },
});

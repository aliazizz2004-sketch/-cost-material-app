import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Linking,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { getApiKey, saveApiKey, clearApiKey } from "../services/aiRecognition";

export default function ApiKeyModal({ visible, onClose, onKeySaved }) {
    const { lang, isRTL } = useLanguage();
    const [key, setKey] = useState("");
    const [existingKey, setExistingKey] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (visible) {
            loadExistingKey();
            setError(null);
            setSuccess(false);
        }
    }, [visible]);

    const loadExistingKey = async () => {
        const stored = await getApiKey();
        setExistingKey(stored);
        if (stored) {
            setKey(stored);
        }
    };

    const handleSave = async () => {
        const trimmed = key.trim();
        if (!trimmed) {
            setError(lang === "ku" ? "تکایە کلیلەکە بنووسە" : "Please enter an API key");
            return;
        }

        if (!trimmed.startsWith("AIza")) {
            setError(
                lang === "ku"
                    ? "کلیلی API دەبێت بە 'AIza' دەست پێبکات"
                    : "API key should start with 'AIza...'"
            );
            return;
        }

        setSaving(true);
        setError(null);

        // Test the key with a simple request
        try {
            // Test validity by making a minimal request to the specified 3.1 flash lite preview model
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${trimmed}`;
            const res = await fetch(testUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Say OK" }] }],
                    generationConfig: { maxOutputTokens: 5 },
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error?.message || "Invalid API key");
            }

            await saveApiKey(trimmed);
            setSuccess(true);
            setExistingKey(trimmed);
            setTimeout(() => {
                onKeySaved && onKeySaved(trimmed);
                onClose();
            }, 1000);
        } catch (err) {
            setError(
                lang === "ku"
                    ? "کلیلی API هەڵەیە: " + err.message
                    : "Invalid API key: " + err.message
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        await clearApiKey();
        setKey("");
        setExistingKey(null);
        setSuccess(false);
    };

    const openGeminiStudio = () => {
        Linking.openURL("https://aistudio.google.com/app/apikey");
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Close */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.headerIcon}>
                            <Text style={styles.headerEmoji}>🔑</Text>
                        </View>
                        <Text style={[styles.title, isRTL && styles.textRTL]}>
                            {lang === "ku" ? "دانانی AI" : "AI Setup"}
                        </Text>
                        <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
                            {lang === "ku"
                                ? "کلیلی Gemini API پێویستە بۆ ناسینەوەی مادە بە AI"
                                : "A Gemini API key is required for AI material recognition"}
                        </Text>

                        {/* Steps */}
                        <View style={styles.stepsContainer}>
                            <Text style={[styles.stepTitle, isRTL && styles.textRTL]}>
                                {lang === "ku" ? "چۆن کلیل بەدەست بهێنیت (بەخۆڕایی):" : "How to get a free key:"}
                            </Text>

                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>1</Text>
                                </View>
                                <Text style={[styles.stepText, isRTL && styles.textRTL]}>
                                    {lang === "ku"
                                        ? "سەردانی Google AI Studio بکە"
                                        : "Visit Google AI Studio"}
                                </Text>
                            </View>

                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>2</Text>
                                </View>
                                <Text style={[styles.stepText, isRTL && styles.textRTL]}>
                                    {lang === "ku"
                                        ? "کلیک لە 'Create API Key' بکە"
                                        : "Click 'Create API Key'"}
                                </Text>
                            </View>

                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>3</Text>
                                </View>
                                <Text style={[styles.stepText, isRTL && styles.textRTL]}>
                                    {lang === "ku"
                                        ? "کلیلەکە لێرە بلکێنە"
                                        : "Paste the key below"}
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.linkBtn} onPress={openGeminiStudio} activeOpacity={0.7}>
                                <Text style={styles.linkBtnText}>
                                    🌐 {lang === "ku" ? "کردنەوەی Google AI Studio" : "Open Google AI Studio"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Input */}
                        <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>
                            {lang === "ku" ? "کلیلی API" : "API Key"}
                        </Text>
                        <TextInput
                            style={[styles.input, error && styles.inputError, success && styles.inputSuccess]}
                            value={key}
                            onChangeText={(t) => {
                                setKey(t);
                                setError(null);
                                setSuccess(false);
                            }}
                            placeholder="AIzaSy..."
                            placeholderTextColor={colors.mediumGray}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={false}
                            multiline={false}
                        />

                        {/* Status messages */}
                        {error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        )}

                        {success && (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>
                                    ✅ {lang === "ku" ? "کلیلەکە ڕاستکرایەوە و پاشەکەوت کرا!" : "Key verified & saved!"}
                                </Text>
                            </View>
                        )}

                        {existingKey && (
                            <View style={styles.existingInfo}>
                                <Text style={styles.existingText}>
                                    ✓{" "}
                                    {lang === "ku"
                                        ? "کلیلی هەنووکەیی: " + existingKey.substring(0, 10) + "..."
                                        : "Current key: " + existingKey.substring(0, 10) + "..."}
                                </Text>
                            </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                activeOpacity={0.8}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.saveBtnText}>
                                        {lang === "ku" ? "پشکنین و پاشەکەوتکردن" : "Verify & Save"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {existingKey && (
                                <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} activeOpacity={0.7}>
                                    <Text style={styles.removeBtnText}>
                                        {lang === "ku" ? "سڕینەوەی کلیل" : "Remove Key"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
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
    modal: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.xl + 4,
        borderTopRightRadius: radius.xl + 4,
        maxHeight: "92%",
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl + 10,
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

    headerIcon: {
        alignSelf: "center",
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.offWhite,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    headerEmoji: {
        fontSize: 30,
    },
    title: {
        ...typography.hero,
        color: colors.charcoal,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.mediumGray,
        textAlign: "center",
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    textRTL: {
        textAlign: "right",
    },

    // Steps
    stepsContainer: {
        backgroundColor: colors.offWhite,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    stepTitle: {
        ...typography.subtitle,
        color: colors.charcoal,
        marginBottom: spacing.md,
    },
    step: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.sm,
    },
    stepNumberText: {
        ...typography.caption,
        color: colors.white,
        fontWeight: "800",
    },
    stepText: {
        ...typography.body,
        color: colors.charcoal,
        flex: 1,
    },
    linkBtn: {
        marginTop: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        alignItems: "center",
    },
    linkBtnText: {
        ...typography.caption,
        color: colors.accentLight,
        fontWeight: "700",
    },

    // Input
    inputLabel: {
        ...typography.caption,
        color: colors.darkGray,
        marginBottom: spacing.xs,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1.5,
        borderColor: colors.cardBorder,
        borderRadius: radius.md,
        padding: spacing.md,
        ...typography.body,
        color: colors.charcoal,
        backgroundColor: colors.offWhite,
        marginBottom: spacing.sm,
    },
    inputError: {
        borderColor: colors.error,
        backgroundColor: "#FFF5F5",
    },
    inputSuccess: {
        borderColor: colors.success,
        backgroundColor: "#F0FFF4",
    },

    // Messages
    errorBox: {
        backgroundColor: "#FFF5F5",
        borderRadius: radius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    errorText: {
        ...typography.caption,
        color: colors.error,
    },
    successBox: {
        backgroundColor: "#F0FFF4",
        borderRadius: radius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    successText: {
        ...typography.caption,
        color: colors.success,
        fontWeight: "600",
    },
    existingInfo: {
        marginBottom: spacing.md,
    },
    existingText: {
        ...typography.caption,
        color: colors.success,
    },

    // Actions
    actions: {
        marginTop: spacing.sm,
    },
    saveBtn: {
        backgroundColor: colors.accent,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        alignItems: "center",
        ...shadows.card,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        ...typography.subtitle,
        color: colors.white,
        fontWeight: "700",
    },
    removeBtn: {
        marginTop: spacing.md,
        alignItems: "center",
        paddingVertical: spacing.md,
    },
    removeBtnText: {
        ...typography.caption,
        color: colors.error,
    },
});

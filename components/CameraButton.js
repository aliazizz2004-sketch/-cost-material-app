import React from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { colors, shadows, radius } from "../styles/theme";

export default function CameraButton({ onPress }) {
    return (
        <TouchableOpacity
            style={styles.fab}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                {/* Camera icon built with Views */}
                <View style={styles.cameraBody}>
                    <View style={styles.cameraLens} />
                    <View style={styles.cameraFlash} />
                </View>
                {/* AI badge */}
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        bottom: 170,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        ...shadows.cardLifted,
    },
    iconContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    cameraBody: {
        width: 28,
        height: 22,
        borderRadius: 4,
        borderWidth: 2.5,
        borderColor: colors.white,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    cameraLens: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.white,
    },
    cameraFlash: {
        position: "absolute",
        top: -6,
        left: 6,
        width: 10,
        height: 5,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        backgroundColor: colors.white,
    },
    aiBadge: {
        position: "absolute",
        bottom: -8,
        right: -12,
        backgroundColor: colors.primary,
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    aiBadgeText: {
        fontSize: 8,
        fontWeight: "900",
        color: colors.accentLight,
        letterSpacing: 0.5,
    },
});

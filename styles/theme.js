import { Platform } from "react-native";

export const colors = {
    // Primary palette — deep navy & gold
    primary: "#0A1628",
    primaryLight: "#132240",
    primaryDark: "#060E1A",
    accent: "#D4A843",
    accentLight: "#E8C96A",
    accentDark: "#B8892E",

    // Semantic
    success: "#2ECC71",
    warning: "#F39C12",
    error: "#E74C3C",
    info: "#3498DB",

    // Neutrals
    white: "#FFFFFF",
    offWhite: "#F8F9FC",
    lightGray: "#E8ECF4",
    mediumGray: "#94A3B8",
    darkGray: "#475569",
    charcoal: "#1E293B",

    // Surface
    card: "#FFFFFF",
    cardBorder: "#E2E8F0",
    searchBg: "#F1F5F9",
    overlay: "rgba(10, 22, 40, 0.85)",

    // Gradient stops
    gradientStart: "#0A1628",
    gradientMid: "#132240",
    gradientEnd: "#1A3058",

    // Results / Info
    resultBackground: "#F7FAFC",
    resultBorder: "#E2E8F0",
    infoBackground: "#EBF4FF",
    infoBorder: "#BEE3F8",
    infoText: "#2C5282",
};

export const darkColors = {
    // Primary palette — dark theme variants
    primary: "#0D1B2A",
    primaryLight: "#1B2838",
    primaryDark: "#050C16",
    accent: "#E8C96A",
    accentLight: "#F0D98A",
    accentDark: "#D4A843",

    // Semantic
    success: "#2ECC71",
    warning: "#F39C12",
    error: "#E74C3C",
    info: "#3498DB",

    // Neutrals (inverted for dark)
    white: "#0F1923",
    offWhite: "#141E2B",
    lightGray: "#1E2A3A",
    mediumGray: "#7B8FA1",
    darkGray: "#C0CCD8",
    charcoal: "#E8ECF4",

    // Surface
    card: "#1A2535",
    cardBorder: "#2A3A4E",
    searchBg: "#1E2A3A",
    overlay: "rgba(0, 0, 0, 0.85)",

    // Gradient stops
    gradientStart: "#0D1B2A",
    gradientMid: "#1B2838",
    gradientEnd: "#243348",

    // Results / Info
    resultBackground: "#1A2535",
    resultBorder: "#2A3A4E",
    infoBackground: "#1B2838",
    infoBorder: "#2A3A4E",
    infoText: "#93C5FD",
};

/**
 * Get colors based on dark mode state
 * @param {boolean} isDark
 * @returns colors object
 */
export function getColors(isDark) {
    return isDark ? darkColors : colors;
}

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
};

export const typography = {
    hero: {
        fontSize: 26,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: "600",
    },
    body: {
        fontSize: 14,
        fontWeight: "400",
    },
    caption: {
        fontSize: 12,
        fontWeight: "500",
    },
    tiny: {
        fontSize: 10,
        fontWeight: "400",
    },
};

export const shadows = {
    card: Platform.select({
        web: { boxShadow: "0px 2px 12px rgba(0,0,0,0.08)" },
        default: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
        }
    }),
    cardLifted: Platform.select({
        web: { boxShadow: "0px 6px 20px rgba(0,0,0,0.12)" },
        default: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 8,
        }
    }),
    bottomBar: Platform.select({
        web: { boxShadow: "0px -4px 16px rgba(0,0,0,0.15)" },
        default: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
        }
    }),
};

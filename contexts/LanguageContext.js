import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import strings from "../i18n/strings";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState("en");

    const t = useCallback(
        (key) => {
            return strings[lang]?.[key] || strings.en?.[key] || key;
        },
        [lang]
    );

    const toggleLanguage = useCallback(() => {
        setLang((prev) => {
            if (prev === "en") return "ku";
            if (prev === "ku") return "ar";
            return "en";
        });
    }, []);

    const isRTL = lang === "ku" || lang === "ar";

    const [fontsLoaded] = useFonts({
      PeshangDes5Bold: require("../assets/kufont/Peshang_Des_5_Bold.ttf"),
      NotoSansArabic: require("../assets/kufont/NotoSansArabic-Regular.ttf"),
    });

    // ─── Kurdish font helper ───────────────────────────────────────────
    // Apply PeshangDes5Bold for Kurdish (ku) text on all platforms.
    // Falls back gracefully when fonts are still loading.
    const kuFont = (isKu = (lang === "ku")) => {
      if (!isKu) return {};
      return Platform.select({
        web: {
          fontFamily: fontsLoaded
            ? "'PeshangDes5Bold', 'Scheherazade New', 'Arial Unicode MS', system-ui, sans-serif"
            : "'Scheherazade New', 'Arial Unicode MS', system-ui, sans-serif",
        },
        // On Android/iOS: use loaded font name or fall back to system default
        // The system default on Android supports Kurdish Sorani via Unicode
        default: fontsLoaded
          ? { fontFamily: "PeshangDes5Bold" }
          : { fontFamily: undefined },
      });
    };

    // ─── Arabic font helper ────────────────────────────────────────────
    // Apply NotoSansArabic for Arabic (ar) text on all platforms.
    // This is CRITICAL on Android — without specifying a font that supports
    // Arabic Unicode, Android renders blank/invisible characters.
    const arFont = (isAr = (lang === "ar")) => {
      if (!isAr) return {};
      return Platform.select({
        web: {
          fontFamily: fontsLoaded
            ? "'NotoSansArabic', 'Arabic Typesetting', 'Arial Unicode MS', system-ui, sans-serif"
            : "'Arabic Typesetting', 'Arial Unicode MS', system-ui, sans-serif",
        },
        // On Android/iOS: NotoSansArabic is bundled via expo-font — must be specified
        default: fontsLoaded
          ? { fontFamily: "NotoSansArabic" }
          : { fontFamily: undefined },
      });
    };

    // ─── RTL font helper (auto-selects ku or ar font) ─────────────────
    // Convenience: use this in components that display text in the current language
    // regardless of which RTL language is active.
    const rtlFont = () => {
      if (lang === "ku") return kuFont(true);
      if (lang === "ar") return arFont(true);
      return {};
    };

    // Sync document direction and language attribute on web
    useEffect(() => {
        if (Platform.OS === "web" && typeof document !== "undefined") {
            document.documentElement.lang = lang;
        }
    }, [lang, isRTL]);

    // ─── Block render until fonts are loaded ──────────────────────────
    // This prevents blank Arabic/Kurdish text during the initial render
    // where the font file hasn't been registered yet by expo-font.
    if (!fontsLoaded) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1628' }}>
          <ActivityIndicator size="large" color="#D4A843" />
        </View>
      );
    }

    const value = { lang, setLang, t, toggleLanguage, isRTL, kuFont, arFont, rtlFont };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}


export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within LanguageProvider");
    }
    return context;
}

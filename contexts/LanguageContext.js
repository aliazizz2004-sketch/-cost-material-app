import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
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

    // Helper: apply Kurdish font (PeshangDes5Bold - original, user-preferred)
    const kuFont = (isKu = (lang === "ku")) => {
      if (!isKu) return {};
      return Platform.select({
        web: {
          fontFamily: fontsLoaded
            ? "'PeshangDes5Bold', 'Scheherazade New', 'Arial Unicode MS', system-ui, sans-serif"
            : "'Scheherazade New', 'Arial Unicode MS', system-ui, sans-serif",
        },
        default: fontsLoaded ? { fontFamily: "PeshangDes5Bold" } : {},
      });
    };

    // Sync document direction and language attribute on web
    useEffect(() => {
        if (Platform.OS === "web" && typeof document !== "undefined") {
            document.documentElement.lang = lang;
            // We NO LONGER set dir="rtl" on document/body because we handle 
            // layout flips manually via flexDirection row-reverse and textRTL.
            // Setting it here causes "double-flips" and shift issues on many browsers.
        }
    }, [lang, isRTL]);

    const value = { lang, setLang, t, toggleLanguage, isRTL, kuFont };

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

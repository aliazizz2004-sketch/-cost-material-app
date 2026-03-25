import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
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
        setLang((prev) => (prev === "en" ? "ku" : "en"));
    }, []);

    const isRTL = lang === "ku";

    // Sync document direction and language attribute on web
    useEffect(() => {
        if (Platform.OS === "web" && typeof document !== "undefined") {
            document.documentElement.lang = lang === "ku" ? "ku" : "en";
            // We NO LONGER set dir="rtl" on document/body because we handle 
            // layout flips manually via flexDirection row-reverse and textRTL.
            // Setting it here causes "double-flips" and shift issues on many browsers.
        }
    }, [lang, isRTL]);

    const value = { lang, setLang, t, toggleLanguage, isRTL };

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

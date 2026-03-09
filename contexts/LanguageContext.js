import React, { createContext, useContext, useState, useCallback } from "react";
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

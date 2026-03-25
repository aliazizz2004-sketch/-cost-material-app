import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

const STORAGE_KEY = "costMaterialThemeMode";

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((v) => {
            if (v === "dark") setIsDark(true);
        });
    }, []);

    const toggleTheme = useCallback(async () => {
        const next = !isDark;
        setIsDark(next);
        await AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    }, [isDark]);

    const value = { isDark, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}

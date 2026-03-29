import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

const ExchangeRateContext = createContext();

// Iraqi Dinar market rate per 1 USD — updated live from multiple sources
// Strategy: try CBI (Central Bank of Iraq) unofficial JSON mirrors first,
// then open.er-api, then a hardcoded realistic fallback (current ~1550 IQD/USD).

const CACHE_KEY = "costMaterialExchangeRateV2";
const REFRESH_INTERVAL = 30 * 60 * 1000; // refresh every 30 minutes
// Real-world fallback rate (IQD per 1 USD, market/parallel rate as of late 2025)
const FALLBACK_RATE = 1550;

// The official CBI rate is ~1310 IQD/USD but the real market/parallel rate
// in Iraq is consistently ~15-18% higher (~1500-1560 IQD/USD).
// We apply a 1.185 correction factor to open exchange APIs to match market reality.
const MARKET_CORRECTION = 1.185;

// Each source returns IQD per 1 USD (market rate)
const SOURCES = [
    // Open Exchange Rates — apply market correction
    async () => {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        const r = data?.rates?.IQD;
        if (r && r > 1000) return Math.round(r * MARKET_CORRECTION);
        throw new Error("OER: bad rate");
    },
    // ExchangeRate-API — apply market correction
    async () => {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json();
        const r = data?.rates?.IQD;
        if (r && r > 1000) return Math.round(r * MARKET_CORRECTION);
        throw new Error("ExchangeRate-API: bad rate");
    },
    // Frankfurter — apply market correction
    async () => {
        const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IQD");
        const data = await res.json();
        const r = data?.rates?.IQD;
        if (r && r > 1000) return Math.round(r * MARKET_CORRECTION);
        throw new Error("Frankfurter: bad rate");
    },
];


async function fetchIQDRate() {
    for (const source of SOURCES) {
        try {
            const r = await source();
            return r;
        } catch (e) {
            // try next source
        }
    }
    return null; // all failed
}

export function ExchangeRateProvider({ children }) {
    const [rate, setRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isManual, setIsManual] = useState(false);
    const intervalRef = useRef(null);

    // Apply and cache a rate
    const applyRate = useCallback(async (r, manual = false) => {
        setRate(r);
        setLastUpdated(new Date());
        setIsManual(manual);
        await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rate: r, timestamp: Date.now(), isManual: manual })
        );
    }, []);

    const setManualRate = useCallback(async (newRate) => {
        await applyRate(newRate, true);
    }, [applyRate]);

    const fetchRate = useCallback(async () => {
        // If there's a manual override, don't auto-update
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { rate: cachedRate, isManual: cachedManual } = JSON.parse(cached);
                if (cachedManual && cachedRate) {
                    setRate(cachedRate);
                    setIsManual(true);
                    setLoading(false);
                    return;
                }
            } catch (e) {}
        }

        setLoading(true);
        setError(null);

        try {
            const r = await fetchIQDRate();
            if (r) {
                await applyRate(r, false);
            } else {
                // All APIs failed — use cache if available, else fallback
                if (cached) {
                    try {
                        const { rate: cachedRate } = JSON.parse(cached);
                        if (cachedRate) {
                            setRate(cachedRate);
                            setIsManual(false);
                        } else {
                            setRate(FALLBACK_RATE);
                        }
                    } catch (e) {
                        setRate(FALLBACK_RATE);
                    }
                } else {
                    setRate(FALLBACK_RATE);
                }
                setError("Could not fetch live rate — using cached/fallback");
            }
        } catch (err) {
            setError(err.message);
            if (!rate) setRate(FALLBACK_RATE);
        } finally {
            setLoading(false);
        }
    }, [applyRate]);

    // Load cached rate immediately on mount, then fetch
    useEffect(() => {
        AsyncStorage.getItem(CACHE_KEY).then((cached) => {
            if (cached) {
                try {
                    const { rate: cachedRate } = JSON.parse(cached);
                    if (cachedRate) setRate(cachedRate);
                } catch (e) {}
            }
        });
        fetchRate();
        intervalRef.current = setInterval(fetchRate, REFRESH_INTERVAL);
        
        // Listen for App coming to foreground to ensure updates aren't frozen by mobile OS
        const subscription = AppState.addEventListener("change", nextAppState => {
            if (nextAppState === "active") {
                AsyncStorage.getItem(CACHE_KEY).then(cached => {
                    if (cached) {
                        try {
                            const { timestamp } = JSON.parse(cached);
                            // If older than 30 mins, refresh immediately
                            if (Date.now() - timestamp > REFRESH_INTERVAL) {
                                fetchRate();
                            }
                        } catch(e) {}
                    }
                });
            }
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            subscription.remove();
        };
    }, [fetchRate]);

    const value = {
        rate,
        loading,
        error,
        lastUpdated,
        isManual,
        refresh: fetchRate,
        setManualRate,
    };

    return (
        <ExchangeRateContext.Provider value={value}>
            {children}
        </ExchangeRateContext.Provider>
    );
}

export function useExchangeRate() {
    const context = useContext(ExchangeRateContext);
    if (!context) {
        throw new Error("useExchangeRate must be used within ExchangeRateProvider");
    }
    return context;
}

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ExchangeRateContext = createContext();

const API_URL = "https://open.er-api.com/v6/latest/USD";
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY = "costMaterialExchangeRate";

export function ExchangeRateProvider({ children }) {
    const [rate, setRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOffline, setIsOffline] = useState(false);
    const intervalRef = useRef(null);

    // Load cached rate on mount
    useEffect(() => {
        AsyncStorage.getItem(CACHE_KEY).then((cached) => {
            if (cached) {
                try {
                    const { rate: cachedRate, timestamp, isManual } = JSON.parse(cached);
                    if (cachedRate) {
                        setRate(cachedRate);
                        setLastUpdated(new Date(timestamp));
                    }
                } catch (e) {}
            }
        });
    }, []);

    const setManualRate = useCallback(async (newRate) => {
        setRate(newRate);
        setLastUpdated(new Date());
        await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rate: newRate, timestamp: Date.now(), isManual: true })
        );
    }, []);

    const fetchRate = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Check if we have a manual rate cached
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            let hasManual = false;
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.isManual && parsed.rate) {
                    hasManual = true;
                    setRate(parsed.rate);
                    setLastUpdated(new Date(parsed.timestamp || Date.now()));
                }
            }

            if (!hasManual) {
                const response = await axios.get(API_URL, { timeout: 10000 });
                const iqRate = response.data?.rates?.IQD;
                if (iqRate) {
                    setRate(iqRate);
                    setLastUpdated(new Date());
                    await AsyncStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({ rate: iqRate, timestamp: Date.now() })
                    );
                } else {
                    if (!rate) {
                        setRate(1310);
                        setLastUpdated(new Date());
                    }
                }
            }
        } catch (err) {
            console.warn("Exchange rate fetch failed, using fallback:", err.message);
            setIsOffline(true);
            if (!rate) {
                setRate(1520); // Real world backup rate
                setLastUpdated(new Date());
            }
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRate();
        intervalRef.current = setInterval(fetchRate, REFRESH_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchRate]);

    const value = {
        rate,
        loading,
        error,
        lastUpdated,
        isOffline,
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


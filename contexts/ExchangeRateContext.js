import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const ExchangeRateContext = createContext();

const API_URL = "https://open.er-api.com/v6/latest/USD";
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function ExchangeRateProvider({ children }) {
    const [rate, setRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const intervalRef = useRef(null);

    const fetchRate = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(API_URL, { timeout: 10000 });
            const iqRate = response.data?.rates?.IQD;
            if (iqRate) {
                setRate(iqRate);
                setLastUpdated(new Date());
            } else {
                // Fallback rate if API doesn't return IQD
                setRate(1310);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.warn("Exchange rate fetch failed, using fallback:", err.message);
            // Use a fallback rate so the app is always functional
            if (!rate) {
                setRate(1310);
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
        refresh: fetchRate,
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

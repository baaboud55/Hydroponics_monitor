import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that polls backend API instead of WebSockets
 * Provides real-time sensor data and connection status
 */
export function useWebSocket() {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const { getState } = useBackendAPI();

    useEffect(() => {
        let isMounted = true;
        let timeoutId = null;

        const poll = async () => {
            try {
                const result = await getState();
                if (isMounted) {
                    setData(result);
                    setIsConnected(true);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setIsConnected(false);
                    setError('Connection error');
                }
            }
            if (isMounted) {
                timeoutId = setTimeout(poll, 2000);
            }
        };

        poll();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    return { data, isConnected, error };
}

/**
 * Hook for sending API requests to backend
 */
export function useBackendAPI() {
    // Auto-detect if we are running off-device (e.g. dev server, github pages)
    // and point to the ESP32 IP/hostname instead of relative paths.
    const hostname = window.location.hostname;
    const isOffDevice = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('github.io');
    const baseURL = isOffDevice ? 'http://hydromonitor.local' : '';

    const manualDose = async (pumpIndex, durationMs) => {
        try {
            const response = await fetch(`${baseURL}/api/dosing/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pump_index: pumpIndex,
                    duration_ms: durationMs,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Dose command sent:', result);
            return result;
        } catch (error) {
            console.error('Failed to send dose command:', error);
            throw error;
        }
    };

    const getState = async () => {
        try {
            const response = await fetch(`${baseURL}/api/state`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch state:', error);
            throw error;
        }
    };

    return { manualDose, getState };
}

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for WebSocket connection to backend
 * Provides real-time sensor data and connection status
 */
export function useWebSocket(url = 'ws://localhost:8000/ws') {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    useEffect(() => {
        const connect = () => {
            try {
                ws.current = new WebSocket(url);

                ws.current.onopen = () => {
                    console.log('WebSocket connected');
                    setIsConnected(true);
                    setError(null);
                };

                ws.current.onmessage = (event) => {
                    try {
                        const receivedData = JSON.parse(event.data);
                        setData(receivedData);
                    } catch (err) {
                        console.error('Failed to parse WebSocket message:', err);
                    }
                };

                ws.current.onerror = (event) => {
                    console.error('WebSocket error:', event);
                    setError('Connection error');
                };

                ws.current.onclose = () => {
                    console.log('WebSocket disconnected');
                    setIsConnected(false);

                    // Auto-reconnect after 3 seconds
                    reconnectTimeout.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 3000);
                };
            } catch (err) {
                console.error('Failed to create WebSocket:', err);
                setError(err.message);
            }
        };

        connect();

        // Cleanup on unmount
        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

    return { data, isConnected, error };
}

/**
 * Hook for sending API requests to backend
 */
export function useBackendAPI() {
    const baseURL = 'http://localhost:8000';

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

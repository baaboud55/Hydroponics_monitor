// API Service for Backend Communication
const API_BASE_URL = 'http://localhost:8000';

export const api = {
    // Get current system state
    getState: async () => {
        const response = await fetch(`${API_BASE_URL}/api/state`);
        return await response.json();
    },

    // Get complete configuration
    getConfig: async () => {
        const response = await fetch(`${API_BASE_URL}/api/config`);
        return await response.json();
    },

    // Update parameter configuration
    updateParameter: async (parameter, updates) => {
        const response = await fetch(`${API_BASE_URL}/api/config/parameter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parameter, ...updates })
        });
        if (!response.ok) throw new Error('Failed to update parameter');
        return await response.json();
    },

    // Toggle automation for a parameter
    toggleAutomation: async (parameter, enabled) => {
        const response = await fetch(`${API_BASE_URL}/api/config/automation/${parameter}/${enabled}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to toggle automation');
        return await response.json();
    },

    // Get dosing history
    getDosingHistory: async (limit = 50) => {
        const response = await fetch(`${API_BASE_URL}/api/dosing/history?limit=${limit}`);
        return await response.json();
    },

    // Manual dosing
    manualDose: async (pumpIndex, durationMs) => {
        const response = await fetch(`${API_BASE_URL}/api/dosing/manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pump_index: pumpIndex, duration_ms: durationMs })
        });
        if (!response.ok) throw new Error('Failed to trigger manual dose');
        return await response.json();
    },

    // Reset PID controllers
    resetControllers: async () => {
        const response = await fetch(`${API_BASE_URL}/api/dosing/reset`, {
            method: 'POST'
        });
        return await response.json();
    },

    // WebSocket connection for real-time updates
    connectWebSocket: (onMessage) => {
        const ws = new WebSocket(`ws://localhost:8000/ws`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt reconnection after 3 seconds
            setTimeout(() => connectWebSocket(onMessage), 3000);
        };

        return ws;
    }
};

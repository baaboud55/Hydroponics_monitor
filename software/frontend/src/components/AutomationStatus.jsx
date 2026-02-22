import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Zap, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function AutomationStatus() {
    const [history, setHistory] = useState([]);
    const [automationState, setAutomationState] = useState({
        ph: { enabled: false, target: 0, current: 0 },
        ec: { enabled: false, target: 0, current: 0 }
    });
    const [lastDose, setLastDose] = useState(null);

    useEffect(() => {
        loadHistory();
        const interval = setInterval(loadHistory, 10000); // Refresh every 10 seconds

        // WebSocket for real-time updates
        const ws = api.connectWebSocket((data) => {
            if (data.automation_status) {
                setAutomationState({
                    ph: {
                        enabled: data.automation_status.enabled?.ph || false,
                        target: data.automation_status.targets?.ph || 0,
                        current: data.automation_status.current?.ph || 0
                    },
                    ec: {
                        enabled: data.automation_status.enabled?.ec || false,
                        target: data.automation_status.targets?.ec || 0,
                        current: data.automation_status.current?.ec || 0
                    }
                });
            }
            if (data.last_dose) {
                setLastDose(data.last_dose);
            }
        });

        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, []);

    const loadHistory = async () => {
        try {
            const data = await api.getDosingHistory(20);
            setHistory(data.history || []);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const getErrorLevel = (parameter) => {
        const state = automationState[parameter];
        const error = Math.abs(state.current - state.target);
        if (error < 0.1) return 'good';
        if (error < 0.3) return 'warning';
        return 'critical';
    };

    const ErrorGauge = ({ parameter, label, unit }) => {
        const state = automationState[parameter];
        const error = Math.abs(state.current - state.target);
        const level = getErrorLevel(parameter);
        const percentage = Math.min((error / state.target) * 100, 100);

        const colors = {
            good: 'bg-green-500',
            warning: 'bg-yellow-500',
            critical: 'bg-red-500'
        };

        return (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${state.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {state.enabled ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                        {state.current.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">/ {state.target.toFixed(2)} {unit}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colors[level]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                    Error: ±{error.toFixed(2)} {unit}
                </div>
            </div>
        );
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    return (
        <div className="space-y-4">
            {/* Status Overview */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Automation Status</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="opacity-80">Active Parameters</p>
                        <p className="text-2xl font-bold">
                            {(automationState.ph.enabled ? 1 : 0) + (automationState.ec.enabled ? 1 : 0)}/2
                        </p>
                    </div>
                    <div>
                        <p className="opacity-80">Last Dose</p>
                        <p className="text-lg font-semibold">
                            {lastDose ? `${lastDose.type.toUpperCase()} ${lastDose.amount_ml.toFixed(1)}ml` : 'None'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Gauges */}
            <div className="grid grid-cols-2 gap-3">
                <ErrorGauge parameter="ph" label="pH Level" unit="pH" />
                <ErrorGauge parameter="ec" label="EC (Nutrients)" unit="mS/cm" />
            </div>

            {/* Dosing History */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Dosing History
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No dosing history yet</p>
                    ) : (
                        history.map((entry, idx) => (
                            <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="flex items-start gap-2">
                                    {entry.parameter === 'ph' ? (
                                        <Droplet className="w-4 h-4 text-blue-600 mt-0.5" />
                                    ) : (
                                        <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {entry.parameter.toUpperCase()} Dose
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {entry.amount_ml.toFixed(1)}ml •
                                            Current: {entry.current_value.toFixed(2)} →
                                            Target: {entry.target_value.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {formatTime(entry.timestamp)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Safety Notice */}
            {(automationState.ph.enabled || automationState.ec.enabled) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-yellow-900">Automation Active</p>
                        <p className="text-yellow-800 mt-1">
                            The system is automatically dosing to maintain target parameters.
                            Safety limits are enforced.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

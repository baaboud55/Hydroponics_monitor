import React, { useState, useEffect } from 'react';
import { Droplet, Zap, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ParameterConfig() {
    const [config, setConfig] = useState({
        ph: { target: 6.0, tolerance: 0.2, enabled: false, min_value: 4.0, max_value: 8.0 },
        ec: { target: 1.5, tolerance: 0.1, enabled: false, min_value: 0.5, max_value: 3.0 }
    });

    const [currentValues, setCurrentValues] = useState({ ph: 0, ec: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Load configuration on mount
    useEffect(() => {
        loadConfig();
        // Set up WebSocket for real-time data
        const ws = api.connectWebSocket((data) => {
            setCurrentValues({
                ph: data.ph || 0,
                ec: data.ec || 0
            });
        });

        return () => ws.close();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await api.getConfig();
            setConfig({
                ph: data.ph,
                ec: data.ec
            });
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    };

    const handleUpdateParameter = async (parameter, field, value) => {
        const newConfig = {
            ...config,
            [parameter]: { ...config[parameter], [field]: value }
        };
        setConfig(newConfig);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Update pH configuration
            await api.updateParameter('ph', config.ph);
            // Update EC configuration
            await api.updateParameter('ec', config.ec);

            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save configuration' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleAutomation = async (parameter) => {
        const newEnabled = !config[parameter].enabled;
        try {
            await api.toggleAutomation(parameter, newEnabled);
            setConfig({
                ...config,
                [parameter]: { ...config[parameter], enabled: newEnabled }
            });
        } catch (error) {
            console.error('Failed to toggle automation:', error);
        }
    };

    const ParameterControl = ({ parameter, icon: Icon, label, unit, color }) => {
        const cfg = config[parameter];
        const current = currentValues[parameter];
        const error = Math.abs(current - cfg.target);
        const withinTolerance = error <= cfg.tolerance;

        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${color}-100`}>
                            <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{label}</h3>
                            <p className="text-sm text-gray-500">Autonomous Control</p>
                        </div>
                    </div>

                    {/* Automation Toggle */}
                    <button
                        onClick={() => handleToggleAutomation(parameter)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cfg.enabled ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cfg.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>

                {/* Current vs Target */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-xs text-gray-500">Current</span>
                            <p className={`text-2xl font-bold ${withinTolerance ? 'text-green-600' : 'text-orange-600'}`}>
                                {current.toFixed(1)} {unit}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-500">Target</span>
                            <p className="text-2xl font-bold text-gray-900">
                                {cfg.target.toFixed(1)} {unit}
                            </p>
                        </div>
                    </div>
                    {!withinTolerance && cfg.enabled && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Outside tolerance, dosing active</span>
                        </div>
                    )}
                </div>

                {/* Target Value Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Value
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleUpdateParameter(parameter, 'target', Math.max(cfg.min_value, cfg.target - 0.1))}
                            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={cfg.target}
                            onChange={(e) => handleUpdateParameter(parameter, 'target', parseFloat(e.target.value))}
                            step="0.1"
                            min={cfg.min_value}
                            max={cfg.max_value}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold"
                        />
                        <button
                            onClick={() => handleUpdateParameter(parameter, 'target', Math.min(cfg.max_value, cfg.target + 0.1))}
                            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Tolerance Slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tolerance: ±{cfg.tolerance.toFixed(2)} {unit}
                    </label>
                    <input
                        type="range"
                        value={cfg.tolerance}
                        onChange={(e) => handleUpdateParameter(parameter, 'tolerance', parseFloat(e.target.value))}
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Tight (0.05)</span>
                        <span>Loose (0.5)</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Parameter Configuration</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Set target values and enable automation for autonomous dosing
                </p>
            </div>

            {/* Message Display */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Parameter Controls */}
            <div className="space-y-4 mb-6">
                <ParameterControl
                    parameter="ph"
                    icon={Droplet}
                    label="pH Level"
                    unit="pH"
                    color="blue"
                />
                <ParameterControl
                    parameter="ec"
                    icon={Zap}
                    label="EC (Nutrients)"
                    unit="mS/cm"
                    color="purple"
                />
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Set your desired target values for pH and EC</li>
                    <li>• Adjust tolerance to control how precisely the system maintains values</li>
                    <li>• Enable automation to start autonomous dosing</li>
                    <li>• The system will automatically dose to keep parameters within target ± tolerance</li>
                </ul>
            </div>
        </div>
    );
}

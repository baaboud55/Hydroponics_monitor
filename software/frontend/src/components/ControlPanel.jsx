import React, { useState, useEffect } from 'react';
import { Power, Droplets, Zap, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function ControlPanel({ systemData }) {
    const { t } = useLanguage();
    // Initialise state from WS data so it survives reconnects/refreshes
    const [solenoids, setSolenoids] = useState(systemData?.solenoids ?? Array(8).fill(false));
    const [pumps, setPumps] = useState(systemData?.circulation_pumps ?? Array(6).fill(false));
    const [mainPump, setMainPump] = useState(systemData?.main_pump ?? false);

    // Dosing pump UI state (speed + name, not tracked on backend for now)
    const [dosingPumps, setDosingPumps] = useState([
        { name: t('pumpA'), speed: 0, active: false },
        { name: t('pumpB'), speed: 0, active: false },
        { name: t('phUpDown'), speed: 0, active: false },
        { name: t('auxPump'), speed: 0, active: false },
    ]);

    const [feedback, setFeedback] = useState(null); // { text, ok }

    // Sync actuator states when WS reconnects and sends a fresh full state
    useEffect(() => {
        if (!systemData) return;
        if (systemData.solenoids) setSolenoids([...systemData.solenoids]);
        if (systemData.circulation_pumps) setPumps([...systemData.circulation_pumps]);
        if (systemData.main_pump !== undefined) setMainPump(systemData.main_pump);
    }, [systemData?.solenoids?.join(','), systemData?.circulation_pumps?.join(','), systemData?.main_pump]);

    const showFeedback = (text, ok = true) => {
        setFeedback({ text, ok });
        setTimeout(() => setFeedback(null), 2500);
    };

    // Toggle solenoid — optimistic UI + backend call
    const toggleSolenoid = async (index) => {
        const newState = !solenoids[index];
        const updated = [...solenoids];
        updated[index] = newState;
        setSolenoids(updated);
        try {
            await api.toggleSolenoid(index, newState);
            showFeedback(`Solenoid S${index} ${newState ? 'opened' : 'closed'}`);
        } catch (e) {
            // Revert on failure
            updated[index] = !newState;
            setSolenoids([...updated]);
            showFeedback(`Failed to toggle S${index}`, false);
        }
    };

    // Toggle circulation pump
    const togglePump = async (index) => {
        const newState = !pumps[index];
        const updated = [...pumps];
        updated[index] = newState;
        setPumps(updated);
        try {
            await api.togglePump(index, newState);
            showFeedback(`Pump P${index} ${newState ? 'started' : 'stopped'}`);
        } catch (e) {
            updated[index] = !newState;
            setPumps([...updated]);
            showFeedback(`Failed to toggle P${index}`, false);
        }
    };

    // Toggle main pump
    const toggleMainPump = async () => {
        const newState = !mainPump;
        setMainPump(newState);
        try {
            await api.toggleMainPump(newState);
            showFeedback(`Main Pump ${newState ? 'started' : 'stopped'}`);
        } catch (e) {
            setMainPump(!newState);
            showFeedback('Failed to toggle Main Pump', false);
        }
    };

    // Update dosing pump speed (UI only for now)
    const updateDosingSpeed = (index, speed) => {
        const updated = [...dosingPumps];
        updated[index] = { ...updated[index], speed };
        setDosingPumps(updated);
    };

    // Start timed dosing via backend
    const startDosing = async (index, duration = 5000) => {
        try {
            await api.manualDose(index, duration);
            showFeedback(`Dosing pump ${dosingPumps[index].name}: ${duration / 1000}s command sent`);
        } catch (error) {
            showFeedback(`Failed to dose ${dosingPumps[index].name}`, false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Feedback Toast */}
            {feedback && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow transition-all ${feedback.ok
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {feedback.ok
                        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 flex-shrink-0" />}
                    {feedback.text}
                </div>
            )}

            {/* Solenoid Valves */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    {t('solenoidValves')}
                </h2>
                <div className="grid grid-cols-4 gap-3">
                    {solenoids.map((active, index) => (
                        <button
                            key={index}
                            onClick={() => toggleSolenoid(index)}
                            className={`py-3 px-4 rounded-lg font-medium transition-all active:scale-95 ${active
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            S{index}
                        </button>
                    ))}
                </div>
            </section>

            {/* Circulation Pumps */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Power className="w-5 h-5 text-green-600" />
                    {t('circulationPumps')}
                </h2>
                <div className="grid grid-cols-3 gap-3 mb-3">
                    {pumps.map((active, index) => (
                        <button
                            key={index}
                            onClick={() => togglePump(index)}
                            className={`py-3 px-4 rounded-lg font-medium transition-all active:scale-95 ${active
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            P{index}
                        </button>
                    ))}
                </div>
                {/* Main Pump */}
                <button
                    onClick={toggleMainPump}
                    className={`w-full py-4 rounded-lg font-semibold text-lg transition-all active:scale-95 ${mainPump
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {t('mainPump')} {mainPump && '●'}
                </button>
            </section>

            {/* Dosing Pumps */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    {t('dosingPumps')}
                </h2>
                <div className="space-y-4">
                    {dosingPumps.map((pump, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-700">{pump.name}</span>
                                <span className="text-sm font-semibold text-purple-600">
                                    {pump.speed}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={pump.speed}
                                onChange={(e) => updateDosingSpeed(index, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <button
                                onClick={() => startDosing(index, 5000)}
                                disabled={pump.speed === 0}
                                className="mt-2 w-full py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" />
                                {t('dose5s')}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

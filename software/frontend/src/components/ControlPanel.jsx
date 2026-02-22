import React, { useState } from 'react';
import { Power, Droplets, Zap, PlayCircle } from 'lucide-react';
import { useBackendAPI } from '../hooks/useWebSocket';

export default function ControlPanel() {
    const { manualDose } = useBackendAPI();

    // State for solenoids (8 valves)
    const [solenoids, setSolenoids] = useState(Array(8).fill(false));

    // State for pumps (6 regular + 1 big)
    const [pumps, setPumps] = useState(Array(6).fill(false));
    const [bigPump, setBigPump] = useState(false);

    // State for dosing pumps (4 pumps with speed)
    const [dosingPumps, setDosingPumps] = useState([
        { name: 'Pump A', speed: 0, active: false },
        { name: 'Pump B', speed: 0, active: false },
        { name: 'pH', speed: 0, active: false },
        { name: 'Aux', speed: 0, active: false },
    ]);

    // Toggle solenoid
    const toggleSolenoid = (index) => {
        const newState = [...solenoids];
        newState[index] = !newState[index];
        setSolenoids(newState);

        // TODO: Implement MQTT publish via backend
        console.log(`MQTT: Solenoid ${index} -> ${newState[index] ? 'ON' : 'OFF'}`);
    };

    // Toggle pump
    const togglePump = (index) => {
        const newState = [...pumps];
        newState[index] = !newState[index];
        setPumps(newState);

        // TODO: Implement MQTT publish via backend
        console.log(`MQTT: Pump ${index} -> ${newState[index] ? 'ON' : 'OFF'}`);
    };

    // Toggle big pump
    const toggleBigPump = () => {
        setBigPump(!bigPump);
        // TODO: Implement MQTT publish via backend
        console.log(`MQTT: Big Pump -> ${!bigPump ? 'ON' : 'OFF'}`);
    };

    // Update dosing pump speed
    const updateDosingSpeed = (index, speed) => {
        const newState = [...dosingPumps];
        newState[index].speed = speed;
        setDosingPumps(newState);

        // TODO: Implement speed control via backend
        console.log(`Speed: Dosing Pump ${index} -> ${speed}%`);
    };

    // Start timed dosing
    const startDosing = async (index, duration = 5000) => {
        try {
            await manualDose(index, duration);
            console.log(`✅ Dosing Pump ${index}: ${duration}ms command sent`);
        } catch (error) {
            console.error(`❌ Failed to dose Pump ${index}:`, error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Solenoid Valves */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    Solenoid Valves
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

            {/* Pumps */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Power className="w-5 h-5 text-green-600" />
                    Circulation Pumps
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
                {/* Big Pump */}
                <button
                    onClick={toggleBigPump}
                    className={`w-full py-4 rounded-lg font-semibold text-lg transition-all active:scale-95 ${bigPump
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Main Pump {bigPump && '●'}
                </button>
            </section>

            {/* Dosing Pumps */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Dosing Pumps
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
                                Dose 5s
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

import React from 'react';
import SensorCard from './SensorCard';
import ControlPanel from './ControlPanel';
import { Settings, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
    const { data, isConnected } = useWebSocket();

    // Map backend data to sensor structure
    const sensors = {
        nutrient: [
            {
                type: 'ph',
                label: 'pH Level',
                value: data?.ph?.toFixed(1) || '--',
                unit: 'pH',
                status: data?.ph ? (data.ph >= 5.5 && data.ph <= 6.5 ? 'normal' : 'warning') : 'normal'
            },
            {
                type: 'ec',
                label: 'EC (Nutrients)',
                value: data?.ec?.toFixed(2) || '--',
                unit: 'mS/cm',
                status: data?.ec ? (data.ec >= 1.0 && data.ec <= 2.0 ? 'normal' : 'warning') : 'normal'
            },
            {
                type: 'temp',
                label: 'Water Temp',
                value: data?.water_temp?.toFixed(1) || '--',
                unit: '°C',
                status: 'normal'
            },
            {
                type: 'water',
                label: 'Res. Level',
                value: data?.water_level?.toString() || '--',
                unit: '%',
                status: 'normal'
            },
        ],
        environment: [
            {
                type: 'air_temp',
                label: 'Air Temp',
                value: data?.air_temp?.toFixed(1) || '--',
                unit: '°C',
                status: 'normal'
            },
            {
                type: 'humidity',
                label: 'Humidity',
                value: data?.humidity?.toFixed(0) || '--',
                unit: '%',
                status: 'normal'
            },
            {
                type: 'vpd',
                label: 'VPD',
                value: data?.vpd?.toFixed(1) || '--',
                unit: 'kPa',
                status: 'normal'
            },
        ],
        system: [
            {
                type: 'power',
                label: 'Pump Current',
                value: data?.power_current?.toFixed(1) || '--',
                unit: 'A',
                status: 'normal'
            },
        ]
    };

    return (
        <div className="p-4 max-w-2xl mx-auto min-h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HydroMonitor Pro</h1>
                    <p className={`text-sm flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4" />
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                System Online
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                Connecting...
                            </>
                        )}
                    </p>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <Settings className="w-6 h-6 text-gray-600" />
                </button>
            </header>

            {/* Nutrient Section */}
            <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Nutrient Solution</h2>
                <div className="grid grid-cols-2 gap-3">
                    {sensors.nutrient.map((s, i) => <SensorCard key={i} {...s} />)}
                </div>
            </section>

            {/* Environment Section */}
            <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Environment (Air)</h2>
                <div className="grid grid-cols-2 gap-3">
                    {sensors.environment.map((s, i) => <SensorCard key={i} {...s} />)}
                </div>
            </section>

            {/* System Health */}
            <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">System Health</h2>
                <div className="grid grid-cols-2 gap-3">
                    {sensors.system.map((s, i) => <SensorCard key={i} {...s} />)}
                </div>
            </section>

            {/* Control Panel */}
            <ControlPanel />
        </div>
    );
}

import React from 'react';
import SensorCard from './SensorCard';
import { Settings, RefreshCw } from 'lucide-react';

export default function Dashboard() {
    // Comprehensive Data model matching Hydromisc Hardware
    const sensors = {
        nutrient: [
            { type: 'ph', label: 'pH Level', value: '5.8', unit: 'pH', status: 'normal' },
            { type: 'ec', label: 'EC (Nutrients)', value: '1.2', unit: 'mS/cm', status: 'normal' },
            { type: 'temp', label: 'Water Temp', value: '22.5', unit: '°C', status: 'normal' },
            { type: 'water', label: 'Res. Level', value: '85', unit: '%', status: 'normal' },
        ],
        environment: [
            { type: 'air_temp', label: 'Air Temp', value: '26.0', unit: '°C', status: 'warning' },
            { type: 'humidity', label: 'Humidity', value: '60', unit: '%', status: 'normal' },
            { type: 'vpd', label: 'VPD', value: '1.2', unit: 'kPa', status: 'normal' }, // Calculated
        ],
        system: [
            { type: 'power', label: 'Pump Current', value: '2.4', unit: 'A', status: 'normal' },
        ]
    };

    return (
        <div className="p-4 max-w-2xl mx-auto min-h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HydroMonitor Pro</h1>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        System Online
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

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <button className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
                        Dose Nutrients
                    </button>
                    <button className="flex-1 py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:scale-95 transition-all">
                        Override Pump
                    </button>
                </div>
            </div>
        </div>
    );
}

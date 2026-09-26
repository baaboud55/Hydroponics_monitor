import React from 'react';
import { Activity, Droplets, Thermometer, Zap } from 'lucide-react';

const icons = {
    ph: Activity,
    ec: Zap,
    temp: Thermometer,
    water: Droplets,
    humidity: Droplets, // Using Droplets for humidity as cloud-rain might not be imported yet
    air_temp: Thermometer,
    vpd: Activity, // Using Activity for VPD
    power: Zap
};

export default function SensorCard({ type, label, value, unit, status = 'normal' }) {
    const Icon = icons[type] || Activity;

    const statusColors = {
        normal: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        critical: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
        <div className={`p-6 rounded-xl border-2 ${statusColors[status]} transition-all duration-300 hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg opacity-80">{label}</h3>
                <Icon className="w-6 h-6 opacity-70" />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{value}</span>
                <span className="text-sm font-medium opacity-60">{unit}</span>
            </div>
        </div>
    );
}

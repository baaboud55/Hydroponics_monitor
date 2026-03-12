import React from 'react';
import { Leaf, Droplets, ThermometerSun } from 'lucide-react';

const PLANT_TYPES = [
    {
        id: 'lettuce',
        name: 'Lettuce',
        description: 'Fast-growing leafy greens. Very easy to grow for beginners.',
        image: '🥬', // Using emoji for simplicity, can be replaced with real images
        idealTemp: '18-22°C',
        idealPh: '5.5-6.5',
        idealEc: '0.8-1.2',
        color: 'from-green-400 to-emerald-600'
    },
    {
        id: 'tomato',
        name: 'Tomatoes',
        description: 'Delicious fruit that needs a bit more food and support to grow tall.',
        image: '🍅',
        idealTemp: '20-27°C',
        idealPh: '5.5-6.5',
        idealEc: '2.0-3.5',
        color: 'from-red-400 to-rose-600'
    },
    {
        id: 'basil',
        name: 'Basil',
        description: 'Strong-smelling herb that loves warm, bright spaces.',
        image: '🌿',
        idealTemp: '21-27°C',
        idealPh: '5.5-6.5',
        idealEc: '1.0-1.6',
        color: 'from-lime-400 to-green-600'
    },
    {
        id: 'strawberry',
        name: 'Strawberries',
        description: 'Sweet berries that need balanced water and food.',
        image: '🍓',
        idealTemp: '15-26°C',
        idealPh: '5.5-6.2',
        idealEc: '1.0-1.5',
        color: 'from-pink-400 to-rose-500'
    }
];

export default function PlantSelector({ onSelectPlant }) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="text-center mb-16 relative z-10 w-full max-w-4xl fade-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium mb-6">
                    <Leaf className="w-4 h-4" />
                    <span>HydroMonitor Smart Grow</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                    What are we growing today?
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Choose what you want to grow, and our smart system will automatically feed, water, and care for your plants.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl relative z-10">
                {PLANT_TYPES.map((plant, index) => (
                    <div
                        key={plant.id}
                        onClick={() => onSelectPlant(plant)}
                        className={`fade-up group relative p-6 rounded-3xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 hover:border-slate-500 transition-all cursor-pointer overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${plant.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                        <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                            {plant.image}
                        </div>

                        <h3 className="text-2xl font-bold mb-2 text-white">{plant.name}</h3>
                        <p className="text-slate-400 text-sm mb-6 line-clamp-2">{plant.description}</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                <span className="flex items-center gap-1 text-slate-400"><ThermometerSun className="w-3.5 h-3.5" /> Temp</span>
                                <span className="font-semibold text-slate-200">{plant.idealTemp}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                <span className="flex items-center gap-1 text-slate-400"><Droplets className="w-3.5 h-3.5" /> Water pH</span>
                                <span className="font-semibold text-slate-200">{plant.idealPh}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                <span className="flex items-center gap-1 text-slate-400"><Droplets className="w-3.5 h-3.5" /> Plant Food</span>
                                <span className="font-semibold text-slate-200">{plant.idealEc}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center text-sm font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            Start Growing &rarr;
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .fade-up {
                    animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { Settings, ArrowLeft, Droplets, Activity, Thermometer, FlaskConical } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SystemVisualizer({ plant, onBack, systemData }) {
    const { t } = useLanguage();
    const [dosing, setDosing] = useState(null);

    // Simulate dosing animation periodically based on "live" data simulation
    useEffect(() => {
        const interval = setInterval(() => {
            const types = ['ph', 'nutrient'];
            setDosing(types[Math.floor(Math.random() * types.length)]);
            setTimeout(() => setDosing(null), 3000); // 3 seconds of dosing animation
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Simulated "current" values hunting towards the plant's ideal target
    const currentPh = systemData?.ph?.value || '5.8';
    const currentEc = systemData?.ec?.value || '1.4';
    const currentTemp = systemData?.temp?.value || '22.0';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
            {/* Base Background Glow */}
            <div className={`absolute top-[20%] right-[10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 pointer-events-none bg-gradient-to-br ${plant.color}`}></div>

            {/* Header / Nav */}
            <header className="flex items-center justify-between p-6 z-10 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 transform rtl:-scale-x-100" />
                    <span className="font-medium">{t('changeCrop')}</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></span>
                        <span className="text-sm font-medium tracking-wide">{t('systemOnline')} </span>
                    </div>
                </div>
            </header>

            {/* Main Visualizer Area */}
            <main className="flex-1 flex flex-col lg:flex-row relative z-10">
                {/* Visualizer Canvas (Left/Center) */}
                <div className="flex-1 relative flex items-center justify-center p-8 min-h-[600px]">

                    {/* The Hydroponic Machine Visualization */}
                    <div className="relative w-full max-w-3xl aspect-[4/3] rounded-3xl bg-slate-900/40 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm p-4 overflow-hidden flex flex-col hero-entrance">

                        {/* Title overlay */}
                        <div className="absolute top-6 start-8 z-20">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-4xl">{plant.image}</span>
                                {t('growing')} {plant.name}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">{t('autopilotMsg')}</p>
                        </div>

                        {/* Top: Grow Tray & Plants */}
                        <div className="flex-1 relative flex items-end justify-center pb-8 border-b-4 border-slate-800">
                            {/* Plant roots hanging down */}
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 flex gap-12 opacity-80 mix-blend-screen overflow-hidden h-[100px] w-3/4 justify-center">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-px h-full bg-gradient-to-b from-white to-transparent opacity-20 relative">
                                        <div className="absolute top-0 w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[2px] animate-drip" style={{ animationDelay: `${i * 0.7}s` }}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Grow Bed Platform */}
                            <div className="w-[80%] h-8 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-t-xl relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t border-slate-600">
                                {/* Plant Icons sticking out */}
                                <div className="absolute top-[-50px] w-full flex justify-around px-8">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="text-5xl filter drop-shadow-[0_10px_10px_rgba(34,197,94,0.2)] hover:-translate-y-2 transition-transform duration-500 cursor-default">
                                            {plant.image}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Reservoir & Tech */}
                        <div className="h-[45%] relative flex items-center justify-center pt-8 px-12">

                            {/* Main Reservoir Tank */}
                            <div className="w-1/2 h-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl relative overflow-hidden backdrop-blur-md">
                                {/* Water Level */}
                                <div className="absolute bottom-0 w-full h-[75%] bg-blue-500/20 backdrop-blur-[2px] transition-all duration-[2000ms]">
                                    {/* Water Surface Line */}
                                    <div className="absolute top-0 w-full h-[1px] bg-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                                    {/* Ambient water glow */}
                                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-blue-600/30 to-transparent mix-blend-screen"></div>

                                    {/* Bubbles */}
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute bottom-0 bg-white/20 rounded-full animate-bubble"
                                            style={{
                                                left: `${10 + Math.random() * 80}%`,
                                                width: `${4 + Math.random() * 6}px`,
                                                height: `${4 + Math.random() * 6}px`,
                                                animationDuration: `${2 + Math.random() * 2}s`,
                                                animationDelay: `${Math.random() * 2}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>

                                {/* Sensors inside tank */}
                                <div className="absolute top-0 right-8 h-full flex gap-4">
                                    <div className="w-2 h-3/4 border-l border-r border-b border-slate-500 rounded-b-full bg-slate-900 relative">
                                        <div className="absolute bottom-0 w-full h-8 bg-rose-500 rounded-b-full shadow-[0_0_10px_rgba(244,63,94,0.8)] px-indicator"></div>
                                    </div>
                                    <div className="w-2 h-[85%] border-l border-r border-b border-slate-500 rounded-b-full bg-slate-900 relative">
                                        <div className="absolute bottom-0 w-full h-6 bg-cyan-400 rounded-b-full shadow-[0_0_10px_rgba(34,211,238,0.8)] ec-indicator"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Dosing Pumps (Right side) */}
                            <div className="w-1/3 ms-8 flex flex-col justify-around h-full py-4 gap-4">
                                {/* Component: Pump Ph */}
                                <div className="flex items-center gap-4 group">
                                    <div className="flex-1 h-3 bg-slate-800 rounded-full relative overflow-hidden">
                                        <div className={`absolute top-0 start-0 h-full w-full bg-rose-500/50 ${dosing === 'ph' ? 'animate-flow' : 'opacity-0'} transition-opacity`}></div>
                                    </div>
                                    <div className={`p-3 rounded-xl border ${dosing === 'ph' ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'border-slate-700 bg-slate-800'} transition-all`}>
                                        <Activity className={`w-6 h-6 ${dosing === 'ph' ? 'text-rose-400' : 'text-slate-500'}`} />
                                    </div>
                                </div>
                                {/* Component: Pump Nutrient */}
                                <div className="flex items-center gap-4 group">
                                    <div className="flex-1 h-3 bg-slate-800 rounded-full relative overflow-hidden">
                                        <div className={`absolute top-0 start-0 h-full w-full bg-emerald-500/50 ${dosing === 'nutrient' ? 'animate-flow' : 'opacity-0'} transition-opacity`}></div>
                                    </div>
                                    <div className={`p-3 rounded-xl border ${dosing === 'nutrient' ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-slate-700 bg-slate-800'} transition-all`}>
                                        <FlaskConical className={`w-6 h-6 ${dosing === 'nutrient' ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Metrics (Right) */}
                <div className="w-full lg:w-96 border-s border-slate-800/50 bg-slate-900/50 backdrop-blur-md p-8 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">{t('currentStatus')}</h3>

                    <div className="flex flex-col gap-6">
                        {/* pH Metric Card */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
                            <div className="absolute top-0 end-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Activity className="w-4 h-4" />
                                    <span className="font-medium">{t('phLevel')}</span>
                                </div>
                                <div className="text-xs font-semibold px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">{t('target')} {plant.idealPh}</div>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className={`text-4xl font-bold tracking-tight ${dosing === 'ph' ? 'text-white drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-slate-200'} transition-all`}>
                                    {currentPh}
                                </span>
                                <span className="text-slate-500 mb-1">{t('ph')}</span>
                            </div>
                            {dosing === 'ph' && <p className="text-xs text-rose-400 mt-2 animate-pulse">{t('autoDosingEngaged')}</p>}
                        </div>

                        {/* EC Metric Card */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
                            <div className="absolute top-0 end-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <FlaskConical className="w-4 h-4" />
                                    <span className="font-medium">{t('plantFoodNutrients')}</span>
                                </div>
                                <div className="text-xs font-semibold px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">{t('target')} {plant.idealEc}</div>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className={`text-4xl font-bold tracking-tight ${dosing === 'nutrient' ? 'text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-200'} transition-all`}>
                                    {currentEc}
                                </span>
                                <span className="text-slate-500 mb-1">{t('mscm')}</span>
                            </div>
                            {dosing === 'nutrient' && <p className="text-xs text-cyan-400 mt-2 animate-pulse">{t('mixingNutrient')}</p>}
                        </div>

                        {/* Temp Metric Card */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Thermometer className="w-4 h-4" />
                                    <span className="font-medium">{t('waterTemp')}</span>
                                </div>
                                <div className="text-xs font-semibold px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">{t('target')} {plant.idealTemp}</div>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-200">{currentTemp}</span>
                                <span className="text-slate-500 mb-1">{t('c')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8">
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-start gap-3">
                            <Settings className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {t('smartSystemMsg')}
                            </p>
                        </div>
                    </div>
                </div>
            </main >

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes drip {
                    0% { transform: translateY(0); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(40px); opacity: 0; }
                }
                @keyframes flow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes bubble {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    20% { opacity: 0.5; }
                    80% { opacity: 0.5; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
                .hero-entrance {
                    animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-drip { animation: drip 2s infinite ease-in; }
                .animate-flow { animation: flow 1s infinite linear; }
                .animate-bubble { animation: bubble 3s infinite linear; }
            `}</style>
        </div >
    );
}

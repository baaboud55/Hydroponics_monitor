import React from 'react';
import { Leaf, Wrench, Sprout, ArrowRight } from 'lucide-react';

export default function MainMenu({ onNavigate }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="p-8 flex justify-between items-center relative z-10 fade-up">
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Sprout className="w-6 h-6 text-white" />
                    </span>
                    <span className="text-xl font-bold tracking-tight text-white">HydroMonitor</span>
                </div>
                <div className="px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-medium text-slate-400">
                    System Hub v2.0
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 z-10 w-full max-w-7xl mx-auto -mt-12">
                <div className="text-center mb-16 max-w-3xl fade-up fade-up-d1">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                        Your hydroponics,<br />fully automated.
                    </h1>
                    <p className="text-xl text-slate-400">
                        Whether you are configuring your hardware for the first time or checking in on your active crops, the HydroMonitor Hub makes intelligent growing effortless.
                    </p>
                </div>

                {/* Primary Action Path Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl fade-up fade-up-d2">

                    {/* Path 1: System Visualizer (Active Grow) */}
                    <button
                        onClick={() => onNavigate('visualizer')}
                        className="group relative p-8 rounded-3xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-all text-left overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Leaf className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Live System Monitor</h2>
                            <p className="text-slate-400 mb-8 flex-1">
                                Enter the autonomous grow environment. Select your crop and watch the AI manage nutrients and pH in real-time.
                            </p>
                            <div className="flex items-center text-emerald-400 font-medium text-sm">
                                Launch Dashboard <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Path 2: Hardware Setup Guide */}
                    <button
                        onClick={() => onNavigate('hardware-guide')}
                        className="group relative p-8 rounded-3xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 transition-all text-left overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Wrench className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Hardware Installation API</h2>
                            <p className="text-slate-400 mb-8 flex-1">
                                First time here? Follow our interactive 3D guide to physically install sensors, pumps, and the control hub onto your system.
                            </p>
                            <div className="flex items-center text-blue-400 font-medium text-sm">
                                View Installation Guide <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                </div>

                {/* Coming Soon Section */}
                <div className="mt-16 text-center w-full max-w-4xl fade-up fade-up-d3">
                    <div className="inline-block relative p-px rounded-2xl bg-gradient-to-b from-slate-700/50 to-transparent w-full">
                        <div className="bg-slate-900/80 rounded-2xl p-6 backdrop-blur-sm border-x border-b border-transparent">
                            <h3 className="text-slate-300 font-medium mb-2">Cloud Synced & Premium Subscriptions</h3>
                            <p className="text-slate-500 text-sm">
                                Soon you will be able to unlock remote multi-system management, advanced data export, and predictive AI yield analysis.
                            </p>
                            <span className="inline-block mt-4 px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700">Coming Q4</span>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .fade-up-d1 { animation-delay: 0.1s; }
                .fade-up-d2 { animation-delay: 0.2s; }
                .fade-up-d3 { animation-delay: 0.3s; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

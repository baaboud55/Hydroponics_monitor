import React from 'react';
import { Leaf, Wrench, Sprout, ArrowRight, Activity, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MainMenu({ onNavigate }) {
    const { t, lang, toggleLanguage } = useLanguage();

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
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-medium text-slate-400">
                        System Hub v2.0
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 z-10 w-full max-w-7xl mx-auto -mt-12">
                <div className="text-center mb-16 max-w-3xl fade-up fade-up-d1">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                        {t('welcomeTitle')}<br />{t('welcomeTitleAccent')}
                    </h1>
                    <p className="text-xl text-slate-400">
                        {t('welcomeSub')}
                    </p>
                </div>

                {/* Primary Action Path Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl fade-up fade-up-d2">

                    {/* Path 1: System Visualizer (Active Grow) */}
                    <button
                        onClick={() => onNavigate('visualizer')}
                        className="group relative p-8 rounded-3xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-all text-start overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Leaf className="w-7 h-7" />
                            </div>
                            <div className="text-xs font-semibold text-emerald-500 tracking-wider uppercase mb-2">{t('card1Badge')}</div>
                            <h2 className="text-2xl font-bold text-white mb-3">{t('card1Title')}</h2>
                            <p className="text-slate-400 mb-8 flex-1">
                                {t('card1Sub')}
                            </p>
                            <div className="flex items-center text-emerald-400 font-medium text-sm">
                                {t('card1Btn')} <ArrowRight className="w-4 h-4 ms-2 transform rtl:-scale-x-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Path 2: Hardware Setup Guide */}
                    <button
                        onClick={() => onNavigate('hardware-guide')}
                        className="group relative p-8 rounded-3xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 transition-all text-start overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Wrench className="w-7 h-7" />
                            </div>
                            <div className="text-xs font-semibold text-blue-500 tracking-wider uppercase mb-2">{t('card2Badge')}</div>
                            <h2 className="text-2xl font-bold text-white mb-3">{t('card2Title')}</h2>
                            <p className="text-slate-400 mb-8 flex-1">
                                {t('card2Sub')}
                            </p>
                            <div className="flex items-center text-blue-400 font-medium text-sm">
                                {t('card2Btn')} <ArrowRight className="w-4 h-4 ms-2 transform rtl:-scale-x-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Path 3: Coming Soon */}
                    <button
                        className="group relative p-8 rounded-3xl bg-slate-900 border border-slate-700 hover:border-fuchsia-500/50 transition-all text-start overflow-hidden hover:shadow-2xl hover:shadow-fuchsia-500/10 hover:-translate-y-1 opacity-75 cursor-not-allowed"
                        disabled
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-6 text-fuchsia-400 transition-colors">
                                <Activity className="w-7 h-7" />
                            </div>
                            <div className="text-xs font-semibold text-fuchsia-500 tracking-wider uppercase mb-2">{t('card3Badge')}</div>
                            <h2 className="text-2xl font-bold text-white mb-3">{t('card3Title')}</h2>
                            <p className="text-slate-400 mb-8 flex-1">
                                {t('card3Sub')}
                            </p>
                            <div className="flex items-center text-fuchsia-400/50 font-medium text-sm">
                                {t('card3Btn')}
                            </div>
                        </div>
                    </button>
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

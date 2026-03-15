import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, ArrowRight, Settings, Droplets, Wifi, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// We use a string path so Vite doesn't crash if the user hasn't added the image yet.
// Instruct the user to place their image in the 'public' folder.
const homieImg = '/homie-system.png'; 

function MagnetButton({ children, onClick, primary }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`group relative px-8 py-5 rounded-2xl transition-all overflow-hidden flex-1 ${
                primary 
                ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/30' 
                : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-700 hover:shadow-2xl'
            }`}
        >
            <div className="relative z-10 flex items-center justify-center gap-3 text-white font-semibold text-lg">
                {children}
            </div>
            {primary && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            )}
        </motion.button>
    );
}

export default function MainMenu({ onNavigate }) {
    const { t, lang } = useLanguage();

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-emerald-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* --- HERO SECTION --- */}
            <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 sm:px-12">
                <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="max-w-5xl mx-auto flex flex-col items-center text-center z-10"
                >
                    <motion.div variants={fadeIn} className="flex items-center gap-3 mb-8">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Sprout className="w-6 h-6 text-white" />
                        </span>
                        <span className="text-xl font-bold tracking-tight text-white block mt-1">HydroMonitor</span>
                    </motion.div>

                    <motion.h1 variants={fadeIn} className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                        {t('bentoHeroTitle1')}<br />{t('bentoHeroTitle2')}
                    </motion.h1>

                    <motion.p variants={fadeIn} className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-16">
                        {t('bentoHeroSub')}
                    </motion.p>
                    
                    <motion.div variants={fadeIn} className="animate-bounce text-slate-500 flex flex-col items-center gap-3 mt-8">
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('bentoScrollPrompt')}</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* --- PRODUCT SHOWCASE / BENTO BOX --- */}
            <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-24 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Main Product Image (HOMIE A-Frame) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="lg:col-span-8 relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden min-h-[500px] flex items-center justify-center group"
                    >
                        {/* Glow effect slightly behind image */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent transition-opacity group-hover:opacity-100 opacity-50"></div>
                        
                        {/* The Actual User Provided Image */}
                        <img 
                            src={homieImg} 
                            alt="Homie Hydroponic System" 
                            className="w-[80%] max-h-[600px] object-contain object-center z-10 transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        {/* Fallback if image is missing */}
                        <div className="absolute inset-0 hidden flex-col items-center justify-center text-slate-500">
                            <Sprout className="w-16 h-16 mb-4 opacity-50" />
                            <p>Place your A-Frame product image here</p>
                            <code className="text-sm mt-2 text-emerald-400">public/homie-system.png</code>
                        </div>
                    </motion.div>

                    {/* Sensor Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 flex flex-col justify-between hover:border-slate-700 transition-colors relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] translate-x-8 -translate-y-8 group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div>
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                                <Activity strokeWidth={2.5} />
                            </div>
                            <div className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-3">{t('bentoSensorBadge')}</div>
                            <h3 className="text-2xl font-bold text-white mb-3">{t('bentoSensorTitle')}</h3>
                            <p className="text-slate-400 leading-relaxed">{t('bentoSensorSub')}</p>
                        </div>
                    </motion.div>

                    {/* Dosing Pump Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="lg:col-span-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 flex flex-col justify-center hover:border-slate-700 transition-colors relative overflow-hidden group"
                    >
                         <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:rotate-12 transition-transform">
                            <Droplets strokeWidth={2.5} />
                        </div>
                        <div className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-3">{t('bentoPumpBadge')}</div>
                        <h3 className="text-2xl font-bold text-white mb-3">{t('bentoPumpTitle')}</h3>
                        <p className="text-slate-400 leading-relaxed max-w-md">{t('bentoPumpSub')}</p>
                    </motion.div>

                    {/* Smart Hub Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="lg:col-span-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 flex flex-col justify-center hover:border-slate-700 transition-colors relative overflow-hidden group"
                    >
                         <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-fuchsia-400 group-hover:scale-110 transition-transform">
                            <Wifi strokeWidth={2.5} />
                        </div>
                        <div className="text-fl font-bold text-fuchsia-500 tracking-widest uppercase mb-3">{t('bentoHubBadge')}</div>
                        <h3 className="text-2xl font-bold text-white mb-3">{t('bentoHubTitle')}</h3>
                        <p className="text-slate-400 leading-relaxed max-w-md">{t('bentoHubSub')}</p>
                    </motion.div>

                </div>
            </section>

            {/* --- ACTION SECTION --- */}
            <section className="w-full py-32 px-6 flex flex-col items-center justify-center text-center relative z-10 border-t border-slate-900 bg-slate-950/50">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl"
                >
                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">{t('bentoActionTitle')}</h2>
                    <p className="text-xl text-slate-400 mb-12">{t('bentoActionSub')}</p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
                        <MagnetButton onClick={() => onNavigate('visualizer')} primary>
                            {t('card1Btn')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:-scale-x-100" />
                        </MagnetButton>

                        <MagnetButton onClick={() => onNavigate('hardware-guide')}>
                            <Settings className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            {t('card2Btn')}
                        </MagnetButton>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}

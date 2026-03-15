import React, { useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Sprout, ArrowRight, Settings, Droplets, Droplet, Leaf, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Product image mapped from public folder
const homieImg = '/homie-system.png';
// Lifestyle image mapped from artifacts via public folder link or local path.
// For now, we will place a placeholder that the user can swap, 
// just like we did with homieImg, to avoid absolute path issues in Vite.
const lifestyleImg = '/lifestyle_kitchen_hydroponics.png'; 

function MinimalistButton({ children, onClick, primary }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`group relative px-8 py-4 rounded-full transition-all flex border ${
                primary 
                ? 'bg-[#87A96B] text-white border-transparent hover:bg-[#7a9960] shadow-sm hover:shadow-md' 
                : 'bg-white/50 backdrop-blur-md text-[#333333] border-[#E5E5E5] hover:border-[#CCCCCC] hover:bg-white'
            }`}
        >
            <div className="flex items-center justify-center gap-3 font-medium text-lg w-full">
                {children}
            </div>
        </motion.button>
    );
}

// Reusable SVG Leader Line
const LeaderLine = ({ d, text, subtext, icon: Icon, progress, side = 'left' }) => {
    return (
        <motion.div 
            style={{ opacity: progress }}
            className={`absolute top-0 bottom-0 pointer-events-none flex flex-col justify-center
                ${side === 'left' ? 'left-[10%] items-end text-right' : 'right-[10%] items-start text-left'}
                rtl:${side === 'left' ? 'right-[10%] text-left items-start' : 'left-[10%] text-right items-end'}
            `}
        >
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-black/5 max-w-sm border border-white">
                <div className={`flex items-center gap-3 mb-3 ${side === 'left' ? 'justify-end rtl:justify-start' : 'justify-start rtl:justify-end'}`}>
                    <Icon className="w-6 h-6 text-[#87A96B]" />
                    <h3 className="font-serif text-xl font-semibold text-[#333333]">{text}</h3>
                </div>
                <p className="text-[#666666] leading-relaxed text-sm bg-white/50 px-2 py-1 rounded inline-block">
                    {subtext}
                </p>
            </div>
            {/* Minimalist SVG connecting line logic can go here. For simplicity, the boxed design floating is extremely elegant. */}
        </motion.div>
    );
};

export default function MainMenu({ onNavigate }) {
    const { t } = useLanguage();
    
    // --- Scroll Math ---
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    // We map 0-1 scroll progress to different "scenes"
    // 0.00 - 0.25: Hero 
    // 0.25 - 0.50: Highlight Reservoir
    // 0.50 - 0.75: Highlight Pipes
    // 0.75 - 1.00: Highlight Pods
    
    // Transforms for Hero text fading out
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

    // Transforms for Layer Highlights
    const opacityReservoir = useTransform(scrollYProgress, [0.15, 0.25, 0.45, 0.55], [0, 1, 1, 0]);
    const opacityPipes = useTransform(scrollYProgress, [0.45, 0.55, 0.75, 0.85], [0, 1, 1, 0]);
    const opacityPods = useTransform(scrollYProgress, [0.75, 0.85, 0.95, 1.00], [0, 1, 1, 1]); // Keeping pods visible at very end
    
    // Subtle scale on main image as you scroll deep into it
    const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

    return (
        <div className="bg-[#F9F9F7] text-[#333333] font-sans selection:bg-[#87A96B]/30">
            
            {/* --- EXPLODED SCROLL container --- */}
            {/* The parent container is 400vh tall to allow a long scroll track */}
            <section ref={targetRef} className="relative h-[400vh] w-full">
                
                {/* The sticky frame holding the actual visual experience */}
                <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                    
                    {/* Background Soft Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[100px] pointer-events-none opacity-80" />

                    {/* Central Product Image */}
                    <motion.div 
                        style={{ scale: imageScale }}
                        className="relative z-10 w-[80%] max-w-[500px] drop-shadow-2xl"
                    >
                        <img 
                            src={homieImg} 
                            alt="HydroMonitor A-Frame System" 
                            className="w-full object-contain"
                            // If the user hasn't copied the image yet, don't break the layout
                            onError={(e) => { e.target.style.opacity = 0; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        {/* Fallback box */}
                        <div className="absolute inset-0 hidden flex-col items-center justify-center text-slate-400 bg-white shadow-xl rounded-3xl border border-slate-100">
                             <Sprout className="w-16 h-16 animate-pulse mb-4 text-[#87A96B]" />
                             <p className="text-sm font-medium">Place image at: public/homie-system.png</p>
                        </div>
                    </motion.div>

                    {/* --- LAYER 1: HERO TEXT --- */}
                    <motion.div 
                        style={{ opacity: heroOpacity, y: heroY }}
                        className="absolute inset-x-0 top-[15%] md:top-[25%] flex flex-col items-center text-center px-6 z-20 pointer-events-none"
                    >
                        <span className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#87A96B]/10 text-[#87A96B] text-sm font-semibold tracking-wide">
                            <Leaf className="w-4 h-4" /> Sustainable Living
                        </span>
                        <h1 className="text-6xl md:text-8xl font-serif font-bold text-[#1A1A1A] tracking-tight leading-tight">
                            {t('heroTitle1')} <br />
                            <span className="italic font-light text-[#87A96B]">{t('heroTitle2')}</span>
                        </h1>
                    </motion.div>
                    
                    <motion.div 
                         style={{ opacity: heroOpacity }}
                         className="absolute bottom-12 inset-x-0 flex justify-center z-20 animate-bounce text-[#666666] text-xs font-bold tracking-[0.2em] uppercase pointer-events-none"
                    >
                        {t('scrollPrompt')}
                    </motion.div>

                    {/* --- LAYER 2: Reservoir --- */}
                    <LeaderLine 
                        progress={opacityReservoir}
                        text={t('feature1Title')}
                        subtext={t('feature1Sub')}
                        icon={Droplet}
                        side="left"
                    />

                    {/* --- LAYER 3: Pipes --- */}
                    <LeaderLine 
                        progress={opacityPipes}
                        text={t('feature2Title')}
                        subtext={t('feature2Sub')}
                        icon={Activity}
                        side="right"
                    />

                    {/* --- LAYER 4: Pods --- */}
                    <LeaderLine 
                        progress={opacityPods}
                        text={t('feature3Title')}
                        subtext={t('feature3Sub')}
                        icon={Sprout}
                        side="left"
                    />

                </div>
            </section>

            {/* --- LIFESTYLE INTEGRATION SECTION --- */}
            <section className="bg-white py-32 px-6 sm:px-12 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#f0f0f0] aspect-[4/5] lg:aspect-square flex items-center justify-center"
                    >
                        <img 
                            src={lifestyleImg} 
                            alt="Farm to kitchen lifestyle" 
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.target.style.opacity = 0; e.target.nextSibling.style.display = 'flex'; }}
                        />
                         <div className="hidden flex-col items-center justify-center text-[#999] p-8 text-center bg-white/80 backdrop-blur-md m-8 rounded-3xl">
                             <p className="font-semibold mb-2">Lifestyle Image Missing</p>
                             <p className="text-sm">Please place the generated 'lifestyle_kitchen_hydroponics.png' in the public folder to see the Farm-to-Kitchen design.</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-5xl md:text-6xl font-serif font-bold text-[#1A1A1A] leading-tight">
                            {t('actionTitle')}
                        </h2>
                        <p className="text-xl text-[#666666] leading-relaxed max-w-xl mb-8">
                            {t('actionSub')}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <MinimalistButton onClick={() => onNavigate('visualizer')} primary>
                                {t('card1Btn')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:-scale-x-100" />
                            </MinimalistButton>

                            <MinimalistButton onClick={() => onNavigate('hardware-guide')}>
                                <Settings className="w-5 h-5 text-[#87A96B]" />
                                {t('card2Btn')}
                            </MinimalistButton>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

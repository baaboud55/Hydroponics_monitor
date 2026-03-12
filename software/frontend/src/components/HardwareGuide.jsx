import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

const GUIDE_STEPS = [
    {
        id: 'sensors',
        title: 'Sensor Placement',
        description: 'Submerge the pH and EC probes into your main hydroponic reservoir. Ensure they are placed in an area with good water circulation but away from direct dosing streams to avoid false readings.',
        image: `${import.meta.env.BASE_URL}hardware_sensors.png`,
        tips: ['Keep probe tips submerged at all times.', 'Calibrate sensors before first use.']
    },
    {
        id: 'pumps',
        title: 'Dosing Pump Setup',
        description: 'Mount the peristaltic dosing pumps above the reservoir. Connect the inlet tubing to your pH Up/Down and Nutrient bottles. Run the outlet tubing directly into the reservoir.',
        image: `${import.meta.env.BASE_URL}hardware_pumps.png`,
        tips: ['Use check valves to prevent backflow.', 'Ensure tubing connections are airtight.']
    },
    {
        id: 'hub',
        title: 'Control Hub Installation',
        description: 'Mount the main smart control hub on a wall near your system, keeping it safely away from splashing water. Connect the sensor cables, pump control wires, and plug in the power adapter.',
        image: `${import.meta.env.BASE_URL}hardware_hub.png`,
        tips: ['Green LED ring indicates system is online.', 'Ensure reliable Wi-Fi coverage at the hub location.']
    }
];

export default function HardwareGuide({ onNavigate }) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = GUIDE_STEPS[currentStep];

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === GUIDE_STEPS.length - 1;

    const nextStep = () => {
        if (!isLastStep) setCurrentStep(curr => curr + 1);
    };

    const prevStep = () => {
        if (!isFirstStep) setCurrentStep(curr => curr - 1);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <button
                    onClick={() => onNavigate('main-menu')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Hub</span>
                </button>
                <div className="text-sm font-medium text-slate-500">
                    Hardware Installation Guide
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">

                {/* Left: Illustration Area */}
                <div className="flex-1 p-8 lg:p-12 flex items-center justify-center relative">
                    {/* Ambient Glow behind image */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* 3D Illustration Container */}
                    <div className="relative w-full max-w-2xl aspect-[4/3] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/50 bg-slate-900 fade-in-image" key={step.id}>
                        <img
                            src={step.image}
                            alt={step.title}
                            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                        />
                    </div>
                </div>

                {/* Right: Text & Controls Area */}
                <div className="w-full lg:w-[450px] p-8 lg:p-12 lg:border-l lg:border-slate-800/50 flex flex-col justify-center bg-slate-900/20">

                    {/* Step Indicators */}
                    <div className="flex items-center gap-3 mb-10">
                        {GUIDE_STEPS.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${idx === currentStep ? 'bg-blue-500 w-8' : idx < currentStep ? 'bg-blue-500/40' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="fade-in-text" key={`text-${step.id}`}>
                        <div className="text-blue-400 font-semibold tracking-wide text-xs uppercase mb-3">
                            Step {currentStep + 1} of {GUIDE_STEPS.length}
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-white">
                            {step.title}
                        </h1>
                        <p className="text-slate-400 leading-relaxed mb-8">
                            {step.description}
                        </p>

                        {/* Tips Section */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-10">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Pro Tips
                            </h4>
                            <ul className="space-y-2">
                                {step.tips.map((tip, idx) => (
                                    <li key={idx} className="text-sm text-slate-500 flex items-start gap-2">
                                        <span className="text-slate-700 mt-0.5">•</span> {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-4 mt-auto pt-6">
                        <button
                            onClick={prevStep}
                            disabled={isFirstStep}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${isFirstStep ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                        >
                            Previous
                        </button>

                        {isLastStep ? (
                            <button
                                onClick={() => onNavigate('main-menu')}
                                className="flex-1 py-3 px-4 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                Setup Complete <CheckCircle2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={nextStep}
                                className="flex-1 py-3 px-4 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all flex flex-row-reverse items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <ArrowRight className="w-4 h-4" /> Next Step
                            </button>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                .fade-in-image {
                    animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .fade-in-text {
                    animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

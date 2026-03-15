import React, { useState, useEffect } from 'react';
import { Activity, ArrowLeft, Droplets, Zap, Wind, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function CalibrationWizard({ onBack, systemData }) {
    const { t } = useLanguage();
    
    // Moved inside component to have access to t() for translations
    const SENSOR_CONFIGS = {
        ph: {
            id: 'ph',
            label: t('phProbe') || 'pH',
            icon: Droplets,
            color: 'text-fuchsia-400',
            bgColor: 'bg-fuchsia-500/10',
            borderColor: 'border-fuchsia-500/20',
            shadowColor: 'hover:shadow-fuchsia-500/10',
            steps: [
                {
                    title: t('clearCalibration') || 'Clear Calibration',
                    description: t('resetPh') || 'Reset existing pH calibration data from memory.',
                    command: 'cal,clear',
                    actionLabel: t('clearData') || 'Clear Data'
                },
                {
                    title: t('midCalibration') || 'Midpoint Calibration (pH 7.0)',
                    description: t('rinsePh') || 'Rinse the probe and place it in a pH 7.0 buffer solution. Wait for the reading to stabilize.',
                    command: 'cal,7', 
                    actionLabel: t('calPh7') || 'Calibrate pH 7.0'
                },
                {
                    title: t('slopeCalibration') || 'Slope Calibration (pH 4.0)',
                    description: t('rinsePh4') || 'Rinse the probe and place it in a pH 4.0 buffer solution. Wait for the reading to stabilize.',
                    command: 'cal,4', 
                    actionLabel: t('calPh4') || 'Calibrate pH 4.0'
                }
            ]
        },
        ec: {
            id: 'ec',
            label: t('ecProbe') || 'EC',
            icon: Zap,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            shadowColor: 'hover:shadow-amber-500/10',
            steps: [
                {
                    title: t('clearCalibration') || 'Clear Calibration',
                    description: t('resetEc') || 'Reset existing EC calibration data from memory.',
                    command: 'cal,clear',
                    actionLabel: t('clearData') || 'Clear Data'
                },
                {
                    title: t('dryCalibration') || 'Dry Calibration (0 mS/cm)',
                    description: t('dryEc') || 'Wipe the EC probe dry and hold it in the air. Wait for the reading to stabilize.',
                    command: 'cal,dry', 
                    actionLabel: t('calEcDry') || 'Calibrate 0 mS/cm'
                },
                {
                    title: t('bufferCalibration') || 'Buffer Calibration (1.41 mS/cm)',
                    description: t('bufferEc') || 'Place the EC probe in a 1.41 mS/cm calibration solution. Wait for the reading to stabilize.',
                    command: 'cal,1.41', 
                    actionLabel: t('calEcBuffer') || 'Calibrate 1.41 mS/cm'
                }
            ]
        },
        do: {
            id: 'do',
            label: t('dissolvedOxygen'),
            icon: Wind,
            color: 'text-sky-400',
            bgColor: 'bg-sky-500/10',
            borderColor: 'border-sky-500/20',
            shadowColor: 'hover:shadow-sky-500/10',
            steps: [
                {
                    title: t('clearCalibration'),
                    description: t('resetDo'),
                    command: 'Cal,clear',
                    actionLabel: t('clearData')
                },
                {
                    title: t('atmCalibration'),
                    description: t('pullProbe'),
                    command: 'Cal,atm',
                    actionLabel: t('calInAir')
                },
                {
                    title: t('zeroCalibration'),
                    description: t('placeProbeZero'),
                    command: 'Cal,0',
                    actionLabel: t('calToZero')
                }
            ]
        }
    };

    const [selectedSensor, setSelectedSensor] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleSelectSensor = (sensorId) => {
        setSelectedSensor(SENSOR_CONFIGS[sensorId]);
        setActiveStep(0);
        setStatusMessage('');
    };

    const handleSendCommand = async () => {
        if (!selectedSensor) return;
        const step = selectedSensor.steps[activeStep];

        setIsSending(true);
        setStatusMessage('Sending command...');

        try {
            let cmdStr = step.command;

            await api.sendCalibration(selectedSensor.id, cmdStr);
            setStatusMessage(`Success! Command sent: ${cmdStr}`);

            // Move to next step or complete after short delay
            setTimeout(() => {
                if (activeStep < selectedSensor.steps.length - 1) {
                    setActiveStep(activeStep + 1);
                    setStatusMessage('');
                } else {
                    setStatusMessage('Calibration complete!');
                }
            }, 2000);

        } catch (err) {
            console.error(err);
            setStatusMessage(`Error: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const renderSelectionMenu = () => (
        <div className="w-full max-w-4xl mx-auto mt-12 fade-up rtl:text-right">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">{t('whichSensor')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(SENSOR_CONFIGS).map((config, idx) => (
                    <button
                        key={config.id}
                        onClick={() => handleSelectSensor(config.id)}
                        className={`group relative p-8 rounded-3xl bg-slate-900 border border-slate-700 transition-all text-left overflow-hidden hover:shadow-2xl ${config.shadowColor} hover:-translate-y-1`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        <div className="relative z-10 flex flex-col h-full items-center text-center">
                            <div className={`w-16 h-16 rounded-2xl ${config.bgColor} ${config.borderColor} border flex items-center justify-center mb-6 ${config.color} transition-colors`}>
                                <config.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{config.label}</h3>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderWizard = () => {
        if (!selectedSensor) return null;
        const currentData = systemData?.[selectedSensor.id];

        return (
            <div className="w-full max-w-2xl mx-auto mt-8 fade-up relative rtl:text-right">
                <button onClick={() => setSelectedSensor(null)} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-sm font-medium transition cursor-pointer">
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('chooseDiffSensor')}
                </button>

                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 relative overflow-hidden">
                    {/* Live Reading Panel */}
                    <div className="absolute top-6 end-6 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-end rtl:items-start">
                        <span className="text-xs text-slate-400 font-medium">{t('liveReading')}</span>
                        <div className={`text-2xl font-bold font-mono ${selectedSensor.color}`}>
                            {currentData !== undefined ? currentData.toFixed(2) : '--'}
                        </div>
                    </div>

                    <div className="mb-8 pe-32 text-start">
                        <div className={`w-12 h-12 rounded-xl ${selectedSensor.bgColor} ${selectedSensor.color} flex items-center justify-center mb-4`}>
                            <selectedSensor.icon className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedSensor.label} {t('calibration')}</h2>
                        <div className="flex gap-2">
                            {selectedSensor.steps.map((_, idx) => (
                                <div key={idx} className={`h-1.5 flex-1 rounded-full bg-slate-800 ${idx <= activeStep ? selectedSensor.bgColor : ''}`}>
                                    <div className={`h-full rounded-full transition-all duration-500 ${selectedSensor.bgColor}`}
                                        style={{ width: idx < activeStep ? '100%' : (idx === activeStep ? '50%' : '0%') }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeStep < selectedSensor.steps.length ? (
                        <div className="space-y-6 text-start">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{t('step')} {activeStep + 1}: {selectedSensor.steps[activeStep].title}</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">
                                    {selectedSensor.steps[activeStep].description}
                                </p>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleSendCommand}
                                    disabled={isSending}
                                    className={`w-full py-4 rounded-xl font-bold text-white border transition-all
                                        ${isSending ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-300'
                                            : `bg-slate-800 border-slate-700 hover:${selectedSensor.bgColor} hover:border-transparent`}`}
                                >
                                    {isSending ? t('processing') : selectedSensor.steps[activeStep].actionLabel}
                                </button>

                                {statusMessage && (
                                    <div className={`mt-4 text-center text-sm font-medium ${statusMessage.includes('Error') ? 'text-red-400' : 'text-emerald-400'} flex items-center justify-center gap-2`}>
                                        {!statusMessage.includes('Error') && <CheckCircle2 className="w-4 h-4" />}
                                        {statusMessage}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('calComplete')}</h3>
                            <p className="text-slate-400 mb-8">{selectedSensor.label} {t('calNowCalibrated')}</p>
                            <button
                                onClick={() => setSelectedSensor(null)}
                                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                            >
                                {t('doneBtn')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-slate-800/20 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="p-8 flex justify-between items-center relative z-10 fade-up">
                <button
                    onClick={onBack}
                    className="p-2 px-4 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 text-sm font-medium cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('backToHub')}
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 sm:px-6 z-10 w-full">
                <div className="text-center mb-8 max-w-3xl fade-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                        {t('calWizardTitle')}
                    </h1>
                    <p className="text-lg text-slate-400">
                        {t('calWizardDesc')}
                    </p>
                </div>

                {!selectedSensor ? renderSelectionMenu() : renderWizard()}
            </main>

            <style>{`
                .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

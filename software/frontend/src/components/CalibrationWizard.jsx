import React, { useState, useEffect } from 'react';
import { Activity, ArrowLeft, Droplets, Zap, Wind, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const SENSOR_CONFIGS = {
    ph: {
        id: 'ph',
        label: 'pH Probe',
        icon: Droplets,
        color: 'text-fuchsia-400',
        bgColor: 'bg-fuchsia-500/10',
        borderColor: 'border-fuchsia-500/20',
        shadowColor: 'hover:shadow-fuchsia-500/10',
        steps: [
            {
                title: 'Clear Calibration',
                description: 'Reset existing pH calibration data from memory.',
                command: 'cal,clear',
                actionLabel: 'Clear Data'
            },
            {
                title: 'Midpoint Calibration (pH 7.0)',
                description: 'Rinse the probe and place it in a pH 7.0 buffer solution. Wait for the reading to stabilize.',
                command: 'cal,7,', // The firmware will append the reading, or we send it. Actually, wait.
                // Our firmware scaffold expects 'cal,7,<value>' or similar? Wait, the firmware expected `command.startsWith("cal,7,")`.
                // For a UI to just ask firmware to calibrate at 7 based on its current raw reading, we could just send 'cal,7'.
                // Oh I scaffolded it to expect `command.substring(6).toFloat()`. This implies the frontend needs to append the reading.
                // If it's a pass-through command, the frontend appends the reading.
                actionLabel: 'Calibrate pH 7.0',
                appendReading: true
            }
        ]
    },
    ec: {
        id: 'ec',
        label: 'EC Probe',
        icon: Zap,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        shadowColor: 'hover:shadow-amber-500/10',
        steps: [
            {
                title: 'Clear Calibration',
                description: 'Reset existing EC calibration data from memory.',
                command: 'cal,clear',
                actionLabel: 'Clear Data'
            }
        ]
    },
    do: {
        id: 'do',
        label: 'Dissolved Oxygen',
        icon: Wind,
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
        borderColor: 'border-sky-500/20',
        shadowColor: 'hover:shadow-sky-500/10',
        steps: [
            {
                title: 'Clear Calibration',
                description: 'Clears all DO calibration data.',
                command: 'Cal,clear',
                actionLabel: 'Clear Data'
            },
            {
                title: 'Atmospheric Calibration',
                description: 'Pull the probe out of the water, dry it off, and let it sit in the air for 1 minute before proceeding.',
                command: 'Cal,atm',
                actionLabel: 'Calibrate in Air'
            },
            {
                title: 'Zero Calibration',
                description: 'Place the probe in 0 Dissolved Oxygen calibration solution. Wait for the reading to stabilize near 0.',
                command: 'Cal,0',
                actionLabel: 'Calibrate to Zero'
            }
        ]
    }
};

export default function CalibrationWizard({ onBack, systemData }) {
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
            if (step.appendReading) {
                // If the firmware needs to know the exact reading at this moment
                const currentVal = systemData?.[selectedSensor.id] || 0;
                cmdStr += currentVal.toFixed(2);
            }

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
        <div className="w-full max-w-4xl mx-auto mt-12 fade-up">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Which sensor are we calibrating?</h2>
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
            <div className="w-full max-w-2xl mx-auto mt-8 fade-up relative">
                <button onClick={() => setSelectedSensor(null)} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-sm font-medium transition cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Choose different sensor
                </button>

                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 relative overflow-hidden">
                    {/* Live Reading Panel */}
                    <div className="absolute top-6 right-6 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-end">
                        <span className="text-xs text-slate-400 font-medium">Live Reading</span>
                        <div className={`text-2xl font-bold font-mono ${selectedSensor.color}`}>
                            {currentData !== undefined ? currentData.toFixed(2) : '--'}
                        </div>
                    </div>

                    <div className="mb-8 pr-32">
                        <div className={`w-12 h-12 rounded-xl ${selectedSensor.bgColor} ${selectedSensor.color} flex items-center justify-center mb-4`}>
                            <selectedSensor.icon className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedSensor.label} Calibration</h2>
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
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Step {activeStep + 1}: {selectedSensor.steps[activeStep].title}</h3>
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
                                    {isSending ? 'Processing...' : selectedSensor.steps[activeStep].actionLabel}
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
                            <h3 className="text-2xl font-bold text-white mb-2">Calibration Complete!</h3>
                            <p className="text-slate-400 mb-8">Your {selectedSensor.label} is now properly calibrated.</p>
                            <button
                                onClick={() => setSelectedSensor(null)}
                                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                            >
                                Done
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
                    className="p-2 px-4 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Hub
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 sm:px-6 z-10 w-full">
                <div className="text-center mb-8 max-w-3xl fade-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                        Calibration Wizard
                    </h1>
                    <p className="text-lg text-slate-400">
                        Follow the steps to ensure your sensors take highly accurate measurements.
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

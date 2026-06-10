import React, { useState, useEffect, Suspense, lazy } from 'react';
import PlantSelector, { PLANT_TYPES } from './components/PlantSelector';
import SystemVisualizer from './components/SystemVisualizer';
import { Home, Settings, Activity, Cpu, Globe } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { useLanguage } from './contexts/LanguageContext';
import { api } from './services/api';

// Lazy load non-critical components for fast initial render
const Dashboard = lazy(() => import('./components/Dashboard'));
const ParameterConfig = lazy(() => import('./components/ParameterConfig'));
const AutomationStatus = lazy(() => import('./components/AutomationStatus'));
const MainMenu = lazy(() => import('./components/MainMenu'));
const HardwareGuide = lazy(() => import('./components/HardwareGuide'));
const CalibrationWizard = lazy(() => import('./components/CalibrationWizard'));

function App() {
    const { t, lang, toggleLanguage } = useLanguage();
    const [viewMode, setViewMode] = useState(() => {
        // Explicit override for testing
        const params = new URLSearchParams(window.location.search);
        if (params.has('demo')) return params.get('demo') === 'true' ? 'main-menu' : 'visualizer';
        
        // Intelligent Routing:
        // - GitHub Pages (Public site) -> Marketing Demo
        // - Localhost / IP (Actual Hardware Appliance) -> App Dashboard
        const hostname = window.location.hostname;
        if (hostname.includes('github.io')) {
            return 'main-menu';
        }
        return 'visualizer';
    }); // 'main-menu' | 'visualizer' | 'technical' | 'hardware-guide' | 'calibration'
    
    const [selectedPlant, setSelectedPlant] = useState(null);

    // Single WebSocket connection shared across all components
    const { data: systemData, isConnected } = useWebSocket();

    // Synchronize selected crop with the Python Backend (Single Source of Truth)
    useEffect(() => {
        if (systemData) {
            const activeCropId = systemData?.automation_status?.active_crop || systemData?.automation_config?.active_crop;
            if (activeCropId) {
                const crop = PLANT_TYPES.find(p => p.id === activeCropId);
                if (crop && (!selectedPlant || selectedPlant.id !== crop.id)) {
                    setSelectedPlant(crop);
                }
            } else if (activeCropId === "") {
                if (selectedPlant !== null) {
                    setSelectedPlant(null);
                }
            }
        }
    }, [systemData, selectedPlant]);
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: t('tabDashboard'), icon: Home },
        { id: 'automation', label: t('tabAutomation'), icon: Activity },
        { id: 'config', label: t('tabConfig'), icon: Settings }
    ];

    // Handle plant selection and sync with backend autopilot
    const handlePlantSelection = async (plant) => {
        setSelectedPlant(plant);
        if (plant) {
            try {
                // Fetch current config so we don't overwrite tolerances/enabled states
                const currentConfig = await api.getConfig();
                
                // Update the backend targets
                await api.updateParameter('ph', { ...currentConfig.ph, target: plant.targetPh });
                await api.updateParameter('ec', { ...currentConfig.ec, target: plant.targetEc });
                await api.setActiveCrop(plant.id);
                console.log(`Backend autopilot synced for ${plant.name}: pH ${plant.targetPh}, EC ${plant.targetEc}`);
            } catch (error) {
                console.error("Failed to sync targets to backend", error);
            }
        } else {
            try {
                await api.setActiveCrop("");
            } catch (e) {
                console.error("Failed to clear crop on backend", e);
            }
        }
    };

    // -- MAIN MENU VIEW --
    let content;
    if (viewMode === 'main-menu') {
        content = <MainMenu onNavigate={setViewMode} />;
    }

    // -- HARDWARE GUIDE VIEW --
    else if (viewMode === 'hardware-guide') {
        content = <HardwareGuide onNavigate={setViewMode} />;
    }

    // -- CALIBRATION WIZARD VIEW --
    else if (viewMode === 'calibration') {
        content = <CalibrationWizard onBack={() => setViewMode('main-menu')} systemData={systemData} />;
    }

    // -- CONSUMER VIEW (The "WOW" Experience) --
    else if (viewMode === 'consumer' || viewMode === 'visualizer') {
        content = (
            <div className="relative min-h-screen bg-slate-950">
                {!selectedPlant ? (
                    <PlantSelector 
                        onSelectPlant={handlePlantSelection} 
                        onBackToMenu={() => setViewMode('main-menu')}
                        onTechView={() => setViewMode('technical')}
                    />
                ) : (
                    <SystemVisualizer
                        plant={selectedPlant}
                        onBack={() => handlePlantSelection(null)}
                        onTechView={() => setViewMode('technical')}
                        systemData={systemData}
                        isConnected={isConnected}
                    />
                )}
            </div>
        );
    }

    // -- TECHNICAL VIEW (The original dashboard) --
    else {
        content = (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Tech Navigation */}
                <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
                    <div className="mx-auto px-4">
                        <div className="flex items-center justify-between h-16 w-full">
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-bold text-gray-900">{t('adminTitle')}</h1>
                                <button
                                    onClick={() => { setViewMode('consumer'); setSelectedPlant(null); }}
                                    className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200"
                                >
                                    <span className="transform rtl:-scale-x-100 inline-block">&larr;</span> {t('backToVisualizer')}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Tech Content */}
                <main className="pb-8">
                    {activeTab === 'dashboard' && (
                        <Dashboard systemData={systemData} isConnected={isConnected} />
                    )}
                    {activeTab === 'automation' && (
                        <div className="mx-auto px-4 py-6 w-full max-w-2xl">
                            <AutomationStatus systemData={systemData} />
                        </div>
                    )}
                    {activeTab === 'config' && (
                        <ParameterConfig systemData={systemData} />
                    )}
                </main>
            </div>
        );
    }

    return (
        <>
            {/* Global Language Toggle (Bottom End to avoid header collisions) */}
            <button
                onClick={toggleLanguage}
                className="fixed bottom-6 end-6 z-[100] flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors shadow-2xl backdrop-blur-md"
                title="Toggle Language"
            >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'عربي' : 'English'}
            </button>
            <Suspense fallback={
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-emerald-500">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-semibold text-lg animate-pulse">Loading HydroMonitor...</p>
                </div>
            }>
                {content}
            </Suspense>
        </>
    );
}

export default App;

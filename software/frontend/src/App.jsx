import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ParameterConfig from './components/ParameterConfig';
import AutomationStatus from './components/AutomationStatus';
import PlantSelector from './components/PlantSelector';
import SystemVisualizer from './components/SystemVisualizer';
import MainMenu from './components/MainMenu';
import HardwareGuide from './components/HardwareGuide';
import CalibrationWizard from './components/CalibrationWizard';
import { Home, Settings, Activity, Cpu, Globe } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { useLanguage } from './contexts/LanguageContext';

function App() {
    const { t, lang, toggleLanguage } = useLanguage();
    // Top-level routing state
    const [viewMode, setViewMode] = useState('main-menu'); // 'main-menu' | 'consumer' | 'technical' | 'hardware-guide'
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Single WebSocket connection shared across all components
    const { data: systemData, isConnected } = useWebSocket();

    const tabs = [
        { id: 'dashboard', label: t('tabDashboard'), icon: Home },
        { id: 'automation', label: t('tabAutomation'), icon: Activity },
        { id: 'config', label: t('tabConfig'), icon: Settings }
    ];

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
            <div className="relative">
                {/* Back to Hub Navigation */}
                <button
                    onClick={() => { setViewMode('main-menu'); setSelectedPlant(null); }}
                    className="absolute top-4 start-4 z-50 p-2 px-4 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition flex items-center gap-2 text-sm font-medium border border-slate-700/50 backdrop-blur-md"
                >
                    <span className="transform rtl:-scale-x-100 inline-block">&larr;</span> {t('backToMenu')}
                </button>

                {/* Hidden Advanced Toggle */}
                <button
                    onClick={() => setViewMode('technical')}
                    className="absolute top-4 end-4 z-50 p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition border border-slate-700/50 backdrop-blur-md"
                    title="Developer / Technical View"
                >
                    <Cpu className="w-5 h-5" />
                </button>

                {!selectedPlant ? (
                    <PlantSelector onSelectPlant={setSelectedPlant} />
                ) : (
                    <SystemVisualizer
                        plant={selectedPlant}
                        onBack={() => setSelectedPlant(null)}
                        systemData={systemData}
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
            {/* Global Language Toggle (Top End) */}
            <button
                onClick={toggleLanguage}
                className="fixed top-4 end-4 z-[100] flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors shadow-lg backdrop-blur-md"
                title="Toggle Language"
            >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'عربي' : 'English'}
            </button>
            {content}
        </>
    );
}

export default App;

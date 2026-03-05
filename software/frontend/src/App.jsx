import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ParameterConfig from './components/ParameterConfig';
import AutomationStatus from './components/AutomationStatus';
import PlantSelector from './components/PlantSelector';
import SystemVisualizer from './components/SystemVisualizer';
import { Home, Settings, Activity, Cpu } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
    // Top-level routing state
    const [viewMode, setViewMode] = useState('consumer'); // 'consumer' | 'technical'
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Single WebSocket connection shared across all components
    const { data: systemData, isConnected } = useWebSocket();

    const tabs = [
        { id: 'dashboard', label: 'Tech Dashboard', icon: Home },
        { id: 'automation', label: 'Automation rules', icon: Activity },
        { id: 'config', label: 'Parameter config', icon: Settings }
    ];

    // -- CONSUMER VIEW (The new "WOW" experience) --
    if (viewMode === 'consumer') {
        return (
            <div className="relative">
                {/* Hidden Advanced Toggle */}
                <button
                    onClick={() => setViewMode('technical')}
                    className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition"
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
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Tech Navigation */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
                <div className="mx-auto px-4">
                    <div className="flex items-center justify-between h-16 w-full">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-gray-900">HydroMonitor Admin</h1>
                            <button
                                onClick={() => { setViewMode('consumer'); setSelectedPlant(null); }}
                                className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200"
                            >
                                &larr; Back to Visualizer
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

export default App;

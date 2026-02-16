import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ParameterConfig from './components/ParameterConfig';
import AutomationStatus from './components/AutomationStatus';
import { Home, Settings, Activity } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'automation', label: 'Automation', icon: Activity },
        { id: 'config', label: 'Configuration', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-gray-900">HydroMonitor</h1>
                        <div className="flex gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
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

            {/* Content */}
            <main className="pb-8">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'automation' && (
                    <div className="max-w-2xl mx-auto px-4 py-6">
                        <AutomationStatus />
                    </div>
                )}
                {activeTab === 'config' && <ParameterConfig />}
            </main>
        </div>
    );
}

export default App


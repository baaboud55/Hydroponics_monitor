import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ComposedChart } from 'recharts';

export default function HistoricalData({ theme = 'light' }) {
    const { t } = useLanguage();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('24h');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [error, setError] = useState(null);

    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-slate-200' : 'text-gray-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-gray-500';
    const bgColor = isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800' : 'bg-white border-gray-100';
    const cardBg = isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-200';
    const gridColor = isDark ? '#334155' : '#f0f0f0';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#e5e7eb';

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            let start = null;
            let end = null;
            const now = new Date();

            if (timeRange === '24h') {
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            } else if (timeRange === '7d') {
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            } else if (timeRange === '30d') {
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            } else if (timeRange === 'custom') {
                start = customStart ? new Date(customStart).toISOString() : null;
                end = customEnd ? new Date(customEnd).toISOString() : null;
            }

            // Fetch telemetry and dosing history concurrently
            const [historyResponse, dosingResponse] = await Promise.all([
                api.getHistory(start, end).catch(() => ({ history: [] })),
                api.getDosingHistory(200).catch(() => ({ history: [] }))
            ]);
            
            const rawData = historyResponse.history || historyResponse || [];
            const dosingData = dosingResponse.history || dosingResponse || [];
            
            // Format data for recharts
            const formattedData = rawData.map(item => {
                const ts = new Date(item.timestamp).getTime();
                // Find dosing events near this timestamp (+/- 3 minutes, typical logging interval is 5m)
                const nearDoses = dosingData.filter(d => Math.abs(new Date(d.timestamp).getTime() - ts) < 180000);
                
                const phDoses = nearDoses.filter(d => d.parameter === 'ph');
                const ecDoses = nearDoses.filter(d => d.parameter === 'ec');

                return {
                    ...item,
                    timeLabel: new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    // Use the existing pH/EC values but add a marker property if a dose occurred
                    phDoseAmount: phDoses.length > 0 ? phDoses.reduce((sum, d) => sum + d.amount_ml, 0) : null,
                    ecDoseAmount: ecDoses.length > 0 ? ecDoses.reduce((sum, d) => sum + d.amount_ml, 0) : null,
                    // To show a dot ON the line chart exactly where the dose happened, we map the dose to the Y value
                    phDoseMarker: phDoses.length > 0 ? item.ph : null,
                    ecDoseMarker: ecDoses.length > 0 ? item.ec : null,
                };
            });
            
            setData(formattedData);
        } catch (err) {
            console.error(err);
            setError('Failed to load historical data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeRange !== 'custom') {
            loadData();
        }
    }, [timeRange]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} className="p-3 border rounded-lg shadow-xl text-sm">
                    <p className={`font-semibold mb-2 ${textColor}`}>{label}</p>
                    {payload.map((entry, index) => {
                        // Skip rendering marker scatter points in tooltip as primary data lines are already there
                        if (entry.dataKey === 'phDoseMarker' || entry.dataKey === 'ecDoseMarker') return null;
                        
                        return (
                            <div key={index} className="flex items-center gap-2 mb-1">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                <span className={subTextColor}>{entry.name}:</span>
                                <span className={`font-medium ${textColor}`}>
                                    {entry.value !== null ? entry.value.toFixed(2) : 'N/A'}
                                </span>
                            </div>
                        );
                    })}
                    
                    {/* Add Dose info if present on this point */}
                    {payload[0] && payload[0].payload.phDoseAmount && (
                         <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-rose-500 font-medium">
                             pH Dose: {payload[0].payload.phDoseAmount.toFixed(1)} ml
                         </div>
                    )}
                    {payload[0] && payload[0].payload.ecDoseAmount && (
                         <div className="mt-1 text-cyan-500 font-medium">
                             Nutrient Dose: {payload[0].payload.ecDoseAmount.toFixed(1)} ml
                         </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`rounded-xl shadow-sm border p-6 ${bgColor}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className={`text-lg font-bold ${textColor}`}>{t('historyTitle')}</h2>
                    <p className={`text-sm ${subTextColor}`}>{t('historyDesc')}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        className={`p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${cardBg} ${textColor} border-gray-200 dark:border-slate-600`}
                    >
                        <option value="24h">{t('last24h')}</option>
                        <option value="7d">{t('last7d')}</option>
                        <option value="30d">{t('last30d')}</option>
                        <option value="custom">{t('customRange')}</option>
                    </select>

                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="datetime-local" 
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className={`p-2 border rounded-lg text-sm ${cardBg} ${textColor} border-gray-200 dark:border-slate-600`}
                            />
                            <span className={subTextColor}>to</span>
                            <input 
                                type="datetime-local" 
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className={`p-2 border rounded-lg text-sm ${cardBg} ${textColor} border-gray-200 dark:border-slate-600`}
                            />
                            <button 
                                onClick={loadData}
                                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('loadHistory')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className={`h-80 flex items-center justify-center ${subTextColor}`}>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                    {t('loading')}
                </div>
            ) : data.length === 0 ? (
                <div className={`h-80 flex items-center justify-center ${subTextColor} ${cardBg} rounded-lg border border-dashed`}>
                    {t('noData')}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* pH & EC Chart */}
                    <div className="h-80">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-sm font-semibold ${textColor}`}>{t('nutrientSolution')}</h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span> pH Dose Event</span>
                                <span className="flex items-center gap-1 text-cyan-500"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> EC Dose Event</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="timeLabel" tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280'}} minTickGap={30} />
                                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280'}} />
                                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280'}} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                
                                <Line yAxisId="left" type="monotone" dataKey="ph" name={t('phLevel')} stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                                <Line yAxisId="right" type="monotone" dataKey="ec" name={t('plantFoodNutrients')} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                                
                                {/* Overlay markers for dosing events */}
                                <Scatter yAxisId="left" dataKey="phDoseMarker" name="pH Dose" fill="#f43f5e" shape="circle" stroke="#fff" strokeWidth={isDark?0:1} />
                                <Scatter yAxisId="right" dataKey="ecDoseMarker" name="EC Dose" fill="#06b6d4" shape="triangle" stroke="#fff" strokeWidth={isDark?0:1} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Environment Chart */}
                    <div className="h-80">
                        <h3 className={`text-sm font-semibold ${textColor} mb-4`}>{t('environmentAir')}</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="timeLabel" tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280'}} minTickGap={30} />
                                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280'}} />
                                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280'}} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Line yAxisId="left" type="monotone" dataKey="water_temp" name={t('waterTempLabel')} stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line yAxisId="left" type="monotone" dataKey="air_temp" name={t('airTemp')} stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="humidity" name={t('humidity')} stroke="#6366f1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

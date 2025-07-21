import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel, LabelList
} from 'recharts';
 
const AnalyticsDashboard = () => {
    const [funnelData, setFunnelData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [posthogEvents, setPosthogEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFunnel, setSelectedFunnel] = useState('onboarding');
    const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Enhanced color scheme for charts
    const colors = {
        primary: '#4f46e5',
        secondary: '#7c3aed',
        tertiary: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        purple: '#8b5cf6',
        pink: '#ec4899',
        gradient: ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
    };

    // API Base URL
    const API_BASE = 'http://127.0.0.1:8000';

    // Fetch funnel data from your backend
    const fetchFunnelData = useCallback(async () => {
        try {
            setError(null);
            
            // Test connection first
            const healthResponse = await fetch(`${API_BASE}/`);
            const healthData = await healthResponse.json();
            
            if (healthData.posthog_connection) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('warning');
            }

            // Fetch funnel data
            const funnelResponse = await fetch(`${API_BASE}/funnel/${selectedFunnel}`);
            if (!funnelResponse.ok) {
                throw new Error(`HTTP error! status: ${funnelResponse.status}`);
            }
            const funnelResult = await funnelResponse.json();
            setFunnelData(funnelResult);

            // Fetch recommendations
            const recommendationsResponse = await fetch(`${API_BASE}/recommendations/${selectedFunnel}`);
            if (recommendationsResponse.ok) {
                const recommendationsResult = await recommendationsResponse.json();
                setRecommendations(recommendationsResult.recommendations || []);
            }

            // Fetch PostHog events
            const eventsResponse = await fetch(`${API_BASE}/posthog/events`);
            if (eventsResponse.ok) {
                const eventsResult = await eventsResponse.json();
                setPosthogEvents(eventsResult.event_types || []);
            }

            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            setConnectionStatus('error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFunnel]);

    // Real-time data polling
    useEffect(() => {
        fetchFunnelData();
        
        let interval;
        if (isRealTimeEnabled) {
            interval = setInterval(fetchFunnelData, 30000); // Update every 30 seconds
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchFunnelData, isRealTimeEnabled]);

    // Process funnel data for visualizations
    const processedChartData = useMemo(() => {
        if (!funnelData?.analysis) return [];
        
        return funnelData.analysis.map((step, index) => ({
            step: step.step,
            count: step.count,
            conversion_rate: step.conversion_rate,
            drop_off_rate: step.drop_off_rate,
            fill: colors.gradient[index % colors.gradient.length]
        }));
    }, [funnelData]);

    // Calculate key metrics
    const keyMetrics = useMemo(() => {
        if (!funnelData) return {};
        
        return {
            totalUsers: funnelData.total_users || 0,
            totalSteps: funnelData.total_steps || 0,
            finalConversion: funnelData.final_conversion_rate || 0,
            dataSource: funnelData.data_source || 'Unknown',
            avgDropOff: funnelData.analysis?.reduce((acc, step) => acc + step.drop_off_rate, 0) / (funnelData.analysis?.length || 1) || 0
        };
    }, [funnelData]);

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-effect p-4 rounded-lg border border-white/10 shadow-xl">
                    <p className="text-sm font-semibold text-gray-200 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs mb-1" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.dataKey.replace('_', ' ').toUpperCase()}:</span>
                            <span className="ml-1">
                                {entry.value}{entry.dataKey.includes('rate') ? '%' : ''}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Priority color mapping
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        }
    };

    if (isLoading && !funnelData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-400 animate-pulse">Loading PostHog analytics...</p>
                    <p className="text-sm text-gray-500 mt-2">Connecting to backend at {API_BASE}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="glass-effect p-8 rounded-xl text-center border border-red-500/20 max-w-md">
                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold mb-2 text-red-400">Connection Error</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Make sure your backend is running at {API_BASE}
                    </p>
                    <button 
                        onClick={fetchFunnelData}
                        className="btn-primary px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 space-y-6">
            {/* Enhanced Header with Status */}
            <div className="glass-effect p-6 rounded-xl">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
                            🚀 PostHog Analytics Dashboard
                        </h1>
                        <p className="text-gray-400">
                            Real-time onboarding funnel analysis powered by PostHog
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-500">
                                Data Source: <span className="text-blue-400">{keyMetrics.dataSource}</span>
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">
                                Events Available: <span className="text-green-400">{posthogEvents.length}</span>
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                                connectionStatus === 'warning' ? 'bg-yellow-400 animate-pulse' :
                                connectionStatus === 'error' ? 'bg-red-400 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-sm text-gray-400 capitalize">
                                {connectionStatus === 'connected' ? 'PostHog Connected' : 
                                 connectionStatus === 'warning' ? 'Using Mock Data' : 
                                 connectionStatus === 'error' ? 'Connection Failed' : 'Connecting...'}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            {/* Real-time Toggle */}
                            <button
                                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                                    isRealTimeEnabled 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10' 
                                        : 'glass-effect border border-white/10 text-gray-400 hover:border-white/20'
                                }`}
                            >
                                {isRealTimeEnabled ? '🔴 Live Updates' : '⏸️ Manual Refresh'}
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={fetchFunnelData}
                                disabled={isLoading}
                                className="px-4 py-2 rounded-lg glass-effect border border-white/10 text-gray-400 hover:border-blue-500/30 hover:text-blue-400 transition-all disabled:opacity-50"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[{
                    title: 'Total Users',
                    value: keyMetrics.totalUsers.toLocaleString(),
                    icon: '👥',
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20'
                },
                {
                    title: 'Final Conversion',
                    value: `${keyMetrics.finalConversion}%`,
                    icon: '🎯',
                    color: 'text-green-400',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/20'
                },
                {
                    title: 'Total Steps',
                    value: keyMetrics.totalSteps,
                    icon: '📊',
                    color: 'text-purple-400',
                    bgColor: 'bg-purple-500/10',
                    borderColor: 'border-purple-500/20'
                },
                {
                    title: 'Avg Drop-off',
                    value: `${keyMetrics.avgDropOff.toFixed(1)}%`,
                    icon: '📉',
                    color: 'text-orange-400',
                    bgColor: 'bg-orange-500/10',
                    borderColor: 'border-orange-500/20'
                }].map((metric, index) => (
                    <div key={index} className={`glass-effect p-6 rounded-xl hover-lift border ${metric.borderColor} ${metric.bgColor}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{metric.icon}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${metric.bgColor} ${metric.borderColor} border`}>
                                Live
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-400 font-medium">{metric.title}</p>
                            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Funnel Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        📊 Funnel Analysis
                        {isRealTimeEnabled && <span className="animate-pulse text-green-400 text-sm">● Live</span>}
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={processedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                dataKey="step" 
                                stroke="#9CA3AF"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="count" 
                                fill={colors.primary}
                                radius={[4, 4, 0, 0]}
                                name="Users"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-effect p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        📈 Conversion Rates
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={processedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                dataKey="step" 
                                stroke="#9CA3AF"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                                type="monotone" 
                                dataKey="conversion_rate" 
                                stroke={colors.success}
                                strokeWidth={3}
                                dot={{ fill: colors.success, strokeWidth: 2, r: 6 }}
                                name="Conversion Rate"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="drop_off_rate" 
                                stroke={colors.error}
                                strokeWidth={3}
                                dot={{ fill: colors.error, strokeWidth: 2, r: 6 }}
                                name="Drop-off Rate"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recommendations Panel */}
            {recommendations.length > 0 && (
                <div className="glass-effect p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        💡 AI Recommendations
                        <span className="text-sm text-gray-400 font-normal">
                            ({recommendations.length} insights)
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.map((rec, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)} transition-all hover:border-opacity-50`}>
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(rec.priority)}`}>
                                        {rec.priority || 'Medium'}
                                    </span>
                                    <span className="text-2xl">{rec.impact > 80 ? '🔥' : rec.impact > 60 ? '⚡' : '💡'}</span>
                                </div>
                                <h4 className="font-semibold mb-2 text-gray-200">{rec.title}</h4>
                                <p className="text-sm text-gray-400 mb-3">{rec.description}</p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">
                                        Impact: <span className="text-blue-400">{rec.impact}%</span>
                                    </span>
                                    <span className="text-gray-500">
                                        Step: <span className="text-purple-400">{rec.step}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PostHog Events Overview */}
            {posthogEvents.length > 0 && (
                <div className="glass-effect p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        🔍 Available Events
                        <span className="text-sm text-gray-400 font-normal">
                            ({posthogEvents.length} event types)
                        </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {posthogEvents.slice(0, 12).map((event, index) => (
                            <div key={index} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-center">
                                <div className="text-xs text-gray-400 font-mono truncate" title={event}>
                                    {event}
                                </div>
                            </div>
                        ))}
                        {posthogEvents.length > 12 && (
                            <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                                <div className="text-xs text-gray-500">
                                    +{posthogEvents.length - 12} more
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-800 pt-4">
                Last updated: {lastUpdated.toLocaleTimeString()} | 
                Auto-refresh: {isRealTimeEnabled ? 'ON' : 'OFF'} | 
                Data from: PostHog Analytics
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
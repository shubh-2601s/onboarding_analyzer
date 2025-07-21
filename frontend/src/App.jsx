import React, { useEffect, useState, useCallback } from 'react';
import './app.css';
import FunnelChart from './components/FunnelChart';
import DropOffTable from './components/DropOffTable';
import RecommendationsList from './components/RecommendationsList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdvancedAnalyticsDashboard from './components/AdvancedAnalyticsDashboard';
import PerformanceMetrics from './components/PerformanceMetrics';
import ExportPanel from './components/ExportPanel';
import ThemeToggle from './components/ThemeToggle';
import AIAgentDashboard from './components/AIAgentDashboard';
import { Toaster } from 'react-hot-toast';

function App() {
    const [funnelData, setFunnelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('ai-agents'); // Changed default to ai-agents
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRealTime, setIsRealTime] = useState(false);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [connectionStatus, setConnectionStatus] = useState('checking');

    // Real-time data fetching
    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const apiUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://127.0.0.1:8000';
            
            // Test connection first
            const healthResponse = await fetch(`${apiUrl}/`);
            const healthData = await healthResponse.json();
            setConnectionStatus(healthData.posthog_connection ? 'connected' : 'disconnected');
            
            const response = await fetch(`${apiUrl}/funnel/onboarding`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setFunnelData(data);
            setLastUpdated(new Date());
            setError(null);
        } catch (error) {
            console.error('Error fetching funnel data:', error);
            setError(error.message);
            setConnectionStatus('error');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time updates
    useEffect(() => {
        let interval;
        if (isRealTime) {
            interval = setInterval(() => {
                fetchData(false); // Don't show loading spinner for auto-refresh
            }, 30000); // Refresh every 30 seconds
        }
        return () => clearInterval(interval);
    }, [isRealTime, fetchData]);

    const navItems = [
        { id: 'ai-agents', name: 'AI Agents', icon: '🤖', description: 'Autonomous Intelligence' },
        { id: 'advanced', name: 'Advanced Analytics', icon: '🧠', description: 'ML-Powered Insights' },
        { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Standard Analytics' },
        { id: 'overview', name: 'Overview', icon: '🔍', description: 'Quick Summary' },
        { id: 'funnel', name: 'Funnel', icon: '🎯', description: 'Conversion Flow' },
        { id: 'table', name: 'Data', icon: '📋', description: 'Detailed Table' },
        { id: 'recommendations', name: 'Insights', icon: '💡', description: 'AI Recommendations' },
        { id: 'performance', name: 'Performance', icon: '⚡', description: 'System Metrics' },
        { id: 'export', name: 'Export', icon: '📥', description: 'Download Reports' },
    ];

    const refreshData = () => {
        fetchData(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center glass-effect rounded-3xl p-16 animate-fade-in max-w-md">
                    <div className="relative mb-8">
                        <div className="loading-spinner mx-auto"></div>
                        <div className="absolute inset-0 loading-spinner mx-auto opacity-30" style={{animationDelay: '0.5s'}}></div>
                    </div>
                    <h3 className="text-2xl font-bold gradient-text mb-4">Loading Analytics</h3>
                    <p className="text-lg font-medium text-glow mb-2">Connecting to PostHog...</p>
                    <p className="text-sm text-secondary">Fetching real-time data</p>
                    <div className="mt-6 progress-bar h-2 rounded-full overflow-hidden">
                        <div className="progress-fill h-full w-3/4 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center glass-effect rounded-3xl p-16 animate-fade-in neon-border max-w-lg">
                    <div className="relative mb-8">
                        <div className="text-8xl animate-bounce">⚠️</div>
                        <div className="absolute -top-2 -right-2 text-2xl animate-ping">💥</div>
                    </div>
                    <h2 className="text-4xl font-bold gradient-text mb-6">Connection Error</h2>
                    <div className="glass-effect rounded-2xl p-4 mb-6 border border-red-500/30">
                        <p className="text-red-300 font-mono text-sm">{error}</p>
                    </div>
                    <div className="space-y-4">
                        <button 
                            onClick={refreshData} 
                            className="btn-primary w-full py-4 px-8 rounded-2xl font-semibold hover-lift text-lg"
                        >
                            🔄 Retry Connection
                        </button>
                        <p className="text-xs text-dim">Backend: http://127.0.0.1:8000</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen dashboard-layout">
            {/* Floating Action Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-6 left-6 z-50 glass-effect rounded-2xl p-4 hover-lift transition-all duration-300 md:hidden"
            >
                <div className={`transform transition-transform duration-300 ${sidebarOpen ? 'rotate-90' : ''}`}>
                    ☰
                </div>
            </button>

            {/* Sidebar Navigation */}
            <nav className={`fixed left-0 top-0 h-full w-80 glass-effect backdrop-blur-xl transition-transform duration-300 z-40 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
                <div className="p-8 h-full overflow-y-auto">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold gradient-text">Analytics</h2>
                                <p className="text-sm text-secondary">PostHog Dashboard</p>
                            </div>
                            <ThemeToggle />
                        </div>
                        
                        {/* Connection Status */}
                        <div className={`flex items-center space-x-2 text-sm p-3 rounded-xl ${
                            connectionStatus === 'connected' ? 'bg-green-500/20 text-green-300' :
                            connectionStatus === 'disconnected' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                        }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                connectionStatus === 'connected' ? 'bg-green-400' :
                                connectionStatus === 'disconnected' ? 'bg-yellow-400' :
                                'bg-red-400'
                            }`}></div>
                            <span>
                                {connectionStatus === 'connected' ? 'PostHog Connected' :
                                 connectionStatus === 'disconnected' ? 'Using Mock Data' :
                                 'Connection Error'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-8">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group ${
                                    activeTab === item.id 
                                        ? 'glass-effect border border-accent neon-border' 
                                        : 'hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-white">{item.name}</p>
                                        <p className="text-xs text-secondary">{item.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Real-time Toggle */}
                    <div className="mb-6 p-4 glass-effect rounded-2xl border border-blue-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-blue-300">Real-time Updates</span>
                            <button
                                onClick={() => setIsRealTime(!isRealTime)}
                                className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                                    isRealTime ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                                    isRealTime ? 'translate-x-7' : 'translate-x-1'
                                } mt-1`}></div>
                            </button>
                        </div>
                        <p className="text-xs text-secondary">Auto-refresh every 30 seconds</p>
                    </div>

                    {/* System Status */}
                    <div className="p-4 glass-effect rounded-2xl border border-green-500/30">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-300">System Status</span>
                        </div>
                        {lastUpdated && (
                            <p className="text-xs text-secondary mb-2">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                        <button 
                            onClick={refreshData}
                            className="w-full text-xs text-accent-primary hover:text-accent-secondary transition-colors py-2 px-3 rounded-lg glass-effect hover:bg-white/10"
                        >
                            🔄 Refresh Data
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="md:ml-80 min-h-screen">
                <div className="p-6 md:p-12">
                    {/* Enhanced Header */}
                    <header className="mb-12 animate-fade-in">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                            <div className="mb-6 lg:mb-0">
                                <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-4 tracking-tight text-glow">
                                    Onboarding Analyzer
                                </h1>
                                <p className="text-xl text-secondary">Real-time funnel performance insights</p>
                            </div>
                            
                            {funnelData && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="glass-effect px-6 py-4 rounded-2xl hover-lift">
                                        <p className="text-sm mono text-secondary">Funnel ID</p>
                                        <p className="gradient-text font-bold text-lg">{funnelData.funnel_id}</p>
                                    </div>
                                    <div className="glass-effect px-6 py-4 rounded-2xl hover-lift">
                                        <p className="text-sm mono text-secondary">Data Source</p>
                                        <p className="text-white font-bold text-lg">{funnelData.data_source}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Stats Overview */}
                        {funnelData && (
                            <div className="dashboard-stats-wrapper overflow-hidden rounded-2xl border border-white/20 mb-8 animate-stagger">
                                <div className="bg-white/10 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span>📊</span>
                                        Performance Overview
                                    </h3>
                                    {isRealTime && (
                                        <div className="flex items-center gap-2 text-sm text-green-300">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            Live
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="dashboard-stats-table min-w-full">
                                        <tbody>
                                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-2xl">
                                                            👥
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">Total Users</div>
                                                            <div className="text-xs text-secondary">Starting funnel</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-3xl font-bold gradient-text">
                                                        {funnelData.total_users?.toLocaleString() || 'N/A'}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-2xl">
                                                            🎯
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">Final Conversion</div>
                                                            <div className="text-xs text-secondary">End-to-end success</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-3xl font-bold text-green-300">
                                                        {funnelData.final_conversion_rate?.toFixed(1) || 0}%
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                                                            ⚠️
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">Critical Steps</div>
                                                            <div className="text-xs text-secondary">High drop-off points</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-3xl font-bold text-yellow-300">
                                                        {funnelData.analysis?.filter(s => s.drop_off_rate > 30).length || 0}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-2xl">
                                                            💎
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">Health Score</div>
                                                            <div className="text-xs text-secondary">Overall performance</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-3xl font-bold gradient-text">
                                                        {funnelData.analysis?.filter(s => s.drop_off_rate > 30).length === 0 ? 'A+' : 
                                                         funnelData.analysis?.filter(s => s.drop_off_rate > 20).length <= 1 ? 'B+' : 'C+'}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </header>

                    {/* Content based on active tab */}
                    {funnelData && funnelData.analysis ? (
                        <div className="animate-fade-in">
                            {activeTab === 'dashboard' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive mb-8">
                                    <AnalyticsDashboard 
                                        funnelData={funnelData} 
                                        onRefresh={refreshData}
                                        isRealTime={isRealTime}
                                    />
                                </div>
                            )}
                            
                            {activeTab === 'overview' && (
                                <>
                                    <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive mb-8">
                                        <FunnelChart data={funnelData.analysis} />
                                    </div>
                                    <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive mb-8">
                                        <DropOffTable data={funnelData.analysis} />
                                    </div>
                                </>
                            )}
                            
                            {activeTab === 'funnel' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive mb-8">
                                    <FunnelChart data={funnelData.analysis} />
                                </div>
                            )}
                            
                            {activeTab === 'table' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive mb-8">
                                    <DropOffTable data={funnelData.analysis} />
                                </div>
                            )}
                            
                            {activeTab === 'recommendations' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive">
                                    <RecommendationsList data={funnelData.analysis} />
                                </div>
                            )}

                            {activeTab === 'performance' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive">
                                    <PerformanceMetrics 
                                        funnelData={funnelData}
                                        connectionStatus={connectionStatus}
                                        lastUpdated={lastUpdated}
                                    />
                                </div>
                            )}

                            {activeTab === 'export' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive">
                                    <ExportPanel 
                                        funnelData={funnelData}
                                        onRefresh={refreshData}
                                    />
                                </div>
                            )}

                            {activeTab === 'ai-agents' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive">
                                    <AIAgentDashboard 
                                        funnelData={funnelData}
                                        onRefresh={refreshData}
                                    />
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="glass-effect rounded-3xl shadow-2xl hover-lift card-interactive">
                                    <AdvancedAnalyticsDashboard 
                                        funnelData={funnelData}
                                        onRefresh={refreshData}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center glass-effect rounded-3xl p-16">
                            <div className="text-6xl mb-6">📊</div>
                            <h3 className="text-2xl font-bold gradient-text mb-4">No Data Available</h3>
                            <p className="text-secondary text-lg mb-6">Check your PostHog connection</p>
                            <button 
                                onClick={refreshData}
                                className="btn-primary px-8 py-4 rounded-2xl font-semibold hover-lift"
                            >
                                🔄 Retry Connection
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Toaster />
        </div>
    );
}

export default App;
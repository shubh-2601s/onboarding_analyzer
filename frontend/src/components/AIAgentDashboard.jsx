import React, { useState, useEffect, useCallback } from 'react';
import './AIAgentDashboard.css';

const AIAgentDashboard = ({ funnelData, onRefresh }) => {
    const [agentStatus, setAgentStatus] = useState({});
    const [aiInsights, setAiInsights] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [optimizations, setOptimizations] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [collaborationReport, setCollaborationReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeAgent, setActiveAgent] = useState('overview');
    const [autoAnalysis, setAutoAnalysis] = useState(false);

    const API_BASE = 'http://127.0.0.1:8000';

    // Fetch agent status
    const fetchAgentStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/ai/agents/status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAgentStatus(data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch agent status:', error);
            setError(`Agent Status Error: ${error.message}`);
        }
    }, []);

    // Trigger AI analysis
    const triggerAIAnalysis = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Trigger comprehensive analysis
            const analysisResponse = await fetch(`${API_BASE}/ai/analyze/onboarding`, {
                method: 'POST'
            });
            
            if (!analysisResponse.ok) {
                throw new Error(`Analysis API error! status: ${analysisResponse.status}`);
            }

            // Fetch all AI insights with error handling
            const fetchWithErrorHandling = async (url, defaultValue = []) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) return defaultValue;
                    const data = await response.json();
                    return data;
                } catch (err) {
                    console.warn(`Failed to fetch ${url}:`, err);
                    return defaultValue;
                }
            };

            const [insights, preds, anoms, opts, patts, collab] = await Promise.all([
                fetchWithErrorHandling(`${API_BASE}/ai/insights/onboarding`),
                fetchWithErrorHandling(`${API_BASE}/ai/predictions/onboarding`),
                fetchWithErrorHandling(`${API_BASE}/ai/anomalies/onboarding`),
                fetchWithErrorHandling(`${API_BASE}/ai/optimizations/onboarding`),
                fetchWithErrorHandling(`${API_BASE}/ai/patterns/onboarding`),
                fetchWithErrorHandling(`${API_BASE}/ai/collaboration-report/onboarding`, {})
            ]);

            setAiInsights(insights.insights || insights || []);
            setPredictions(preds.predictions || preds || []);
            setAnomalies(anoms.anomalies || anoms || []);
            setOptimizations(opts.optimizations || opts || []);
            setPatterns(patts.patterns || patts || []);
            setCollaborationReport(collab);

        } catch (error) {
            console.error('AI Analysis failed:', error);
            setError(`AI Analysis Failed: ${error.message}. Make sure the backend server is running.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-analysis effect
    useEffect(() => {
        let interval;
        if (autoAnalysis) {
            interval = setInterval(() => {
                triggerAIAnalysis();
            }, 60000); // Every minute
        }
        return () => clearInterval(interval);
    }, [autoAnalysis, triggerAIAnalysis]);

    useEffect(() => {
        fetchAgentStatus();
        triggerAIAnalysis();
    }, [fetchAgentStatus, triggerAIAnalysis]);

    const getAgentStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
            case 'analyzing': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
            case 'learning': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
            case 'idle': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
            default: return 'text-red-400 bg-red-500/20 border-red-500/30';
        }
    };

    const getImpactColor = (impact) => {
        switch (impact) {
            case 'critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'high': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
            case 'medium': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            case 'low': return 'text-green-400 border-green-500/50 bg-green-500/10';
            default: return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
        }
    };

    const renderAgentOverview = () => (
        <div className="space-y-6">
            {/* Agent Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(agentStatus.agent_states || {}).map(([agentId, state]) => (
                    <div key={agentId} className="ai-agent-card glass-effect p-6 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{state.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAgentStatusColor(state.status)}`}>
                                {state.status}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Confidence:</span>
                                <span className="text-blue-400">{(state.confidence_level * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Decisions:</span>
                                <span className="text-green-400">{state.decisions_made}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Insights:</span>
                                <span className="text-purple-400">{state.insights_generated}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Memory:</span>
                                <span className="text-yellow-400">{state.memory_size}</span>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${state.confidence_level * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Collaboration Metrics */}
            {collaborationReport && (
                <div className="glass-effect p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        🤝 Agent Collaboration Report
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">
                                {(collaborationReport.collaboration_metrics.collaboration_score * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">Collaboration Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-400 mb-2">
                                {(collaborationReport.collaboration_metrics.consensus_level * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">Consensus Level</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-400 mb-2">
                                {(collaborationReport.collaboration_metrics.system_confidence * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">System Confidence</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderInsightsList = (insights, title, icon) => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                {title}
                <span className="ml-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {insights.length}
                </span>
            </h3>
            
            {insights.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-4">🔍</div>
                    <p>No {title.toLowerCase()} detected at this time</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {insights.map((insight, index) => (
                        <div key={index} className={`ai-insight-card p-6 rounded-xl border-2 ${getImpactColor(insight.impact_level)}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {insight.insight_type === 'anomaly' ? '🚨' : 
                                         insight.insight_type === 'prediction' ? '🔮' : 
                                         insight.insight_type === 'pattern' ? '📈' : 
                                         insight.insight_type === 'recommendation' ? '💡' : '🤖'}
                                    </span>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">{insight.insight_type.replace('_', ' ').toUpperCase()}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact_level)}`}>
                                            {insight.impact_level} impact
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-400">Confidence</div>
                                    <div className="text-lg font-bold text-blue-400">{(insight.confidence * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                            
                            <p className="text-gray-300 mb-4">{insight.description}</p>
                            
                            {insight.suggested_actions && insight.suggested_actions.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-sm font-semibold text-white mb-2">Suggested Actions:</h5>
                                    <ul className="space-y-1">
                                        {insight.suggested_actions.map((action, actionIndex) => (
                                            <li key={actionIndex} className="text-sm text-gray-400 flex items-start gap-2">
                                                <span className="text-blue-400 mt-1">•</span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Generated: {new Date(insight.created_at).toLocaleString()}</span>
                                {insight.data_points?.step && (
                                    <span className="px-2 py-1 bg-gray-700 rounded">Step: {insight.data_points.step}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const agentTabs = [
        { id: 'overview', name: 'Overview', icon: '🤖', count: Object.keys(agentStatus.agent_states || {}).length },
        { id: 'insights', name: 'All Insights', icon: '🧠', count: aiInsights.length },
        { id: 'anomalies', name: 'Anomalies', icon: '🚨', count: anomalies.length },
        { id: 'predictions', name: 'Predictions', icon: '🔮', count: predictions.length },
        { id: 'optimizations', name: 'Optimizations', icon: '⚡', count: optimizations.length },
        { id: 'patterns', name: 'Patterns', icon: '📈', count: patterns.length }
    ];

    return (
        <div className="ai-dashboard-container p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
                        🤖 AI Agent Command Center
                    </h1>
                    <p className="text-gray-400">
                        Autonomous intelligence analyzing your funnel performance in real-time
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setAutoAnalysis(!autoAnalysis)}
                        className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                            autoAnalysis 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'glass-effect border border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                    >
                        {autoAnalysis ? '🟢 Auto Analysis ON' : '⏸️ Auto Analysis OFF'}
                    </button>
                    
                    <button
                        onClick={triggerAIAnalysis}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 font-semibold"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Analyzing...
                            </div>
                        ) : (
                            '🚀 Run AI Analysis'
                        )}
                    </button>
                </div>
            </div>

            {/* Agent Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto">
                {agentTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveAgent(tab.id)}
                        className={`px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
                            activeAgent === tab.id
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'glass-effect border border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        {tab.name}
                        {tab.count > 0 && (
                            <span className="ml-1 px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-96">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">⚠️</span>
                            <h3 className="text-lg font-bold text-red-400">AI System Error</h3>
                        </div>
                        <p className="text-red-300 mb-3">{error}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={triggerAIAnalysis}
                                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                                🔄 Retry AI Analysis
                            </button>
                            <button
                                onClick={() => setError(null)}
                                className="px-4 py-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-all"
                            >
                                ✕ Dismiss Error
                            </button>
                        </div>
                    </div>
                )}

                {activeAgent === 'overview' && renderAgentOverview()}
                {activeAgent === 'insights' && renderInsightsList(aiInsights, 'AI Insights', '🧠')}
                {activeAgent === 'anomalies' && renderInsightsList(anomalies, 'Anomaly Detection', '🚨')}
                {activeAgent === 'predictions' && renderInsightsList(predictions, 'Predictive Analysis', '🔮')}
                {activeAgent === 'optimizations' && renderInsightsList(optimizations, 'Autonomous Optimizations', '⚡')}
                {activeAgent === 'patterns' && renderInsightsList(patterns, 'Pattern Analysis', '📈')}
            </div>
        </div>
    );
};

export default AIAgentDashboard;
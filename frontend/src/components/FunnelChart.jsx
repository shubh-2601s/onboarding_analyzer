import React, { useState, useEffect } from 'react';
import './FunnelChart.css';

function FunnelChart({ data }) {
    const [hoveredStep, setHoveredStep] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [animateRows, setAnimateRows] = useState(false);

    useEffect(() => {
        // Trigger animations on mount
        const timer = setTimeout(() => setAnimateRows(true), 300);
        return () => clearTimeout(timer);
    }, []);

    if (!data || !data.length) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">📊 Funnel Visualization</h2>
                <div className="glass-effect rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-white/70 text-lg">No data available</p>
                    <p className="text-white/50 text-sm mt-2">Please check your data connection or try refreshing</p>
                </div>
            </div>
        );
    }

    // Calculate conversion rates and user counts for funnel visualization
    const maxDropOff = Math.max(...data.map(step => step.drop_off_rate));
    const totalUsers = 1000; // Starting with 1000 users as per backend mock data
    
    // Calculate progressive funnel data
    let remainingUsers = totalUsers;
    const funnelData = data.map((step, index) => {
        const dropOffCount = Math.round(remainingUsers * (step.drop_off_rate / 100));
        const convertedUsers = remainingUsers - dropOffCount;
        const conversionRate = index === 0 ? 100 : (remainingUsers / totalUsers) * 100;
        
        const result = {
            ...step,
            position: index + 1,
            usersEntering: remainingUsers,
            usersConverting: convertedUsers,
            usersDropping: dropOffCount,
            conversionRate: conversionRate,
            cumulativeConversionRate: (convertedUsers / totalUsers) * 100,
            stepConversionRate: ((convertedUsers / remainingUsers) * 100)
        };
        
        remainingUsers = convertedUsers;
        return result;
    });

    const handleStepClick = (step) => {
        setSelectedStep(step);
        setShowDetails(true);
    };

    const getStepStatus = (dropOffRate) => {
        if (dropOffRate > 30) return { status: 'high-risk', color: 'text-red-300', bg: 'bg-red-500/20', emoji: '🔴' };
        if (dropOffRate > 15) return { status: 'moderate', color: 'text-yellow-300', bg: 'bg-yellow-500/20', emoji: '🟡' };
        return { status: 'healthy', color: 'text-green-300', bg: 'bg-green-500/20', emoji: '🟢' };
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="text-4xl animate-bounce">📊</span>
                        Interactive Funnel Visualization
                    </h2>
                    <p className="text-white/70">Click on any step for detailed analysis • Hover for quick insights</p>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="glass-effect px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                >
                    <span>{showDetails ? '📊' : '📋'}</span>
                    {showDetails ? 'Show Chart' : 'Show Details'}
                </button>
            </div>
            
            {/* Enhanced Funnel Summary Stats with animations */}
            <div className="funnel-summary-stats mb-8">
                <div className="glass-effect funnel-summary-card rounded-2xl p-6 text-center hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold gradient-text animate-count-up">{totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-secondary">Total Users Started</div>
                    <div className="mt-2 text-xs text-accent-primary">100% of funnel entry</div>
                </div>
                <div className="glass-effect funnel-summary-card rounded-2xl p-6 text-center hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-green-300 animate-count-up">
                        {funnelData[funnelData.length - 1].usersConverting.toLocaleString()}
                    </div>
                    <div className="text-sm text-secondary">Final Conversions</div>
                    <div className="mt-2 text-xs text-green-400">
                        Success Rate: {funnelData[funnelData.length - 1].cumulativeConversionRate.toFixed(1)}%
                    </div>
                </div>
                <div className="glass-effect funnel-summary-card rounded-2xl p-6 text-center hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-purple-300 animate-count-up">
                        {funnelData[funnelData.length - 1].cumulativeConversionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-secondary">Overall Conversion</div>
                    <div className="mt-2 text-xs text-purple-400">
                        {totalUsers - funnelData[funnelData.length - 1].usersConverting} users lost
                    </div>
                </div>
            </div>

            {/* Interactive Funnel Table */}
            <div className="funnel-table-container overflow-hidden rounded-2xl border border-white/20 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="funnel-table min-w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span className="animate-pulse">🎯</span>
                                        Step Details
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>👥</span>
                                        Users Flow
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>📊</span>
                                        Performance
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>📈</span>
                                        Visualization
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>⚡</span>
                                        Status & Actions
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {funnelData.map((step, index) => {
                                const stepStatus = getStepStatus(step.drop_off_rate);
                                const isHovered = hoveredStep === index;
                                const isSelected = selectedStep?.position === step.position;
                                
                                return (
                                    <tr 
                                        key={index} 
                                        className={`
                                            cursor-pointer transition-all duration-500 group
                                            ${animateRows ? 'animate-slide-in-right' : 'opacity-0'}
                                            ${isHovered ? 'bg-white/20 shadow-2xl scale-102' : 'bg-white/5 hover:bg-white/15'}
                                            ${isSelected ? 'ring-2 ring-accent-primary bg-accent-primary/10' : ''}
                                        `}
                                        onMouseEnter={() => setHoveredStep(index)}
                                        onMouseLeave={() => setHoveredStep(null)}
                                        onClick={() => handleStepClick(step)}
                                        style={{
                                            animationDelay: `${index * 100}ms`
                                        }}
                                    >
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`funnel-step-indicator transition-all duration-300 ${
                                                    isHovered ? 'scale-110 shadow-lg' : ''
                                                }`}>
                                                    {step.position}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white text-lg capitalize">
                                                        {step.step.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-xs text-secondary">
                                                        Step {step.position} of {funnelData.length}
                                                    </div>
                                                    <div className="text-xs text-accent-primary mt-1">
                                                        Step Conversion: {step.stepConversionRate.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-6 text-center">
                                            <div className="space-y-2">
                                                <div className="flex justify-center items-center gap-4">
                                                    <div className="text-center">
                                                        <div className="font-bold text-xl text-blue-300">
                                                            {step.usersEntering.toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-secondary">Entering</div>
                                                    </div>
                                                    <div className="text-2xl">→</div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-xl text-green-300">
                                                            {step.usersConverting.toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-secondary">Continuing</div>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-lg text-red-300">
                                                        -{step.usersDropping.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-secondary">Dropped</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-6 text-center">
                                            <div className="space-y-3">
                                                <div className={`font-bold text-2xl ${stepStatus.color}`}>
                                                    {step.drop_off_rate.toFixed(1)}%
                                                </div>
                                                <div className="flex justify-center">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${stepStatus.bg} ${stepStatus.color}`}>
                                                        Drop-off Rate
                                                    </div>
                                                </div>
                                                {isHovered && (
                                                    <div className="animate-fade-in">
                                                        <div className="text-xs text-white/70">
                                                            Benchmark: {step.drop_off_rate > 25 ? 'Above avg' : 'Below avg'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-full max-w-32">
                                                    <div 
                                                        className={`funnel-visualization-bar transition-all duration-700 ${
                                                            isHovered ? 'shadow-lg' : ''
                                                        }`}
                                                        style={{ 
                                                            width: `${Math.max((step.cumulativeConversionRate / 100) * 120, 40)}px`,
                                                            animationDelay: `${index * 200}ms`
                                                        }}
                                                    >
                                                        {step.cumulativeConversionRate.toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div className="funnel-dropoff-bar w-20">
                                                    <div 
                                                        className={`funnel-dropoff-fill transition-all duration-700 ${
                                                            step.drop_off_rate > 30 ? 'high' :
                                                            step.drop_off_rate > 15 ? 'medium' : 'low'
                                                        }`}
                                                        style={{ 
                                                            width: `${(step.drop_off_rate / maxDropOff) * 100}%`,
                                                            animationDelay: `${index * 300}ms`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className={`funnel-status-badge transition-all duration-300 ${stepStatus.status} ${
                                                    isHovered ? 'scale-110' : ''
                                                }`}>
                                                    {stepStatus.emoji} {stepStatus.status.toUpperCase().replace('-', ' ')}
                                                </span>
                                                
                                                <button
                                                    className="glass-effect px-3 py-1 rounded-lg text-xs text-white hover:bg-white/20 transition-all duration-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStepClick(step);
                                                    }}
                                                >
                                                    Analyze
                                                </button>
                                                
                                                {step.drop_off_rate > 30 && (
                                                    <span className="text-red-300 animate-pulse text-sm flex items-center gap-1">
                                                        ⚠️ Critical
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Enhanced Funnel Performance Summary */}
            <div className="funnel-performance-summary mt-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="animate-spin-slow">📈</span>
                    Funnel Performance Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="funnel-metric-item glass-effect p-4 rounded-xl hover-lift">
                        <span className="text-secondary">Total Drop-off Rate:</span>
                        <span className={`ml-2 font-bold text-2xl ${
                            (100 - funnelData[funnelData.length - 1].cumulativeConversionRate) > 50 ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                            {(100 - funnelData[funnelData.length - 1].cumulativeConversionRate).toFixed(1)}%
                        </span>
                    </div>
                    <div className="funnel-metric-item glass-effect p-4 rounded-xl hover-lift">
                        <span className="text-secondary">Average Step Conversion:</span>
                        <span className="ml-2 font-bold text-2xl text-blue-300">
                            {(data.reduce((acc, step) => acc + (100 - step.drop_off_rate), 0) / data.length).toFixed(1)}%
                        </span>
                    </div>
                    <div className="funnel-metric-item glass-effect p-4 rounded-xl hover-lift">
                        <span className="text-secondary">Biggest Drop-off Step:</span>
                        <span className="ml-2 font-bold text-red-300 capitalize">
                            {data.reduce((max, step) => step.drop_off_rate > max.drop_off_rate ? step : max).step.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <div className="funnel-metric-item glass-effect p-4 rounded-xl hover-lift">
                        <span className="text-secondary">Best Performing Step:</span>
                        <span className="ml-2 font-bold text-green-300 capitalize">
                            {data.reduce((min, step) => step.drop_off_rate < min.drop_off_rate ? step : min).step.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Step Details Modal */}
            {selectedStep && showDetails && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white capitalize">
                                    {selectedStep.step.replace(/_/g, ' ')} Analysis
                                </h3>
                                <p className="text-secondary">Step {selectedStep.position} detailed breakdown</p>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="glass-effect p-2 rounded-lg text-white hover:bg-white/20 transition-all"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-3xl font-bold text-blue-300">
                                        {selectedStep.usersEntering.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-secondary">Users Entering Step</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-300">
                                        {selectedStep.usersConverting.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-secondary">Users Converting</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-red-300">
                                        {selectedStep.usersDropping.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-secondary">Users Dropping Off</div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold text-purple-300">
                                        {selectedStep.stepConversionRate.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-secondary">Step Conversion Rate</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-300">
                                        {selectedStep.drop_off_rate.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-secondary">Drop-off Rate</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-cyan-300">
                                        {selectedStep.cumulativeConversionRate.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-secondary">Cumulative Conversion</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-white/5 rounded-xl">
                            <h4 className="font-semibold text-white mb-2">Recommendations</h4>
                            <ul className="text-sm text-secondary space-y-1">
                                {selectedStep.drop_off_rate > 30 ? (
                                    <>
                                        <li>• This step has a critical drop-off rate</li>
                                        <li>• Consider simplifying the user interface</li>
                                        <li>• Review user feedback for this step</li>
                                        <li>• Consider A/B testing alternatives</li>
                                    </>
                                ) : selectedStep.drop_off_rate > 15 ? (
                                    <>
                                        <li>• This step has moderate drop-off</li>
                                        <li>• Monitor user behavior patterns</li>
                                        <li>• Consider minor UX improvements</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• This step is performing well</li>
                                        <li>• Maintain current approach</li>
                                        <li>• Use as template for other steps</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FunnelChart;
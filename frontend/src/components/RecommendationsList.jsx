import React from 'react';
import './RecommendationsList.css';

function RecommendationsList({ data }) {
    if (!data || !data.length) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">💡 Improvement Recommendations</h2>
                <p className="text-white/70 text-center">No data available</p>
            </div>
        );
    }

    const generateRecommendations = (analysisData) => {
        const recommendations = [];
        
        analysisData.forEach((step, index) => {
            if (step.drop_off_rate > 30) {
                recommendations.push({
                    priority: 'high',
                    step: step.step,
                    icon: '🚨',
                    message: `Critical: ${step.step.replace(/_/g, ' ')} has a ${step.drop_off_rate.toFixed(1)}% drop-off rate. Consider simplifying this step or adding guidance.`,
                    action: 'Immediate optimization required',
                    urgency: 'URGENT'
                });
            } else if (step.drop_off_rate > 15) {
                recommendations.push({
                    priority: 'medium',
                    step: step.step,
                    icon: '⚠️',
                    message: `${step.step.replace(/_/g, ' ')} has a ${step.drop_off_rate.toFixed(1)}% drop-off rate. Could benefit from UX improvements.`,
                    action: 'Consider A/B testing improvements',
                    urgency: 'MODERATE'
                });
            }
        });

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                step: 'overall',
                icon: '✅',
                message: 'Excellent performance! All funnel steps have healthy drop-off rates.',
                action: 'Monitor and maintain current performance',
                urgency: 'MAINTENANCE'
            });
        }

        return recommendations;
    };

    const recommendations = generateRecommendations(data);

    return (
        <div className="recommendations-container p-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                <span className="text-4xl">💡</span>
                Improvement Recommendations
            </h2>
            
            {/* Recommendations Table */}
            <div className="recommendations-table-wrapper overflow-hidden rounded-2xl border border-white/20 mb-8">
                <div className="overflow-x-auto">
                    <table className="recommendations-table min-w-full">
                        <thead>
                            <tr className="bg-white/10 backdrop-blur-sm">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span>🎯</span>
                                        Priority
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span>📍</span>
                                        Step
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span>💬</span>
                                        Recommendation
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-white/90 uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>⚡</span>
                                        Action Required
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {recommendations.map((rec, index) => (
                                <tr key={index} className="bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`recommendation-icon ${rec.priority}-priority w-10 h-10 rounded-xl flex items-center justify-center text-lg`}>
                                                {rec.icon}
                                            </div>
                                            <div>
                                                <span className={`priority-badge ${
                                                    rec.priority === 'high' ? 'urgent' : 
                                                    rec.priority === 'medium' ? 'moderate' : 'maintenance'
                                                } text-xs font-bold px-3 py-1 rounded-full`}>
                                                    {rec.urgency}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        {rec.step !== 'overall' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                    {data.findIndex(s => s.step === rec.step) + 1}
                                                </div>
                                                <span className="font-medium text-white capitalize">
                                                    {rec.step.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-white/70 italic">Overall Assessment</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="max-w-md">
                                            <p className="text-white leading-relaxed">
                                                {rec.message}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`recommendation-action ${rec.priority}-priority inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm`}>
                                            <span>🎯</span>
                                            {rec.action}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Summary Stats Table */}
            <div className="summary-stats-wrapper overflow-hidden rounded-2xl border border-white/20">
                <div className="bg-white/10 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>📊</span>
                        Summary Statistics
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="summary-stats-table min-w-full">
                        <tbody>
                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                <td className="px-6 py-4 font-semibold text-white">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📈</span>
                                        Steps Analyzed
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="stat-value text-2xl font-bold gradient-text">
                                        {data.length}
                                    </div>
                                </td>
                            </tr>
                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                <td className="px-6 py-4 font-semibold text-white">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        Action Items Required
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-2xl font-bold text-yellow-300">
                                        {recommendations.filter(r => r.priority === 'high' || r.priority === 'medium').length}
                                    </div>
                                </td>
                            </tr>
                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                <td className="px-6 py-4 font-semibold text-white">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">💯</span>
                                        Average Retention Rate
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-2xl font-bold text-green-300">
                                        {(100 - data.reduce((acc, step) => acc + step.drop_off_rate, 0) / data.length).toFixed(1)}%
                                    </div>
                                </td>
                            </tr>
                            <tr className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                <td className="px-6 py-4 font-semibold text-white">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🚨</span>
                                        Critical Issues
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-2xl font-bold text-red-300">
                                        {recommendations.filter(r => r.priority === 'high').length}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default RecommendationsList;
import React from 'react';
import './DropOffTable.css';

function DropOffTable({ data }) {
    if (!data || !data.length) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">📋 Drop-off Analysis</h2>
                <p className="text-white/70 text-center">No data available</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                <span className="text-4xl">📋</span>
                Drop-off Analysis
            </h2>
            <div className="dropoff-table-wrapper overflow-hidden rounded-2xl border border-white/20">
                <div className="overflow-x-auto">
                    <table className="dropoff-table min-w-full">
                        <tbody className="divide-y divide-white/10">
                            {data.map((step, index) => (
                                <tr key={index} className="bg-white/5 hover:bg-white/10 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="dropoff-step-info">
                                            <div className="dropoff-step-number">
                                                {index + 1}
                                            </div>
                                            <span className="dropoff-step-name">
                                                {step.step.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="dropoff-rate-display">
                                            <span className={`dropoff-rate-number ${
                                                step.drop_off_rate > 30 ? 'high' :
                                                step.drop_off_rate > 15 ? 'medium' : 'low'
                                            }`}>
                                                {step.drop_off_rate.toFixed(1)}%
                                            </span>
                                            <div className="dropoff-mini-progress">
                                                <div 
                                                    className={`dropoff-mini-fill ${
                                                        step.drop_off_rate > 30 ? 'high' :
                                                        step.drop_off_rate > 15 ? 'medium' : 'low'
                                                    }`}
                                                    style={{ width: `${Math.min(step.drop_off_rate * 2, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`dropoff-priority-badge ${
                                                step.drop_off_rate > 30 ? 'high-risk' : 
                                                step.drop_off_rate > 15 ? 'moderate' : 'healthy'
                                            }`}>
                                                {step.drop_off_rate > 30 ? '🔴 High' : step.drop_off_rate > 15 ? '🟡 Medium' : '🟢 Low'}
                                            </span>
                                            {step.drop_off_rate > 30 && (
                                                <span className="dropoff-warning-pulse">⚠️</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DropOffTable;
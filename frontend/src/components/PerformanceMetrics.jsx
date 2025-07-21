import React, { useState, useEffect } from 'react';
import { Clock, Zap, Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ funnelData, theme }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (funnelData && funnelData.analysis) {
      calculateMetrics();
    }
  }, [funnelData]);

  const calculateMetrics = () => {
    const analysis = funnelData.analysis;
    if (!analysis || analysis.length === 0) return;

    // Calculate performance metrics
    const totalSteps = analysis.length;
    const avgConversion = analysis.reduce((acc, step) => acc + step.conversion_rate, 0) / totalSteps;
    const avgDropOff = analysis.reduce((acc, step) => acc + step.drop_off_rate, 0) / totalSteps;
    
    // Find bottlenecks (steps with >30% drop-off)
    const bottlenecks = analysis.filter(step => step.drop_off_rate > 30);
    const healthySteps = analysis.filter(step => step.drop_off_rate <= 15);
    
    // Calculate efficiency score (0-100)
    const efficiencyScore = Math.max(0, 100 - (avgDropOff * 2));
    
    // Time-based analysis (simulated)
    const estimatedCompletionTime = totalSteps * 45; // 45 seconds per step average
    
    // Performance grade
    let grade = 'A';
    if (efficiencyScore < 80) grade = 'B';
    if (efficiencyScore < 60) grade = 'C';
    if (efficiencyScore < 40) grade = 'D';
    if (efficiencyScore < 20) grade = 'F';

    // Calculate additional metrics for KPI section
    const totalUsers = analysis[0]?.users_at_step || 1000; // Use first step users or default
    const completedUsers = Math.round(totalUsers * (avgConversion / 100));
    const overallConversionRate = (completedUsers / totalUsers) * 100;
    
    // Find biggest drop-off step
    const biggestDropOffStep = analysis.reduce((max, step) => 
      step.drop_off_rate > max.drop_off_rate ? step : max, analysis[0] || {}
    );
    
    const biggestDropOff = {
      step: biggestDropOffStep.step_name || 'Unknown Step',
      percentage: biggestDropOffStep.drop_off_rate || 0,
      users: Math.round((biggestDropOffStep.drop_off_rate || 0) * totalUsers / 100)
    };

    const avgTimePerStep = Math.round(estimatedCompletionTime / totalSteps / 60); // minutes per step

    setMetrics({
      totalSteps,
      avgConversion: avgConversion.toFixed(1),
      avgDropOff: avgDropOff.toFixed(1),
      bottlenecks: bottlenecks.length,
      healthySteps: healthySteps.length,
      efficiencyScore: efficiencyScore.toFixed(0),
      estimatedTime: Math.round(estimatedCompletionTime / 60), // in minutes
      grade,
      totalUsers,
      completedUsers,
      overallConversionRate,
      biggestDropOff,
      avgTimePerStep,
      recommendations: generateRecommendations(bottlenecks, efficiencyScore)
    });
    
    setLoading(false);
  };

  const generateRecommendations = (bottlenecks, score) => {
    const recs = [];
    
    if (bottlenecks.length > 2) {
      recs.push({
        type: 'critical',
        title: 'Multiple Bottlenecks Detected',
        description: `${bottlenecks.length} steps have high drop-off rates. Focus on the first bottleneck first.`,
        action: 'Review user feedback and simplify complex steps'
      });
    }
    
    if (score < 50) {
      recs.push({
        type: 'warning',
        title: 'Low Efficiency Score',
        description: 'Overall funnel performance needs improvement',
        action: 'Consider A/B testing different onboarding flows'
      });
    }
    
    if (bottlenecks.length === 0 && score > 80) {
      recs.push({
        type: 'success',
        title: 'Excellent Performance',
        description: 'Your funnel is performing well with minimal drop-offs',
        action: 'Monitor for any seasonal changes and maintain current approach'
      });
    }
    
    return recs;
  };

  if (loading || !metrics) {
    return (
      <div className="glass-effect rounded-3xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Efficiency Score',
      value: `${metrics.efficiencyScore}%`,
      subtitle: `Grade: ${metrics.grade}`,
      icon: <Zap className="w-5 h-5" />,
      color: metrics.efficiencyScore > 70 ? 'from-green-500 to-emerald-500' : 
             metrics.efficiencyScore > 40 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-500'
    },
    {
      title: 'Avg Conversion',
      value: `${metrics.avgConversion}%`,
      subtitle: 'Per step',
      icon: <Target className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Est. Time',
      value: `${metrics.estimatedTime}m`,
      subtitle: 'To complete',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Health Status',
      value: `${metrics.healthySteps}/${metrics.totalSteps}`,
      subtitle: 'Healthy steps',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold gradient-text mb-2">⚡ Performance Metrics</h2>
            <p className="text-secondary">Real-time funnel health and efficiency analysis</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-2xl font-bold ${
            metrics.grade === 'A' ? 'bg-green-500' :
            metrics.grade === 'B' ? 'bg-blue-500' :
            metrics.grade === 'C' ? 'bg-yellow-500' :
            metrics.grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
          } text-white`}>
            {metrics.grade}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((metric, index) => (
            <div key={index} className="glass-effect rounded-2xl p-6 hover-lift transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} text-white`}>
                  {metric.icon}
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                <p className="text-secondary text-sm">{metric.title}</p>
                <p className="text-accent-primary text-xs mt-1">{metric.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Insights */}
        <div className="border-t border-white/20 pt-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Performance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="glass-effect rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Bottlenecks Detected</span>
                  <span className={`font-bold ${metrics.bottlenecks > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.bottlenecks}
                  </span>
                </div>
              </div>
              
              <div className="glass-effect rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Average Drop-off</span>
                  <span className={`font-bold ${parseFloat(metrics.avgDropOff) > 25 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.avgDropOff}%
                  </span>
                </div>
              </div>
              
              <div className="glass-effect rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Completion Rate</span>
                  <span className="font-bold text-blue-400">
                    {(100 - parseFloat(metrics.avgDropOff)).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              {metrics.recommendations.map((rec, index) => (
                <div key={index} className={`glass-effect rounded-xl p-4 border-l-4 ${
                  rec.type === 'critical' ? 'border-red-500' :
                  rec.type === 'warning' ? 'border-yellow-500' : 'border-green-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      rec.type === 'critical' ? 'bg-red-500' :
                      rec.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    } text-white`}>
                      {rec.type === 'critical' ? '!' : rec.type === 'warning' ? '?' : '✓'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{rec.title}</h4>
                      <p className="text-sm text-secondary mb-2">{rec.description}</p>
                      <p className="text-xs text-accent-primary font-medium">{rec.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New KPI Metrics Section */}
      <div className="performance-metrics glass-effect rounded-3xl p-8">
        <h2 className="text-3xl font-bold gradient-text mb-6">📊 KPI Metrics Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="metric-header">
              <Users className="metric-icon blue" size={24} />
              <div className="metric-info">
                <h3>Total Users</h3>
                <div className="metric-value">{metrics.totalSteps.toLocaleString()}</div>
                <div className="metric-subtitle">Started onboarding</div>
              </div>
              <div className="trend positive">
                <TrendingUp size={16} />
                <span>5.2%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <Target className="metric-icon green" size={24} />
              <div className="metric-info">
                <h3>Completion Rate</h3>
                <div className="metric-value">{`${metrics.overallConversionRate.toFixed(1)}%`}</div>
                <div className="metric-subtitle">{`${metrics.completedUsers} completed`}</div>
              </div>
              <div className="trend negative">
                <TrendingDown size={16} />
                <span>-2.1%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <AlertCircle className="metric-icon red" size={24} />
              <div className="metric-info">
                <h3>Biggest Drop-off</h3>
                <div className="metric-value">{`${metrics.biggestDropOff.percentage.toFixed(1)}%`}</div>
                <div className="metric-subtitle">{metrics.biggestDropOff.step}</div>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <Clock className="metric-icon purple" size={24} />
              <div className="metric-info">
                <h3>Avg. Time per Step</h3>
                <div className="metric-value">{`${metrics.avgTimePerStep} min`}</div>
                <div className="metric-subtitle">Time to complete</div>
              </div>
              <div className="trend negative">
                <TrendingDown size={16} />
                <span>-1.3%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="insights-section mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Key Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <AlertCircle className="insight-icon warning" size={16} />
              <span>
                The biggest drop-off occurs at <strong>{metrics.biggestDropOff.step}</strong> 
                ({metrics.biggestDropOff.users} users, {metrics.biggestDropOff.percentage.toFixed(1)}%)
              </span>
            </div>
            
            <div className="insight-item">
              <Target className="insight-icon success" size={16} />
              <span>
                Overall conversion rate of <strong>{metrics.overallConversionRate.toFixed(1)}%</strong> 
                {metrics.overallConversionRate > 70 ? ' is excellent!' : metrics.overallConversionRate > 50 ? ' is good.' : ' needs improvement.'}
              </span>
            </div>
            
            <div className="insight-item">
              <Users className="insight-icon info" size={16} />
              <span>
                <strong>{metrics.totalSteps - metrics.completedUsers}</strong> users dropped off during onboarding
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
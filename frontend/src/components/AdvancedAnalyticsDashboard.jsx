import React, { useState, useEffect } from 'react';
import './AdvancedAnalyticsDashboard.css';

const AdvancedAnalyticsDashboard = ({ funnelData, onRefresh }) => {
  const [activeView, setActiveView] = useState('segments');
  const [analyticsData, setAnalyticsData] = useState({
    segments: [],
    cohorts: [],
    sessionReplays: [],
    predictiveInsights: {},
    comprehensiveReport: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const views = [
    { id: 'segments', name: 'User Segments', icon: '👥', description: 'ML-powered behavior clustering' },
    { id: 'cohorts', name: 'Cohort Analysis', icon: '📈', description: 'Retention & conversion tracking' },
    { id: 'replays', name: 'Session Replays', icon: '🎬', description: 'Drop-off user journeys' },
    { id: 'predictive', name: 'Predictive Insights', icon: '🔮', description: 'AI-powered forecasting' },
    { id: 'comprehensive', name: 'Full Report', icon: '📊', description: 'Complete analytics suite' }
  ];

  useEffect(() => {
    fetchAnalyticsData(activeView);
  }, [activeView]);

  const fetchAnalyticsData = async (viewType) => {
    if (!funnelData?.funnel_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://127.0.0.1:8000';
      let endpoint = '';
      
      switch (viewType) {
        case 'segments':
          endpoint = `/analytics/segments/${funnelData.funnel_id}`;
          break;
        case 'cohorts':
          endpoint = `/analytics/cohorts/${funnelData.funnel_id}`;
          break;
        case 'replays':
          endpoint = `/analytics/session-replays/${funnelData.funnel_id}`;
          break;
        case 'predictive':
          endpoint = `/analytics/predictive-insights/${funnelData.funnel_id}`;
          break;
        case 'comprehensive':
          endpoint = `/analytics/comprehensive-report/${funnelData.funnel_id}`;
          break;
        default:
          return;
      }
      
      const response = await fetch(`${apiUrl}${endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalyticsData(prev => ({
          ...prev,
          [viewType === 'comprehensive' ? 'comprehensiveReport' : viewType]: data
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${viewType} data:`, err);
    } finally {
      setLoading(false);
    }
  };

  const renderUserSegments = () => {
    const segments = analyticsData.segments?.segments || [];
    
    return (
      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title">🧠 Behavior-Based User Segments</h3>
          <p className="section-subtitle">ML-powered clustering reveals distinct user patterns</p>
        </div>
        
        <div className="segments-grid">
          {segments.map((segment, index) => (
            <div key={segment.segment_id} className="segment-card glass-morphism">
              <div className="segment-header">
                <div className="segment-badge">{index + 1}</div>
                <h4 className="segment-name">{segment.name}</h4>
              </div>
              
              <div className="segment-metrics">
                <div className="metric">
                  <span className="metric-label">Users</span>
                  <span className="metric-value">{segment.user_count.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Conversion</span>
                  <span className={`metric-value ${segment.conversion_rate > 0.6 ? 'success' : segment.conversion_rate > 0.3 ? 'warning' : 'danger'}`}>
                    {(segment.conversion_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Time to Convert</span>
                  <span className="metric-value">{segment.avg_time_to_convert.toFixed(1)}h</span>
                </div>
              </div>
              
              <div className="segment-description">
                <p>{segment.description}</p>
              </div>
              
              <div className="drop-off-patterns">
                <h5>Common Drop-off Points:</h5>
                <div className="pattern-tags">
                  {segment.drop_off_patterns.map((pattern, idx) => (
                    <span key={idx} className="pattern-tag">{pattern}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {segments.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h4>No Segments Available</h4>
            <p>Insufficient data for behavior segmentation. Need at least 10 users for clustering.</p>
          </div>
        )}
      </div>
    );
  };

  const renderCohortAnalysis = () => {
    const cohorts = analyticsData.cohorts?.cohorts || [];
    
    return (
      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title">📈 Cohort Retention Analysis</h3>
          <p className="section-subtitle">Track user retention and conversion over time</p>
        </div>
        
        <div className="cohort-table-container">
          <table className="cohort-table">
            <thead>
              <tr>
                <th>Cohort Month</th>
                <th>Initial Size</th>
                <th>Week 1</th>
                <th>Week 2</th>
                <th>Month 1</th>
                <th>Month 3</th>
                <th>Month 6</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort, index) => (
                <tr key={index}>
                  <td className="cohort-date">{cohort.cohort_date}</td>
                  <td className="cohort-size">{cohort.cohort_size.toLocaleString()}</td>
                  <td className="retention-cell">
                    <div className="retention-bar">
                      <div 
                        className="retention-fill"
                        style={{ width: `${(cohort.retention_rates?.week_1 || 0) * 100}%` }}
                      ></div>
                      <span>{((cohort.retention_rates?.week_1 || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="retention-cell">
                    <div className="retention-bar">
                      <div 
                        className="retention-fill"
                        style={{ width: `${(cohort.retention_rates?.week_2 || 0) * 100}%` }}
                      ></div>
                      <span>{((cohort.retention_rates?.week_2 || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="retention-cell">
                    <div className="retention-bar">
                      <div 
                        className="retention-fill"
                        style={{ width: `${(cohort.retention_rates?.month_1 || 0) * 100}%` }}
                      ></div>
                      <span>{((cohort.retention_rates?.month_1 || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="retention-cell">
                    <div className="retention-bar">
                      <div 
                        className="retention-fill"
                        style={{ width: `${(cohort.retention_rates?.month_3 || 0) * 100}%` }}
                      ></div>
                      <span>{((cohort.retention_rates?.month_3 || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="retention-cell">
                    <div className="retention-bar">
                      <div 
                        className="retention-fill"
                        style={{ width: `${(cohort.retention_rates?.month_6 || 0) * 100}%` }}
                      ></div>
                      <span>{((cohort.retention_rates?.month_6 || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {cohorts.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h4>No Cohort Data Available</h4>
            <p>Insufficient historical data for cohort analysis. Need at least 2 months of user data.</p>
          </div>
        )}
      </div>
    );
  };

  const renderSessionReplays = () => {
    const replays = analyticsData.replays?.sessions || [];
    
    return (
      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title">🎬 Session Replays - Drop-off Analysis</h3>
          <p className="section-subtitle">Analyze user journeys that ended in drop-offs</p>
        </div>
        
        <div className="replays-list">
          {replays.map((replay, index) => (
            <div key={replay.session_id} className="replay-card glass-morphism">
              <div className="replay-header">
                <div className="replay-info">
                  <span className="session-id">Session {index + 1}</span>
                  <span className="user-id">User: {replay.user_id.substring(0, 8)}...</span>
                  <span className="device-type">{replay.device_type}</span>
                </div>
                <div className="replay-status">
                  <span className={`status-badge ${replay.conversion_status}`}>
                    {replay.conversion_status}
                  </span>
                  <span className="duration">{Math.floor(replay.duration / 60)}m {replay.duration % 60}s</span>
                </div>
              </div>
              
              <div className="replay-timeline">
                <div className="timeline-header">
                  <h5>User Journey Timeline</h5>
                  {replay.drop_off_point && (
                    <span className="drop-off-point">Dropped at: {replay.drop_off_point}</span>
                  )}
                </div>
                
                <div className="event-timeline">
                  {replay.events.slice(0, 5).map((event, idx) => (
                    <div key={idx} className="timeline-event">
                      <div className="event-dot"></div>
                      <div className="event-details">
                        <span className="event-name">{event.event}</span>
                        <span className="event-time">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {replay.events.length > 5 && (
                    <div className="timeline-event">
                      <div className="event-dot more"></div>
                      <span className="more-events">+{replay.events.length - 5} more events</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {replays.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h4>No Session Replays Available</h4>
            <p>No dropped user sessions found for analysis.</p>
          </div>
        )}
      </div>
    );
  };

  const renderPredictiveInsights = () => {
    const insights = analyticsData.predictive?.predictive_insights || {};
    
    return (
      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title">🔮 AI-Powered Predictive Insights</h3>
          <p className="section-subtitle">Machine learning forecasts and optimization opportunities</p>
        </div>
        
        <div className="insights-grid">
          {/* Churn Prediction */}
          <div className="insight-card glass-morphism">
            <h4>🚨 Churn Risk Analysis</h4>
            <div className="churn-risks">
              {Object.entries(insights.churn_prediction || {}).map(([segmentId, risk]) => (
                <div key={segmentId} className="risk-item">
                  <span className="segment-name">{segmentId.replace('_', ' ')}</span>
                  <div className="risk-bar">
                    <div 
                      className={`risk-fill ${risk > 0.7 ? 'high' : risk > 0.4 ? 'medium' : 'low'}`}
                      style={{ width: `${risk * 100}%` }}
                    ></div>
                    <span className="risk-value">{(risk * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Forecast */}
          <div className="insight-card glass-morphism">
            <h4>📈 Conversion Forecast</h4>
            <div className="forecast-metrics">
              <div className="forecast-item">
                <span className="forecast-label">Next Week</span>
                <span className="forecast-value">{insights.conversion_forecast?.next_week || 0} conversions</span>
              </div>
              <div className="forecast-item">
                <span className="forecast-label">Next Month</span>
                <span className="forecast-value">{insights.conversion_forecast?.next_month || 0} conversions</span>
              </div>
              <div className="forecast-item">
                <span className="forecast-label">Confidence</span>
                <span className="forecast-value">{((insights.conversion_forecast?.confidence || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="forecast-item">
                <span className="forecast-label">Trend</span>
                <span className={`forecast-value ${insights.conversion_forecast?.trend || 'stable'}`}>
                  {insights.conversion_forecast?.trend || 'stable'}
                </span>
              </div>
            </div>
          </div>

          {/* Optimization Opportunities */}
          <div className="insight-card glass-morphism full-width">
            <h4>⚡ Optimization Opportunities</h4>
            <div className="opportunities-list">
              {(insights.optimization_opportunities || []).map((opp, index) => (
                <div key={index} className="opportunity-item">
                  <div className="opportunity-header">
                    <span className="segment-name">{opp.segment}</span>
                    <span className={`priority-badge ${opp.priority}`}>{opp.priority} priority</span>
                  </div>
                  <p className="opportunity-description">{opp.opportunity}</p>
                  <div className="potential-impact">{opp.potential_impact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonality Patterns */}
          <div className="insight-card glass-morphism">
            <h4>📅 Seasonality Patterns</h4>
            <div className="seasonality-data">
              <div className="pattern-item">
                <span className="pattern-label">Peak Hours</span>
                <div className="hour-tags">
                  {(insights.seasonality_patterns?.peak_hours || []).map(hour => (
                    <span key={hour} className="hour-tag">{hour}:00</span>
                  ))}
                </div>
              </div>
              <div className="pattern-item">
                <span className="pattern-label">Peak Days</span>
                <div className="day-tags">
                  {(insights.seasonality_patterns?.peak_days || []).map(day => (
                    <span key={day} className="day-tag">{day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Competitive Benchmarks */}
          <div className="insight-card glass-morphism">
            <h4>🏆 Industry Benchmarks</h4>
            <div className="benchmark-metrics">
              {Object.entries(insights.competitive_benchmarks || {}).map(([key, value]) => (
                <div key={key} className="benchmark-item">
                  <span className="benchmark-label">{key.replace(/_/g, ' ')}</span>
                  <span className="benchmark-value">
                    {typeof value === 'number' ? 
                      (key.includes('rate') ? `${(value * 100).toFixed(1)}%` : value.toFixed(1)) : 
                      value
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComprehensiveReport = () => {
    const report = analyticsData.comprehensiveReport?.comprehensive_report;
    if (!report) return null;

    return (
      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title">📊 Comprehensive Analytics Report</h3>
          <p className="section-subtitle">Complete overview of all analytics insights</p>
        </div>
        
        <div className="report-summary glass-morphism">
          <h4>Executive Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">{report.summary.total_users_analyzed.toLocaleString()}</span>
              <span className="summary-label">Total Users Analyzed</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{(report.summary.average_conversion_rate * 100).toFixed(1)}%</span>
              <span className="summary-label">Average Conversion Rate</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{report.summary.high_risk_segments}</span>
              <span className="summary-label">High Risk Segments</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{report.summary.optimization_opportunities}</span>
              <span className="summary-label">Optimization Opportunities</span>
            </div>
          </div>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h5>User Segments ({report.user_segments.total_segments})</h5>
            <div className="mini-segments">
              {report.user_segments.segments.slice(0, 3).map((segment, idx) => (
                <div key={idx} className="mini-segment">
                  <span className="segment-name">{segment.name}</span>
                  <span className="segment-conversion">{(segment.conversion_rate * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h5>Cohort Analysis ({report.cohort_analysis.total_cohorts} cohorts)</h5>
            <div className="mini-cohorts">
              {report.cohort_analysis.cohorts.slice(0, 3).map((cohort, idx) => (
                <div key={idx} className="mini-cohort">
                  <span className="cohort-date">{cohort.cohort_date}</span>
                  <span className="cohort-size">{cohort.cohort_size} users</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h5>Session Analysis ({report.session_replays.total_sessions} sessions)</h5>
            <p className="section-note">Analyzed dropped user sessions for optimization insights</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="advanced-analytics-dashboard">
      {/* Navigation */}
      <div className="analytics-nav glass-morphism">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`nav-item ${activeView === view.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{view.icon}</span>
            <div className="nav-content">
              <span className="nav-name">{view.name}</span>
              <span className="nav-description">{view.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state glass-morphism">
          <div className="loading-spinner"></div>
          <p>Analyzing data with ML algorithms...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state glass-morphism">
          <div className="error-icon">⚠️</div>
          <h4>Analytics Error</h4>
          <p>{error}</p>
          <button onClick={() => fetchAnalyticsData(activeView)} className="retry-button">
            🔄 Retry Analysis
          </button>
        </div>
      )}

      {/* Content */}
      <div className="analytics-content">
        {!loading && !error && (
          <>
            {activeView === 'segments' && renderUserSegments()}
            {activeView === 'cohorts' && renderCohortAnalysis()}
            {activeView === 'replays' && renderSessionReplays()}
            {activeView === 'predictive' && renderPredictiveInsights()}
            {activeView === 'comprehensive' && renderComprehensiveReport()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
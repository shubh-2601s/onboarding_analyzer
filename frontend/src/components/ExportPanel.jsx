import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ExportPanel = ({ funnelData }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('json');

  const exportFormats = [
    { id: 'json', name: 'JSON Data', icon: '📄', desc: 'Raw data format' },
    { id: 'csv', name: 'CSV Table', icon: '📊', desc: 'Spreadsheet format' },
    { id: 'report', name: 'HTML Report', icon: '📋', desc: 'Visual report' },
    { id: 'png', name: 'Chart Image', icon: '🖼️', desc: 'PNG screenshot' }
  ];

  const exportData = async (format) => {
    setIsExporting(true);
    
    try {
      let content, filename, mimeType;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(funnelData, null, 2);
          filename = `funnel-data-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          const csvHeaders = ['Step', 'Users', 'Drop-off Rate (%)', 'Conversion Rate (%)'];
          const csvRows = funnelData.analysis.map(step => [
            step.step.replace(/_/g, ' '),
            step.count,
            step.drop_off_rate.toFixed(2),
            step.conversion_rate.toFixed(2)
          ]);
          content = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
          filename = `funnel-analysis-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'report':
          content = generateHTMLReport(funnelData);
          filename = `funnel-report-${new Date().toISOString().split('T')[0]}.html`;
          mimeType = 'text/html';
          break;
          
        case 'png':
          // For now, we'll just export the data as JSON and notify about the PNG feature
          toast.info('PNG export coming soon! For now, use browser screenshot tools.');
          return;
          
        default:
          throw new Error('Unsupported format');
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} exported successfully!`);
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateHTMLReport = (data) => {
    const totalUsers = data.total_users || 0;
    const finalConversion = data.final_conversion_rate || 0;
    const date = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Funnel Analysis Report - ${date}</title>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
        .title { color: #1F2937; font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #6B7280; font-size: 1.2em; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .kpi-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; }
        .kpi-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .kpi-label { font-size: 0.9em; opacity: 0.9; }
        .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .table th, .table td { padding: 15px; text-align: left; border-bottom: 1px solid #E5E7EB; }
        .table th { background: #F9FAFB; font-weight: bold; color: #374151; }
        .table tr:hover { background: #F9FAFB; }
        .status-healthy { color: #059669; font-weight: bold; }
        .status-moderate { color: #D97706; font-weight: bold; }
        .status-critical { color: #DC2626; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">📊 Onboarding Funnel Analysis</h1>
            <p class="subtitle">Generated on ${date}</p>
        </div>
        
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${totalUsers.toLocaleString()}</div>
                <div class="kpi-label">Total Users</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${finalConversion}%</div>
                <div class="kpi-label">Final Conversion</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.analysis.length}</div>
                <div class="kpi-label">Funnel Steps</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.analysis.filter(s => s.drop_off_rate > 30).length}</div>
                <div class="kpi-label">Critical Issues</div>
            </div>
        </div>
        
        <h2>📈 Detailed Step Analysis</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Step Name</th>
                    <th>Users</th>
                    <th>Drop-off Rate</th>
                    <th>Conversion Rate</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.analysis.map(step => `
                    <tr>
                        <td><strong>${step.step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></td>
                        <td>${step.count.toLocaleString()}</td>
                        <td>${step.drop_off_rate.toFixed(2)}%</td>
                        <td>${step.conversion_rate.toFixed(2)}%</td>
                        <td class="${step.drop_off_rate > 30 ? 'status-critical' : step.drop_off_rate > 15 ? 'status-moderate' : 'status-healthy'}">
                            ${step.drop_off_rate > 30 ? '🔴 Critical' : step.drop_off_rate > 15 ? '🟡 Moderate' : '🟢 Healthy'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="footer">
            <p>This report was generated by the Onboarding Analyzer dashboard</p>
            <p>Data source: PostHog Analytics</p>
        </div>
    </div>
</body>
</html>`;
  };

  const shareToClipboard = async () => {
    try {
      const shareData = {
        totalUsers: funnelData.total_users || 0,
        finalConversion: funnelData.final_conversion_rate || 0,
        criticalSteps: funnelData.analysis.filter(s => s.drop_off_rate > 30).length,
        date: new Date().toLocaleDateString()
      };
      
      const shareText = `🚀 Funnel Analysis Summary\n📊 Total Users: ${shareData.totalUsers.toLocaleString()}\n✅ Final Conversion: ${shareData.finalConversion}%\n⚠️ Critical Steps: ${shareData.criticalSteps}\n📅 Date: ${shareData.date}`;
      
      await navigator.clipboard.writeText(shareText);
      toast.success('Summary copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!funnelData || !funnelData.analysis) {
    return (
      <div className="glass-effect rounded-3xl p-8 text-center">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-white mb-2">Export Not Available</h3>
        <p className="text-secondary">No data to export yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-3xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">📤 Export & Share</h2>
          <p className="text-secondary">Download your funnel analysis in various formats</p>
        </div>

        {/* Export Formats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {exportFormats.map((format) => (
            <div
              key={format.id}
              className={`glass-effect rounded-2xl p-6 cursor-pointer transition-all duration-300 hover-lift ${
                exportType === format.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setExportType(format.id)}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {format.icon}
              </div>
              <h3 className="text-lg font-semibold text-white text-center mb-2">{format.name}</h3>
              <p className="text-sm text-secondary text-center">{format.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => exportData(exportType)}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              isExporting
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover-lift'
            } text-white`}
          >
            <span className={`text-xl ${isExporting ? 'animate-pulse' : ''}`}>📥</span>
            {isExporting ? 'Exporting...' : `Export as ${exportType.toUpperCase()}`}
          </button>
          
          <button
            onClick={shareToClipboard}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold glass-effect hover:bg-white/10 transition-all duration-300 text-white hover-lift"
          >
            <span className="text-xl">📋</span>
            Copy Summary
          </button>
        </div>

        {/* Export Preview */}
        <div className="mt-8 p-6 glass-effect rounded-2xl">
          <h4 className="text-lg font-semibold text-white mb-4">📋 Export Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-secondary">Total Steps:</span>
              <div className="font-bold text-white">{funnelData.analysis.length}</div>
            </div>
            <div>
              <span className="text-secondary">File Size:</span>
              <div className="font-bold text-white">
                {exportType === 'json' ? '~2KB' : exportType === 'csv' ? '~1KB' : exportType === 'report' ? '~15KB' : '~500KB'}
              </div>
            </div>
            <div>
              <span className="text-secondary">Format:</span>
              <div className="font-bold text-white uppercase">{exportType}</div>
            </div>
            <div>
              <span className="text-secondary">Date:</span>
              <div className="font-bold text-white">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
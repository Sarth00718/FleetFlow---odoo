import React, { useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import ReportExporter from './ReportExporter';
import './Analytics.css';

function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="analytics-module">
      <div className="analytics-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Analytics Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'exporter' ? 'active' : ''}`}
          onClick={() => setActiveTab('exporter')}
        >
          Report Exporter
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' ? <AnalyticsDashboard /> : <ReportExporter />}
      </div>
    </div>
  );
}

export default AnalyticsModule;

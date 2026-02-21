import React, { useState } from 'react';
import api from '../utils/api';
import './Analytics.css';

function ReportExporter() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [exportStatus, setExportStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    setLoading(true);
    setExportStatus({ type: 'loading', message: `Generating ${format.toUpperCase()} report...` });

    try {
      const response = await api.post('/analytics/export', {
        format,
        startDate,
        endDate,
        reportType: 'monthly'
      }, {
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const filename = `fleet-report-${startDate}-to-${endDate}.${format}`;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus({ 
        type: 'success', 
        message: `${format.toUpperCase()} report downloaded successfully!` 
      });
    } catch (err) {
      setExportStatus({ 
        type: 'error', 
        message: err.response?.data?.message || `Failed to export ${format.toUpperCase()} report` 
      });
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-exporter">
      <div className="exporter-header">
        <h1>Report Exporter</h1>
        <p>Generate and download fleet reports</p>
      </div>

      <div className="exporter-content">
        <div className="export-section">
          <h3>Select Date Range</h3>
          <div className="date-range-selector">
            <div className="date-input-group">
              <label htmlFor="export-startDate">Start Date:</label>
              <input
                type="date"
                id="export-startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="date-input-group">
              <label htmlFor="export-endDate">End Date:</label>
              <input
                type="date"
                id="export-endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="export-section">
          <h3>Export Format</h3>
          <div className="export-buttons">
            <button
              className="btn-export btn-csv"
              onClick={() => handleExport('csv')}
              disabled={loading}
            >
              <span>📊</span>
              Export as CSV
            </button>
            
            <button
              className="btn-export btn-pdf"
              onClick={() => handleExport('pdf')}
              disabled={loading}
            >
              <span>📄</span>
              Export as PDF
            </button>
          </div>
        </div>

        {exportStatus && (
          <div className={`export-status ${exportStatus.type}`}>
            {exportStatus.message}
          </div>
        )}

        <div className="export-section">
          <h3>Report Contents</h3>
          <ul style={{ color: '#666', lineHeight: '1.8' }}>
            <li>All trips within the selected date range</li>
            <li>All expenses (fuel and maintenance)</li>
            <li>Calculated metrics: fuel efficiency, ROI, operational costs</li>
            <li>Vehicle utilization statistics</li>
            <li>Driver performance summaries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ReportExporter;

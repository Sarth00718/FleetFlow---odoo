import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import './Analytics.css';

function AnalyticsDashboard() {
  const [fuelEfficiencyData, setFuelEfficiencyData] = useState([]);
  const [roiData, setRoiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        startDate,
        endDate
      };

      const [fuelResponse, roiResponse] = await Promise.all([
        api.get('/analytics/fuel-efficiency', { params }),
        api.get('/analytics/roi', { params })
      ]);

      setFuelEfficiencyData(fuelResponse.data);
      setRoiData(roiResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    fetchAnalyticsData();
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="analytics-error">Error: {error}</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Performance metrics and financial analysis</p>
      </div>

      <div className="date-range-selector">
        <div className="date-input-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div className="date-input-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <button onClick={handleDateChange} className="btn-primary">
          Apply Date Range
        </button>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h2>Fuel Efficiency (km/L per Vehicle)</h2>
          {fuelEfficiencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fuelEfficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicleId" label={{ value: 'Vehicle ID', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'km/L', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="kmPerLiter" fill="#8884d8" name="Fuel Efficiency (km/L)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No fuel efficiency data available for the selected period</div>
          )}
        </div>

        <div className="chart-container">
          <h2>ROI Comparison</h2>
          {roiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicleId" label={{ value: 'Vehicle ID', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="roi" stroke="#82ca9d" name="ROI (%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No ROI data available for the selected period</div>
          )}
        </div>
      </div>

      <div className="analytics-summary">
        <h3>Summary Statistics</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Vehicles Analyzed</h4>
            <p className="summary-value">{fuelEfficiencyData.length}</p>
          </div>
          <div className="summary-card">
            <h4>Average Fuel Efficiency</h4>
            <p className="summary-value">
              {fuelEfficiencyData.length > 0
                ? (fuelEfficiencyData.reduce((sum, v) => sum + v.kmPerLiter, 0) / fuelEfficiencyData.length).toFixed(2)
                : '0.00'} km/L
            </p>
          </div>
          <div className="summary-card">
            <h4>Average ROI</h4>
            <p className="summary-value">
              {roiData.length > 0
                ? (roiData.reduce((sum, v) => sum + v.roi, 0) / roiData.length).toFixed(2)
                : '0.00'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

const DashboardKPI = ({ filters }) => {
  const [kpis, setKpis] = useState({
    activeFleetCount: 0,
    maintenanceAlerts: 0,
    utilizationRate: 0,
    pendingCargo: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.region) params.append('region', filters.region);
      
      const queryString = params.toString();
      const url = queryString ? `/dashboard/kpis?${queryString}` : '/dashboard/kpis';
      
      const response = await api.get(url);
      setKpis(response.data);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchKPIs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filters]);

  if (loading && !kpis.activeFleetCount) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="dashboard-kpis">
      <div className="kpi-card">
        <div className="kpi-icon">🚛</div>
        <div className="kpi-content">
          <h3>Active Fleet</h3>
          <p className="kpi-value">{kpis.activeFleetCount}</p>
          <span className="kpi-label">Vehicles</span>
        </div>
      </div>

      <div className="kpi-card alert">
        <div className="kpi-icon">🔧</div>
        <div className="kpi-content">
          <h3>Maintenance Alerts</h3>
          <p className="kpi-value">{kpis.maintenanceAlerts}</p>
          <span className="kpi-label">Vehicles</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon">📊</div>
        <div className="kpi-content">
          <h3>Utilization Rate</h3>
          <p className="kpi-value">{kpis.utilizationRate}%</p>
          <span className="kpi-label">Active Usage</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon">📦</div>
        <div className="kpi-content">
          <h3>Pending Cargo</h3>
          <p className="kpi-value">{kpis.pendingCargo}</p>
          <span className="kpi-label">Trips</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardKPI;

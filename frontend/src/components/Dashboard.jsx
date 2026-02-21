import React, { useState } from 'react';
import DashboardKPI from './DashboardKPI';
import DashboardFilters from './DashboardFilters';
import './Dashboard.css';

const Dashboard = () => {
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    region: ''
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Command Center</h1>
        <p>Real-time fleet operations overview</p>
      </div>
      
      <DashboardFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <DashboardKPI filters={filters} />
    </div>
  );
};

export default Dashboard;

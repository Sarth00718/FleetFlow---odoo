import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Dashboard.css';

const DashboardFilters = ({ filters, onFilterChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = {
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      region: searchParams.get('region') || ''
    };
    
    // Only update if URL has filters
    if (urlFilters.type || urlFilters.status || urlFilters.region) {
      onFilterChange(urlFilters);
    }
  }, []);

  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    
    // Update parent component state
    onFilterChange(newFilters);
    
    // Update URL query parameters
    const newSearchParams = new URLSearchParams();
    if (newFilters.type) newSearchParams.set('type', newFilters.type);
    if (newFilters.status) newSearchParams.set('status', newFilters.status);
    if (newFilters.region) newSearchParams.set('region', newFilters.region);
    
    setSearchParams(newSearchParams);
  };

  const handleReset = () => {
    const resetFilters = { type: '', status: '', region: '' };
    onFilterChange(resetFilters);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="dashboard-filters">
      <h3>Filters</h3>
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="type-filter">Vehicle Type</label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="In Shop">In Shop</option>
            <option value="Out of Service">Out of Service</option>
            <option value="On Trip">On Trip</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="region-filter">Region</label>
          <input
            type="text"
            id="region-filter"
            placeholder="Enter region"
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
          />
        </div>

        <button 
          className="reset-button" 
          onClick={handleReset}
          disabled={!filters.type && !filters.status && !filters.region}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;

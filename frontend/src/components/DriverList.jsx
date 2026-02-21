import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function DriverList({ onEdit }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/drivers');
      setDrivers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const isLicenseExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const handleToggleStatus = async (driver) => {
    const newStatus = driver.status === 'Suspended' ? 'Off Duty' : 'Suspended';
    
    try {
      await api.put(`/drivers/${driver.id}`, { 
        ...driver,
        status: newStatus 
      });
      setDrivers(drivers.map(d => 
        d.id === driver.id ? { ...d, status: newStatus } : d
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update driver status');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedDrivers = () => {
    let filtered = drivers.filter(driver =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  };

  if (loading) {
    return <div className="loading">Loading drivers...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="driver-list">
      <div className="list-header">
        <h2>Driver Management</h2>
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="driver-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('licenseNumber')}>
              License Number {sortConfig.key === 'licenseNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('licenseExpiry')}>
              License Expiry {sortConfig.key === 'licenseExpiry' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')}>
              Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('safetyScore')}>
              Safety Score {sortConfig.key === 'safetyScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('tripCompletionRate')}>
              Completion Rate {sortConfig.key === 'tripCompletionRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedDrivers().map(driver => {
            const licenseExpired = isLicenseExpired(driver.licenseExpiry);
            return (
              <tr key={driver.id} className={licenseExpired ? 'expired-license' : ''}>
                <td>{driver.name}</td>
                <td>{driver.licenseNumber}</td>
                <td>
                  {new Date(driver.licenseExpiry).toLocaleDateString()}
                  {licenseExpired && (
                    <span className="expired-indicator" title="License Expired">
                      ⚠️
                    </span>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${driver.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {driver.status}
                  </span>
                </td>
                <td>{driver.safetyScore?.toFixed(2) || 'N/A'}</td>
                <td>{driver.tripCompletionRate?.toFixed(1) || '0.0'}%</td>
                <td className="actions">
                  <button onClick={() => onEdit(driver)} className="btn-edit">
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(driver)} 
                    className="btn-toggle"
                  >
                    {driver.status === 'Suspended' ? 'Activate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredAndSortedDrivers().length === 0 && (
        <div className="no-results">No drivers found</div>
      )}
    </div>
  );
}

export default DriverList;

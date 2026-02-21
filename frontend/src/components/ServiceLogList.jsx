import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ServiceLogList() {
  const [serviceLogs, setServiceLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    fetchVehicles();
    fetchServiceLogs();
  }, []);

  useEffect(() => {
    fetchServiceLogs();
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchServiceLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = selectedVehicle 
        ? `/service-logs?vehicleId=${selectedVehicle}`
        : '/service-logs';
      
      const response = await api.get(url);
      setServiceLogs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch service logs');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this service log as completed? The vehicle status will be changed to "Available".')) {
      return;
    }

    try {
      setCompletingId(id);
      await api.patch(`/service-logs/${id}/complete`);
      
      // Refresh the list
      await fetchServiceLogs();
      
      alert('Service log marked as completed. Vehicle status changed to "Available".');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete service log');
    } finally {
      setCompletingId(null);
    }
  };

  const groupByVehicle = () => {
    const grouped = {};
    
    serviceLogs.forEach(log => {
      const vehicleId = log.vehicle_id;
      if (!grouped[vehicleId]) {
        grouped[vehicleId] = {
          vehicle: log.vehicle,
          logs: [],
          totalCost: 0
        };
      }
      grouped[vehicleId].logs.push(log);
      grouped[vehicleId].totalCost += parseFloat(log.cost);
    });
    
    return grouped;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading service logs...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const groupedLogs = groupByVehicle();

  return (
    <div className="service-log-list">
      <div className="list-header">
        <h2>Maintenance History</h2>
        <div className="filter-group">
          <label htmlFor="vehicleFilter">Filter by Vehicle:</label>
          <select
            id="vehicleFilter"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="vehicle-filter"
          >
            <option value="">All Vehicles</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.licensePlate}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(groupedLogs).length === 0 ? (
        <div className="no-results">No service logs found</div>
      ) : (
        <div className="vehicle-groups">
          {Object.entries(groupedLogs).map(([vehicleId, data]) => (
            <div key={vehicleId} className="vehicle-group">
              <div className="vehicle-header">
                <h3>
                  {data.vehicle.name} - {data.vehicle.license_plate}
                  <span className={`status-badge status-${data.vehicle.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {data.vehicle.status}
                  </span>
                </h3>
                <div className="total-cost">
                  Total Maintenance Cost: <strong>{formatCurrency(data.totalCost)}</strong>
                </div>
              </div>

              <table className="service-log-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service Type</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map(log => (
                    <tr key={log.id} className={log.completed ? 'completed' : 'pending'}>
                      <td>{formatDate(log.service_date)}</td>
                      <td>{log.service_type}</td>
                      <td>{log.description || '-'}</td>
                      <td>{formatCurrency(log.cost)}</td>
                      <td>
                        <span className={`status-badge ${log.completed ? 'status-completed' : 'status-pending'}`}>
                          {log.completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="actions">
                        {!log.completed && (
                          <button
                            onClick={() => handleComplete(log.id)}
                            disabled={completingId === log.id}
                            className="btn-complete"
                          >
                            {completingId === log.id ? 'Completing...' : 'Mark as Completed'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServiceLogList;

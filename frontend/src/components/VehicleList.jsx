import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';

function VehicleList({ onEdit }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, vehicleId: null, action: null });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch vehicles';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      vehicleId: id,
      action: 'delete',
      title: 'Delete Vehicle',
      message: 'Are you sure you want to delete this vehicle? This action cannot be undone.'
    });
  };

  const confirmDelete = async () => {
    const id = confirmDialog.vehicleId;
    setConfirmDialog({ isOpen: false, vehicleId: null, action: null });

    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter(v => v.id !== id));
      showSuccess('Vehicle deleted successfully');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const handleToggleStatus = async (vehicle) => {
    const newStatus = vehicle.status === 'Out of Service' ? 'Available' : 'Out of Service';
    
    setConfirmDialog({
      isOpen: true,
      vehicleId: vehicle.id,
      action: 'toggle',
      title: newStatus === 'Out of Service' ? 'Deactivate Vehicle' : 'Activate Vehicle',
      message: `Are you sure you want to change the vehicle status to "${newStatus}"?`,
      newStatus
    });
  };

  const confirmToggleStatus = async () => {
    const { vehicleId, newStatus } = confirmDialog;
    setConfirmDialog({ isOpen: false, vehicleId: null, action: null });

    try {
      await api.patch(`/vehicles/${vehicleId}/status`, { status: newStatus });
      setVehicles(vehicles.map(v => 
        v.id === vehicleId ? { ...v, status: newStatus } : v
      ));
      showSuccess(`Vehicle status updated to ${newStatus}`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update vehicle status');
    }
  };

  const handleConfirm = () => {
    if (confirmDialog.action === 'delete') {
      confirmDelete();
    } else if (confirmDialog.action === 'toggle') {
      confirmToggleStatus();
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedVehicles = () => {
    let filtered = vehicles.filter(vehicle =>
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
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
    return <LoadingSpinner size="large" message="Loading vehicles..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="vehicle-list">
      <div className="list-header">
        <h2>Vehicle Registry</h2>
        <input
          type="text"
          placeholder="Search vehicles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="vehicle-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('model')}>
              Model {sortConfig.key === 'model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('licensePlate')}>
              License Plate {sortConfig.key === 'licensePlate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('maxCapacity')}>
              Max Capacity {sortConfig.key === 'maxCapacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('odometer')}>
              Odometer {sortConfig.key === 'odometer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')}>
              Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedVehicles().map(vehicle => (
            <tr key={vehicle.id}>
              <td data-label="Name">{vehicle.name}</td>
              <td data-label="Model">{vehicle.model}</td>
              <td data-label="License Plate">{vehicle.licensePlate}</td>
              <td data-label="Max Capacity">{vehicle.maxCapacity} kg</td>
              <td data-label="Odometer">{vehicle.odometer} km</td>
              <td data-label="Status">
                <span className={`status-badge status-${vehicle.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {vehicle.status}
                </span>
              </td>
              <td data-label="Actions" className="actions">
                <button onClick={() => onEdit(vehicle)} className="btn-edit">
                  Edit
                </button>
                <button 
                  onClick={() => handleToggleStatus(vehicle)} 
                  className="btn-toggle"
                >
                  {vehicle.status === 'Out of Service' ? 'Activate' : 'Deactivate'}
                </button>
                <button onClick={() => handleDelete(vehicle.id)} className="btn-delete">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredAndSortedVehicles().length === 0 && (
        <div className="no-results">No vehicles found</div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
        cancelText="Cancel"
        type={confirmDialog.action === 'delete' ? 'danger' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, vehicleId: null, action: null })}
      />
    </div>
  );
}

export default VehicleList;

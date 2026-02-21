import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import VehicleList from './VehicleList';
import VehicleForm from './VehicleForm';
import './VehicleRegistry.css';

function VehicleRegistry() {
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { vehicleUpdates, clearVehicleUpdates } = useWebSocket();

  // Listen for vehicle updates from WebSocket
  useEffect(() => {
    if (vehicleUpdates.length > 0) {
      console.log('Vehicle updates received, refreshing list');
      setRefreshKey(prev => prev + 1);
      clearVehicleUpdates();
    }
  }, [vehicleUpdates, clearVehicleUpdates]);

  const handleAddNew = () => {
    setSelectedVehicle(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedVehicle(null);
    setRefreshKey(prev => prev + 1); // Trigger refresh of vehicle list
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedVehicle(null);
  };

  return (
    <div className="vehicle-registry">
      {!showForm ? (
        <>
          <div className="registry-header">
            <button onClick={handleAddNew} className="btn-primary">
              Add New Vehicle
            </button>
          </div>
          <VehicleList key={refreshKey} onEdit={handleEdit} />
        </>
      ) : (
        <VehicleForm
          vehicle={selectedVehicle}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}

export default VehicleRegistry;

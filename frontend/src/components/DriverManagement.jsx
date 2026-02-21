import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import DriverList from './DriverList';
import DriverForm from './DriverForm';
import './DriverManagement.css';

function DriverManagement() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { driverUpdates, clearDriverUpdates } = useWebSocket();

  // Listen for driver updates from WebSocket
  useEffect(() => {
    if (driverUpdates.length > 0) {
      console.log('Driver updates received, refreshing list');
      setRefreshKey(prev => prev + 1);
      clearDriverUpdates();
    }
  }, [driverUpdates, clearDriverUpdates]);

  const handleAddNew = () => {
    setSelectedDriver(null);
    setShowForm(true);
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedDriver(null);
    setRefreshKey(prev => prev + 1); // Trigger refresh of driver list
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedDriver(null);
  };

  return (
    <div className="driver-management">
      {!showForm ? (
        <>
          <div className="management-header">
            <button onClick={handleAddNew} className="btn-primary">
              Add New Driver
            </button>
          </div>
          <DriverList key={refreshKey} onEdit={handleEdit} />
        </>
      ) : (
        <DriverForm
          driver={selectedDriver}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}

export default DriverManagement;

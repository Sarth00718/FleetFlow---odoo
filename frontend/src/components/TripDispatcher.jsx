import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import TripList from './TripList';
import TripForm from './TripForm';
import './TripDispatcher.css';

function TripDispatcher() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { vehicleUpdates, driverUpdates, clearVehicleUpdates, clearDriverUpdates } = useWebSocket();

  // Listen for vehicle and driver updates from WebSocket
  useEffect(() => {
    if (vehicleUpdates.length > 0 || driverUpdates.length > 0) {
      console.log('Vehicle or driver updates received, refreshing trip list');
      setRefreshKey(prev => prev + 1);
      clearVehicleUpdates();
      clearDriverUpdates();
    }
  }, [vehicleUpdates, driverUpdates, clearVehicleUpdates, clearDriverUpdates]);

  const handleAddNew = () => {
    setSelectedTrip(null);
    setShowForm(true);
  };

  const handleEdit = (trip) => {
    setSelectedTrip(trip);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTrip(null);
    setRefreshKey(prev => prev + 1); // Trigger refresh of trip list
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedTrip(null);
  };

  return (
    <div className="trip-dispatcher">
      {!showForm ? (
        <>
          <div className="dispatcher-header">
            <button onClick={handleAddNew} className="btn-primary">
              Create New Trip
            </button>
          </div>
          <TripList key={refreshKey} onEdit={handleEdit} />
        </>
      ) : (
        <TripForm
          trip={selectedTrip}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}

export default TripDispatcher;

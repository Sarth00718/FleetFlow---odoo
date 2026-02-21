import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function TripList({ onEdit }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [finalOdometer, setFinalOdometer] = useState('');
  const [odometerError, setOdometerError] = useState(null);
  const [completingTrip, setCompletingTrip] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/trips');
      setTrips(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (tripId) => {
    if (!window.confirm('Are you sure you want to dispatch this trip?')) {
      return;
    }

    try {
      await api.patch(`/trips/${tripId}/dispatch`);
      // Refresh trips list
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch trip');
    }
  };

  const handleCancel = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) {
      return;
    }

    try {
      await api.patch(`/trips/${tripId}/cancel`);
      // Refresh trips list
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const openCompletionModal = (trip) => {
    setSelectedTrip(trip);
    const startingOdometer = trip.starting_odometer || trip.startingOdometer;
    setFinalOdometer(startingOdometer?.toString() || '');
    setOdometerError(null);
    setShowCompletionModal(true);
  };

  const closeCompletionModal = () => {
    setShowCompletionModal(false);
    setSelectedTrip(null);
    setFinalOdometer('');
    setOdometerError(null);
  };

  const handleCompleteTrip = async () => {
    if (!finalOdometer || parseFloat(finalOdometer) <= 0) {
      setOdometerError('Final odometer reading is required');
      return;
    }

    const startingOdometer = selectedTrip.starting_odometer || selectedTrip.startingOdometer;
    if (startingOdometer && parseFloat(finalOdometer) < startingOdometer) {
      setOdometerError(`Final odometer must be >= starting odometer (${startingOdometer} km)`);
      return;
    }

    setCompletingTrip(true);
    try {
      await api.patch(`/trips/${selectedTrip.id}/complete`, {
        finalOdometer: parseFloat(finalOdometer)
      });
      closeCompletionModal();
      // Refresh trips list
      fetchTrips();
    } catch (err) {
      setOdometerError(err.response?.data?.message || 'Failed to complete trip');
    } finally {
      setCompletingTrip(false);
    }
  };

  const getVehicleInfo = (trip) => {
    if (trip.vehicle) {
      return `${trip.vehicle.name} (${trip.vehicle.license_plate})`;
    }
    return `Vehicle ID: ${trip.vehicleId}`;
  };

  const getDriverInfo = (trip) => {
    if (trip.driver) {
      return `${trip.driver.name} (${trip.driver.license_number})`;
    }
    return `Driver ID: ${trip.driverId}`;
  };

  const filteredTrips = () => {
    if (statusFilter === 'All') {
      return trips;
    }
    return trips.filter(trip => trip.status === statusFilter);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading trips...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="trip-list">
      <div className="list-header">
        <h2>Trip Management</h2>
        <div className="filter-controls">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="All">All</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <table className="trip-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Cargo (kg)</th>
            <th>Scheduled</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrips().map(trip => (
            <tr key={trip.id}>
              <td>{trip.id}</td>
              <td>{getVehicleInfo(trip)}</td>
              <td>{getDriverInfo(trip)}</td>
              <td>{trip.origin}</td>
              <td>{trip.destination}</td>
              <td>{trip.cargo_weight || trip.cargoWeight}</td>
              <td>{formatDate(trip.scheduled_date || trip.scheduledDate)}</td>
              <td>
                <span className={`status-badge status-${trip.status.toLowerCase()}`}>
                  {trip.status}
                </span>
              </td>
              <td className="actions">
                {trip.status === 'Draft' && (
                  <>
                    <button onClick={() => onEdit(trip)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDispatch(trip.id)} className="btn-success">
                      Dispatch
                    </button>
                    <button onClick={() => handleCancel(trip.id)} className="btn-delete">
                      Cancel
                    </button>
                  </>
                )}
                {trip.status === 'Dispatched' && (
                  <>
                    <button onClick={() => openCompletionModal(trip)} className="btn-success">
                      Complete
                    </button>
                    <button onClick={() => handleCancel(trip.id)} className="btn-delete">
                      Cancel
                    </button>
                  </>
                )}
                {(trip.status === 'Completed' || trip.status === 'Cancelled') && (
                  <span className="no-actions">No actions available</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredTrips().length === 0 && (
        <div className="no-results">No trips found</div>
      )}

      {/* Trip Completion Modal */}
      {showCompletionModal && selectedTrip && (
        <div className="modal-overlay" onClick={closeCompletionModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Complete Trip</h3>
            <div className="modal-body">
              <p><strong>Trip:</strong> {selectedTrip.origin} → {selectedTrip.destination}</p>
              <p><strong>Vehicle:</strong> {getVehicleInfo(selectedTrip)}</p>
              <p><strong>Driver:</strong> {getDriverInfo(selectedTrip)}</p>
              {(selectedTrip.starting_odometer || selectedTrip.startingOdometer) && (
                <p><strong>Starting Odometer:</strong> {selectedTrip.starting_odometer || selectedTrip.startingOdometer} km</p>
              )}
              
              <div className="form-group">
                <label htmlFor="finalOdometer">Final Odometer Reading (km) *</label>
                <input
                  type="number"
                  id="finalOdometer"
                  value={finalOdometer}
                  onChange={(e) => {
                    setFinalOdometer(e.target.value);
                    setOdometerError(null);
                  }}
                  step="0.01"
                  min="0"
                  className={odometerError ? 'error' : ''}
                />
                {odometerError && <span className="field-error">{odometerError}</span>}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleCompleteTrip} 
                disabled={completingTrip}
                className="btn-success"
              >
                {completingTrip ? 'Completing...' : 'Complete Trip'}
              </button>
              <button onClick={closeCompletionModal} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripList;

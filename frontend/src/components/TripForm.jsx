import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function TripForm({ trip, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    origin: '',
    destination: '',
    scheduledDate: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [capacityWarning, setCapacityWarning] = useState(null);

  useEffect(() => {
    fetchAvailableResources();
  }, []);

  useEffect(() => {
    if (trip) {
      setFormData({
        vehicleId: (trip.vehicle_id || trip.vehicleId)?.toString() || '',
        driverId: (trip.driver_id || trip.driverId)?.toString() || '',
        cargoWeight: (trip.cargo_weight || trip.cargoWeight)?.toString() || '',
        origin: trip.origin || '',
        destination: trip.destination || '',
        scheduledDate: (trip.scheduled_date || trip.scheduledDate) 
          ? new Date(trip.scheduled_date || trip.scheduledDate).toISOString().slice(0, 16) 
          : ''
      });
    }
  }, [trip]);

  useEffect(() => {
    validateCapacity();
  }, [formData.vehicleId, formData.cargoWeight, vehicles]);

  const fetchAvailableResources = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      
      // Filter available vehicles (status Available, not In Shop or Out of Service)
      const availableVehicles = vehiclesRes.data.filter(v => 
        v.status === 'Available' || (trip && (v.id === trip.vehicle_id || v.id === trip.vehicleId))
      );
      
      // Filter available drivers (On Duty status with valid licenses)
      const availableDrivers = driversRes.data.filter(d => {
        const licenseExpiry = d.license_expiry || d.licenseExpiry;
        const isExpired = new Date(licenseExpiry) <= new Date();
        return (d.status === 'On Duty' && !isExpired) || (trip && (d.id === trip.driver_id || d.id === trip.driverId));
      });
      
      setVehicles(availableVehicles);
      setDrivers(availableDrivers);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to fetch available resources');
    } finally {
      setLoading(false);
    }
  };

  const validateCapacity = () => {
    if (formData.vehicleId && formData.cargoWeight) {
      const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicleId));
      const cargoWeight = parseFloat(formData.cargoWeight);
      
      if (selectedVehicle) {
        const maxCapacity = selectedVehicle.max_capacity || selectedVehicle.maxCapacity;
        if (cargoWeight > maxCapacity) {
          setCapacityWarning(
            `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${maxCapacity} kg)`
          );
        } else {
          setCapacityWarning(null);
        }
      }
    } else {
      setCapacityWarning(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Vehicle is required';
    }

    if (!formData.driverId) {
      newErrors.driverId = 'Driver is required';
    }

    if (!formData.cargoWeight || parseFloat(formData.cargoWeight) <= 0) {
      newErrors.cargoWeight = 'Cargo weight must be greater than 0';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    // Check capacity validation
    if (capacityWarning) {
      newErrors.cargoWeight = capacityWarning;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e, shouldDispatch = false) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        cargoWeight: parseFloat(formData.cargoWeight),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        scheduledDate: new Date(formData.scheduledDate).toISOString()
      };

      let tripId;
      if (trip) {
        await api.put(`/trips/${trip.id}`, payload);
        tripId = trip.id;
      } else {
        const response = await api.post('/trips', payload);
        tripId = response.data.id;
      }

      // If shouldDispatch is true, dispatch the trip immediately
      if (shouldDispatch) {
        await api.patch(`/trips/${tripId}/dispatch`);
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save trip';
      setApiError(errorMessage);
      
      // Handle specific validation errors from API
      if (err.response?.data?.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach(error => {
          apiErrors[error.field] = error.message;
        });
        setErrors(apiErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading available resources...</div>;
  }

  return (
    <div className="trip-form">
      <h2>{trip ? 'Edit Trip' : 'Create New Trip'}</h2>
      
      {apiError && (
        <div className="error-message">{apiError}</div>
      )}

      {capacityWarning && !errors.cargoWeight && (
        <div className="warning-message">{capacityWarning}</div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="form-group">
          <label htmlFor="vehicleId">Vehicle *</label>
          <select
            id="vehicleId"
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            className={errors.vehicleId ? 'error' : ''}
          >
            <option value="">Select a vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.model} ({vehicle.license_plate || vehicle.licensePlate}) - Max: {vehicle.max_capacity || vehicle.maxCapacity} kg
              </option>
            ))}
          </select>
          {errors.vehicleId && <span className="field-error">{errors.vehicleId}</span>}
          {vehicles.length === 0 && (
            <span className="field-info">No available vehicles</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="driverId">Driver *</label>
          <select
            id="driverId"
            name="driverId"
            value={formData.driverId}
            onChange={handleChange}
            className={errors.driverId ? 'error' : ''}
          >
            <option value="">Select a driver</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name} - License: {driver.license_number || driver.licenseNumber}
              </option>
            ))}
          </select>
          {errors.driverId && <span className="field-error">{errors.driverId}</span>}
          {drivers.length === 0 && (
            <span className="field-info">No available drivers</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="cargoWeight">Cargo Weight (kg) *</label>
          <input
            type="number"
            id="cargoWeight"
            name="cargoWeight"
            value={formData.cargoWeight}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={errors.cargoWeight ? 'error' : ''}
          />
          {errors.cargoWeight && <span className="field-error">{errors.cargoWeight}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="origin">Origin *</label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            className={errors.origin ? 'error' : ''}
          />
          {errors.origin && <span className="field-error">{errors.origin}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination *</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className={errors.destination ? 'error' : ''}
          />
          {errors.destination && <span className="field-error">{errors.destination}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="scheduledDate">Scheduled Date *</label>
          <input
            type="datetime-local"
            id="scheduledDate"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            className={errors.scheduledDate ? 'error' : ''}
          />
          {errors.scheduledDate && <span className="field-error">{errors.scheduledDate}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, true)} 
            disabled={submitting}
            className="btn-success"
          >
            {submitting ? 'Dispatching...' : 'Dispatch'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default TripForm;

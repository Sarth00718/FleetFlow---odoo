import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ServiceLogForm({ onSuccess, onCancel }) {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: 'Preventative',
    description: '',
    cost: '',
    serviceDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Vehicle is required';
    }

    if (!formData.cost || parseFloat(formData.cost) < 0) {
      newErrors.cost = 'Cost must be 0 or greater';
    }

    if (!formData.serviceDate) {
      newErrors.serviceDate = 'Service date is required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vehicleId: parseInt(formData.vehicleId),
        serviceType: formData.serviceType,
        description: formData.description.trim() || null,
        cost: parseFloat(formData.cost),
        serviceDate: formData.serviceDate
      };

      const response = await api.post('/service-logs', payload);
      
      // Show success message with vehicle status update confirmation
      const vehicleName = vehicles.find(v => v.id === parseInt(formData.vehicleId))?.name || 'Vehicle';
      setSuccessMessage(`Service log created successfully. ${vehicleName} status changed to "In Shop".`);
      
      // Reset form
      setFormData({
        vehicleId: '',
        serviceType: 'Preventative',
        description: '',
        cost: '',
        serviceDate: new Date().toISOString().split('T')[0]
      });

      // Call onSuccess after a short delay to show the message
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create service log';
      setApiError(errorMessage);
      
      // Handle specific validation errors from API
      if (err.response?.data?.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach(error => {
          apiErrors[error.path || error.param] = error.msg || error.message;
        });
        setErrors(apiErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="service-log-form">
      <h2>Add Service Log</h2>
      
      {apiError && (
        <div className="error-message">{apiError}</div>
      )}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit}>
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
                {vehicle.name} - {vehicle.licensePlate} ({vehicle.status})
              </option>
            ))}
          </select>
          {errors.vehicleId && <span className="field-error">{errors.vehicleId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="serviceType">Service Type *</label>
          <select
            id="serviceType"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
          >
            <option value="Preventative">Preventative</option>
            <option value="Reactive">Reactive</option>
            <option value="Inspection">Inspection</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Enter service details..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="cost">Cost ($) *</label>
          <input
            type="number"
            id="cost"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={errors.cost ? 'error' : ''}
          />
          {errors.cost && <span className="field-error">{errors.cost}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="serviceDate">Service Date *</label>
          <input
            type="date"
            id="serviceDate"
            name="serviceDate"
            value={formData.serviceDate}
            onChange={handleChange}
            className={errors.serviceDate ? 'error' : ''}
          />
          {errors.serviceDate && <span className="field-error">{errors.serviceDate}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating...' : 'Create Service Log'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServiceLogForm;

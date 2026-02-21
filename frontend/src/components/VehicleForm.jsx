import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';

function VehicleForm({ vehicle, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    licensePlate: '',
    vehicleType: 'Truck',
    maxCapacity: '',
    initialOdometer: '0',
    region: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        model: vehicle.model || '',
        licensePlate: vehicle.licensePlate || '',
        vehicleType: vehicle.vehicleType || 'Truck',
        maxCapacity: vehicle.maxCapacity || '',
        initialOdometer: vehicle.odometer || '0',
        region: vehicle.region || ''
      });
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }

    if (!formData.maxCapacity || parseFloat(formData.maxCapacity) <= 0) {
      newErrors.maxCapacity = 'Max capacity must be greater than 0';
    }

    if (!vehicle && (!formData.initialOdometer || parseFloat(formData.initialOdometer) < 0)) {
      newErrors.initialOdometer = 'Initial odometer must be 0 or greater';
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

    if (!validateForm()) {
      showError('Please fix the validation errors before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        model: formData.model.trim(),
        licensePlate: formData.licensePlate.trim(),
        vehicleType: formData.vehicleType,
        maxCapacity: parseFloat(formData.maxCapacity),
        region: formData.region.trim() || null
      };

      if (!vehicle) {
        payload.initialOdometer = parseFloat(formData.initialOdometer);
      }

      if (vehicle) {
        await api.put(`/vehicles/${vehicle.id}`, payload);
        showSuccess('Vehicle updated successfully');
      } else {
        await api.post('/vehicles', payload);
        showSuccess('Vehicle created successfully');
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save vehicle';
      showError(errorMessage);
      
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

  return (
    <div className="vehicle-form">
      <h2>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="model">Model *</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={errors.model ? 'error' : ''}
          />
          {errors.model && <span className="field-error">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="licensePlate">License Plate *</label>
          <input
            type="text"
            id="licensePlate"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            className={errors.licensePlate ? 'error' : ''}
          />
          {errors.licensePlate && <span className="field-error">{errors.licensePlate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="vehicleType">Vehicle Type *</label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
          >
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="maxCapacity">Max Capacity (kg) *</label>
          <input
            type="number"
            id="maxCapacity"
            name="maxCapacity"
            value={formData.maxCapacity}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={errors.maxCapacity ? 'error' : ''}
          />
          {errors.maxCapacity && <span className="field-error">{errors.maxCapacity}</span>}
        </div>

        {!vehicle && (
          <div className="form-group">
            <label htmlFor="initialOdometer">Initial Odometer (km) *</label>
            <input
              type="number"
              id="initialOdometer"
              name="initialOdometer"
              value={formData.initialOdometer}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={errors.initialOdometer ? 'error' : ''}
            />
            {errors.initialOdometer && <span className="field-error">{errors.initialOdometer}</span>}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="region">Region</label>
          <input
            type="text"
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default VehicleForm;

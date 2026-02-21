import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function DriverForm({ driver, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    safetyScore: '100.00',
    status: 'Off Duty'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
        safetyScore: driver.safetyScore?.toString() || '100.00',
        status: driver.status || 'Off Duty'
      });
    }
  }, [driver]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.licenseExpiry) {
      newErrors.licenseExpiry = 'License expiry date is required';
    } else {
      const expiryDate = new Date(formData.licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!driver && expiryDate <= today) {
        newErrors.licenseExpiry = 'License expiry must be a future date';
      }
    }

    const safetyScore = parseFloat(formData.safetyScore);
    if (isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
      newErrors.safetyScore = 'Safety score must be between 0 and 100';
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

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        licenseExpiry: formData.licenseExpiry,
        status: formData.status
      };

      if (!driver) {
        payload.initialSafetyScore = parseFloat(formData.safetyScore);
      } else {
        payload.safetyScore = parseFloat(formData.safetyScore);
      }

      if (driver) {
        await api.put(`/drivers/${driver.id}`, payload);
      } else {
        await api.post('/drivers', payload);
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save driver';
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

  return (
    <div className="driver-form">
      <h2>{driver ? 'Edit Driver' : 'Add New Driver'}</h2>
      
      {apiError && (
        <div className="error-message">{apiError}</div>
      )}

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
          <label htmlFor="licenseNumber">License Number *</label>
          <input
            type="text"
            id="licenseNumber"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            className={errors.licenseNumber ? 'error' : ''}
          />
          {errors.licenseNumber && <span className="field-error">{errors.licenseNumber}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="licenseExpiry">License Expiry Date *</label>
          <input
            type="date"
            id="licenseExpiry"
            name="licenseExpiry"
            value={formData.licenseExpiry}
            onChange={handleChange}
            className={errors.licenseExpiry ? 'error' : ''}
          />
          {errors.licenseExpiry && <span className="field-error">{errors.licenseExpiry}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="safetyScore">
            {driver ? 'Safety Score *' : 'Initial Safety Score *'}
          </label>
          <input
            type="number"
            id="safetyScore"
            name="safetyScore"
            value={formData.safetyScore}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="100"
            className={errors.safetyScore ? 'error' : ''}
          />
          {errors.safetyScore && <span className="field-error">{errors.safetyScore}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="On Duty">On Duty</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : (driver ? 'Update Driver' : 'Add Driver')}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default DriverForm;

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ExpenseForm({ onSuccess, onCancel }) {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: '',
    expenseType: 'Fuel',
    cost: '',
    expenseDate: new Date().toISOString().split('T')[0],
    liters: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      setApiError('Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
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

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Date is required';
    }

    if (formData.expenseType === 'Fuel') {
      if (!formData.liters || parseFloat(formData.liters) <= 0) {
        newErrors.liters = 'Liters must be greater than 0 for fuel expenses';
      }
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

    // Clear liters when switching to Maintenance
    if (name === 'expenseType' && value === 'Maintenance') {
      setFormData(prev => ({
        ...prev,
        liters: ''
      }));
      setErrors(prev => ({
        ...prev,
        liters: null
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
        vehicleId: parseInt(formData.vehicleId),
        expenseType: formData.expenseType,
        cost: parseFloat(formData.cost),
        expenseDate: formData.expenseDate,
        description: formData.description.trim() || null
      };

      // Only include liters for fuel expenses
      if (formData.expenseType === 'Fuel' && formData.liters) {
        payload.liters = parseFloat(formData.liters);
      }

      await api.post('/expenses', payload);
      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to save expense';
      setApiError(errorMessage);
      
      // Handle specific validation errors from API
      if (err.response?.data?.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach(error => {
          apiErrors[error.param || error.field] = error.msg || error.message;
        });
        setErrors(apiErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicles) {
    return <div className="loading">Loading vehicles...</div>;
  }

  return (
    <div className="expense-form">
      <h2>Add New Expense</h2>
      
      {apiError && (
        <div className="error-message">{apiError}</div>
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
                {vehicle.name} - {vehicle.licensePlate}
              </option>
            ))}
          </select>
          {errors.vehicleId && <span className="field-error">{errors.vehicleId}</span>}
        </div>

        <div className="form-group">
          <label>Expense Type *</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="expenseType"
                value="Fuel"
                checked={formData.expenseType === 'Fuel'}
                onChange={handleChange}
              />
              Fuel
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="expenseType"
                value="Maintenance"
                checked={formData.expenseType === 'Maintenance'}
                onChange={handleChange}
              />
              Maintenance
            </label>
          </div>
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
          <label htmlFor="expenseDate">Date *</label>
          <input
            type="date"
            id="expenseDate"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            className={errors.expenseDate ? 'error' : ''}
          />
          {errors.expenseDate && <span className="field-error">{errors.expenseDate}</span>}
        </div>

        {formData.expenseType === 'Fuel' && (
          <div className="form-group">
            <label htmlFor="liters">Liters *</label>
            <input
              type="number"
              id="liters"
              name="liters"
              value={formData.liters}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className={errors.liters ? 'error' : ''}
            />
            {errors.liters && <span className="field-error">{errors.liters}</span>}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Add Expense'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;

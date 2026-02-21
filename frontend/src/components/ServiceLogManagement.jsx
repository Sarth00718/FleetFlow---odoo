import React, { useState } from 'react';
import ServiceLogForm from './ServiceLogForm';
import ServiceLogList from './ServiceLogList';
import './ServiceLogManagement.css';

function ServiceLogManagement() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh of the list
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="service-log-management">
      <div className="management-header">
        <h1>Service & Maintenance Logs</h1>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Service Log'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <ServiceLogForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="list-container">
        <ServiceLogList key={refreshKey} />
      </div>
    </div>
  );
}

export default ServiceLogManagement;

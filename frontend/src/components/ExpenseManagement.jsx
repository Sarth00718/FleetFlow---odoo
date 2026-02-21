import React, { useState } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import './ExpenseManagement.css';

function ExpenseManagement() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh of expense list
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="expense-management">
      <div className="management-header">
        <h1>Expense Tracking</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Add Expense
          </button>
        )}
      </div>

      {showForm ? (
        <ExpenseForm onSuccess={handleSuccess} onCancel={handleCancel} />
      ) : (
        <ExpenseList key={refreshKey} />
      )}
    </div>
  );
}

export default ExpenseManagement;

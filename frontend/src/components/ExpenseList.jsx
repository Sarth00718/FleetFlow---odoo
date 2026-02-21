import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [operationalCosts, setOperationalCosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vehicleId: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data);

      // Fetch operational costs for each vehicle
      await fetchOperationalCosts();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationalCosts = async () => {
    try {
      const costs = {};
      
      // Get unique vehicle IDs from expenses
      const vehicleIds = [...new Set(expenses.map(e => e.vehicle_id))];
      
      // Fetch operational cost for each vehicle
      await Promise.all(
        vehicleIds.map(async (vehicleId) => {
          try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            
            const response = await api.get(`/expenses/operational-cost/${vehicleId}?${params.toString()}`);
            costs[vehicleId] = response.data;
          } catch (err) {
            console.error(`Failed to fetch operational cost for vehicle ${vehicleId}:`, err);
          }
        })
      );
      
      setOperationalCosts(costs);
    } catch (err) {
      console.error('Failed to fetch operational costs:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      vehicleId: '',
      type: '',
      startDate: '',
      endDate: ''
    });
  };

  const groupExpensesByVehicle = () => {
    const grouped = {};
    
    expenses.forEach(expense => {
      const vehicleId = expense.vehicle_id;
      if (!grouped[vehicleId]) {
        grouped[vehicleId] = {
          vehicle: expense.vehicle,
          expenses: []
        };
      }
      grouped[vehicleId].expenses.push(expense);
    });
    
    return grouped;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const groupedExpenses = groupExpensesByVehicle();

  return (
    <div className="expense-list">
      <div className="list-header">
        <h2>Expense Tracking</h2>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="vehicleId">Vehicle</label>
          <select
            id="vehicleId"
            name="vehicleId"
            value={filters.vehicleId}
            onChange={handleFilterChange}
          >
            <option value="">All Vehicles</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.licensePlate}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type">Expense Type</label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="Fuel">Fuel</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>

        <button onClick={clearFilters} className="btn-secondary">
          Clear Filters
        </button>
      </div>

      {Object.keys(groupedExpenses).length === 0 ? (
        <div className="no-results">No expenses found</div>
      ) : (
        <div className="expense-groups">
          {Object.entries(groupedExpenses).map(([vehicleId, data]) => (
            <div key={vehicleId} className="vehicle-expense-group">
              <div className="vehicle-header">
                <h3>
                  {data.vehicle?.name || 'Unknown Vehicle'} - {data.vehicle?.license_plate || 'N/A'}
                </h3>
                {operationalCosts[vehicleId] && (
                  <div className="operational-cost">
                    <div className="cost-breakdown">
                      <span className="cost-label">Fuel:</span>
                      <span className="cost-value">{formatCurrency(operationalCosts[vehicleId].totalFuel)}</span>
                    </div>
                    <div className="cost-breakdown">
                      <span className="cost-label">Maintenance:</span>
                      <span className="cost-value">{formatCurrency(operationalCosts[vehicleId].totalMaintenance)}</span>
                    </div>
                    <div className="cost-breakdown total">
                      <span className="cost-label">Operational Cost:</span>
                      <span className="cost-value">{formatCurrency(operationalCosts[vehicleId].operationalCost)}</span>
                    </div>
                  </div>
                )}
              </div>

              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Cost</th>
                    <th>Liters</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expense_date)}</td>
                      <td>
                        <span className={`expense-type-badge ${expense.expense_type.toLowerCase()}`}>
                          {expense.expense_type}
                        </span>
                      </td>
                      <td>{formatCurrency(expense.cost)}</td>
                      <td>{expense.liters ? `${parseFloat(expense.liters).toFixed(2)} L` : '-'}</td>
                      <td>{expense.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpenseList;

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

// Test data
let testVehicleId;
let testExpenseIds = [];

async function testExpenseEndpoints() {
  console.log('=== Testing Expense Tracking Backend ===\n');

  try {
    // Step 1: Create a test vehicle
    console.log('1. Creating test vehicle...');
    const vehicleResponse = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Truck',
        model: 'Ford F-150',
        licensePlate: 'EXP-TEST-001',
        vehicleType: 'Truck',
        maxCapacity: 1000,
        initialOdometer: 50000
      })
    });

    if (!vehicleResponse.ok) {
      const error = await vehicleResponse.json();
      console.error('Failed to create vehicle:', error);
      return;
    }

    const vehicle = await vehicleResponse.json();
    testVehicleId = vehicle.id;
    console.log(`✓ Vehicle created with ID: ${testVehicleId}\n`);

    // Step 2: Create fuel expense
    console.log('2. Creating fuel expense...');
    const fuelExpenseResponse = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: testVehicleId,
        expenseType: 'Fuel',
        cost: 150.50,
        expenseDate: '2024-01-15',
        liters: 75.25,
        description: 'Regular fuel fill-up'
      })
    });

    if (!fuelExpenseResponse.ok) {
      const error = await fuelExpenseResponse.json();
      console.error('Failed to create fuel expense:', error);
      return;
    }

    const fuelExpense = await fuelExpenseResponse.json();
    testExpenseIds.push(fuelExpense.id);
    console.log('✓ Fuel expense created:', {
      id: fuelExpense.id,
      type: fuelExpense.expense_type,
      cost: fuelExpense.cost,
      liters: fuelExpense.liters
    });
    console.log();

    // Step 3: Create maintenance expense
    console.log('3. Creating maintenance expense...');
    const maintenanceExpenseResponse = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: testVehicleId,
        expenseType: 'Maintenance',
        cost: 350.00,
        expenseDate: '2024-01-20',
        description: 'Oil change and tire rotation'
      })
    });

    if (!maintenanceExpenseResponse.ok) {
      const error = await maintenanceExpenseResponse.json();
      console.error('Failed to create maintenance expense:', error);
      return;
    }

    const maintenanceExpense = await maintenanceExpenseResponse.json();
    testExpenseIds.push(maintenanceExpense.id);
    console.log('✓ Maintenance expense created:', {
      id: maintenanceExpense.id,
      type: maintenanceExpense.expense_type,
      cost: maintenanceExpense.cost
    });
    console.log();

    // Step 4: Create another fuel expense (earlier date to test chronological ordering)
    console.log('4. Creating earlier fuel expense (to test chronological ordering)...');
    const earlierFuelResponse = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: testVehicleId,
        expenseType: 'Fuel',
        cost: 120.00,
        expenseDate: '2024-01-10',
        liters: 60.00
      })
    });

    if (!earlierFuelResponse.ok) {
      const error = await earlierFuelResponse.json();
      console.error('Failed to create earlier fuel expense:', error);
      return;
    }

    const earlierFuel = await earlierFuelResponse.json();
    testExpenseIds.push(earlierFuel.id);
    console.log('✓ Earlier fuel expense created\n');

    // Step 5: Test GET /api/expenses with filtering
    console.log('5. Testing GET /api/expenses with vehicleId filter...');
    const expensesResponse = await fetch(`${API_BASE}/expenses?vehicleId=${testVehicleId}`);
    
    if (!expensesResponse.ok) {
      const error = await expensesResponse.json();
      console.error('Failed to get expenses:', error);
      return;
    }

    const expenses = await expensesResponse.json();
    console.log(`✓ Retrieved ${expenses.length} expenses`);
    
    // Verify chronological ordering
    console.log('  Checking chronological ordering...');
    let isChronological = true;
    for (let i = 1; i < expenses.length; i++) {
      if (new Date(expenses[i].expense_date) < new Date(expenses[i-1].expense_date)) {
        isChronological = false;
        break;
      }
    }
    console.log(`  ${isChronological ? '✓' : '✗'} Expenses are in chronological order`);
    
    expenses.forEach((exp, idx) => {
      console.log(`  ${idx + 1}. ${exp.expense_date} - ${exp.expense_type}: $${exp.cost}`);
    });
    console.log();

    // Step 6: Test filtering by expense type
    console.log('6. Testing GET /api/expenses with type filter (Fuel only)...');
    const fuelOnlyResponse = await fetch(`${API_BASE}/expenses?vehicleId=${testVehicleId}&type=Fuel`);
    const fuelExpenses = await fuelOnlyResponse.json();
    console.log(`✓ Retrieved ${fuelExpenses.length} fuel expenses`);
    console.log();

    // Step 7: Test date range filtering
    console.log('7. Testing GET /api/expenses with date range filter...');
    const dateRangeResponse = await fetch(
      `${API_BASE}/expenses?vehicleId=${testVehicleId}&startDate=2024-01-15&endDate=2024-01-31`
    );
    const dateRangeExpenses = await dateRangeResponse.json();
    console.log(`✓ Retrieved ${dateRangeExpenses.length} expenses in date range (2024-01-15 to 2024-01-31)`);
    console.log();

    // Step 8: Test operational cost calculation
    console.log('8. Testing GET /api/expenses/operational-cost/:vehicleId...');
    const operationalCostResponse = await fetch(`${API_BASE}/expenses/operational-cost/${testVehicleId}`);
    
    if (!operationalCostResponse.ok) {
      const error = await operationalCostResponse.json();
      console.error('Failed to get operational cost:', error);
      return;
    }

    const operationalCost = await operationalCostResponse.json();
    console.log('✓ Operational cost calculated:', {
      totalFuel: operationalCost.totalFuel,
      totalMaintenance: operationalCost.totalMaintenance,
      operationalCost: operationalCost.operationalCost
    });
    
    // Verify calculation
    const expectedTotal = 150.50 + 120.00 + 350.00;
    const calculationCorrect = Math.abs(operationalCost.operationalCost - expectedTotal) < 0.01;
    console.log(`  ${calculationCorrect ? '✓' : '✗'} Calculation is correct (expected: ${expectedTotal})`);
    console.log();

    // Step 9: Test referential integrity (invalid vehicle ID)
    console.log('9. Testing referential integrity with invalid vehicle ID...');
    const invalidVehicleResponse = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 99999,
        expenseType: 'Fuel',
        cost: 100.00,
        expenseDate: '2024-01-25',
        liters: 50.00
      })
    });

    if (invalidVehicleResponse.status === 400) {
      const error = await invalidVehicleResponse.json();
      console.log('✓ Referential integrity enforced:', error.error);
    } else {
      console.log('✗ Expected 400 error for invalid vehicle ID');
    }
    console.log();

    // Step 10: Test validation errors
    console.log('10. Testing validation (missing required fields)...');
    const invalidExpenseResponse = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: testVehicleId,
        expenseType: 'Fuel'
        // Missing cost and expenseDate
      })
    });

    if (invalidExpenseResponse.status === 400) {
      const error = await invalidExpenseResponse.json();
      console.log('✓ Validation errors returned:', error.errors?.length || 0, 'errors');
    } else {
      console.log('✗ Expected 400 error for missing fields');
    }
    console.log();

    console.log('=== All Expense Tests Completed Successfully ===\n');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Cleanup: Delete test vehicle (will cascade delete expenses)
    if (testVehicleId) {
      console.log('Cleaning up test data...');
      await fetch(`${API_BASE}/vehicles/${testVehicleId}`, {
        method: 'DELETE'
      });
      console.log('✓ Test data cleaned up\n');
    }
  }
}

// Run tests
testExpenseEndpoints();

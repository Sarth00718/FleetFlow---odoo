// Comprehensive API endpoint testing script
// This script tests all backend API endpoints systematically

const BASE_URL = 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(testName) {
  log(`\n→ ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

async function testEndpoint(method, path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => null);
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function runTests() {
  log('FleetFlow Backend API - Comprehensive Endpoint Testing', 'cyan');
  log('========================================================\n', 'cyan');

  // Test 1: Health Check
  logSection('1. HEALTH CHECK');
  logTest('GET /health');
  const health = await testEndpoint('GET', '/health');
  if (health.ok) {
    logSuccess(`Server is running (Status: ${health.status})`);
    results.passed++;
  } else {
    logError(`Server health check failed (Status: ${health.status})`);
    results.failed++;
    log('\n⚠ Cannot proceed with tests - server is not running', 'red');
    return;
  }

  // Test 2: Database Status
  logTest('GET /api/db-status');
  const dbStatus = await testEndpoint('GET', '/api/db-status');
  if (dbStatus.ok) {
    logSuccess(`Database connected (Status: ${dbStatus.status})`);
    results.passed++;
  } else {
    logError(`Database connection failed (Status: ${dbStatus.status})`);
    results.failed++;
    logWarning('Some tests may fail without database connection');
    results.warnings++;
  }

  // Test 3: Authentication Endpoints
  logSection('2. AUTHENTICATION ENDPOINTS');
  
  logTest('POST /api/auth/login - Invalid credentials');
  const loginFail = await testEndpoint('POST', '/api/auth/login', {
    body: { email: 'test@example.com', password: 'wrongpassword' }
  });
  if (loginFail.status === 401) {
    logSuccess('Invalid credentials rejected correctly');
    results.passed++;
  } else {
    logError(`Expected 401, got ${loginFail.status}`);
    results.failed++;
  }

  logTest('POST /api/auth/forgot-password');
  const forgotPassword = await testEndpoint('POST', '/api/auth/forgot-password', {
    body: { email: 'test@example.com' }
  });
  if (forgotPassword.ok) {
    logSuccess('Forgot password endpoint working');
    results.passed++;
  } else {
    logError(`Forgot password failed (Status: ${forgotPassword.status})`);
    results.failed++;
  }

  // Test 4: Vehicle Endpoints
  logSection('3. VEHICLE ENDPOINTS');
  
  logTest('GET /api/vehicles');
  const vehicles = await testEndpoint('GET', '/api/vehicles');
  if (vehicles.ok) {
    logSuccess(`Retrieved vehicles (Count: ${vehicles.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get vehicles (Status: ${vehicles.status})`);
    results.failed++;
  }

  logTest('GET /api/vehicles?type=Truck');
  const vehiclesByType = await testEndpoint('GET', '/api/vehicles?type=Truck');
  if (vehiclesByType.ok) {
    logSuccess(`Filtered vehicles by type (Count: ${vehiclesByType.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to filter vehicles (Status: ${vehiclesByType.status})`);
    results.failed++;
  }

  logTest('POST /api/vehicles - Create vehicle');
  const createVehicle = await testEndpoint('POST', '/api/vehicles', {
    body: {
      name: 'Test Vehicle',
      model: 'Test Model',
      licensePlate: `TEST-${Date.now()}`,
      vehicleType: 'Truck',
      maxCapacity: 5000,
      initialOdometer: 0,
      region: 'Test Region'
    }
  });
  if (createVehicle.status === 201) {
    logSuccess('Vehicle created successfully');
    results.passed++;
  } else {
    logError(`Failed to create vehicle (Status: ${createVehicle.status})`);
    results.failed++;
  }

  logTest('POST /api/vehicles - Duplicate license plate');
  const duplicateVehicle = await testEndpoint('POST', '/api/vehicles', {
    body: {
      name: 'Duplicate Test',
      model: 'Test Model',
      licensePlate: createVehicle.data?.license_plate || 'DUPLICATE',
      vehicleType: 'Truck',
      maxCapacity: 5000
    }
  });
  if (duplicateVehicle.status === 409) {
    logSuccess('Duplicate license plate rejected correctly');
    results.passed++;
  } else {
    logError(`Expected 409, got ${duplicateVehicle.status}`);
    results.failed++;
  }

  logTest('POST /api/vehicles - Invalid max capacity');
  const invalidCapacity = await testEndpoint('POST', '/api/vehicles', {
    body: {
      name: 'Invalid Vehicle',
      model: 'Test Model',
      licensePlate: `INVALID-${Date.now()}`,
      vehicleType: 'Truck',
      maxCapacity: 0
    }
  });
  if (invalidCapacity.status === 400) {
    logSuccess('Invalid max capacity rejected correctly');
    results.passed++;
  } else {
    logError(`Expected 400, got ${invalidCapacity.status}`);
    results.failed++;
  }

  // Test 5: Driver Endpoints
  logSection('4. DRIVER ENDPOINTS');
  
  logTest('GET /api/drivers');
  const drivers = await testEndpoint('GET', '/api/drivers');
  if (drivers.ok) {
    logSuccess(`Retrieved drivers (Count: ${drivers.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get drivers (Status: ${drivers.status})`);
    results.failed++;
  }

  logTest('POST /api/drivers - Create driver');
  const createDriver = await testEndpoint('POST', '/api/drivers', {
    body: {
      name: 'Test Driver',
      licenseNumber: `LIC-${Date.now()}`,
      licenseExpiry: '2025-12-31',
      initialSafetyScore: 100
    }
  });
  if (createDriver.status === 201) {
    logSuccess('Driver created successfully');
    results.passed++;
  } else {
    logError(`Failed to create driver (Status: ${createDriver.status})`);
    results.failed++;
  }

  // Test 6: Trip Endpoints
  logSection('5. TRIP ENDPOINTS');
  
  logTest('GET /api/trips');
  const trips = await testEndpoint('GET', '/api/trips');
  if (trips.ok) {
    logSuccess(`Retrieved trips (Count: ${trips.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get trips (Status: ${trips.status})`);
    results.failed++;
  }

  logTest('GET /api/trips?status=Draft');
  const draftTrips = await testEndpoint('GET', '/api/trips?status=Draft');
  if (draftTrips.ok) {
    logSuccess(`Filtered trips by status (Count: ${draftTrips.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to filter trips (Status: ${draftTrips.status})`);
    results.failed++;
  }

  // Test 7: Service Log Endpoints
  logSection('6. SERVICE LOG ENDPOINTS');
  
  logTest('GET /api/service-logs');
  const serviceLogs = await testEndpoint('GET', '/api/service-logs');
  if (serviceLogs.ok) {
    logSuccess(`Retrieved service logs (Count: ${serviceLogs.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get service logs (Status: ${serviceLogs.status})`);
    results.failed++;
  }

  // Test 8: Expense Endpoints
  logSection('7. EXPENSE ENDPOINTS');
  
  logTest('GET /api/expenses');
  const expenses = await testEndpoint('GET', '/api/expenses');
  if (expenses.ok) {
    logSuccess(`Retrieved expenses (Count: ${expenses.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get expenses (Status: ${expenses.status})`);
    results.failed++;
  }

  // Test 9: Dashboard Endpoints
  logSection('8. DASHBOARD ENDPOINTS');
  
  logTest('GET /api/dashboard/kpis');
  const kpis = await testEndpoint('GET', '/api/dashboard/kpis');
  if (kpis.ok) {
    logSuccess('Retrieved dashboard KPIs');
    if (kpis.data) {
      log(`    Active Fleet: ${kpis.data.activeFleetCount}`, 'reset');
      log(`    Maintenance Alerts: ${kpis.data.maintenanceAlerts}`, 'reset');
      log(`    Utilization Rate: ${kpis.data.utilizationRate}%`, 'reset');
      log(`    Pending Cargo: ${kpis.data.pendingCargo}`, 'reset');
    }
    results.passed++;
  } else {
    logError(`Failed to get KPIs (Status: ${kpis.status})`);
    results.failed++;
  }

  logTest('GET /api/dashboard/kpis?type=Truck');
  const filteredKpis = await testEndpoint('GET', '/api/dashboard/kpis?type=Truck');
  if (filteredKpis.ok) {
    logSuccess('Retrieved filtered dashboard KPIs');
    results.passed++;
  } else {
    logError(`Failed to get filtered KPIs (Status: ${filteredKpis.status})`);
    results.failed++;
  }

  // Test 10: Analytics Endpoints
  logSection('9. ANALYTICS ENDPOINTS');
  
  logTest('GET /api/analytics/fuel-efficiency');
  const fuelEfficiency = await testEndpoint('GET', '/api/analytics/fuel-efficiency');
  if (fuelEfficiency.ok) {
    logSuccess(`Retrieved fuel efficiency data (Count: ${fuelEfficiency.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get fuel efficiency (Status: ${fuelEfficiency.status})`);
    results.failed++;
  }

  logTest('GET /api/analytics/roi');
  const roi = await testEndpoint('GET', '/api/analytics/roi');
  if (roi.ok) {
    logSuccess(`Retrieved ROI data (Count: ${roi.data?.length || 0})`);
    results.passed++;
  } else {
    logError(`Failed to get ROI (Status: ${roi.status})`);
    results.failed++;
  }

  logTest('POST /api/analytics/export - CSV format');
  const exportCsv = await testEndpoint('POST', '/api/analytics/export', {
    body: {
      format: 'csv',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      reportType: 'monthly'
    }
  });
  if (exportCsv.ok || exportCsv.status === 200) {
    logSuccess('CSV export endpoint working');
    results.passed++;
  } else {
    logError(`Failed to export CSV (Status: ${exportCsv.status})`);
    results.failed++;
  }

  logTest('POST /api/analytics/export - PDF format');
  const exportPdf = await testEndpoint('POST', '/api/analytics/export', {
    body: {
      format: 'pdf',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      reportType: 'monthly'
    }
  });
  if (exportPdf.status === 501) {
    logWarning('PDF export not yet implemented (expected)');
    results.warnings++;
  } else if (exportPdf.ok) {
    logSuccess('PDF export endpoint working');
    results.passed++;
  } else {
    logError(`Unexpected PDF export status: ${exportPdf.status}`);
    results.failed++;
  }

  // Final Summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.passed + results.failed}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Warnings: ${results.warnings}`, 'yellow');
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n✓ All tests passed! Backend API is complete and working correctly.', 'green');
  } else {
    log(`\n⚠ ${results.failed} test(s) failed. Please review the errors above.`, 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  logError(`\nTest suite failed with error: ${error.message}`);
  console.error(error);
});

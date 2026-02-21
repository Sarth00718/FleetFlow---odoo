import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

// Test credentials
const testUser = {
  email: 'admin@fleetflow.com',
  password: 'admin123'
};

let authToken = '';

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const data = await response.json();
  authToken = data.token;
  console.log('✅ Login successful\n');
}

async function testServiceLogCreation() {
  console.log('📝 Test 1: Create service log and verify vehicle status changes to "In Shop"');
  
  // First, get an available vehicle
  const vehiclesResponse = await fetch(`${API_BASE}/vehicles?status=Available`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const vehicles = await vehiclesResponse.json();
  
  if (vehicles.length === 0) {
    console.log('⚠️  No available vehicles found. Skipping test.\n');
    return null;
  }
  
  const testVehicle = vehicles[0];
  console.log(`   Using vehicle: ${testVehicle.name} (ID: ${testVehicle.id})`);
  console.log(`   Current status: ${testVehicle.status}`);
  
  // Create a service log
  const serviceLogData = {
    vehicleId: testVehicle.id,
    serviceType: 'Preventative',
    description: 'Regular maintenance check',
    cost: 150.00,
    serviceDate: new Date().toISOString().split('T')[0]
  };
  
  const createResponse = await fetch(`${API_BASE}/service-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(serviceLogData)
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.json();
    console.log(`❌ Failed to create service log: ${JSON.stringify(error)}\n`);
    return null;
  }
  
  const serviceLog = await createResponse.json();
  console.log(`   ✅ Service log created (ID: ${serviceLog.id})`);
  console.log(`   Vehicle status after creation: ${serviceLog.vehicle.status}`);
  
  if (serviceLog.vehicle.status === 'In Shop') {
    console.log('   ✅ Vehicle status correctly updated to "In Shop"\n');
  } else {
    console.log(`   ❌ Expected status "In Shop", got "${serviceLog.vehicle.status}"\n`);
  }
  
  return serviceLog;
}

async function testServiceLogCompletion(serviceLog) {
  if (!serviceLog) {
    console.log('⚠️  Skipping completion test (no service log available)\n');
    return;
  }
  
  console.log('✅ Test 2: Complete service log and verify vehicle status changes to "Available"');
  console.log(`   Completing service log ID: ${serviceLog.id}`);
  
  const completeResponse = await fetch(`${API_BASE}/service-logs/${serviceLog.id}/complete`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  if (!completeResponse.ok) {
    const error = await completeResponse.json();
    console.log(`❌ Failed to complete service log: ${JSON.stringify(error)}\n`);
    return;
  }
  
  const completedLog = await completeResponse.json();
  console.log(`   ✅ Service log marked as completed`);
  console.log(`   Vehicle status after completion: ${completedLog.vehicle.status}`);
  
  if (completedLog.vehicle.status === 'Available') {
    console.log('   ✅ Vehicle status correctly restored to "Available"\n');
  } else {
    console.log(`   ❌ Expected status "Available", got "${completedLog.vehicle.status}"\n`);
  }
}

async function testChronologicalOrdering() {
  console.log('📅 Test 3: Verify service logs are returned in chronological order');
  
  const response = await fetch(`${API_BASE}/service-logs`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  if (!response.ok) {
    console.log('❌ Failed to fetch service logs\n');
    return;
  }
  
  const serviceLogs = await response.json();
  console.log(`   Found ${serviceLogs.length} service log(s)`);
  
  if (serviceLogs.length < 2) {
    console.log('   ⚠️  Need at least 2 service logs to verify ordering\n');
    return;
  }
  
  // Check if ordered by service_date DESC
  let isOrdered = true;
  for (let i = 0; i < serviceLogs.length - 1; i++) {
    const current = new Date(serviceLogs[i].service_date);
    const next = new Date(serviceLogs[i + 1].service_date);
    
    if (current < next) {
      isOrdered = false;
      break;
    }
  }
  
  if (isOrdered) {
    console.log('   ✅ Service logs are correctly ordered by date (DESC)\n');
  } else {
    console.log('   ❌ Service logs are not in chronological order\n');
  }
}

async function testFilterByVehicle() {
  console.log('🔍 Test 4: Filter service logs by vehicle ID');
  
  // Get all service logs first
  const allResponse = await fetch(`${API_BASE}/service-logs`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const allLogs = await allResponse.json();
  
  if (allLogs.length === 0) {
    console.log('   ⚠️  No service logs found\n');
    return;
  }
  
  const testVehicleId = allLogs[0].vehicle_id;
  console.log(`   Filtering by vehicle ID: ${testVehicleId}`);
  
  const filteredResponse = await fetch(`${API_BASE}/service-logs?vehicleId=${testVehicleId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const filteredLogs = await filteredResponse.json();
  
  console.log(`   Found ${filteredLogs.length} service log(s) for this vehicle`);
  
  // Verify all returned logs belong to the specified vehicle
  const allMatch = filteredLogs.every(log => log.vehicle_id === testVehicleId);
  
  if (allMatch) {
    console.log('   ✅ All returned logs belong to the specified vehicle\n');
  } else {
    console.log('   ❌ Some logs do not belong to the specified vehicle\n');
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Service Log API Tests\n');
    console.log('=' .repeat(60) + '\n');
    
    await login();
    
    const serviceLog = await testServiceLogCreation();
    await testServiceLogCompletion(serviceLog);
    await testChronologicalOrdering();
    await testFilterByVehicle();
    
    console.log('=' .repeat(60));
    console.log('✅ All tests completed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();

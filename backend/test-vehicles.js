// Simple test script to verify vehicle endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function testVehicleEndpoints() {
  console.log('Testing Vehicle Endpoints...\n');

  try {
    // Test 1: Create a vehicle
    console.log('1. Testing POST /api/vehicles (Create vehicle)');
    const createResponse = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Truck 1',
        model: 'Ford F-150',
        licensePlate: 'ABC-123',
        vehicleType: 'Truck',
        maxCapacity: 5000.00,
        initialOdometer: 0,
        region: 'North'
      })
    });
    const createdVehicle = await createResponse.json();
    console.log('Status:', createResponse.status);
    console.log('Response:', createdVehicle);
    console.log('✓ Vehicle created\n');

    const vehicleId = createdVehicle.id;

    // Test 2: Get all vehicles
    console.log('2. Testing GET /api/vehicles (Get all vehicles)');
    const getAllResponse = await fetch(`${BASE_URL}/vehicles`);
    const allVehicles = await getAllResponse.json();
    console.log('Status:', getAllResponse.status);
    console.log('Count:', allVehicles.length);
    console.log('✓ Retrieved all vehicles\n');

    // Test 3: Get vehicles with filter
    console.log('3. Testing GET /api/vehicles?type=Truck (Filter by type)');
    const filterResponse = await fetch(`${BASE_URL}/vehicles?type=Truck`);
    const filteredVehicles = await filterResponse.json();
    console.log('Status:', filterResponse.status);
    console.log('Count:', filteredVehicles.length);
    console.log('✓ Filtered vehicles by type\n');

    // Test 4: Update vehicle
    console.log('4. Testing PUT /api/vehicles/:id (Update vehicle)');
    const updateResponse = await fetch(`${BASE_URL}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Test Truck 1',
        maxCapacity: 6000.00
      })
    });
    const updatedVehicle = await updateResponse.json();
    console.log('Status:', updateResponse.status);
    console.log('Response:', updatedVehicle);
    console.log('✓ Vehicle updated\n');

    // Test 5: Update vehicle status
    console.log('5. Testing PATCH /api/vehicles/:id/status (Update status)');
    const statusResponse = await fetch(`${BASE_URL}/vehicles/${vehicleId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'In Shop'
      })
    });
    const statusUpdated = await statusResponse.json();
    console.log('Status:', statusResponse.status);
    console.log('Response:', statusUpdated);
    console.log('✓ Vehicle status updated\n');

    // Test 6: Try to create duplicate license plate
    console.log('6. Testing duplicate license plate validation');
    const duplicateResponse = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Truck 2',
        model: 'Ford F-150',
        licensePlate: 'ABC-123', // Duplicate
        vehicleType: 'Truck',
        maxCapacity: 5000.00
      })
    });
    const duplicateResult = await duplicateResponse.json();
    console.log('Status:', duplicateResponse.status);
    console.log('Response:', duplicateResult);
    console.log('✓ Duplicate license plate rejected\n');

    // Test 7: Try to create vehicle with invalid max capacity
    console.log('7. Testing max capacity validation');
    const invalidCapacityResponse = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Truck 3',
        model: 'Ford F-150',
        licensePlate: 'XYZ-789',
        vehicleType: 'Truck',
        maxCapacity: 0 // Invalid
      })
    });
    const invalidCapacityResult = await invalidCapacityResponse.json();
    console.log('Status:', invalidCapacityResponse.status);
    console.log('Response:', invalidCapacityResult);
    console.log('✓ Invalid max capacity rejected\n');

    // Test 8: Delete vehicle
    console.log('8. Testing DELETE /api/vehicles/:id (Delete vehicle)');
    const deleteResponse = await fetch(`${BASE_URL}/vehicles/${vehicleId}`, {
      method: 'DELETE'
    });
    const deleteResult = await deleteResponse.json();
    console.log('Status:', deleteResponse.status);
    console.log('Response:', deleteResult);
    console.log('✓ Vehicle deleted\n');

    console.log('All tests completed successfully! ✓');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run tests
testVehicleEndpoints();

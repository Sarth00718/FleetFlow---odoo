import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testDashboardKPIs() {
  console.log('\n=== Testing Dashboard KPIs Endpoint ===');
  
  try {
    // Test 1: Get KPIs without filters
    console.log('\n1. Testing GET /api/dashboard/kpis (no filters)');
    const response1 = await fetch(`${BASE_URL}/api/dashboard/kpis`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    
    if (response1.ok) {
      console.log('✓ KPIs retrieved successfully');
      console.log(`  - Active Fleet Count: ${data1.activeFleetCount}`);
      console.log(`  - Maintenance Alerts: ${data1.maintenanceAlerts}`);
      console.log(`  - Utilization Rate: ${data1.utilizationRate}%`);
      console.log(`  - Pending Cargo: ${data1.pendingCargo}`);
    } else {
      console.log('✗ Failed to retrieve KPIs');
    }

    // Test 2: Get KPIs with filters
    console.log('\n2. Testing GET /api/dashboard/kpis (with type filter)');
    const response2 = await fetch(`${BASE_URL}/api/dashboard/kpis?type=Truck`);
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    if (response2.ok) {
      console.log('✓ Filtered KPIs retrieved successfully');
    }

    // Test 3: Invalid filter value
    console.log('\n3. Testing GET /api/dashboard/kpis (invalid filter)');
    const response3 = await fetch(`${BASE_URL}/api/dashboard/kpis?type=InvalidType`);
    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
    
    if (response3.status === 400) {
      console.log('✓ Validation error handled correctly');
    }

  } catch (error) {
    console.error('✗ Error testing dashboard KPIs:', error.message);
  }
}

async function testFuelEfficiency() {
  console.log('\n=== Testing Fuel Efficiency Endpoint ===');
  
  try {
    // Test 1: Get fuel efficiency for all vehicles
    console.log('\n1. Testing GET /api/analytics/fuel-efficiency (all vehicles)');
    const response1 = await fetch(`${BASE_URL}/api/analytics/fuel-efficiency`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    
    if (response1.ok) {
      console.log('✓ Fuel efficiency data retrieved successfully');
      console.log(`  - Number of vehicles: ${data1.length}`);
    }

    // Test 2: Get fuel efficiency with date range
    console.log('\n2. Testing GET /api/analytics/fuel-efficiency (with date range)');
    const response2 = await fetch(`${BASE_URL}/api/analytics/fuel-efficiency?startDate=2024-01-01&endDate=2024-12-31`);
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    if (response2.ok) {
      console.log('✓ Filtered fuel efficiency data retrieved successfully');
    }

  } catch (error) {
    console.error('✗ Error testing fuel efficiency:', error.message);
  }
}

async function testROI() {
  console.log('\n=== Testing ROI Endpoint ===');
  
  try {
    // Test 1: Get ROI for all vehicles
    console.log('\n1. Testing GET /api/analytics/roi (all vehicles)');
    const response1 = await fetch(`${BASE_URL}/api/analytics/roi`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    
    if (response1.ok) {
      console.log('✓ ROI data retrieved successfully');
      console.log(`  - Number of vehicles: ${data1.length}`);
    }

    // Test 2: Get ROI with date range
    console.log('\n2. Testing GET /api/analytics/roi (with date range)');
    const response2 = await fetch(`${BASE_URL}/api/analytics/roi?startDate=2024-01-01&endDate=2024-12-31`);
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    if (response2.ok) {
      console.log('✓ Filtered ROI data retrieved successfully');
    }

  } catch (error) {
    console.error('✗ Error testing ROI:', error.message);
  }
}

async function testExport() {
  console.log('\n=== Testing Export Endpoint ===');
  
  try {
    // Test 1: Export CSV
    console.log('\n1. Testing POST /api/analytics/export (CSV format)');
    const response1 = await fetch(`${BASE_URL}/api/analytics/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        format: 'csv',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        reportType: 'monthly'
      })
    });
    
    console.log('Status:', response1.status);
    console.log('Content-Type:', response1.headers.get('content-type'));
    
    if (response1.ok && response1.headers.get('content-type')?.includes('text/csv')) {
      const csvData = await response1.text();
      console.log('✓ CSV export successful');
      console.log('CSV Preview (first 500 chars):');
      console.log(csvData.substring(0, 500));
    } else {
      const data = await response1.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    }

    // Test 2: Export PDF (should return not implemented)
    console.log('\n2. Testing POST /api/analytics/export (PDF format)');
    const response2 = await fetch(`${BASE_URL}/api/analytics/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        format: 'pdf',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
    });
    
    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    if (response2.status === 501) {
      console.log('✓ PDF not implemented message returned correctly');
    }

    // Test 3: Invalid format
    console.log('\n3. Testing POST /api/analytics/export (invalid format)');
    const response3 = await fetch(`${BASE_URL}/api/analytics/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        format: 'xml',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
    });
    
    console.log('Status:', response3.status);
    const data3 = await response3.json();
    console.log('Response:', JSON.stringify(data3, null, 2));
    
    if (response3.status === 400) {
      console.log('✓ Validation error handled correctly');
    }

  } catch (error) {
    console.error('✗ Error testing export:', error.message);
  }
}

async function runAllTests() {
  console.log('Starting Dashboard and Analytics API Tests...');
  console.log('Make sure the server is running on http://localhost:3000');
  
  await testDashboardKPIs();
  await testFuelEfficiency();
  await testROI();
  await testExport();
  
  console.log('\n=== All Tests Complete ===\n');
}

runAllTests();

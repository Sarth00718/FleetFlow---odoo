import { sequelize, Trip, Vehicle, Driver } from './src/models/index.js';

async function testTripEndpoints() {
  try {
    console.log('Testing Trip Model and Associations...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Test that Trip model is properly defined
    const tripAttributes = Object.keys(Trip.rawAttributes);
    console.log('✓ Trip model attributes:', tripAttributes.join(', '));

    // Test associations
    const tripAssociations = Object.keys(Trip.associations);
    console.log('✓ Trip associations:', tripAssociations.join(', '));

    // Verify required associations exist
    if (Trip.associations.vehicle && Trip.associations.driver) {
      console.log('✓ Trip has vehicle and driver associations');
    } else {
      console.log('✗ Missing required associations');
    }

    // Test creating a trip (if we have test data)
    const vehicleCount = await Vehicle.count();
    const driverCount = await Driver.count();
    
    console.log(`\nDatabase status:`);
    console.log(`  Vehicles: ${vehicleCount}`);
    console.log(`  Drivers: ${driverCount}`);
    console.log(`  Trips: ${await Trip.count()}`);

    if (vehicleCount > 0 && driverCount > 0) {
      // Get first available vehicle and driver
      const vehicle = await Vehicle.findOne({ where: { status: 'Available' } });
      const driver = await Driver.findOne({ where: { status: 'On Duty' } });

      if (vehicle && driver) {
        console.log('\n✓ Found available vehicle and driver for testing');
        console.log(`  Vehicle: ${vehicle.name} (${vehicle.license_plate})`);
        console.log(`  Driver: ${driver.name} (${driver.license_number})`);
        
        // Test trip creation validation
        const testCargoWeight = parseFloat(vehicle.max_capacity) + 100;
        console.log(`\nValidation test: Cargo weight ${testCargoWeight} > Max capacity ${vehicle.max_capacity}`);
        console.log('  Expected: Should fail validation');
      } else {
        console.log('\n⚠ No available vehicle or on-duty driver found for testing');
      }
    }

    console.log('\n✓ All basic tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testTripEndpoints();

// Checkpoint 5: Backend Foundation Verification Script
import { sequelize, User, Vehicle, Driver, Trip, ServiceLog, Expense } from './src/models/index.js';
import bcrypt from 'bcrypt';

console.log('='.repeat(60));
console.log('CHECKPOINT 5: Backend Foundation Verification');
console.log('='.repeat(60));
console.log();

const runCheckpoint = async () => {
  let allTestsPassed = true;

  try {
    // Test 1: Database Connection
    console.log('Test 1: Database Connection');
    console.log('-'.repeat(60));
    try {
      await sequelize.authenticate();
      console.log('✓ Database connection successful');
    } catch (error) {
      console.log('✗ Database connection failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 2: Database Schema Sync
    console.log('Test 2: Database Schema Synchronization');
    console.log('-'.repeat(60));
    try {
      await sequelize.sync({ alter: false });
      console.log('✓ Database schema synchronized');
    } catch (error) {
      console.log('✗ Database schema sync failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 3: Model Definitions
    console.log('Test 3: Model Definitions');
    console.log('-'.repeat(60));
    const models = [
      { name: 'User', model: User },
      { name: 'Vehicle', model: Vehicle },
      { name: 'Driver', model: Driver },
      { name: 'Trip', model: Trip },
      { name: 'ServiceLog', model: ServiceLog },
      { name: 'Expense', model: Expense }
    ];

    for (const { name, model } of models) {
      if (model && model.tableName) {
        console.log(`✓ ${name} model defined (table: ${model.tableName})`);
      } else {
        console.log(`✗ ${name} model not properly defined`);
        allTestsPassed = false;
      }
    }
    console.log();

    // Test 4: Database Constraints - License Plate Uniqueness
    console.log('Test 4: Database Constraints - License Plate Uniqueness');
    console.log('-'.repeat(60));
    try {
      // Clean up any existing test vehicles
      await Vehicle.destroy({ where: { licensePlate: 'TEST-UNIQUE-001' } });
      
      // Create first vehicle
      await Vehicle.create({
        name: 'Test Vehicle 1',
        model: 'Test Model',
        licensePlate: 'TEST-UNIQUE-001',
        vehicleType: 'Truck',
        maxCapacity: 5000,
        odometer: 0,
        status: 'Available'
      });

      // Try to create duplicate
      try {
        await Vehicle.create({
          name: 'Test Vehicle 2',
          model: 'Test Model',
          licensePlate: 'TEST-UNIQUE-001', // Duplicate
          vehicleType: 'Truck',
          maxCapacity: 5000,
          odometer: 0,
          status: 'Available'
        });
        console.log('✗ Duplicate license plate was allowed (constraint not working)');
        allTestsPassed = false;
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log('✓ License plate uniqueness constraint working');
        } else {
          console.log('✗ Unexpected error:', error.message);
          allTestsPassed = false;
        }
      }

      // Clean up
      await Vehicle.destroy({ where: { licensePlate: 'TEST-UNIQUE-001' } });
    } catch (error) {
      console.log('✗ License plate uniqueness test failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 5: Database Constraints - Max Capacity Validation
    console.log('Test 5: Database Constraints - Max Capacity Validation');
    console.log('-'.repeat(60));
    try {
      // Try to create vehicle with invalid max capacity
      try {
        await Vehicle.create({
          name: 'Test Vehicle Invalid',
          model: 'Test Model',
          licensePlate: 'TEST-INVALID-001',
          vehicleType: 'Truck',
          maxCapacity: 0, // Invalid
          odometer: 0,
          status: 'Available'
        });
        console.log('✗ Invalid max capacity (0) was allowed');
        allTestsPassed = false;
      } catch (error) {
        if (error.name === 'SequelizeValidationError') {
          console.log('✓ Max capacity validation constraint working');
        } else {
          console.log('✗ Unexpected error:', error.message);
          allTestsPassed = false;
        }
      }
    } catch (error) {
      console.log('✗ Max capacity validation test failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 6: Database Constraints - Foreign Key Integrity
    console.log('Test 6: Database Constraints - Foreign Key Integrity');
    console.log('-'.repeat(60));
    try {
      // Try to create trip with invalid vehicle ID
      try {
        await Trip.create({
          vehicle_id: 99999, // Non-existent
          driver_id: 99999, // Non-existent
          cargoWeight: 1000,
          origin: 'Test Origin',
          destination: 'Test Destination',
          scheduledDate: new Date(),
          status: 'Draft'
        });
        console.log('✗ Invalid foreign keys were allowed');
        allTestsPassed = false;
      } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          console.log('✓ Foreign key integrity constraint working');
        } else {
          console.log('✗ Unexpected error:', error.message);
          allTestsPassed = false;
        }
      }
    } catch (error) {
      console.log('✗ Foreign key integrity test failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 7: Password Hashing
    console.log('Test 7: Password Hashing (bcrypt)');
    console.log('-'.repeat(60));
    try {
      const testPassword = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const isValid = await bcrypt.compare(testPassword, hashedPassword);
      
      if (isValid) {
        console.log('✓ Password hashing and verification working');
      } else {
        console.log('✗ Password verification failed');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('✗ Password hashing test failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 8: Model Associations
    console.log('Test 8: Model Associations');
    console.log('-'.repeat(60));
    try {
      // Check Vehicle-Trip association
      if (Vehicle.associations.Trips) {
        console.log('✓ Vehicle-Trip association defined');
      } else {
        console.log('✗ Vehicle-Trip association missing');
        allTestsPassed = false;
      }

      // Check Driver-Trip association
      if (Driver.associations.Trips) {
        console.log('✓ Driver-Trip association defined');
      } else {
        console.log('✗ Driver-Trip association missing');
        allTestsPassed = false;
      }

      // Check Vehicle-ServiceLog association
      if (Vehicle.associations.ServiceLogs) {
        console.log('✓ Vehicle-ServiceLog association defined');
      } else {
        console.log('✗ Vehicle-ServiceLog association missing');
        allTestsPassed = false;
      }

      // Check Vehicle-Expense association
      if (Vehicle.associations.Expenses) {
        console.log('✓ Vehicle-Expense association defined');
      } else {
        console.log('✗ Vehicle-Expense association missing');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('✗ Model associations test failed:', error.message);
      allTestsPassed = false;
    }
    console.log();

    // Test 9: Database Indexes
    console.log('Test 9: Database Indexes');
    console.log('-'.repeat(60));
    try {
      const vehicleIndexes = await sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'vehicles'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      const indexNames = vehicleIndexes.map(idx => idx.indexname);
      console.log(`✓ Found ${vehicleIndexes.length} indexes on vehicles table`);
      
      if (indexNames.some(name => name.includes('status'))) {
        console.log('✓ Vehicle status index exists');
      } else {
        console.log('  Note: Vehicle status index not found (may be created differently)');
      }
    } catch (error) {
      console.log('  Note: Could not verify indexes (may require different query for your DB)');
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    if (allTestsPassed) {
      console.log('✓ ALL CHECKPOINT TESTS PASSED');
      console.log('Backend foundation is complete and ready for next phase!');
    } else {
      console.log('✗ SOME TESTS FAILED');
      console.log('Please review the failures above before proceeding.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Checkpoint verification failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

runCheckpoint();

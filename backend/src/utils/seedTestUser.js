import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { sequelize } from '../models/index.js';

/**
 * Seed a test user for authentication testing
 * Email: admin@fleetflow.com
 * Password: password123
 * Role: Fleet Manager
 */
async function seedTestUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email: 'admin@fleetflow.com' } 
    });

    if (existingUser) {
      console.log('Test user already exists.');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash('password123', saltRounds);

    // Create test user
    await User.create({
      email: 'admin@fleetflow.com',
      password_hash,
      role: 'Fleet Manager'
    });

    console.log('Test user created successfully!');
    console.log('Email: admin@fleetflow.com');
    console.log('Password: password123');
    console.log('Role: Fleet Manager');
  } catch (error) {
    console.error('Error seeding test user:', error);
  } finally {
    await sequelize.close();
  }
}

seedTestUser();

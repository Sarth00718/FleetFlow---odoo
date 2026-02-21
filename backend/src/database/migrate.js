import { sequelize } from '../models/index.js';

const migrate = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Synchronizing database schema...');
    await sequelize.sync({ force: false });
    console.log('Database schema synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
};

migrate();

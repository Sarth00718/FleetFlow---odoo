import sequelize from '../config/database.js';
import User from './User.js';
import Vehicle from './Vehicle.js';
import Driver from './Driver.js';
import Trip from './Trip.js';
import ServiceLog from './ServiceLog.js';
import Expense from './Expense.js';

// Define associations
Vehicle.hasMany(Trip, { foreignKey: 'vehicle_id', as: 'trips', onDelete: 'RESTRICT' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

Driver.hasMany(Trip, { foreignKey: 'driver_id', as: 'trips', onDelete: 'RESTRICT' });
Trip.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Vehicle.hasMany(ServiceLog, { foreignKey: 'vehicle_id', as: 'serviceLogs', onDelete: 'RESTRICT' });
ServiceLog.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

Vehicle.hasMany(Expense, { foreignKey: 'vehicle_id', as: 'expenses', onDelete: 'RESTRICT' });
Expense.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

export {
  sequelize,
  User,
  Vehicle,
  Driver,
  Trip,
  ServiceLog,
  Expense
};

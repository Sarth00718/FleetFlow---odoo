import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  license_plate: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['Truck', 'Van', 'Bike']]
    }
  },
  max_capacity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  odometer: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Available',
    validate: {
      isIn: [['Available', 'In Shop', 'Out of Service', 'On Trip']]
    }
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  acquisition_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['license_plate']
    }
  ]
});

export default Vehicle;

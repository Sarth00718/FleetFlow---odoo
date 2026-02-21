import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  cargo_weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  origin: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  scheduled_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Draft',
    validate: {
      isIn: [['Draft', 'Dispatched', 'Completed', 'Cancelled']]
    }
  },
  starting_odometer: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  final_odometer: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      isValidOdometer(value) {
        if (value !== null && this.starting_odometer !== null && value < this.starting_odometer) {
          throw new Error('Final odometer must be greater than or equal to starting odometer');
        }
      }
    }
  },
  distance_traveled: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'trips',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vehicle_id']
    },
    {
      fields: ['driver_id']
    },
    {
      fields: ['status']
    }
  ]
});

export default Trip;

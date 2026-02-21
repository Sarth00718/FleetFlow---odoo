import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  license_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  license_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Off Duty',
    validate: {
      isIn: [['On Duty', 'Off Duty', 'Suspended']]
    }
  },
  safety_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 100.00,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'drivers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['license_expiry']
    },
    {
      fields: ['status']
    }
  ]
});

export default Driver;

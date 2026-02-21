import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Expense = sequelize.define('Expense', {
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
  expense_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['Fuel', 'Maintenance']]
    }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  liters: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0.01
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['vehicle_id']
    },
    {
      fields: ['expense_type']
    },
    {
      fields: ['expense_date']
    }
  ]
});

export default Expense;

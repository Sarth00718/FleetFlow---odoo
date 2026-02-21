import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ServiceLog = sequelize.define('ServiceLog', {
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
  service_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [['Preventative', 'Reactive', 'Inspection']]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  service_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'service_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vehicle_id']
    },
    {
      fields: ['completed']
    }
  ]
});

export default ServiceLog;

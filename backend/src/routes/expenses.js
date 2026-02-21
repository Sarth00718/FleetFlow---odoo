import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Expense, Vehicle } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/expenses - Get all expenses with optional filtering
router.get('/',
  [
    query('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer'),
    query('type').optional().isIn(['Fuel', 'Maintenance']).withMessage('Invalid expense type'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, type, startDate, endDate } = req.query;
      const whereClause = {};

      if (vehicleId) {
        whereClause.vehicle_id = vehicleId;
      }
      if (type) {
        whereClause.expense_type = type;
      }
      if (startDate || endDate) {
        whereClause.expense_date = {};
        if (startDate) {
          whereClause.expense_date[Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.expense_date[Op.lte] = endDate;
        }
      }

      const expenses = await Expense.findAll({
        where: whereClause,
        order: [['expense_date', 'ASC'], ['created_at', 'ASC']],
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'name', 'license_plate']
        }]
      });

      res.json(expenses);
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/expenses - Create a new expense
router.post('/',
  [
    body('vehicleId').isInt().withMessage('Vehicle ID is required and must be an integer'),
    body('expenseType').isIn(['Fuel', 'Maintenance']).withMessage('Expense type must be Fuel or Maintenance'),
    body('cost').isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
    body('expenseDate').isISO8601().withMessage('Expense date is required and must be a valid date'),
    body('liters').optional().isFloat({ min: 0.01 }).withMessage('Liters must be greater than 0'),
    body('description').optional().isString().withMessage('Description must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, expenseType, cost, expenseDate, liters, description } = req.body;

      // Validate vehicle exists (referential integrity)
      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }

      // Create expense record
      const expense = await Expense.create({
        vehicle_id: vehicleId,
        expense_type: expenseType,
        cost,
        expense_date: expenseDate,
        liters: liters || null,
        description: description || null
      });

      // Fetch the created expense with vehicle details
      const createdExpense = await Expense.findByPk(expense.id, {
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'name', 'license_plate']
        }]
      });

      res.status(201).json(createdExpense);
    } catch (error) {
      console.error('Create expense error:', error);
      
      // Handle foreign key constraint violation
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/expenses/operational-cost/:vehicleId - Get operational cost for a vehicle
router.get('/operational-cost/:vehicleId',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId } = req.params;
      const { startDate, endDate } = req.query;

      // Validate vehicle exists
      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const whereClause = { vehicle_id: vehicleId };

      // Apply date range filter if provided
      if (startDate || endDate) {
        whereClause.expense_date = {};
        if (startDate) {
          whereClause.expense_date[Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.expense_date[Op.lte] = endDate;
        }
      }

      // Get all expenses for the vehicle
      const expenses = await Expense.findAll({
        where: whereClause,
        attributes: ['expense_type', 'cost']
      });

      // Calculate operational cost (sum of fuel + maintenance)
      let totalFuel = 0;
      let totalMaintenance = 0;

      expenses.forEach(expense => {
        const cost = parseFloat(expense.cost);
        if (expense.expense_type === 'Fuel') {
          totalFuel += cost;
        } else if (expense.expense_type === 'Maintenance') {
          totalMaintenance += cost;
        }
      });

      const operationalCost = totalFuel + totalMaintenance;

      res.json({
        vehicleId: parseInt(vehicleId),
        totalFuel: parseFloat(totalFuel.toFixed(2)),
        totalMaintenance: parseFloat(totalMaintenance.toFixed(2)),
        operationalCost: parseFloat(operationalCost.toFixed(2))
      });
    } catch (error) {
      console.error('Get operational cost error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

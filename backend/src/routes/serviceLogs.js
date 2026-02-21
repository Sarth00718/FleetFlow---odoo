import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { ServiceLog, Vehicle } from '../models/index.js';

const router = express.Router();

// GET /api/service-logs - Get all service logs with optional filtering
router.get('/',
  [
    query('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId } = req.query;
      const whereClause = {};

      if (vehicleId) {
        whereClause.vehicle_id = vehicleId;
      }

      const serviceLogs = await ServiceLog.findAll({
        where: whereClause,
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'model', 'license_plate', 'status']
          }
        ],
        order: [['service_date', 'DESC'], ['created_at', 'DESC']]
      });

      res.json(serviceLogs);
    } catch (error) {
      console.error('Get service logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/service-logs - Create a new service log with automatic vehicle status update
router.post('/',
  [
    body('vehicleId').isInt().withMessage('Vehicle ID is required and must be an integer'),
    body('serviceType').isIn(['Preventative', 'Reactive', 'Inspection']).withMessage('Invalid service type'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('cost').isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
    body('serviceDate').isISO8601().withMessage('Service date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, serviceType, description, cost, serviceDate } = req.body;

      // Validate vehicle exists
      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }

      // Create service log
      const serviceLog = await ServiceLog.create({
        vehicle_id: vehicleId,
        service_type: serviceType,
        description: description || null,
        cost,
        service_date: serviceDate,
        completed: false
      });

      // Auto-update vehicle status to "In Shop"
      await vehicle.update({ status: 'In Shop' });

      // Emit WebSocket event for vehicle status change
      const io = req.app.get('io');
      if (io) {
        io.to('vehicles').emit('vehicle:statusChanged', {
          vehicleId: vehicle.id,
          status: 'In Shop',
          timestamp: new Date().toISOString()
        });
      }

      // Fetch the created service log with associations
      const createdServiceLog = await ServiceLog.findByPk(serviceLog.id, {
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'model', 'license_plate', 'status']
          }
        ]
      });

      res.status(201).json(createdServiceLog);
    } catch (error) {
      console.error('Create service log error:', error);
      
      // Handle foreign key constraint violations
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/service-logs/:id/complete - Mark service log as completed with status restoration
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const serviceLog = await ServiceLog.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        }
      ]
    });

    if (!serviceLog) {
      return res.status(404).json({ error: 'Service log not found' });
    }

    // Check if already completed
    if (serviceLog.completed) {
      return res.status(400).json({ error: 'Service log is already completed' });
    }

    // Mark service log as completed
    await serviceLog.update({ completed: true });

    // Auto-update vehicle status back to "Available"
    await serviceLog.vehicle.update({ status: 'Available' });

    // Emit WebSocket event for vehicle status change
    const io = req.app.get('io');
    if (io) {
      io.to('vehicles').emit('vehicle:statusChanged', {
        vehicleId: serviceLog.vehicle.id,
        status: 'Available',
        timestamp: new Date().toISOString()
      });
    }

    // Fetch updated service log with associations
    const updatedServiceLog = await ServiceLog.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'name', 'model', 'license_plate', 'status']
        }
      ]
    });

    res.json(updatedServiceLog);
  } catch (error) {
    console.error('Complete service log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Vehicle, Trip, ServiceLog } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/vehicles - Get all vehicles with optional filtering
router.get('/',
  [
    query('type').optional().isIn(['Truck', 'Van', 'Bike']).withMessage('Invalid vehicle type'),
    query('status').optional().isIn(['Available', 'In Shop', 'Out of Service', 'On Trip']).withMessage('Invalid status'),
    query('region').optional().isString().withMessage('Region must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, status, region } = req.query;
      const whereClause = {};

      if (type) {
        whereClause.vehicle_type = type;
      }
      if (status) {
        whereClause.status = status;
      }
      if (region) {
        whereClause.region = region;
      }

      const vehicles = await Vehicle.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      res.json(vehicles);
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/vehicles - Create a new vehicle
router.post('/',
  [
    body('name').notEmpty().withMessage('Vehicle name is required'),
    body('model').notEmpty().withMessage('Vehicle model is required'),
    body('licensePlate').notEmpty().withMessage('License plate is required'),
    body('vehicleType').isIn(['Truck', 'Van', 'Bike']).withMessage('Invalid vehicle type'),
    body('maxCapacity').isFloat({ min: 0.01 }).withMessage('Max capacity must be greater than 0'),
    body('initialOdometer').optional().isFloat({ min: 0 }).withMessage('Initial odometer must be non-negative'),
    body('region').optional().isString().withMessage('Region must be a string'),
    body('acquisitionCost').optional().isFloat({ min: 0 }).withMessage('Acquisition cost must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, model, licensePlate, vehicleType, maxCapacity, initialOdometer, region, acquisitionCost } = req.body;

      // Check for duplicate license plate
      const existingVehicle = await Vehicle.findOne({
        where: { license_plate: licensePlate }
      });

      if (existingVehicle) {
        return res.status(409).json({ error: 'License plate already exists' });
      }

      // Create vehicle with Available status
      const vehicle = await Vehicle.create({
        name,
        model,
        license_plate: licensePlate,
        vehicle_type: vehicleType,
        max_capacity: maxCapacity,
        odometer: initialOdometer || 0,
        status: 'Available',
        region: region || null,
        acquisition_cost: acquisitionCost || null
      });

      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Create vehicle error:', error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'License plate already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/vehicles/:id - Update a vehicle
router.put('/:id',
  [
    body('name').optional().notEmpty().withMessage('Vehicle name cannot be empty'),
    body('model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
    body('licensePlate').optional().notEmpty().withMessage('License plate cannot be empty'),
    body('vehicleType').optional().isIn(['Truck', 'Van', 'Bike']).withMessage('Invalid vehicle type'),
    body('maxCapacity').optional().isFloat({ min: 0.01 }).withMessage('Max capacity must be greater than 0'),
    body('status').optional().isIn(['Available', 'In Shop', 'Out of Service', 'On Trip']).withMessage('Invalid status'),
    body('region').optional().isString().withMessage('Region must be a string'),
    body('acquisitionCost').optional().isFloat({ min: 0 }).withMessage('Acquisition cost must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const vehicle = await Vehicle.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const updateData = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.model !== undefined) updateData.model = req.body.model;
      if (req.body.licensePlate !== undefined) {
        // Check for duplicate license plate (excluding current vehicle)
        const existingVehicle = await Vehicle.findOne({
          where: { 
            license_plate: req.body.licensePlate,
            id: { [Op.ne]: id }
          }
        });

        if (existingVehicle) {
          return res.status(409).json({ error: 'License plate already exists' });
        }
        updateData.license_plate = req.body.licensePlate;
      }
      if (req.body.vehicleType !== undefined) updateData.vehicle_type = req.body.vehicleType;
      if (req.body.maxCapacity !== undefined) updateData.max_capacity = req.body.maxCapacity;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.region !== undefined) updateData.region = req.body.region;
      if (req.body.acquisitionCost !== undefined) updateData.acquisition_cost = req.body.acquisitionCost;

      await vehicle.update(updateData);

      res.json(vehicle);
    } catch (error) {
      console.error('Update vehicle error:', error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'License plate already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/vehicles/:id - Delete a vehicle with dependency checking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check for active trips (Dispatched status)
    const activeTrips = await Trip.count({
      where: {
        vehicle_id: id,
        status: 'Dispatched'
      }
    });

    if (activeTrips > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete: vehicle has active trips' 
      });
    }

    // Check for pending service logs (not completed)
    const pendingServiceLogs = await ServiceLog.count({
      where: {
        vehicle_id: id,
        completed: false
      }
    });

    if (pendingServiceLogs > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete: vehicle has pending service logs' 
      });
    }

    await vehicle.destroy();

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/vehicles/:id/status - Update vehicle status
router.patch('/:id/status',
  [
    body('status').isIn(['Available', 'In Shop', 'Out of Service', 'On Trip']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      const vehicle = await Vehicle.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      await vehicle.update({ status });

      res.json(vehicle);
    } catch (error) {
      console.error('Update vehicle status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

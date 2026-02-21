import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Trip, Vehicle, Driver } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/trips - Get all trips with optional filtering
router.get('/',
  [
    query('status').optional().isIn(['Draft', 'Dispatched', 'Completed', 'Cancelled']).withMessage('Invalid status'),
    query('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer'),
    query('driverId').optional().isInt().withMessage('Driver ID must be an integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, vehicleId, driverId } = req.query;
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }
      if (vehicleId) {
        whereClause.vehicle_id = vehicleId;
      }
      if (driverId) {
        whereClause.driver_id = driverId;
      }

      const trips = await Trip.findAll({
        where: whereClause,
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'model', 'license_plate', 'max_capacity', 'status']
          },
          {
            model: Driver,
            as: 'driver',
            attributes: ['id', 'name', 'license_number', 'status']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json(trips);
    } catch (error) {
      console.error('Get trips error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/trips - Create a new trip
router.post('/',
  [
    body('vehicleId').isInt().withMessage('Vehicle ID is required and must be an integer'),
    body('driverId').isInt().withMessage('Driver ID is required and must be an integer'),
    body('cargoWeight').isFloat({ min: 0.01 }).withMessage('Cargo weight must be greater than 0'),
    body('origin').notEmpty().withMessage('Origin is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    body('scheduledDate').isISO8601().withMessage('Scheduled date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, driverId, cargoWeight, origin, destination, scheduledDate } = req.body;

      // Validate vehicle exists and is available
      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }

      // Check vehicle availability (status Available, not In Shop or Out of Service)
      if (vehicle.status === 'In Shop') {
        return res.status(400).json({ error: 'Vehicle is currently in shop and unavailable' });
      }
      if (vehicle.status === 'Out of Service') {
        return res.status(400).json({ error: 'Vehicle is out of service and unavailable' });
      }

      // Validate cargo weight does not exceed vehicle capacity
      if (parseFloat(cargoWeight) > parseFloat(vehicle.max_capacity)) {
        return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });
      }

      // Validate driver exists and is available
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      // Check driver status (must be On Duty)
      if (driver.status !== 'On Duty') {
        return res.status(400).json({ error: 'Driver is not on duty and unavailable' });
      }

      // Check driver license expiry
      const currentDate = new Date();
      const licenseExpiryDate = new Date(driver.license_expiry);
      if (licenseExpiryDate < currentDate) {
        return res.status(400).json({ error: 'Driver license has expired' });
      }

      // Create trip with Draft status
      const trip = await Trip.create({
        vehicle_id: vehicleId,
        driver_id: driverId,
        cargo_weight: cargoWeight,
        origin,
        destination,
        scheduled_date: scheduledDate,
        status: 'Draft'
      });

      // Fetch the created trip with associations
      const createdTrip = await Trip.findByPk(trip.id, {
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'model', 'license_plate', 'max_capacity', 'status']
          },
          {
            model: Driver,
            as: 'driver',
            attributes: ['id', 'name', 'license_number', 'status']
          }
        ]
      });

      res.status(201).json(createdTrip);
    } catch (error) {
      console.error('Create trip error:', error);
      
      // Handle foreign key constraint violations
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: 'Invalid vehicle ID or driver ID' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);


// PUT /api/trips/:id - Update a trip (only Draft trips can be updated)
router.put('/:id',
  [
    body('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer'),
    body('driverId').optional().isInt().withMessage('Driver ID must be an integer'),
    body('cargoWeight').optional().isFloat({ min: 0.01 }).withMessage('Cargo weight must be greater than 0'),
    body('origin').optional().notEmpty().withMessage('Origin cannot be empty'),
    body('destination').optional().notEmpty().withMessage('Destination cannot be empty'),
    body('scheduledDate').optional().isISO8601().withMessage('Scheduled date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { vehicleId, driverId, cargoWeight, origin, destination, scheduledDate } = req.body;

      const trip = await Trip.findByPk(id);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Only Draft trips can be updated
      if (trip.status !== 'Draft') {
        return res.status(400).json({ error: 'Only Draft trips can be updated' });
      }

      // If vehicleId is being updated, validate the new vehicle
      if (vehicleId && vehicleId !== trip.vehicle_id) {
        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
          return res.status(400).json({ error: 'Invalid vehicle ID' });
        }

        if (vehicle.status === 'In Shop') {
          return res.status(400).json({ error: 'Vehicle is currently in shop and unavailable' });
        }
        if (vehicle.status === 'Out of Service') {
          return res.status(400).json({ error: 'Vehicle is out of service and unavailable' });
        }

        // Validate cargo weight against new vehicle capacity
        const weight = cargoWeight !== undefined ? parseFloat(cargoWeight) : parseFloat(trip.cargo_weight);
        if (weight > parseFloat(vehicle.max_capacity)) {
          return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });
        }
      } else if (cargoWeight) {
        // If only cargo weight is being updated, validate against current vehicle
        const vehicle = await Vehicle.findByPk(trip.vehicle_id);
        if (parseFloat(cargoWeight) > parseFloat(vehicle.max_capacity)) {
          return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });
        }
      }

      // If driverId is being updated, validate the new driver
      if (driverId && driverId !== trip.driver_id) {
        const driver = await Driver.findByPk(driverId);
        if (!driver) {
          return res.status(400).json({ error: 'Invalid driver ID' });
        }

        if (driver.status !== 'On Duty') {
          return res.status(400).json({ error: 'Driver is not on duty and unavailable' });
        }

        const currentDate = new Date();
        const licenseExpiryDate = new Date(driver.license_expiry);
        if (licenseExpiryDate < currentDate) {
          return res.status(400).json({ error: 'Driver license has expired' });
        }
      }

      // Update trip
      const updateData = {};
      if (vehicleId !== undefined) updateData.vehicle_id = vehicleId;
      if (driverId !== undefined) updateData.driver_id = driverId;
      if (cargoWeight !== undefined) updateData.cargo_weight = cargoWeight;
      if (origin !== undefined) updateData.origin = origin;
      if (destination !== undefined) updateData.destination = destination;
      if (scheduledDate !== undefined) updateData.scheduled_date = scheduledDate;

      await trip.update(updateData);

      // Fetch updated trip with associations
      const updatedTrip = await Trip.findByPk(id, {
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'model', 'license_plate', 'max_capacity', 'status']
          },
          {
            model: Driver,
            as: 'driver',
            attributes: ['id', 'name', 'license_number', 'status']
          }
        ]
      });

      res.json(updatedTrip);
    } catch (error) {
      console.error('Update trip error:', error);
      
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: 'Invalid vehicle ID or driver ID' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/trips/:id/dispatch - Dispatch a trip
router.patch('/:id/dispatch', async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: Driver,
          as: 'driver'
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Only Draft trips can be dispatched
    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft trips can be dispatched' });
    }

    // Re-validate vehicle availability at dispatch time
    const vehicle = trip.vehicle;
    if (vehicle.status === 'In Shop') {
      return res.status(400).json({ error: 'Vehicle is currently in shop and unavailable' });
    }
    if (vehicle.status === 'Out of Service') {
      return res.status(400).json({ error: 'Vehicle is out of service and unavailable' });
    }
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Vehicle is already assigned to another trip' });
    }

    // Re-validate driver availability at dispatch time
    const driver = trip.driver;
    if (driver.status !== 'On Duty') {
      return res.status(400).json({ error: 'Driver is not on duty and unavailable' });
    }

    const currentDate = new Date();
    const licenseExpiryDate = new Date(driver.license_expiry);
    if (licenseExpiryDate < currentDate) {
      return res.status(400).json({ error: 'Driver license has expired' });
    }

    // Capture starting odometer from vehicle
    const startingOdometer = vehicle.odometer;

    // Update trip status to Dispatched and set starting odometer
    await trip.update({
      status: 'Dispatched',
      starting_odometer: startingOdometer
    });

    // Mark vehicle and driver as unavailable
    await vehicle.update({ status: 'On Trip' });
    // Driver status remains 'On Duty' but we track availability through active trips

    // Emit WebSocket events for availability changes
    const io = req.app.get('io');
    if (io) {
      io.to('vehicles').emit('vehicle:availabilityChanged', {
        vehicleId: vehicle.id,
        available: false,
        status: 'On Trip',
        timestamp: new Date().toISOString()
      });
      io.to('drivers').emit('driver:availabilityChanged', {
        driverId: driver.id,
        available: false,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch updated trip with associations
    const updatedTrip = await Trip.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'name', 'model', 'license_plate', 'max_capacity', 'status', 'odometer']
        },
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'name', 'license_number', 'status']
        }
      ]
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Dispatch trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/trips/:id/complete - Complete a trip
router.patch('/:id/complete',
  [
    body('finalOdometer').isFloat({ min: 0 }).withMessage('Final odometer is required and must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { finalOdometer } = req.body;

      const trip = await Trip.findByPk(id, {
        include: [
          {
            model: Vehicle,
            as: 'vehicle'
          },
          {
            model: Driver,
            as: 'driver'
          }
        ]
      });

      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Only Dispatched trips can be completed
      if (trip.status !== 'Dispatched') {
        return res.status(400).json({ error: 'Only Dispatched trips can be completed' });
      }

      // Validate final odometer >= starting odometer
      if (parseFloat(finalOdometer) < parseFloat(trip.starting_odometer)) {
        return res.status(400).json({ error: 'Final odometer must be >= starting odometer' });
      }

      // Calculate distance traveled
      const distanceTraveled = parseFloat(finalOdometer) - parseFloat(trip.starting_odometer);

      // Update trip status to Completed
      await trip.update({
        status: 'Completed',
        final_odometer: finalOdometer,
        distance_traveled: distanceTraveled,
        completed_at: new Date()
      });

      // Update vehicle odometer and restore availability
      await trip.vehicle.update({
        odometer: finalOdometer,
        status: 'Available'
      });

      // Driver availability is restored (they remain On Duty but are now available for new trips)

      // Emit WebSocket events for availability restoration
      const io = req.app.get('io');
      if (io) {
        io.to('vehicles').emit('vehicle:availabilityChanged', {
          vehicleId: trip.vehicle.id,
          available: true,
          status: 'Available',
          timestamp: new Date().toISOString()
        });
        io.to('drivers').emit('driver:availabilityChanged', {
          driverId: trip.driver.id,
          available: true,
          timestamp: new Date().toISOString()
        });
      }

      // Fetch updated trip with associations
      const updatedTrip = await Trip.findByPk(id, {
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'model', 'license_plate', 'max_capacity', 'status', 'odometer']
          },
          {
            model: Driver,
            as: 'driver',
            attributes: ['id', 'name', 'license_number', 'status']
          }
        ]
      });

      res.json(updatedTrip);
    } catch (error) {
      console.error('Complete trip error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/trips/:id/cancel - Cancel a trip
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: Driver,
          as: 'driver'
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Draft and Dispatched trips can be cancelled
    if (trip.status !== 'Draft' && trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Draft or Dispatched trips can be cancelled' });
    }

    const wasDispatched = trip.status === 'Dispatched';

    // Update trip status to Cancelled
    await trip.update({
      status: 'Cancelled'
    });

    // If trip was Dispatched, restore vehicle and driver availability
    if (wasDispatched) {
      await trip.vehicle.update({ status: 'Available' });
      // Driver remains On Duty and is now available for new trips

      // Emit WebSocket events for availability restoration
      const io = req.app.get('io');
      if (io) {
        io.to('vehicles').emit('vehicle:availabilityChanged', {
          vehicleId: trip.vehicle.id,
          available: true,
          status: 'Available',
          timestamp: new Date().toISOString()
        });
        io.to('drivers').emit('driver:availabilityChanged', {
          driverId: trip.driver.id,
          available: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Fetch updated trip with associations
    const updatedTrip = await Trip.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'name', 'model', 'license_plate', 'max_capacity', 'status', 'odometer']
        },
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'name', 'license_number', 'status']
        }
      ]
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

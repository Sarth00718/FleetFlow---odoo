import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Driver, Trip } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Helper function to check if license is expired
const isLicenseExpired = (licenseExpiry) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(licenseExpiry);
  expiryDate.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

// Helper function to calculate trip completion rate
const calculateTripCompletionRate = async (driverId) => {
  const totalTrips = await Trip.count({
    where: { driver_id: driverId }
  });

  if (totalTrips === 0) {
    return 0;
  }

  const completedTrips = await Trip.count({
    where: {
      driver_id: driverId,
      status: 'Completed'
    }
  });

  return (completedTrips / totalTrips) * 100;
};

// GET /api/drivers - Get all drivers with optional filtering
router.get('/',
  [
    query('status').optional().isIn(['On Duty', 'Off Duty', 'Suspended']).withMessage('Invalid status'),
    query('licenseValid').optional().isBoolean().withMessage('licenseValid must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, licenseValid } = req.query;
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      let drivers = await Driver.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      // Filter by license validity if requested
      if (licenseValid !== undefined) {
        const isValid = licenseValid === 'true' || licenseValid === true;
        drivers = drivers.filter(driver => {
          const expired = isLicenseExpired(driver.license_expiry);
          return isValid ? !expired : expired;
        });
      }

      // Add computed fields
      const driversWithMetrics = await Promise.all(
        drivers.map(async (driver) => {
          const tripCompletionRate = await calculateTripCompletionRate(driver.id);
          const licenseExpired = isLicenseExpired(driver.license_expiry);
          
          return {
            ...driver.toJSON(),
            tripCompletionRate: parseFloat(tripCompletionRate.toFixed(2)),
            licenseExpired
          };
        })
      );

      res.json(driversWithMetrics);
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/drivers - Create a new driver
router.post('/',
  [
    body('name').notEmpty().withMessage('Driver name is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('licenseExpiry').isISO8601().withMessage('License expiry must be a valid date'),
    body('initialSafetyScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Safety score must be between 0 and 100'),
    body('status').optional().isIn(['On Duty', 'Off Duty', 'Suspended']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, licenseNumber, licenseExpiry, initialSafetyScore, status } = req.body;

      // Validate license expiry is a future date
      const expiryDate = new Date(licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate <= today) {
        return res.status(400).json({ 
          error: 'License expiry date must be a future date' 
        });
      }

      // Check for duplicate license number
      const existingDriver = await Driver.findOne({
        where: { license_number: licenseNumber }
      });

      if (existingDriver) {
        return res.status(409).json({ error: 'License number already exists' });
      }

      // Create driver
      const driver = await Driver.create({
        name,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        safety_score: initialSafetyScore !== undefined ? initialSafetyScore : 100.00,
        status: status || 'Off Duty'
      });

      // Add computed fields
      const driverWithMetrics = {
        ...driver.toJSON(),
        tripCompletionRate: 0,
        licenseExpired: false
      };

      res.status(201).json(driverWithMetrics);
    } catch (error) {
      console.error('Create driver error:', error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'License number already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/drivers/:id - Update a driver
router.put('/:id',
  [
    body('name').optional().notEmpty().withMessage('Driver name cannot be empty'),
    body('licenseNumber').optional().notEmpty().withMessage('License number cannot be empty'),
    body('licenseExpiry').optional().isISO8601().withMessage('License expiry must be a valid date'),
    body('status').optional().isIn(['On Duty', 'Off Duty', 'Suspended']).withMessage('Invalid status'),
    body('safetyScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Safety score must be between 0 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const driver = await Driver.findByPk(id);

      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const updateData = {};
      let statusChanged = false;
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.licenseNumber !== undefined) {
        // Check for duplicate license number (excluding current driver)
        const existingDriver = await Driver.findOne({
          where: { 
            license_number: req.body.licenseNumber,
            id: { [Op.ne]: id }
          }
        });

        if (existingDriver) {
          return res.status(409).json({ error: 'License number already exists' });
        }
        updateData.license_number = req.body.licenseNumber;
      }
      if (req.body.licenseExpiry !== undefined) {
        updateData.license_expiry = req.body.licenseExpiry;
      }
      if (req.body.status !== undefined) {
        statusChanged = req.body.status !== driver.status;
        updateData.status = req.body.status;
      }
      if (req.body.safetyScore !== undefined) updateData.safety_score = req.body.safetyScore;

      await driver.update(updateData);

      // Emit WebSocket event for driver status change
      if (statusChanged) {
        const io = req.app.get('io');
        if (io) {
          io.to('drivers').emit('driver:statusChanged', {
            driverId: driver.id,
            status: driver.status,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Add computed fields
      const tripCompletionRate = await calculateTripCompletionRate(driver.id);
      const licenseExpired = isLicenseExpired(driver.license_expiry);

      const driverWithMetrics = {
        ...driver.toJSON(),
        tripCompletionRate: parseFloat(tripCompletionRate.toFixed(2)),
        licenseExpired
      };

      res.json(driverWithMetrics);
    } catch (error) {
      console.error('Update driver error:', error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'License number already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/drivers/:id - Delete a driver with dependency checking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByPk(id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check for active trips (Dispatched status)
    const activeTrips = await Trip.count({
      where: {
        driver_id: id,
        status: 'Dispatched'
      }
    });

    if (activeTrips > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete: driver has active trips' 
      });
    }

    await driver.destroy();

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

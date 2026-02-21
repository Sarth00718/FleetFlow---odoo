import express from 'express';
import { query, validationResult } from 'express-validator';
import { Vehicle, Trip, ServiceLog } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/dashboard/kpis - Get dashboard KPIs with optional filtering
router.get('/kpis',
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
      const vehicleWhereClause = {};

      // Apply filters to vehicle query
      if (type) {
        vehicleWhereClause.vehicle_type = type;
      }
      if (status) {
        vehicleWhereClause.status = status;
      }
      if (region) {
        vehicleWhereClause.region = region;
      }

      // 1. Active Fleet Count - vehicles NOT "Out of Service"
      const activeFleetWhereClause = {
        ...vehicleWhereClause,
        status: { [Op.ne]: 'Out of Service' }
      };
      
      const activeFleetCount = await Vehicle.count({
        where: activeFleetWhereClause
      });

      // 2. Maintenance Alerts Count - vehicles with "In Shop" status OR pending service logs
      const inShopWhereClause = {
        ...vehicleWhereClause,
        status: 'In Shop'
      };
      
      const inShopCount = await Vehicle.count({
        where: inShopWhereClause
      });

      // Get vehicles with pending service logs (not completed)
      const vehiclesWithPendingService = await ServiceLog.findAll({
        where: { completed: false },
        attributes: ['vehicle_id'],
        group: ['vehicle_id'],
        raw: true
      });

      const vehicleIdsWithPendingService = vehiclesWithPendingService.map(log => log.vehicle_id);
      
      // Count vehicles with pending service logs that match filters
      let pendingServiceCount = 0;
      if (vehicleIdsWithPendingService.length > 0) {
        const pendingServiceWhereClause = {
          ...vehicleWhereClause,
          id: { [Op.in]: vehicleIdsWithPendingService },
          status: { [Op.ne]: 'In Shop' } // Don't double count vehicles already in shop
        };
        
        pendingServiceCount = await Vehicle.count({
          where: pendingServiceWhereClause
        });
      }

      const maintenanceAlerts = inShopCount + pendingServiceCount;

      // 3. Utilization Rate - (time vehicles spent on trips / total available vehicle time) * 100
      // For simplicity, we calculate based on current state: (vehicles on trip / active fleet) * 100
      const onTripWhereClause = {
        ...vehicleWhereClause,
        status: 'On Trip'
      };
      
      const onTripCount = await Vehicle.count({
        where: onTripWhereClause
      });

      const utilizationRate = activeFleetCount > 0 
        ? parseFloat(((onTripCount / activeFleetCount) * 100).toFixed(2))
        : 0;

      // 4. Pending Cargo Count - trips with "Draft" status
      // If filters are applied, only count trips for vehicles matching the filters
      let pendingCargoCount;
      
      if (type || status || region) {
        // Get vehicle IDs that match the filters
        const filteredVehicles = await Vehicle.findAll({
          where: vehicleWhereClause,
          attributes: ['id'],
          raw: true
        });
        
        const filteredVehicleIds = filteredVehicles.map(v => v.id);
        
        if (filteredVehicleIds.length > 0) {
          pendingCargoCount = await Trip.count({
            where: {
              status: 'Draft',
              vehicle_id: { [Op.in]: filteredVehicleIds }
            }
          });
        } else {
          pendingCargoCount = 0;
        }
      } else {
        // No filters, count all draft trips
        pendingCargoCount = await Trip.count({
          where: { status: 'Draft' }
        });
      }

      res.json({
        activeFleetCount,
        maintenanceAlerts,
        utilizationRate,
        pendingCargo: pendingCargoCount
      });
    } catch (error) {
      console.error('Get dashboard KPIs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

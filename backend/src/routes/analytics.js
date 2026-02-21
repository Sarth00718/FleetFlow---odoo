import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { Vehicle, Trip, Expense } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/analytics/fuel-efficiency - Calculate fuel efficiency per vehicle
router.get('/fuel-efficiency',
  [
    query('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, startDate, endDate } = req.query;
      
      // Build where clauses for trips and expenses
      const tripWhereClause = { status: 'Completed' };
      const expenseWhereClause = { expense_type: 'Fuel' };
      
      if (vehicleId) {
        tripWhereClause.vehicle_id = vehicleId;
        expenseWhereClause.vehicle_id = vehicleId;
      }
      
      if (startDate || endDate) {
        tripWhereClause.completed_at = {};
        expenseWhereClause.expense_date = {};
        
        if (startDate) {
          tripWhereClause.completed_at[Op.gte] = startDate;
          expenseWhereClause.expense_date[Op.gte] = startDate;
        }
        if (endDate) {
          tripWhereClause.completed_at[Op.lte] = endDate;
          expenseWhereClause.expense_date[Op.lte] = endDate;
        }
      }

      // Get all completed trips
      const trips = await Trip.findAll({
        where: tripWhereClause,
        attributes: ['vehicle_id', 'distance_traveled']
      });

      // Get all fuel expenses
      const fuelExpenses = await Expense.findAll({
        where: expenseWhereClause,
        attributes: ['vehicle_id', 'liters']
      });

      // Group by vehicle and calculate totals
      const vehicleData = {};

      trips.forEach(trip => {
        const vId = trip.vehicle_id;
        if (!vehicleData[vId]) {
          vehicleData[vId] = { totalKm: 0, totalLiters: 0 };
        }
        vehicleData[vId].totalKm += parseFloat(trip.distance_traveled || 0);
      });

      fuelExpenses.forEach(expense => {
        const vId = expense.vehicle_id;
        if (!vehicleData[vId]) {
          vehicleData[vId] = { totalKm: 0, totalLiters: 0 };
        }
        vehicleData[vId].totalLiters += parseFloat(expense.liters || 0);
      });

      // Calculate fuel efficiency (km/L) for each vehicle
      const results = [];
      
      for (const [vId, data] of Object.entries(vehicleData)) {
        const kmPerLiter = data.totalLiters > 0 
          ? parseFloat((data.totalKm / data.totalLiters).toFixed(2))
          : 0;
        
        results.push({
          vehicleId: parseInt(vId),
          kmPerLiter,
          totalKm: parseFloat(data.totalKm.toFixed(2)),
          totalLiters: parseFloat(data.totalLiters.toFixed(2))
        });
      }

      res.json(results);
    } catch (error) {
      console.error('Get fuel efficiency error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/analytics/roi - Calculate ROI per vehicle
router.get('/roi',
  [
    query('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, startDate, endDate } = req.query;
      
      // Build vehicle where clause
      const vehicleWhereClause = {};
      if (vehicleId) {
        vehicleWhereClause.id = vehicleId;
      }

      // Get vehicles with acquisition cost
      const vehicles = await Vehicle.findAll({
        where: vehicleWhereClause,
        attributes: ['id', 'name', 'acquisition_cost']
      });

      const results = [];

      for (const vehicle of vehicles) {
        // Build expense where clause
        const expenseWhereClause = { vehicle_id: vehicle.id };
        
        if (startDate || endDate) {
          expenseWhereClause.expense_date = {};
          if (startDate) {
            expenseWhereClause.expense_date[Op.gte] = startDate;
          }
          if (endDate) {
            expenseWhereClause.expense_date[Op.lte] = endDate;
          }
        }

        // Calculate operational cost (sum of all expenses)
        const expenses = await Expense.findAll({
          where: expenseWhereClause,
          attributes: ['cost']
        });

        const operationalCost = expenses.reduce((sum, exp) => sum + parseFloat(exp.cost), 0);

        // For ROI calculation, we need revenue data
        // Since revenue is not tracked in the current schema, we'll set it to 0
        // In a real system, this would come from a revenue/billing table
        const revenue = 0;

        // Calculate ROI: (Revenue - Operational Cost) / Acquisition Cost
        const acquisitionCost = parseFloat(vehicle.acquisition_cost || 0);
        let roi = 0;
        
        if (acquisitionCost > 0) {
          roi = parseFloat((((revenue - operationalCost) / acquisitionCost) * 100).toFixed(2));
        }

        results.push({
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          revenue: parseFloat(revenue.toFixed(2)),
          operationalCost: parseFloat(operationalCost.toFixed(2)),
          acquisitionCost: parseFloat(acquisitionCost.toFixed(2)),
          roi
        });
      }

      res.json(results);
    } catch (error) {
      console.error('Get ROI error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/analytics/export - Export analytics report in CSV or PDF format
router.post('/export',
  [
    body('format').isIn(['csv', 'pdf']).withMessage('Format must be csv or pdf'),
    body('startDate').isISO8601().withMessage('Start date is required and must be a valid date'),
    body('endDate').isISO8601().withMessage('End date is required and must be a valid date'),
    body('reportType').optional().isString().withMessage('Report type must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { format, startDate, endDate, reportType } = req.body;

      // Gather all data for the report
      const tripWhereClause = {
        completed_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      };

      const expenseWhereClause = {
        expense_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      };

      // Get trips
      const trips = await Trip.findAll({
        where: tripWhereClause,
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'license_plate']
          }
        ],
        order: [['completed_at', 'ASC']]
      });

      // Get expenses
      const expenses = await Expense.findAll({
        where: expenseWhereClause,
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'license_plate']
          }
        ],
        order: [['expense_date', 'ASC']]
      });

      // Get all vehicles for metrics calculation
      const vehicles = await Vehicle.findAll({
        attributes: ['id', 'name', 'license_plate', 'acquisition_cost']
      });

      if (format === 'csv') {
        // Generate CSV report
        let csvContent = '';

        // Trips section
        csvContent += 'TRIPS REPORT\n';
        csvContent += `Period: ${startDate} to ${endDate}\n\n`;
        csvContent += 'Trip ID,Vehicle,License Plate,Origin,Destination,Distance (km),Completed At\n';
        
        trips.forEach(trip => {
          csvContent += `${trip.id},${trip.vehicle?.name || 'N/A'},${trip.vehicle?.license_plate || 'N/A'},${trip.origin},${trip.destination},${trip.distance_traveled || 0},${trip.completed_at}\n`;
        });

        // Expenses section
        csvContent += '\n\nEXPENSES REPORT\n';
        csvContent += 'Expense ID,Vehicle,License Plate,Type,Cost,Date,Liters\n';
        
        expenses.forEach(expense => {
          csvContent += `${expense.id},${expense.vehicle?.name || 'N/A'},${expense.vehicle?.license_plate || 'N/A'},${expense.expense_type},${expense.cost},${expense.expense_date},${expense.liters || 'N/A'}\n`;
        });

        // Summary metrics section
        csvContent += '\n\nSUMMARY METRICS\n';
        csvContent += 'Vehicle,Total Distance (km),Total Fuel Cost,Total Maintenance Cost,Operational Cost\n';

        // Calculate metrics per vehicle
        const vehicleMetrics = {};
        
        trips.forEach(trip => {
          const vId = trip.vehicle_id;
          if (!vehicleMetrics[vId]) {
            vehicleMetrics[vId] = {
              name: trip.vehicle?.name || 'Unknown',
              totalDistance: 0,
              fuelCost: 0,
              maintenanceCost: 0
            };
          }
          vehicleMetrics[vId].totalDistance += parseFloat(trip.distance_traveled || 0);
        });

        expenses.forEach(expense => {
          const vId = expense.vehicle_id;
          if (!vehicleMetrics[vId]) {
            vehicleMetrics[vId] = {
              name: expense.vehicle?.name || 'Unknown',
              totalDistance: 0,
              fuelCost: 0,
              maintenanceCost: 0
            };
          }
          
          if (expense.expense_type === 'Fuel') {
            vehicleMetrics[vId].fuelCost += parseFloat(expense.cost);
          } else if (expense.expense_type === 'Maintenance') {
            vehicleMetrics[vId].maintenanceCost += parseFloat(expense.cost);
          }
        });

        Object.values(vehicleMetrics).forEach(metrics => {
          const operationalCost = metrics.fuelCost + metrics.maintenanceCost;
          csvContent += `${metrics.name},${metrics.totalDistance.toFixed(2)},${metrics.fuelCost.toFixed(2)},${metrics.maintenanceCost.toFixed(2)},${operationalCost.toFixed(2)}\n`;
        });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="fleet-report-${startDate}-to-${endDate}.csv"`);
        res.send(csvContent);

      } else if (format === 'pdf') {
        // For PDF generation, we would typically use a library like pdfkit or puppeteer
        // For now, return a simple text-based response indicating PDF generation
        // In production, implement actual PDF generation
        
        res.status(501).json({ 
          error: 'PDF export not yet implemented',
          message: 'PDF generation requires additional libraries. Use CSV format for now.',
          suggestion: 'Consider using libraries like pdfkit, puppeteer, or jsPDF for PDF generation'
        });
      }

    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

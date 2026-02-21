import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import tripRoutes from './routes/trips.js';
import serviceLogRoutes from './routes/serviceLogs.js';
import expenseRoutes from './routes/expenses.js';
import dashboardRoutes from './routes/dashboard.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'FleetFlow API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/service-logs', serviceLogRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Database connection test
app.get('/api/db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'connected', message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
  }
});

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join rooms for real-time updates
  socket.on('join:vehicles', () => {
    socket.join('vehicles');
    console.log(`Socket ${socket.id} joined vehicles room`);
  });

  socket.on('join:drivers', () => {
    socket.join('drivers');
    console.log(`Socket ${socket.id} joined drivers room`);
  });

  socket.on('join:trips', () => {
    socket.join('trips');
    console.log(`Socket ${socket.id} joined trips room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    httpServer.listen(PORT, () => {
      console.log(`FleetFlow API server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };

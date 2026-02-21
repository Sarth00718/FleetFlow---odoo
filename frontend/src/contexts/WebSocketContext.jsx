import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [vehicleUpdates, setVehicleUpdates] = useState([]);
  const [driverUpdates, setDriverUpdates] = useState([]);

  useEffect(() => {
    // Connect to WebSocket server
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setConnected(true);
      
      // Join rooms for real-time updates
      newSocket.emit('join:vehicles');
      newSocket.emit('join:drivers');
      newSocket.emit('join:trips');
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    // Listen for vehicle status changes
    newSocket.on('vehicle:statusChanged', (data) => {
      console.log('Vehicle status changed:', data);
      setVehicleUpdates(prev => [...prev, { type: 'statusChanged', ...data }]);
    });

    // Listen for vehicle availability changes
    newSocket.on('vehicle:availabilityChanged', (data) => {
      console.log('Vehicle availability changed:', data);
      setVehicleUpdates(prev => [...prev, { type: 'availabilityChanged', ...data }]);
    });

    // Listen for driver status changes
    newSocket.on('driver:statusChanged', (data) => {
      console.log('Driver status changed:', data);
      setDriverUpdates(prev => [...prev, { type: 'statusChanged', ...data }]);
    });

    // Listen for driver availability changes
    newSocket.on('driver:availabilityChanged', (data) => {
      console.log('Driver availability changed:', data);
      setDriverUpdates(prev => [...prev, { type: 'availabilityChanged', ...data }]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Clear vehicle updates after they've been processed
  const clearVehicleUpdates = useCallback(() => {
    setVehicleUpdates([]);
  }, []);

  // Clear driver updates after they've been processed
  const clearDriverUpdates = useCallback(() => {
    setDriverUpdates([]);
  }, []);

  const value = {
    socket,
    connected,
    vehicleUpdates,
    driverUpdates,
    clearVehicleUpdates,
    clearDriverUpdates
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

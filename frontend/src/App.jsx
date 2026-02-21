import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import VehicleRegistry from './components/VehicleRegistry';
import DriverManagement from './components/DriverManagement';
import TripDispatcher from './components/TripDispatcher';
import ServiceLogManagement from './components/ServiceLogManagement';
import ExpenseManagement from './components/ExpenseManagement';
import AnalyticsModule from './components/AnalyticsModule';

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== '/login' && location.pathname !== '/';

  return (
    <div className="app">
      <header>
        <h1>FleetFlow</h1>
        <p>Fleet Management System</p>
      </header>
      {showNavigation && <Navigation />}
      <main>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vehicles" 
            element={
              <ProtectedRoute>
                <VehicleRegistry />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/drivers" 
            element={
              <ProtectedRoute>
                <DriverManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips" 
            element={
              <ProtectedRoute>
                <TripDispatcher />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/service-logs" 
            element={
              <ProtectedRoute>
                <ServiceLogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <ExpenseManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsModule />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <WebSocketProvider>
          <Router>
            <AppContent />
          </Router>
        </WebSocketProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

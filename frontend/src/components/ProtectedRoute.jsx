import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Check if token is expired by decoding the JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
          // Token expired, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);

        // Check role-based permissions
        if (allowedRoles.length > 0 && userStr) {
          const user = JSON.parse(userStr);
          setHasPermission(allowedRoles.includes(user.role));
        } else {
          setHasPermission(true);
        }
      } catch (error) {
        // Invalid token format
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [allowedRoles]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but insufficient permissions
  if (!hasPermission) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center' 
      }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Required role: {allowedRoles.join(' or ')}</p>
      </div>
    );
  }

  // Authenticated and has permission
  return children;
};

export default ProtectedRoute;

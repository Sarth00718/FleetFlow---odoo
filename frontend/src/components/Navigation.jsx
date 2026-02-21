import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <ul className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')} onClick={closeMenu}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/vehicles" className={isActive('/vehicles')} onClick={closeMenu}>
              Vehicles
            </Link>
          </li>
          <li>
            <Link to="/drivers" className={isActive('/drivers')} onClick={closeMenu}>
              Drivers
            </Link>
          </li>
          <li>
            <Link to="/trips" className={isActive('/trips')} onClick={closeMenu}>
              Trips
            </Link>
          </li>
          <li>
            <Link to="/service-logs" className={isActive('/service-logs')} onClick={closeMenu}>
              Service Logs
            </Link>
          </li>
          <li>
            <Link to="/expenses" className={isActive('/expenses')} onClick={closeMenu}>
              Expenses
            </Link>
          </li>
          <li>
            <Link to="/analytics" className={isActive('/analytics')} onClick={closeMenu}>
              Analytics
            </Link>
          </li>
          <li className="nav-logout">
            <button onClick={() => { handleLogout(); closeMenu(); }} className="logout-btn">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;

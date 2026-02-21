import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      // Store JWT token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email: forgotPasswordEmail
      });
      setForgotPasswordMessage(response.data.message);
      setForgotPasswordEmail('');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Forgot Password</h2>
          <p>Enter your email address and we'll send you a password reset link.</p>
          
          {forgotPasswordMessage && (
            <div className="success-message">{forgotPasswordMessage}</div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label htmlFor="forgotEmail">Email</label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <button 
              type="button" 
              className="link-button"
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setForgotPasswordMessage('');
              }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>FleetFlow Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <button 
            type="button" 
            className="link-button"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

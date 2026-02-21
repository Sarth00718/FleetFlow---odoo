import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/login - Authenticate user and generate JWT token
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/forgot-password - Initiate password recovery
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ where: { email } });
      
      // Always return success to prevent email enumeration
      // In production, send actual password reset email here
      res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent' 
      });

      // TODO: In production, generate reset token and send email
      if (user) {
        // Generate password reset token
        const resetToken = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        // Send email with reset link containing token
        console.log(`Password reset token for ${email}: ${resetToken}`);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired reset token' });
      }

      // Find user
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      await user.update({ password_hash });

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

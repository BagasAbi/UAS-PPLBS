const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');
const { body } = require('express-validator');
const { verifyBackendToken } = require('../middleware/tokenMiddleware');
const { requireRole } = require('../middleware/roles');
const rateLimit = require('express-rate-limit');

// Per-route stricter limiters
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many registration attempts, try later.' });
const generateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 50, message: 'Too many token generations, try later.' });

// Public endpoints
router.post('/login', [
	body('email').isEmail().withMessage('Valid email required'),
	body('password').isLength({ min: 6 }).withMessage('Password min 6 characters')
], gatewayController.login);
router.post('/auth/google', gatewayController.handleGoogleLogin);

// Registration endpoint (simple): client provides email/password/name and receives JWT
router.post('/register', registerLimiter, [
	body('email').isEmail().withMessage('Valid email required'),
	body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
	body('role').optional().isIn(['user', 'staff', 'manager']).withMessage('Invalid role'),
], gatewayController.registerUser);

// Protected user info endpoint
router.get('/me', verifyBackendToken, gatewayController.me);

// Admin endpoint: change user's role
router.patch('/users/:id/role', verifyBackendToken, requireRole('admin'), [
	body('role').isIn(['admin', 'owner', 'staff', 'user']).withMessage('Invalid role')
], gatewayController.setUserRole);

module.exports = router;
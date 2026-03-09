import express from 'express';
import { signupController, loginController, getProfileController, logoutController } from './auth.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Public routes (no JWT required)
 */
router.post('/signup', signupController);
router.post('/login', loginLimiter, loginController);

/**
 * Protected routes (JWT required)
 */
router.get('/me', verifyToken, getProfileController);
router.post('/logout', verifyToken, logoutController);

export default router;

import express from 'express';
import { signupController, loginController, getProfileController, logoutController, registerApplicantController, saveJobController, unsaveJobController, getSavedJobsController } from './auth.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';
import User from './user.model.js';

const router = express.Router();

/**
 * Public routes (no JWT required)
 */
router.post('/signup', signupController);
router.post('/register', registerApplicantController);
router.post('/login', loginLimiter, loginController);

/**
 * Protected routes (JWT required)
 */
router.get('/me', verifyToken, getProfileController);
router.post('/logout', verifyToken, logoutController);
router.patch(
  '/change-password',
  verifyToken,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword)
        return res.status(400).json({
          error: 'Current and new password are required',
        });

      if (newPassword.length < 8)
        return res.status(400).json({
          error: 'New password must be at least 8 characters',
        });

      // Load user with password
      const user = await User.findById(userId)
        .select('+password');
      if (!user)
        return res.status(404).json({
          error: 'User not found',
        });

      // Verify current password
      const bcrypt = await import('bcryptjs');
      const isMatch = await bcrypt.default.compare(
        currentPassword, user.password
      );
      if (!isMatch)
        return res.status(400).json({
          error: 'Current password is incorrect',
        });

      // Set new password — pre-save hook hashes it
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);
router.post  ('/save-job/:jobId', verifyToken, saveJobController);
router.delete('/save-job/:jobId', verifyToken, unsaveJobController);
router.get   ('/saved-jobs',      verifyToken, getSavedJobsController);

export default router;

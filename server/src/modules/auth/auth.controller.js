import { signup, login, getProfile, logout, registerApplicant, saveJob, unsaveJob, getSavedJobs } from './auth.service.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /api/auth/signup
 * Register a new employee
 */
export const signupController = async (req, res, next) => {
  try {
    const { email, password, role, ...allFormData } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, password',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    const result = await signup({ email, password, role, ...allFormData });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login an employee
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, password',
      });
    }

    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile (requires JWT)
 */
export const getProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT middleware
    const profile = await getProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout (frontend will delete JWT)
 */
export const logoutController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await logout(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Register a new applicant (public)
 */
export const registerApplicantController = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName) return res.status(400).json({ error: 'First name is required' });
  if (!lastName) return res.status(400).json({ error: 'Last name is required' });
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const { user, token } = await registerApplicant({ firstName, lastName, email, password });
    return res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS' || error.status === 409)
      return res.status(409).json({ error: 'An account with this email already exists' });
    next(error);
  }
};

/**
 * POST /api/auth/save-job/:jobId
 */
export const saveJobController = async (req, res, next) => {
  const userId = req.user.id;
  const { jobId } = req.params;
  try {
    const savedJobs = await saveJob(userId, jobId);
    return res.status(200).json({ success: true, data: savedJobs });
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: 'User not found' });
    next(error);
  }
};

/**
 * DELETE /api/auth/save-job/:jobId
 */
export const unsaveJobController = async (req, res, next) => {
  const userId = req.user.id;
  const { jobId } = req.params;
  try {
    const savedJobs = await unsaveJob(userId, jobId);
    return res.status(200).json({ success: true, data: savedJobs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/saved-jobs
 */
export const getSavedJobsController = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const savedJobs = await getSavedJobs(userId);
    return res.status(200).json({ success: true, data: savedJobs });
  } catch (error) {
    next(error);
  }
};

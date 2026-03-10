import express from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { getDashboardStats } from './reports.service.js';
import { createOshaReport, createIncidentReport } from './reports.controller.js';

const router = express.Router();

router.get(
  '/dashboard',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const stats = await getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/osha', verifyToken, createOshaReport);
router.post('/incident', verifyToken, createIncidentReport);

export default router;

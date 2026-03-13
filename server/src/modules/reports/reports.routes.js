import express from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  getDashboardStats,
  getATSReport,
  getHeadcountReport,
  getEmployeeStatusReport,
  getTrainingReport,
} from './reports.service.js';
import {
  createOshaReport,
  createIncidentReport,
  exportCSV,
  exportPDF,
} from './reports.controller.js';

const router = express.Router();

// Dashboard stats (existing)
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

// ATS Report
router.get(
  '/ats',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const data = await getATSReport();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Headcount Report
router.get(
  '/headcount',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const data = await getHeadcountReport();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Employee Status Report
router.get(
  '/employees',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const data = await getEmployeeStatusReport();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Training Report
router.get(
  '/training',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const data = await getTrainingReport();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export as CSV
router.get(
  '/export/csv',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  exportCSV
);

// Export as PDF
router.get(
  '/export/pdf',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  exportPDF
);

// Contact HR reports (existing)
router.post('/osha', verifyToken, createOshaReport);
router.post('/incident', verifyToken, createIncidentReport);

export default router;


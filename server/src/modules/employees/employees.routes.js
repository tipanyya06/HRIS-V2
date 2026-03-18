import express from 'express';
import * as employeeController from './employees.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// GET /api/employees
router.get(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  employeeController.getEmployeesController
);

// PATCH /api/employees/:id/status — MUST be before /:id to avoid 'status' being treated as ObjectId
router.patch(
  '/:id/status',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  employeeController.updateEmployeeStatusController
);

// Employee-accessible routes (authorization checked in controller)
router.get('/:id', verifyToken, employeeController.getEmployeeByIdController);
router.patch('/:id', verifyToken, employeeController.updateEmployeeController);

// Admin-only routes
router.use(verifyToken, requireRole(['admin', 'super-admin', 'hr']));

// DELETE /api/employees/:id (legacy terminate — kept for backward compat)
router.delete('/:id', employeeController.terminateEmployeeController);

export default router;

import express from 'express';
import * as employeeController from './employees.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// GET /api/employees (must be before /:id)
router.get(
	'/',
	verifyToken,
	requireRole(['admin', 'super-admin', 'hr']),
	employeeController.getEmployeesController
);

// Employee-accessible routes (verifyToken only, authorization checked in controller)
router.get('/:id', verifyToken, employeeController.getEmployeeByIdController);
router.patch('/:id', verifyToken, employeeController.updateEmployeeController);

// Admin-only routes (requires admin/super-admin/hr role)
router.use(verifyToken, requireRole(['admin', 'super-admin', 'hr']));

// PATCH /api/employees/:id/status
router.patch('/:id/status', employeeController.setEmployeeStatusController);

// DELETE /api/employees/:id
router.delete('/:id', employeeController.terminateEmployeeController);

export default router;


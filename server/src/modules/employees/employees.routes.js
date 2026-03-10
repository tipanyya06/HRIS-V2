import express from 'express';
import * as employeeController from './employees.controller.js';
import { upload, uploadProfilePicController, uploadDocumentController } from './upload.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// Upload routes - available to all authenticated employees (no admin role required)
router.post('/upload/profile-pic', verifyToken, upload.single('photo'), uploadProfilePicController);
router.post('/upload/documents', verifyToken, upload.single('document'), uploadDocumentController);

// Employee-accessible routes (verifyToken only, authorization checked in controller)
router.get('/:id', verifyToken, employeeController.getEmployeeByIdController);
router.patch('/:id', verifyToken, employeeController.updateEmployeeController);

// Admin-only routes (requires admin/super-admin/hr role)
router.use(verifyToken, requireRole(['admin', 'super-admin', 'hr']));

// GET /api/employees
router.get('/', employeeController.getEmployeesController);

// PATCH /api/employees/:id/status
router.patch('/:id/status', employeeController.setEmployeeStatusController);

// DELETE /api/employees/:id
router.delete('/:id', employeeController.terminateEmployeeController);

export default router;

import * as employeeService from './employees.service.js';
import { logActivity } from '../../middleware/activityLogger.js';
import multer from 'multer';
import User from '../auth/user.model.js';
import {
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  getEmployeeDocuments,
} from './employees.service.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const getEmployeesController = async (req, res, next) => {
  try {
    const data = await employeeService.getEmployees(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeByIdController = async (req, res, next) => {
  try {
    const isSelf = String(req.user.id) === String(req.params.id);
    const isAdminOrHR = ['admin', 'super-admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHR) {
      return next(createError(403, 'Forbidden: access denied'));
    }

    const employee = await employeeService.getEmployeeById(req.params.id);

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const updateEmployeeController = async (req, res, next) => {
  try {
    const isSelf = String(req.user.id) === String(req.params.id);
    const isAdminOrHR = ['admin', 'super-admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHR) {
      return next(createError(403, 'Forbidden: access denied'));
    }

    const employee = await employeeService.updateEmployee(req.params.id, req.body);

    logActivity(
      req,
      `Employee profile updated: ${employee.personalInfo?.fullName ?? employee.email ?? id}`,
      'employee',
      id
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

export const setEmployeeStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const employee = await employeeService.setEmployeeStatus(
      id,
      isActive
    );

    await logActivity(
      req,
      `${isActive ? 'Activated' : 'Deactivated'} employee: ${employee.email}`,
      'employee',
      id
    );

    res.status(200).json({
      success: true,
      message: 'Employee status updated',
      data: employee,
    });
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

export const terminateEmployeeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.terminateEmployee(id);

    await logActivity(
      req,
      `Terminated employee: ${employee.email}`,
      'employee',
      id
    );

    res.status(200).json({
      success: true,
      message: 'Employee terminated',
      data: employee,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const updateEmployeeStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason = '' } = req.body;
    const adminId = req.user.id;

    if (!status)
      return res.status(400).json({ error: 'status is required' });

    const result = await employeeService.updateEmployeeStatus(id, status, adminId, reason);
    const updatedEmployee = await User.findById(id)
      .select('personalInfo.fullName personalInfo.firstName personalInfo.lastName email')
      .lean();
    const empName = updatedEmployee?.personalInfo?.fullName
      ?? `${updatedEmployee?.personalInfo?.firstName ?? ''} ${updatedEmployee?.personalInfo?.lastName ?? ''}`.trim()
      ?? updatedEmployee?.email
      ?? id;
    logActivity(
      req,
      `Employee status changed to ${status}: ${empName}`,
      'employee',
      id
    );

    res.status(200).json({
      success: true,
      message: `Employee status updated to ${status}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Document Controllers ────────────────────────────────────────────────────

const upload = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = upload.single('file');

export const uploadEmployeeDocController = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { id } = req.params;
    const { docType = 'other', label = '' } = req.body;
    const allowed = ['contract', 'government-id', 'nbi', 'medical', 'clearance', 'other'];

    if (!allowed.includes(docType))
      return res.status(400).json({ error: `Invalid docType. Must be: ${allowed.join(', ')}` });

    const doc = await uploadEmployeeDocument(id, req.file, docType, label);
    logActivity(
      req,
      `Document uploaded for employee: ${id} — ${docType}`,
      'employee',
      id
    );
    res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployeeDocController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });

    const result = await deleteEmployeeDocument(id, filePath);
    logActivity(
      req,
      `Document deleted for employee: ${id}`,
      'employee',
      id
    );
    res.status(200).json({ success: true, message: 'Document deleted', data: result });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDocsController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getEmployeeDocuments(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

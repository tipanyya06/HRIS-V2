import * as employeeService from './employees.service.js';
import { logActivity } from '../../middleware/activityLogger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const getEmployeesController = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (department) filters.department = department;
    if (status) filters.status = status;

    const result = await employeeService.getEmployees(filters, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
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

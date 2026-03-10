import { getAdmins, createAdmin, updateAdmin, setAdminStatus } from './admins.service.js';
import { logActivity } from '../../middleware/activityLogger.js';

/**
 * GET /api/admins
 * Get all admins with filters and pagination
 */
export const getAdminsController = async (req, res, next) => {
  try {
    const { search, role, page, limit } = req.query;
    const filters = { search, role };
    const pagination = { page, limit };

    const result = await getAdmins(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admins
 * Create a new admin account
 */
export const createAdminController = async (req, res, next) => {
  try {
    const result = await createAdmin(req.body);
    await logActivity(
      req,
      `Created admin account: ${result.email}`,
      'admin',
      result._id
    );
    res.status(201).json({
      success: true,
      data: result,
      message: 'Admin account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admins/:id
 * Update admin account
 */
export const updateAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateAdmin(id, req.body);
    await logActivity(
      req,
      `Updated admin: ${updated.email} -> role: ${updated.role}`,
      'admin',
      id
    );
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Admin updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admins/:id/status
 * Set admin status (activate/deactivate)
 */
export const setAdminStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await setAdminStatus(id, isActive);
    await logActivity(
      req,
      `${updated.isActive ? 'Activated' : 'Deactivated'} admin: ${updated.email}`,
      'admin',
      id
    );
    res.status(200).json({
      success: true,
      data: updated,
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

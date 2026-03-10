import User from '../auth/user.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

/**
 * Get all admins with filters and pagination
 */
export const getAdmins = async (filters = {}, pagination = {}) => {
  try {
    const { search, role } = filters;
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 20;

    let query = { role: { $in: ['admin', 'hr', 'super-admin'] } };

    // Filter by role if specified and not 'all'
    if (role && role !== 'all') {
      query.role = role;
    }

    // Search by email or name
    if (search && search.trim()) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'personalInfo.givenName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const data = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    logger.error(`Get admins error: ${error.message}`);
    throw error;
  }
};

/**
 * Create a new admin account
 */
export const createAdmin = async (data = {}) => {
  try {
    // Validate required fields
    if (!data.email || !data.password || !data.personalInfo?.givenName || !data.personalInfo?.lastName) {
      throw createError(400, 'Missing required fields: email, password, givenName, lastName');
    }

    // Validate role
    if (!['admin', 'hr'].includes(data.role)) {
      throw createError(400, 'Role must be admin or hr');
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw createError(409, 'Email already in use');
    }

    // Create new admin user
    const user = new User({
      email: data.email,
      // User model pre-save hook hashes password.
      password: data.password,
      role: data.role,
      department: data.department || '',
      personalInfo: {
        givenName: data.personalInfo.givenName || '',
        lastName: data.personalInfo.lastName || '',
      },
      isActive: true,
      isVerified: true,
    });

    await user.save();

    // Return without password
    const result = user.toObject();
    delete result.password;
    return result;
  } catch (error) {
    logger.error(`Create admin error: ${error.message}`);
    throw error;
  }
};

/**
 * Update admin account (role and department only)
 */
export const updateAdmin = async (id, data = {}) => {
  try {
    const allowed = {};

    // Only allow role and department updates
    // And only for non-super-admin accounts
    if (data.role && ['admin', 'hr'].includes(data.role)) {
      allowed.role = data.role;
    }
    if (typeof data.department === 'string') {
      allowed.department = data.department;
    }

    // Update only admin/hr users (not super-admin)
    const updated = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['admin', 'hr'] } },
      { $set: allowed },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      throw createError(404, 'Admin not found');
    }

    return updated;
  } catch (error) {
    logger.error(`Update admin error: ${error.message}`);
    throw error;
  }
};

/**
 * Set admin status (activate/deactivate)
 */
export const setAdminStatus = async (id, isActive) => {
  try {
    // Validate isActive is boolean
    if (typeof isActive !== 'boolean') {
      throw createError(400, 'isActive must be boolean');
    }

    // Update only admin/hr users (not super-admin)
    const updated = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['admin', 'hr'] } },
      { $set: { isActive } },
      { new: true }
    ).select('-password');

    if (!updated) {
      throw createError(404, 'Admin not found');
    }

    return updated;
  } catch (error) {
    logger.error(`Set admin status error: ${error.message}`);
    throw error;
  }
};

import { signToken } from '../../utils/jwt.js';
import User from './user.model.js';
import Applicant from '../applications/applicant.model.js';
import { getSupabaseClient } from '../../config/supabase.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject();

  delete user.password;

  if (user.personalInfo) {
    delete user.personalInfo.dateOfBirth;
  }
  if (user.contactInfo) {
    delete user.contactInfo.mainContactNo;
    delete user.contactInfo.emergencyContactNo;
  }
  if (user.emergencyContact) {
    delete user.emergencyContact.contact;
  }
  if (user.governmentIds) {
    delete user.governmentIds.ssn;
    delete user.governmentIds.tin;
    delete user.governmentIds.sss;
    delete user.governmentIds.pagIbig;
    delete user.governmentIds.philhealth;
  }
  if (user.payrollInfo) {
    delete user.payrollInfo.accountNumber;
  }

  return user;
};

/**
 * Register a new user with full employee profile
 */
export const signup = async ({ email, password, role = 'employee', ...allFormData }) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError(409, 'Email already registered');
    }

    // Create user in Supabase Auth
    const supabase = getSupabaseClient();
    const { data: supabaseData, error: supabaseError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
      },
    });

    if (supabaseError) {
      throw createError(500, `Supabase signup failed: ${supabaseError.message}`);
    }

    // Check if this email was already hired (has applicant record with isEmployee: true)
    // Use case-insensitive regex match
    const applicant = await Applicant.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      isEmployee: true,
    });

    // Create user profile in MongoDB with full payload
    const newUser = new User({
      email,
      password, // Hashed in pre-save hook
      role: 'employee',
      supabaseUid: supabaseData?.user?.id,
      ...allFormData,
    });

    // If applicant was already hired, auto-activate the account
    if (applicant) {
      newUser.isVerified = true;
      newUser.isActive = true;
      logger.info(`User auto-activated based on applicant hire status: ${email}`);
    } else {
      // Otherwise, account is pending admin approval
      newUser.isVerified = false;
      newUser.isActive = false;
      logger.info(`New user registered with pending status: ${email}`);
    }

    await newUser.save();
    
    // If applicant was hired, update the user record directly to ensure activation
    if (applicant) {
      await User.findByIdAndUpdate(newUser._id, {
        isVerified: true,
        isActive: true,
        role: 'employee',
      });
    }
    logger.info(`New user registered: ${email}`);

    // Generate JWT token
    const token = signToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: sanitizeUser(newUser),
      token,
    };
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    throw error;
  }
};

/**
 * Login an employee
 */
export const login = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createError(401, 'Invalid email or password');
    }

    // Check if user account is verified and active (only for employees)
    // Admins/HR/Super-admin bypass this check
    if (user.role === 'employee' && (user.isVerified === false || user.isActive === false)) {
      throw createError(
        401,
        'Your account is pending approval. Please wait until you have been hired and verified.'
      );
    }

    logger.info(`User logged in: ${email}`);

    // Generate JWT token
    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.personalInfo?.givenName || '',
        lastName: user.personalInfo?.lastName || '',
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

/**
 * Get current user profile (called with JWT)
 */
export const getProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw createError(404, 'User not found');
    }
    return user;
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    throw error;
  }
};

/**
 * Logout (frontend will delete JWT from localStorage)
 */
export const logout = async (userId) => {
  logger.info(`User logged out: ${userId}`);
  return { message: 'Logged out successfully' };
};

import multer from 'multer';
import { getSupabaseClient } from '../../config/supabase.js';
import User from '../auth/user.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Multer configuration for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type. Allowed: JPEG, PNG, PDF'));
  },
});

export const uploadProfilePicController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file provided'));
    }

    const userId = req.user.id || req.user._id;
    const file = req.file;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return next(createError(400, 'Profile picture must be JPEG or PNG'));
    }

    const supabase = getSupabaseClient();
    const timestamp = Date.now();
    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = `${userId}/profile-${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pics')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        duplex: 'half',
      });

    if (error) {
      logger.error(`Supabase upload error: ${error.message}`);
      return next(createError(500, `File upload failed: ${error.message}`));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pics')
      .getPublicUrl(filePath);

    const profilePicUrl = urlData?.publicUrl || '';

    // Update employee record
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicUrl },
      { new: true }
    ).select('-password');

    logger.info(`Profile picture uploaded for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicUrl,
        fileName: data?.name,
      },
    });
  } catch (error) {
    logger.error(`Profile picture upload error: ${error.message}`);
    next(error);
  }
};

export const uploadDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file provided'));
    }

    const userId = req.user.id || req.user._id;
    const file = req.file;
    const { documentType = 'other' } = req.body;

    // Validate file type
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      return next(createError(400, 'Document must be PDF, JPEG, or PNG'));
    }

    const supabase = getSupabaseClient();
    const timestamp = Date.now();
    const filePath = `${userId}/docs/${timestamp}-${file.originalname}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('employee-docs')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        duplex: 'half',
      });

    if (error) {
      logger.error(`Supabase document upload error: ${error.message}`);
      return next(createError(500, `File upload failed: ${error.message}`));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('employee-docs')
      .getPublicUrl(filePath);

    const documentUrl = urlData?.publicUrl || '';

    // Add document to employee's documents array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          documents: {
            url: documentUrl,
            originalName: file.originalname,
            type: documentType,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return next(createError(404, 'Employee not found'));
    }

    logger.info(`Document uploaded for user ${userId}: ${file.originalname}`);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentUrl,
        fileName: data?.name,
        documentType,
      },
    });
  } catch (error) {
    logger.error(`Document upload error: ${error.message}`);
    next(error);
  }
};

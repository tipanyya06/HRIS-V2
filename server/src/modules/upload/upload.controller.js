import { getSupabaseClient } from '../../config/supabase.js';
import { logger } from '../../utils/logger.js';
import User from '../auth/user.model.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Map upload types to specific Supabase buckets
const getBucketName = (type) => {
  const bucketMap = {
    'profile-pic': 'profile-pics',
    'photo': 'profile-pics',
    'document': 'employee-docs',
    'resume': 'resumes',
    'certificate': 'employee-docs',
  };
  return bucketMap[type] || 'employee-docs';
};

/**
 * Generic file upload controller
 * Uses type-specific buckets and updates MongoDB
 */
export const uploadFileController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file provided'));
    }

    const userId = req.user.id || req.user._id;
    const { type } = req.params;
    const { fieldName } = req.body;

    // Validate upload type
    const validTypes = ['resume', 'photo', 'document', 'certificate', 'profile-pic'];
    if (!validTypes.includes(type)) {
      return next(createError(400, `Invalid upload type. Must be one of: ${validTypes.join(', ')}`));
    }

    const file = req.file;
    const bucket = getBucketName(type);
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    const filePath = `${userId}/${type}/${timestamp}_${originalName}`;

    const supabase = getSupabaseClient();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
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
      .from(bucket)
      .getPublicUrl(filePath);

    const fileUrl = urlData?.publicUrl || '';

    logger.info(`File uploaded successfully: ${filePath} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: data?.name,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
        originalName: file.originalname,
        fieldName,
      },
    });
  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    next(error);
  }
};

/**
 * Profile picture upload controller
 * Uploads to profile-pics bucket and updates user profilePicUrl
 */
export const uploadProfilePicController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file provided'));
    }

    const userId = req.user.id || req.user._id;
    const file = req.file;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return next(createError(400, 'Profile picture must be JPEG, PNG, or WebP'));
    }

    const supabase = getSupabaseClient();
    const timestamp = Date.now();
    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
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
    ).select('-password -governmentIds.ssn -governmentIds.tin -governmentIds.sss -governmentIds.pagIbig -governmentIds.philhealth');

    if (!updatedUser) {
      return next(createError(404, 'Employee not found'));
    }

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

/**
 * Document upload controller
 * Uploads to employee-docs bucket and adds to user documents array
 */
export const uploadDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file provided'));
    }

    const userId = req.user.id || req.user._id;
    const file = req.file;
    const { documentType = 'other' } = req.body;

    // Validate file type
    if (!['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) {
      return next(createError(400, 'Document must be PDF, JPEG, PNG, or Word document'));
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
    ).select('-password -governmentIds.ssn -governmentIds.tin -governmentIds.sss -governmentIds.pagIbig -governmentIds.philhealth');

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

/**
 * Delete file controller
 * Removes file from appropriate Supabase bucket
 */
export const deleteFileController = async (req, res, next) => {
  try {
    const { filePath, bucket } = req.body;

    if (!filePath) {
      return next(createError(400, 'File path is required'));
    }

    // Default to employee-docs if bucket not specified
    const targetBucket = bucket || 'employee-docs';

    const supabase = getSupabaseClient();

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(targetBucket)
      .remove([filePath]);

    if (error) {
      logger.error(`Supabase delete error: ${error.message}`);
      return next(createError(500, `File deletion failed: ${error.message}`));
    }

    logger.info(`File deleted: ${filePath} from bucket ${targetBucket}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete error: ${error.message}`);
    next(error);
  }
};

/**
 * Get file URL controller
 * Retrieves public URL for a file
 */
export const getFileUrlController = async (req, res, next) => {
  try {
    const { filePath, bucket } = req.query;

    if (!filePath) {
      return next(createError(400, 'File path is required'));
    }

    // Default to employee-docs if bucket not specified
    const targetBucket = bucket || 'employee-docs';

    const supabase = getSupabaseClient();

    // Get public URL
    const { data } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath);

    const fileUrl = data?.publicUrl || '';

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
      },
    });
  } catch (error) {
    logger.error(`Get URL error: ${error.message}`);
    next(error);
  }
};

/**
 * Resume upload controller
 * Uploads resume to resumes bucket
 */
export const uploadResumeController = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No file uploaded' });

    const userId   = req.user.id;
    const fileName = `${userId}/resume-${Date.now()}.pdf`;
    const supabase = getSupabaseClient();

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Resume upload error:', uploadError);
      return res.status(500).json({ error: 'Resume upload failed' });
    }

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    return res.status(200).json({
      success: true,
      data: { resumeUrl: urlData.publicUrl },
    });
  } catch (err) {
    logger.error('Resume upload error:', err);
    next(err);
  }
};

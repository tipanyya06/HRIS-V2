import { getSupabaseClient } from '../../config/supabase.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const uploadFileController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file provided'));
    }

    const { type } = req.params;
    const { userId } = req.user;
    const { fieldName } = req.body; // e.g., which field this file is for

    // Validate upload type
    const validTypes = ['resume', 'photo', 'document', 'certificate'];
    if (!validTypes.includes(type)) {
      return next(createError(400, `Invalid upload type. Must be one of: ${validTypes.join(', ')}`));
    }

    const file = req.file;
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    const filename = `${userId}/${type}/${timestamp}_${originalName}`;

    const supabase = getSupabaseClient();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        duplex: 'half',
      });

    if (error) {
      logger.error(`Supabase upload error: ${error.message}`);
      return next(createError(500, `File upload failed: ${error.message}`));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    const fileUrl = urlData?.publicUrl || '';

    logger.info(`File uploaded successfully: ${filename} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename,
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

export const deleteFileController = async (req, res, next) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return next(createError(400, 'File path is required'));
    }

    const supabase = getSupabaseClient();

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);

    if (error) {
      logger.error(`Supabase delete error: ${error.message}`);
      return next(createError(500, `File deletion failed: ${error.message}`));
    }

    logger.info(`File deleted: ${filePath}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete error: ${error.message}`);
    next(error);
  }
};

export const getFileUrlController = async (req, res, next) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return next(createError(400, 'File path is required'));
    }

    const supabase = getSupabaseClient();

    // Get public URL
    const { data } = supabase.storage
      .from('uploads')
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

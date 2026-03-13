import multer from 'multer';

// Use memory storage - never diskStorage on Railway
const storage = multer.memoryStorage();

/**
 * Image upload configuration (profile pictures)
 * - 2MB file size limit
 * - JPEG/PNG only
 */
export const imageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Profile picture must be JPEG or PNG'));
  },
});

/**
 * Document upload configuration
 * - 10MB file size limit
 * - PDF, Word docs, images, Excel
 */
export const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type. Allowed: PDF, Word, Excel, JPG, PNG'));
  },
});

/**
 * Generic file upload configuration (for :type routes)
 * - 10MB file size limit
 * - Type-specific validation based on req.params.type
 */
const fileFilter = (req, file, cb) => {
  // Define allowed MIME types based on upload type
  const allowedMimes = {
    resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    photo: ['image/jpeg', 'image/png', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    certificate: ['application/pdf', 'image/jpeg', 'image/png'],
  };

  const uploadType = req.params.type || 'document';
  const allowed = allowedMimes[uploadType] || allowedMimes.document;

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${uploadType}. Allowed types: ${allowed.join(', ')}`));
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB max
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits,
});

/**
 * Resume upload configuration
 * - 5MB file size limit
 * - PDF only
 */
export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Resume must be PDF only'), false);
    }
  },
});

import multer from 'multer';

// Use memory storage - never diskStorage on Railway
const storage = multer.memoryStorage();

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

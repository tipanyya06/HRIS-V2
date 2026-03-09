import jwt from 'jsonwebtoken';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Verify JWT token from Authorization header
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError(401, 'No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    next(createError(403, 'Invalid or expired token'));
  }
};

// Role-based access control (use after verifyToken)
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(createError(403, 'Forbidden: insufficient role'));
  }
  next();
};

// Optional token verification (doesn't fail if no token, but parses it if present)
export const optionalToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid but we don't fail, just continue as unauthenticated
    }
  }
  next();
};

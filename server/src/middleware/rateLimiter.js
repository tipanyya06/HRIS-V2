import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000, 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isProd ? 100 : 2000), 10),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_LIMIT_WINDOW_MS || 15 * 60 * 1000, 10),
  max: parseInt(process.env.LOGIN_LIMIT_MAX_REQUESTS || (isProd ? 5 : 100), 10),
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
});

// Stricter limiter for public forms (apply, contact)
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per hour
  message: 'Too many submissions, please try again later',
});

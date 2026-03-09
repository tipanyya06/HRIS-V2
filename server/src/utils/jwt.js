import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

/**
 * Sign a JWT token
 */
export const signToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
  } catch (error) {
    logger.error(`Token sign error: ${error.message}`);
    throw error;
  }
};

/**
 * Verify a JWT token
 */
export const verifyTokenUtil = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error(`Token verify error: ${error.message}`);
    throw error;
  }
};

/**
 * Decode token without verification (for reading payload)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

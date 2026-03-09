import crypto from 'crypto';
import { logger } from './logger.js';

const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
const ALGO = 'aes-256-cbc';

/**
 * Encrypt a value using AES-256-CBC
 * Returns format: "iv:ciphertext" (both hex encoded)
 */
export const encrypt = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(String(text)), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    logger.error(`Encryption error: ${error.message}`);
    throw error;
  }
};

/**
 * Decrypt a value stored in "iv:ciphertext" format
 */
export const decrypt = (hash) => {
  if (!hash || !hash.includes(':')) return hash;
  try {
    const [ivHex, encHex] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    return Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final(),
    ]).toString();
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    throw error;
  }
};

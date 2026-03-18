import Log from '../modules/logs/log.model.js';
import { logger } from '../utils/logger.js';

export const logActivity = async (req, details, resource, resourceId = null) => {
  try {
    let action = req.method;

    // Map HTTP methods to standard action names
    if (req.method === 'POST') action = 'CREATE';
    if (req.method === 'PATCH') action = 'UPDATE';
    if (req.method === 'PUT') action = 'UPDATE';
    if (req.method === 'DELETE') action = 'DELETE';
    if (req.method === 'GET') action = 'VIEW';

    // Override with specific action from details string
    const d = String(details || '').toLowerCase();
    if (d.includes('logged in')) action = 'LOGIN';
    if (d.includes('logged out')) action = 'LOGOUT';
    if (d.includes('stage')) action = 'STAGE_CHANGE';
    if (d.includes('hired')) action = 'HIRE';
    if (d.includes('note added')) action = 'NOTE_ADDED';
    if (d.includes('uploaded')) action = 'UPLOAD';
    if (d.includes('deleted') && resource === 'employee') action = 'DELETE';
    if (d.includes('terminated')) action = 'TERMINATE';
    if (d.includes('deactivated')) action = 'DEACTIVATE';
    if (d.includes('activated') && !d.includes('deactivated')) action = 'ACTIVATE';
    if (d.includes('exported')) action = 'EXPORT';
    if (d.includes('generated')) action = 'GENERATE';
    if (d.includes('status changed')) action = 'STATUS_CHANGE';

    await Log.create({
      userId: req.user?.id || null,
      userEmail: req.user?.email || 'system',
      userRole: req.user?.role || 'system',
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    });
  } catch (err) {
    // Never throw - logging must never crash the main request
    logger.error(`Activity log error: ${err.message}`);
  }
};

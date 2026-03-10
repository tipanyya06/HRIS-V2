import Log from '../modules/logs/log.model.js';

export const logActivity = async (req, details, resource, resourceId = null) => {
  try {
    let action = req.method;

    if (req.method === 'POST') action = 'CREATE';
    if (req.method === 'PATCH') action = 'UPDATE';
    if (req.method === 'DELETE') action = 'DELETE';

    // Derive more specific actions for status/termination changes.
    if (resource === 'admin' || resource === 'employee') {
      const message = String(details || '').toLowerCase();
      if (message.includes('activated')) action = 'ACTIVATE';
      if (message.includes('deactivated')) action = 'DEACTIVATE';
      if (message.includes('terminated')) action = 'TERMINATE';
    }

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
    console.error('Activity log error:', err.message);
  }
};

# Backend Development Guide

## Phase 0 Stabilization Rules (Must Follow)

### Source of Truth Policy

- User is the single source of truth for identity, profile, government IDs, and payroll account data.
- Runtime service files must query User with role filters.
- Employee model is legacy/extension-only and must not be imported in runtime services.
- Employee model may be referenced in seed scripts for compatibility only.

### Canonical Field Names

Use these exact keys across backend modules:

- governmentIds.philhealth
- emergencyContact.contact

Do not introduce alternate spellings (for example, philHealth or emergencyContact.phone).

### Encryption Migration Status

- Model-level encryption hooks are active in user.model.js.
- One-time backfill has been executed and archived at:
  - src/scripts/archive/backfillEncryption.done.js
- Do not re-run backfill unless a new migration window is explicitly planned.

## Quick Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Backend runs on `http://localhost:5000`

---

## Module Template

Each module should follow this structure:

```
modules/feature/
  ├── feature.model.js          # Mongoose schema
  ├── feature.controller.js      # Request handlers
  ├── feature.service.js         # Business logic
  ├── feature.routes.js          # Route definitions
  └── feature.test.js            # Tests
```

### Example: Job Module

**job.model.js** — Define schema with validation
```javascript
const jobSchema = new mongoose.Schema({ ... });
export default mongoose.model('Job', jobSchema);
```

**job.service.js** — Business logic layer
```javascript
export const getJobs = async (filters) => {
  return Job.find(filters).populate('postedBy');
};
```

**job.controller.js** — Handle HTTP requests
```javascript
export const listJobs = async (req, res, next) => {
  try {
    const jobs = await getJobs({ status: 'active' });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
};
```

**job.routes.js** — Define endpoints
```javascript
router.get('/', listJobs);
router.post('/', verifyToken, requireRole('admin'), createJob);
```

---

## API Patterns

### Protected Route
```javascript
router.patch(
  '/:id/stage',
  verifyToken,          // JWT required
  requireRole('admin'), // Role check
  updateApplicationStage
);
```

### Pagination
```javascript
const { page = 1, limit = 10 } = req.query;
const skip = (page - 1) * limit;
const items = await Model.find().skip(skip).limit(limit);
```

### Error Handling
```javascript
export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  res.status(err.status || 500).json({ error: err.message });
};
```

### Response Contract Pattern

Keep API contracts stable and frontend-safe.

```javascript
return res.status(200).json({
  success: true,
  data,
});
```

For failures, return string errors or pass to next(error) from controllers.

---

## Testing

Run tests:
```bash
npm test
npm run test:coverage
```

### Unit Test Example
```javascript
import { describe, it, expect } from 'vitest';
import { getJobs } from '../job.service.js';

describe('Job Service', () => {
  it('should return active jobs', async () => {
    const jobs = await getJobs({ status: 'active' });
    expect(jobs).toBeInstanceOf(Array);
  });
});
```

### Integration Test (with Supertest)
```javascript
import request from 'supertest';
import app from '../../server.js';

describe('GET /api/jobs', () => {
  it('should return list of jobs', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});
```

---

## Encryption & Security

### Encrypt Sensitive Fields
```javascript
import { encrypt } from '../../utils/encrypt.js';

const isEncrypted = (value) => typeof value === 'string' && value.includes(':');

if (this.isModified('governmentIds.sss') && this.governmentIds?.sss && !isEncrypted(this.governmentIds.sss)) {
  this.governmentIds.sss = encrypt(this.governmentIds.sss);
}
```

Always guard against double-encryption when updating existing rows.

### JWT Token
```javascript
import { signToken, verifyTokenUtil } from '../../utils/jwt.js';

const token = signToken({ id: user._id, role: user.role });
const decoded = verifyTokenUtil(token);
```

### Rate Limiting
```javascript
import { apiLimiter, loginLimiter } from '../../middleware/rateLimiter.js';

router.post('/login', loginLimiter, handleLogin);
router.use(apiLimiter);
```

---

## MongoDB & TTL Indexes

### View Indexes
```bash
# In MongoDB Compass or Atlas Shell
db.applicants.getIndexes()
```

### Promote Applicant to Employee
```javascript
await Applicant.findByIdAndUpdate(
  applicantId,
  {
    isEmployee: true,
    $unset: { deletedAt: '' }
  }
);
```

The TTL index will no longer apply after this.

---

## Logging

```javascript
import { logger } from '../../utils/logger.js';

logger.info('User logged in');
logger.error('Database connection failed');
logger.warn('Deprecated API endpoint');
logger.debug('Trace information');
```

Logs are written to `logs/` directory.

---

## Environment Variables

All secrets go in `.env` — NEVER commit this file.

```
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

Validate on startup with a config file:

```javascript
const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
requiredVars.forEach(v => {
  if (!process.env[v]) throw new Error(`Missing ${v}`);
});
```

---

## Common Tasks

### Add a New Module

1. Create folder `modules/feature/`
2. Create `feature.model.js` (schema)
3. Create `feature.service.js` (logic)
4. Create `feature.controller.js` (handlers)
5. Create `feature.routes.js` (endpoints)
6. Import routes in `server.js`

### Add Service Query Safely (User-first)

1. Import User model from modules/auth/user.model.js
2. Add role filter to every query when targeting employees/admins/applicants
3. Preserve canonical field names for sensitive paths
4. Ensure responses follow `{ success, data }` pattern

Example:

```javascript
const employees = await User.find({ role: 'employee', isActive: true })
  .select('-password')
  .lean();
```

### Debug a Route

1. Add breakpoint in controller
2. Run `npm run dev` (with nodemon)
3. VS Code debugger will pause
4. Inspect variables in Debug pane

### Test Database Locally

Use MongoDB Compass — connect to your local MongoDB:
```
mongodb://localhost:27017/hris_v2_dev
```

### Verify Canonical Sensitive Keys

Use case-sensitive search before merging model changes:

```powershell
Get-ChildItem -Path server/src -Recurse -File |
  Select-String -Pattern 'philHealth','philhealth','emergencyContact\.phone','emergencyContact\.contact' -CaseSensitive
```

---

*Sprint 1+ Development Guide for Madison 88 HRIS/ATS*

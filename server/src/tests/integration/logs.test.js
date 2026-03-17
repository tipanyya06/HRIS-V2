/**
 * Integration tests — Logs module (S10)
 *
 * Covers:
 *  4. Logs list filters and pagination
 *  5. Logs export access control
 */

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import logsRouter from '../../modules/logs/logs.routes.js';
import { globalErrorHandler } from '../../middleware/error.js';
import Log from '../../modules/logs/log.model.js';
import {
  connectToTestDatabase,
  dropTestCollections,
  disconnectTestDatabase,
} from '../helpers/testDb.js';

// ─── Env / config ────────────────────────────────────────────────────────────

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Minimal test app (no rate limiter) ──────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/api/logs', logsRouter);
app.use(globalErrorHandler);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fakeOid = () => new mongoose.Types.ObjectId();

const makeToken = (role, email) =>
  `Bearer ${jwt.sign(
    { id: fakeOid().toString(), role, email: email || `${role}@test.com` },
    JWT_SECRET,
    { expiresIn: '1h' }
  )}`;

const adminToken    = () => makeToken('admin');
const employeeToken = () => makeToken('employee', 'worker@test.com');

/**
 * Seed log documents with explicit timestamps via collection.insertMany()
 * to bypass Mongoose's immutable createdAt.
 */
const SEED_LOGS = [
  // Log 1 – CREATE on employee resource, January 2026
  {
    action: 'CREATE',
    resource: 'employee',
    userEmail: 'hr@test.com',
    userRole: 'hr',
    details: 'Created new employee record for John Doe',
    ip: '127.0.0.1',
    createdAt: new Date('2026-01-10T09:00:00Z'),
    updatedAt: new Date('2026-01-10T09:00:00Z'),
  },
  // Log 2 – UPDATE on job resource, February 2026
  {
    action: 'UPDATE',
    resource: 'job',
    userEmail: 'admin@test.com',
    userRole: 'admin',
    details: 'Updated job posting for Software Engineer',
    ip: '127.0.0.1',
    createdAt: new Date('2026-02-15T14:30:00Z'),
    updatedAt: new Date('2026-02-15T14:30:00Z'),
  },
  // Log 3 – CREATE on job resource, January 2026
  {
    action: 'CREATE',
    resource: 'job',
    userEmail: 'recruiter@test.com',
    userRole: 'hr',
    details: 'Created new job posting for DevOps Engineer',
    ip: '127.0.0.1',
    createdAt: new Date('2026-01-20T11:00:00Z'),
    updatedAt: new Date('2026-01-20T11:00:00Z'),
  },
];

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Logs API', () => {
  beforeAll(async () => {
    await connectToTestDatabase();
  });

  afterAll(async () => {
    await dropTestCollections(['logs']);
    await disconnectTestDatabase();
  });

  // ── 4. Logs list filters and pagination ────────────────────────────────────

  describe('4. Logs list filters and pagination', () => {
    beforeAll(async () => {
      await Log.deleteMany({});
      await Log.collection.insertMany(SEED_LOGS);
    });

    afterAll(async () => {
      await Log.deleteMany({});
    });

    it('returns paginated results with correct shape', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
    });

    it('?resource=employee returns only employee logs', async () => {
      const res = await request(app)
        .get('/api/logs')
        .query({ resource: 'employee' })
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data.every((l) => l.resource === 'employee')).toBe(true);
    });

    it('?action=CREATE returns only CREATE logs', async () => {
      const res = await request(app)
        .get('/api/logs')
        .query({ action: 'CREATE' })
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((l) => l.action === 'CREATE')).toBe(true);
    });

    it('?dateFrom and ?dateTo filter logs by date range', async () => {
      const res = await request(app)
        .get('/api/logs')
        .query({ dateFrom: '2026-01-01', dateTo: '2026-01-31' })
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      // Only logs 1 and 3 were created in January 2026
      expect(res.body.data.length).toBe(2);

      res.body.data.forEach((log) => {
        const d = new Date(log.createdAt);
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(0); // Month is 0-indexed; 0 = January
      });
    });

    it('?search filters logs by userEmail', async () => {
      const res = await request(app)
        .get('/api/logs')
        .query({ search: 'hr@test.com' })
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const match = res.body.data.some((l) => l.userEmail === 'hr@test.com');
      expect(match).toBe(true);
    });

    it('?search filters logs by details text', async () => {
      const res = await request(app)
        .get('/api/logs')
        .query({ search: 'DevOps Engineer' })
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].details).toContain('DevOps Engineer');
    });
  });

  // ── 5. Logs export access control ──────────────────────────────────────────

  describe('5. Logs export access control', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/logs/export/csv');

      expect(res.status).toBe(401);
    });

    it('returns 403 with an employee role token', async () => {
      const res = await request(app)
        .get('/api/logs/export/csv')
        .set('Authorization', employeeToken());

      expect(res.status).toBe(403);
    });

    it('returns 200 with an admin token and downloads a CSV', async () => {
      // Ensure at least one log exists for a non-empty CSV
      await Log.collection.insertOne({
        action: 'EXPORT',
        resource: 'logs',
        userEmail: 'admin@test.com',
        userRole: 'admin',
        details: 'Exported logs to CSV',
        ip: '127.0.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/logs/export/csv')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.headers['content-disposition']).toMatch(/activity-logs/);
      // CSV body must have a header row
      expect(res.text).toContain('Timestamp');
    });
  });
});

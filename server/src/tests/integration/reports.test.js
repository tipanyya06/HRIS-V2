/**
 * Integration tests — Reports module (S10)
 *
 * Covers:
 *  1. Reports filter validation (dateFrom/dateTo)
 *  2. Trend data shape for /trends/ats, /trends/hiring, /trends/training
 *  3. Report exports via /export/csv and /export/pdf
 */

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import reportsRouter from '../../modules/reports/reports.routes.js';
import { globalErrorHandler } from '../../middleware/error.js';
import Applicant from '../../modules/applications/applicant.model.js';
import TrainingRecord from '../../modules/training/training.model.js';
import User from '../../modules/auth/user.model.js';
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
app.use('/api/reports', reportsRouter);
app.use(globalErrorHandler);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fakeOid = () => new mongoose.Types.ObjectId();

const adminToken = () =>
  `Bearer ${jwt.sign(
    { id: fakeOid().toString(), role: 'admin', email: 'admin@test.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  )}`;

/**
 * Insert applicant docs with explicit createdAt values.
 * Uses collection.insertMany() to bypass Mongoose's immutable timestamp.
 */
const seedApplicants = async (docs) => {
  const now = new Date();
  return Applicant.collection.insertMany(
    docs.map((d) => ({
      jobId: fakeOid(),
      fullName: 'Test User',
      email: 'test@test.com',
      stage: 'applied',
      phone: '',
      resumeUrl: '',
      coverLetter: '',
      isEmployee: false,
      notes: [],
      stageHistory: [],
      deletedAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      updatedAt: d.createdAt || now,
      ...d,
    }))
  );
};

/**
 * Insert training records with explicit completedAt values.
 */
const seedTraining = async (docs) => {
  return TrainingRecord.collection.insertMany(
    docs.map((d) => ({
      employeeId: fakeOid(),
      courseName: 'Test Course',
      status: 'completed',
      updatedAt: d.completedAt || new Date(),
      createdAt: d.completedAt || new Date(),
      ...d,
    }))
  );
};

/**
 * Insert employee users used by custom/PESO report routes.
 */
const seedEmployees = async (docs) => {
  return User.collection.insertMany(
    docs.map((d, i) => ({
      email: d.email || `employee${i + 1}@test.com`,
      password: d.password || 'hashed-password',
      role: 'employee',
      isActive: true,
      countryOfEmployment: d.countryOfEmployment || 'Philippines',
      ...d,
    }))
  );
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Reports API', () => {
  beforeAll(async () => {
    await connectToTestDatabase();
    await Applicant.deleteMany({});
    await TrainingRecord.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await dropTestCollections(['applicants', 'trainingrecords', 'users']);
    await disconnectTestDatabase();
  });

  // ── 1. Reports filter validation ────────────────────────────────────────────

  describe('1. Reports filter validation', () => {
    beforeEach(async () => {
      await Applicant.deleteMany({});
    });

    it('returns 400 when dateFrom is after dateTo', async () => {
      const res = await request(app)
        .get('/api/reports/ats?dateFrom=2026-02-01&dateTo=2026-01-01')
        .set('Authorization', adminToken());

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('dateFrom cannot be after dateTo');
    });

    it('returns 200 with valid dateFrom and dateTo and filters results correctly', async () => {
      // Seed: 2 applied in Jan 2026, 1 applied in Mar 2026
      await seedApplicants([
        { stage: 'applied', createdAt: new Date('2026-01-10') },
        { stage: 'applied', createdAt: new Date('2026-01-20') },
        { stage: 'applied', createdAt: new Date('2026-03-05') },
      ]);

      const res = await request(app)
        .get('/api/reports/ats?dateFrom=2026-01-01&dateTo=2026-01-31')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Only the 2 January applications should be counted
      expect(res.body.data.applied).toBe(2);
      expect(res.body.data.total).toBe(2);
    });

    it('returns 200 with no filters (regression check)', async () => {
      const res = await request(app)
        .get('/api/reports/ats')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('applied');
      expect(res.body.data).toHaveProperty('hired');
    });
  });

  // ── 2. Trend data shape ─────────────────────────────────────────────────────

  describe('2. Trend data shape', () => {
    describe('with empty collections', () => {
      beforeEach(async () => {
        await Applicant.deleteMany({});
        await TrainingRecord.deleteMany({});
      });

      it('getATSTrend returns [] not null when there is no data', async () => {
        const res = await request(app)
          .get('/api/reports/trends/ats?dateFrom=2026-01-01&dateTo=2026-01-31')
          .set('Authorization', adminToken());

        expect(res.status).toBe(200);
        expect(res.body.data).not.toBeNull();
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(0);
      });

      it('getHiringTrend returns [] not null when there is no data', async () => {
        const res = await request(app)
          .get('/api/reports/trends/hiring?dateFrom=2026-01-01&dateTo=2026-01-31')
          .set('Authorization', adminToken());

        expect(res.status).toBe(200);
        expect(res.body.data).not.toBeNull();
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(0);
      });

      it('getTrainingCompletionTrend returns [] not null when there is no data', async () => {
        const res = await request(app)
          .get('/api/reports/trends/training?dateFrom=2026-01-01&dateTo=2026-01-31')
          .set('Authorization', adminToken());

        expect(res.status).toBe(200);
        expect(res.body.data).not.toBeNull();
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(0);
      });
    });

    describe('with seeded data', () => {
      beforeEach(async () => {
        await Applicant.deleteMany({});
        await TrainingRecord.deleteMany({});

        // 2 hired in Jan 2026, 1 rejected in Feb 2026
        await seedApplicants([
          { stage: 'hired', createdAt: new Date('2026-01-10') },
          { stage: 'hired', createdAt: new Date('2026-01-22') },
          { stage: 'rejected', createdAt: new Date('2026-02-14') },
        ]);

        // 1 completed training in Jan, 1 in Feb
        await seedTraining([
          { completedAt: new Date('2026-01-15') },
          { completedAt: new Date('2026-02-20') },
        ]);
      });

      it('getATSTrend returns array sorted chronologically', async () => {
        const res = await request(app)
          .get('/api/reports/trends/ats?dateFrom=2026-01-01&dateTo=2026-02-28')
          .set('Authorization', adminToken());

        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        // Each successive month key must be >= the previous (chronological)
        for (let i = 1; i < data.length; i++) {
          expect(data[i].month >= data[i - 1].month).toBe(true);
        }

        // Spot-check bucket counts
        const jan = data.find((d) => d.month === '2026-01');
        const feb = data.find((d) => d.month === '2026-02');
        expect(jan?.count).toBe(2);
        expect(feb?.count).toBe(1);
      });

      it('getHiringTrend items have { month, hired, rejected } shape', async () => {
        const res = await request(app)
          .get('/api/reports/trends/hiring?dateFrom=2026-01-01&dateTo=2026-02-28')
          .set('Authorization', adminToken());

        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        data.forEach((item) => {
          expect(item).toHaveProperty('month');
          expect(item).toHaveProperty('hired');
          expect(item).toHaveProperty('rejected');
          expect(typeof item.month).toBe('string');
          expect(typeof item.hired).toBe('number');
          expect(typeof item.rejected).toBe('number');
        });

        // Spot-check values against seed
        const jan = data.find((d) => d.month === '2026-01');
        const feb = data.find((d) => d.month === '2026-02');
        expect(jan?.hired).toBe(2);
        expect(jan?.rejected).toBe(0);
        expect(feb?.hired).toBe(0);
        expect(feb?.rejected).toBe(1);
      });

      it('getTrainingCompletionTrend items have { month, completed } shape', async () => {
        const res = await request(app)
          .get('/api/reports/trends/training?dateFrom=2026-01-01&dateTo=2026-02-28')
          .set('Authorization', adminToken());

        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        data.forEach((item) => {
          expect(item).toHaveProperty('month');
          expect(item).toHaveProperty('completed');
          expect(typeof item.month).toBe('string');
          expect(typeof item.completed).toBe('number');
        });

        // Spot-check values against seed
        const jan = data.find((d) => d.month === '2026-01');
        const feb = data.find((d) => d.month === '2026-02');
        expect(jan?.completed).toBe(1);
        expect(feb?.completed).toBe(1);
      });
    });
  });

  // ── 3. Report exports with filters ─────────────────────────────────────────

  describe('3. Report exports with filters', () => {
    beforeEach(async () => {
      await Applicant.deleteMany({});
    });

    it('GET /api/reports/export/csv?type=ats returns a CSV file', async () => {
      const res = await request(app)
        .get('/api/reports/export/csv?type=ats')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      // CSV must have at least the header line
      expect(res.text).toContain('Stage,Count');
    });

    it('GET /api/reports/export/pdf?type=ats returns a PDF file', async () => {
      const res = await request(app)
        .get('/api/reports/export/pdf?type=ats')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('export with dateFrom/dateTo filters produces only filtered data in CSV', async () => {
      // Seed: 2 applied in Jan 2026, 1 hired in Nov 2025
      await seedApplicants([
        { stage: 'applied', createdAt: new Date('2026-01-10') },
        { stage: 'applied', createdAt: new Date('2026-01-25') },
        { stage: 'hired',   createdAt: new Date('2025-11-05') },
      ]);

      const res = await request(app)
        .get('/api/reports/export/csv?type=ats&dateFrom=2026-01-01&dateTo=2026-01-31')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);

      // The Nov 2025 "hired" doc must be excluded; only the Jan applied docs count
      const lines = res.text.split('\n');
      const appliedLine = lines.find((l) => l.startsWith('applied,'));
      const hiredLine   = lines.find((l) => l.startsWith('hired,'));

      expect(appliedLine).toBe('applied,2');
      expect(hiredLine).toBe('hired,0');
    });
  });

  // ── 4. Custom/PESO reports ────────────────────────────────────────────────

  describe('4. Custom/PESO reports', () => {
    beforeEach(async () => {
      await User.deleteMany({});
    });

    it('POST /api/reports/custom returns selected fields for active employees', async () => {
      await seedEmployees([
        {
          email: 'juan@test.com',
          personalInfo: { givenName: 'Juan', lastName: 'Dela Cruz', sex: 'Male' },
          positionTitle: 'Software Engineer',
          department: 'Engineering',
          dateOfEmployment: new Date('2026-01-10'),
          governmentIds: { sss: '123', tin: '456', philhealth: '789', pagIbig: '321' },
        },
      ]);

      const res = await request(app)
        .post('/api/reports/custom')
        .set('Authorization', adminToken())
        .send({
          fields: ['Full Name', 'Position', 'Department'],
          filters: { countryOfEmployment: 'Philippines' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]['Full Name']).toBe('Juan Dela Cruz');
      expect(res.body.data[0].Position).toBe('Software Engineer');
      expect(res.body.data[0].Department).toBe('Engineering');
    });

    it('POST /api/reports/custom/export/xlsx returns an Excel file', async () => {
      await seedEmployees([
        {
          email: 'ana@test.com',
          personalInfo: { givenName: 'Ana', lastName: 'Reyes' },
          positionTitle: 'HR Officer',
          department: 'HR',
        },
      ]);

      const res = await request(app)
        .post('/api/reports/custom/export/xlsx')
        .set('Authorization', adminToken())
        .send({
          reportName: 'People Export',
          fields: ['Full Name', 'Department'],
          filters: {},
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/);
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('POST /api/reports/custom/export/pdf returns a PDF file', async () => {
      await seedEmployees([
        {
          email: 'lea@test.com',
          personalInfo: { givenName: 'Lea', lastName: 'Santos' },
        },
      ]);

      const res = await request(app)
        .post('/api/reports/custom/export/pdf')
        .set('Authorization', adminToken())
        .send({
          reportName: 'Custom PDF',
          fields: ['Full Name'],
          filters: {},
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('GET /api/reports/peso returns fixed PESO fields', async () => {
      await seedEmployees([
        {
          email: 'maria@test.com',
          personalInfo: {
            givenName: 'Maria',
            lastName: 'Lopez',
            dateOfBirth: '1995-05-03',
            sex: 'Female',
            civilStatus: 'Single',
          },
          contactInfo: {
            address: {
              addressLine: '123 Main St',
              city: 'Quezon City',
              province: 'Metro Manila',
              country: 'Philippines',
            },
          },
          governmentIds: {
            sss: '111',
            philhealth: '222',
            tin: '333',
            pagIbig: '444',
          },
          positionTitle: 'Analyst',
          department: 'Operations',
          dateOfEmployment: new Date('2026-02-01'),
        },
      ]);

      const res = await request(app)
        .get('/api/reports/peso')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]['Full Name']).toBe('Maria Lopez');
      expect(res.body.data[0].Department).toBe('Operations');
      expect(res.body.data[0].Position).toBe('Analyst');
    });

    it('POST /api/reports/peso/export/csv returns a CSV file', async () => {
      await seedEmployees([
        {
          email: 'peso@test.com',
          personalInfo: { givenName: 'Peso', lastName: 'User' },
        },
      ]);

      const res = await request(app)
        .post('/api/reports/peso/export/csv')
        .set('Authorization', adminToken())
        .send({ filters: {} });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Full Name,Date of Birth,Sex,Address,Civil Status');
    });

    it('GET /api/reports/peso ignores invalid date query values and still returns 200', async () => {
      await seedEmployees([
        {
          email: 'peso-invalid-date@test.com',
          personalInfo: { givenName: 'Peso', lastName: 'Date' },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/peso?dateFrom=undefined&dateTo=undefined')
        .set('Authorization', adminToken());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

/**
 * Preservation Property Tests — Pre-Employment Hire Gate
 *
 * These tests encode the BASELINE behavior that must be preserved after the fix.
 * They PASS on unfixed code (confirming the baseline) and must continue to PASS
 * on fixed code (confirming no regressions).
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock all Mongoose models BEFORE importing the service
// ---------------------------------------------------------------------------
vi.mock('../applicant.model.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../../auth/user.model.js', () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../preEmployment/preEmployment.model.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../interviews/interviewSchedule.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../jobs/job.model.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

// Mock email utility to prevent real email sends
vi.mock('../../../utils/email.js', () => ({
  default: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  sendEmail: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import service and mocked models AFTER vi.mock declarations
// ---------------------------------------------------------------------------
import { updateStage, hireApplicant } from '../applications.service.js';
import Applicant from '../applicant.model.js';
import User from '../../auth/user.model.js';
import PreEmployment from '../../preEmployment/preEmployment.model.js';
import InterviewSchedule from '../../interviews/interviewSchedule.model.js';
import Job from '../../jobs/job.model.js';

// ---------------------------------------------------------------------------
// Shared fake data
// ---------------------------------------------------------------------------
const fakeApplicantId = '64a000000000000000000001';
const fakeUserId = '64a000000000000000000002';
const fakeJobId = '64a000000000000000000099';

/** A minimal fake applicant */
const makeFakeApplicant = (stage = 'screening') => ({
  _id: fakeApplicantId,
  email: 'jane.doe@example.com',
  fullName: 'Jane Doe',
  phone: '09171234567',
  stage,
  jobId: fakeJobId,
  userId: fakeUserId,
  isEmployee: false,
  stageHistory: [],
  save: vi.fn().mockResolvedValue(true),
});

/** A minimal fake linked user */
const makeFakeUser = () => ({
  _id: fakeUserId,
  email: 'jane.doe@example.com',
});

/** A fully approved PreEmployment record */
const makeApprovedPreEmp = () => ({
  overallStatus: 'approved',
  items: [
    { key: 'nbi', label: 'NBI Clearance', required: true, status: 'approved' },
  ],
});

/** A minimal fake job */
const makeFakeJob = () => ({
  _id: fakeJobId,
  title: 'Software Engineer',
  department: 'Engineering',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('updateStage() — Preservation (non-buggy inputs unaffected)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // InterviewSchedule.findOne uses .lean() chaining — mock the chain
    InterviewSchedule.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    InterviewSchedule.create.mockResolvedValue({});
    InterviewSchedule.updateMany.mockResolvedValue({});

    // PreEmployment.findOne uses .lean() chaining in hireApplicant
    PreEmployment.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
  });

  // -------------------------------------------------------------------------
  // Test 1 — Non-hired stage transitions: no PreEmployment check
  // Validates: Requirement 3.1
  // -------------------------------------------------------------------------
  describe('Non-hired stage transitions — stage order preserved', () => {
    it("should keep allowing stage to stay at 'screening' without calling PreEmployment.findOne", async () => {
      // Arrange
      Applicant.findById.mockResolvedValue(makeFakeApplicant());

      // Act
      const result = await updateStage(fakeApplicantId, 'screening', 'admin1', 'Admin One');

      // Assert — stage updated, no pre-employment lookup
      expect(result.stage).toBe('screening');
      expect(PreEmployment.findOne).not.toHaveBeenCalled();
    });

    it("should keep allowing forward stage transition to 'interview' without calling PreEmployment.findOne", async () => {
      // Arrange
      Applicant.findById.mockResolvedValue(makeFakeApplicant());

      // Act
      const result = await updateStage(fakeApplicantId, 'interview', 'admin1', 'Admin One');

      // Assert — stage updated, no pre-employment lookup
      expect(result.stage).toBe('interview');
      expect(PreEmployment.findOne).not.toHaveBeenCalled();
    });

    it("should now reject skipping directly to 'offer'", async () => {
      // Arrange
      Applicant.findById.mockResolvedValue(makeFakeApplicant());

      // Act & Assert
      await expect(
        updateStage(fakeApplicantId, 'offer', 'admin1', 'Admin One')
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('Cannot skip stages'),
      });
      expect(PreEmployment.findOne).not.toHaveBeenCalled();
    });

    it("should now reject moving backwards to 'applied'", async () => {
      // Arrange
      Applicant.findById.mockResolvedValue(makeFakeApplicant());

      // Act & Assert
      await expect(
        updateStage(fakeApplicantId, 'applied', 'admin1', 'Admin One')
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('Cannot move backwards'),
      });
      expect(PreEmployment.findOne).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Test 2 — Interview schedule lifecycle
  // Validates: Requirements 3.4, 3.5
  // -------------------------------------------------------------------------
  describe('Interview schedule lifecycle', () => {
    it('should create a pending InterviewSchedule when moving to interview and none exists', async () => {
      // Arrange
      Applicant.findById.mockResolvedValue(makeFakeApplicant('screening'));
      // Service calls InterviewSchedule.findOne(...).lean() — mock the chain
      InterviewSchedule.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      // Act
      await updateStage(fakeApplicantId, 'interview', 'admin1', 'Admin One');

      // Assert — a new pending record was created
      expect(InterviewSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          applicantId: fakeApplicantId,
          status: 'pending',
        })
      );
    });

    it('should cancel all active interview records when moving to rejected', async () => {
      // Arrange
      Applicant.findById.mockResolvedValue(makeFakeApplicant('interview'));

      // Act
      await updateStage(fakeApplicantId, 'rejected', 'admin1', 'Admin One');

      // Assert — active records cancelled
      expect(InterviewSchedule.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          applicantId: fakeApplicantId,
          status: { $in: ['pending', 'scheduled', 'rescheduled'] },
        }),
        { $set: { status: 'cancelled' } }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 3 — Approved hire path: gate passes, downstream logic runs
  // Validates: Requirement 3.3
  // -------------------------------------------------------------------------
  describe('Approved hire path', () => {
    it('should complete successfully and set isEmployee=true when PreEmployment is fully approved', async () => {
      // Arrange
      const fakeApplicant = makeFakeApplicant('offer');
      Applicant.findById.mockResolvedValue(fakeApplicant);
      User.findOne.mockResolvedValue(makeFakeUser());
      // PreEmployment.findOne not called in unfixed updateStage, but set for completeness
      PreEmployment.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(makeApprovedPreEmp()) });
      User.findByIdAndUpdate.mockResolvedValue({});
      User.findById.mockResolvedValue(makeFakeUser());
      // Job.findById uses .select() chaining in the profile copy step
      Job.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(makeFakeJob()) });
      Applicant.findByIdAndUpdate.mockResolvedValue({});

      // Act
      const result = await updateStage(fakeApplicantId, 'hired', 'admin1', 'Admin One');

      // Assert — hire completed, isEmployee set
      expect(result.isEmployee).toBe(true);
      expect(result.stage).toBe('hired');
    });
  });

  // -------------------------------------------------------------------------
  // Test 4 — hireApplicant() gate unchanged
  // Validates: Requirement 3.2
  // -------------------------------------------------------------------------
  describe('hireApplicant() gate unchanged', () => {
    it('should still throw 400 when PreEmployment record is missing', async () => {
      // Arrange
      const offerApplicant = makeFakeApplicant('offer');
      Applicant.findById.mockResolvedValue(offerApplicant);
      User.findOne.mockResolvedValue(makeFakeUser());
      // hireApplicant uses .lean() chaining — return null via the chain
      PreEmployment.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      // Act & Assert
      await expect(
        hireApplicant(fakeApplicantId, 'admin1')
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('Pre-employment checklist not found'),
      });
    });
  });
});

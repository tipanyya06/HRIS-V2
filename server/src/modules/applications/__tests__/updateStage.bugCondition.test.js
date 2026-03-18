/**
 * Bug Condition Exploration Tests — Pre-Employment Hire Gate
 *
 * These tests encode the EXPECTED behavior (gate should throw).
 * They FAIL on unfixed code (the function does NOT throw — it completes
 * successfully instead). This failure IS the success condition for this
 * exploration task.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock all Mongoose models BEFORE importing the service
// ---------------------------------------------------------------------------
vi.mock('../applicant.model.js', () => ({
  default: {
    findById: vi.fn(),
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
import { updateStage } from '../applications.service.js';
import Applicant from '../applicant.model.js';
import User from '../../auth/user.model.js';
import PreEmployment from '../../preEmployment/preEmployment.model.js';
import InterviewSchedule from '../../interviews/interviewSchedule.model.js';

// ---------------------------------------------------------------------------
// Shared fake data
// ---------------------------------------------------------------------------
const fakeApplicantId = '64a000000000000000000001';
const fakeUserId = '64a000000000000000000002';

/** A minimal fake applicant at 'offer' stage */
const makeFakeApplicant = () => ({
  _id: fakeApplicantId,
  email: 'jane.doe@example.com',
  fullName: 'Jane Doe',
  phone: '09171234567',
  stage: 'offer',
  jobId: '64a000000000000000000099',
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('updateStage() — Bug Condition Exploration (pre-employment gate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: InterviewSchedule.findOne uses .lean() chaining
    InterviewSchedule.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    InterviewSchedule.create.mockResolvedValue({});
    InterviewSchedule.updateMany.mockResolvedValue({});
  });

  // -------------------------------------------------------------------------
  // Test Case A — No PreEmployment record
  // -------------------------------------------------------------------------
  it('Test A: should throw 400 when no PreEmployment record exists for the linked user', async () => {
    // Arrange
    Applicant.findById.mockResolvedValue(makeFakeApplicant());
    User.findOne.mockResolvedValue(makeFakeUser());
    PreEmployment.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }); // <-- no checklist record

    // Act & Assert
    await expect(
      updateStage(fakeApplicantId, 'hired', 'admin1', 'Admin One')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Pre-employment checklist not found'),
    });
  });

  // -------------------------------------------------------------------------
  // Test Case B — PreEmployment exists but not approved
  // -------------------------------------------------------------------------
  it('Test B: should throw 400 when PreEmployment overallStatus is in-progress with pending required items', async () => {
    // Arrange
    Applicant.findById.mockResolvedValue(makeFakeApplicant());
    User.findOne.mockResolvedValue(makeFakeUser());
    PreEmployment.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        overallStatus: 'in-progress',
        items: [
          { key: 'nbi', label: 'NBI Clearance', required: true, status: 'pending' },
        ],
      }),
    });

    // Act & Assert
    await expect(
      updateStage(fakeApplicantId, 'hired', 'admin1', 'Admin One')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Pre-employment requirements not fully approved'),
    });
  });

  // -------------------------------------------------------------------------
  // Test Case C — No linked User account
  // -------------------------------------------------------------------------
  it('Test C: should throw 404 when no User record exists for the applicant email', async () => {
    // Arrange
    Applicant.findById.mockResolvedValue(makeFakeApplicant());
    User.findOne.mockResolvedValue(null); // <-- no linked user

    // Act & Assert
    await expect(
      updateStage(fakeApplicantId, 'hired', 'admin1', 'Admin One')
    ).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining('No user account found'),
    });
  });
});

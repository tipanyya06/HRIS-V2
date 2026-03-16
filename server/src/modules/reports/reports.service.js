import mongoose from 'mongoose';
import User from '../auth/user.model.js';
import Job from '../jobs/job.model.js';
import Applicant from '../applications/applicant.model.js';
import InterviewSchedule from '../interviews/interview.model.js';
import TrainingRecord from '../training/training.model.js';
import { logger } from '../../utils/logger.js';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const buildDateRangeFilter = (filters = {}) => {
  const { dateFrom, dateTo } = filters;

  if (!dateFrom && !dateTo) {
    return {};
  }

  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;

  if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
    return {};
  }

  if (fromDate && toDate && fromDate > toDate) {
    const error = new Error('dateFrom cannot be after dateTo');
    error.status = 400;
    throw error;
  }

  const createdAt = {};
  if (fromDate) createdAt.$gte = fromDate;
  if (toDate) createdAt.$lte = toDate;

  return Object.keys(createdAt).length > 0 ? { createdAt } : {};
};

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getTrendWindow = (filters = {}) => {
  const fromInput = parseDateOrNull(filters.dateFrom);
  const toInput = parseDateOrNull(filters.dateTo);

  if (fromInput && toInput && fromInput > toInput) {
    const error = new Error('dateFrom cannot be after dateTo');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const rangeStart = fromInput && fromInput > start ? fromInput : start;
  const rangeEnd = toInput && toInput < end ? toInput : end;

  if (rangeStart > rangeEnd) {
    return null;
  }

  return { rangeStart, rangeEnd };
};

const buildMonthBuckets = (rangeStart, rangeEnd) => {
  const buckets = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const limit = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

  while (cursor <= limit) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    buckets.push({ key, month: key });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
};

export const getDashboardStats = async () => {
  try {
    const now = new Date();

    const employeeTotalQuery = User.countDocuments({ role: 'employee' });
    const employeeActiveQuery = User.countDocuments({ role: 'employee', isActive: true });
    const employeeInactiveQuery = User.countDocuments({ role: 'employee', isActive: false });

    const jobsTotalQuery = Job.countDocuments({});
    const jobsActiveQuery = Job.countDocuments({ status: 'active' });
    const jobsDraftQuery = Job.countDocuments({ status: 'draft' });
    const jobsClosedQuery = Job.countDocuments({ status: 'closed' });

    const applicationsTotalQuery = Applicant.countDocuments({});
    const stageCountQueries = STAGES.map((stage) => Applicant.countDocuments({ stage }));

    const upcomingInterviewsQuery = InterviewSchedule.countDocuments({
      status: { $in: ['pending', 'scheduled'] },
      scheduledAt: { $gte: now },
    });

    const recentApplicationsQuery = Applicant.find({})
      .select('_id fullName email stage createdAt jobId')
      .populate('jobId', 'title department')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const openJobsQuery = Job.find({ status: 'active' })
      .select('_id title department slots status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const [
      employeeTotal,
      employeeActive,
      employeeInactive,
      jobsTotal,
      jobsActive,
      jobsDraft,
      jobsClosed,
      applicationsTotal,
      ...rest
    ] = await Promise.all([
      employeeTotalQuery,
      employeeActiveQuery,
      employeeInactiveQuery,
      jobsTotalQuery,
      jobsActiveQuery,
      jobsDraftQuery,
      jobsClosedQuery,
      applicationsTotalQuery,
      ...stageCountQueries,
      upcomingInterviewsQuery,
      recentApplicationsQuery,
      openJobsQuery,
    ]);

    const stageCounts = rest.slice(0, STAGES.length);
    const upcomingInterviews = rest[STAGES.length];
    const recentApplications = rest[STAGES.length + 1] || [];
    const openJobs = rest[STAGES.length + 2] || [];

    const byStage = STAGES.reduce((acc, stage, index) => {
      acc[stage] = stageCounts[index] || 0;
      return acc;
    }, {});

    let recentActivity = [];
    try {
      const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog');
      recentActivity = await ActivityLog.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } catch (error) {
      recentActivity = [];
    }

    return {
      employees: {
        total: employeeTotal,
        active: employeeActive,
        inactive: employeeInactive,
      },
      jobs: {
        total: jobsTotal,
        active: jobsActive,
        draft: jobsDraft,
        closed: jobsClosed,
      },
      applications: {
        total: applicationsTotal,
        byStage,
      },
      interviews: {
        upcoming: upcomingInterviews,
      },
      recentApplications,
      openJobs,
      recentActivity,
    };
  } catch (error) {
    logger.error(`Get dashboard stats error: ${error.message}`);
    throw error;
  }
};

/**
 * Get ATS (Applicant Tracking System) report
 * Aggregate applications by stage with counts
 */
export const getATSReport = async (filters = {}) => {
  try {
    const baseFilter = buildDateRangeFilter(filters);

    const stageCounts = await Promise.all(
      STAGES.map(async (stage) => ({
        stage,
        count: await Applicant.countDocuments({
          ...baseFilter,
          stage,
        }),
      }))
    );

    const total = stageCounts.reduce((sum, s) => sum + s.count, 0);

    // Create object with stage keys for easier access in frontend
    const stageData = {};
    stageCounts.forEach((s) => {
      stageData[s.stage] = s.count;
    });

    return {
      ...stageData,
      total,
    };
  } catch (error) {
    logger.error(`Get ATS report error: ${error.message}`);
    throw error;
  }
};

/**
 * Get headcount report
 * Aggregate employees by department
 */
export const getHeadcountReport = async (filters = {}) => {
  try {
    const baseMatch = {
      role: 'employee',
      ...buildDateRangeFilter(filters),
    };

    if (filters.department) {
      baseMatch.department = filters.department;
    }

    const headcount = await User.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
          inactive: {
            $sum: { $cond: ['$isActive', 0, 1] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$_id', 'Unassigned'] },
          total: 1,
          active: 1,
          inactive: 1,
        },
      },
      { $sort: { department: 1 } },
    ]);

    return {
      departments: headcount,
    };
  } catch (error) {
    logger.error(`Get headcount report error: ${error.message}`);
    throw error;
  }
};

/**
 * Get employee status report
 * Returns employee counts by status and detailed list
 */
export const getEmployeeStatusReport = async (filters = {}) => {
  try {
    const baseFilter = {
      role: 'employee',
      ...buildDateRangeFilter(filters),
    };

    if (filters.department) {
      baseFilter.department = filters.department;
    }

    const total = await User.countDocuments(baseFilter);
    const active = await User.countDocuments({ ...baseFilter, isActive: true });
    const inactive = await User.countDocuments({ ...baseFilter, isActive: false });
    const terminated = await User.countDocuments({
      ...baseFilter,
      terminatedAt: { $exists: true, $ne: null },
    });

    const employees = await User.find(baseFilter)
      .select('personalInfo department positionTitle isActive dateOfEmployment')
      .lean();

    const employeeList = employees.map((emp) => ({
      name: `${emp.personalInfo?.givenName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
      department: emp.department || 'Unassigned',
      position: emp.positionTitle || 'Not Set',
      status: emp.isActive ? 'Active' : 'Inactive',
      startDate: emp.dateOfEmployment ? new Date(emp.dateOfEmployment).toLocaleDateString() : 'N/A',
    }));

    return {
      summary: {
        total,
        active,
        inactive,
        terminated,
      },
      employees: employeeList,
    };
  } catch (error) {
    logger.error(`Get employee status report error: ${error.message}`);
    throw error;
  }
};

/**
 * Get training report
 * Returns training record stats (courses, certifications, etc.)
 */
export const getTrainingReport = async (filters = {}) => {
  try {
    const baseFilter = buildDateRangeFilter(filters);

    const totalRecords = await TrainingRecord.countDocuments(baseFilter).catch(() => 0);
    const completed = await TrainingRecord.countDocuments({ ...baseFilter, status: 'completed' }).catch(() => 0);
    const inProgress = await TrainingRecord.countDocuments({ ...baseFilter, status: 'in-progress' }).catch(() => 0);
    const expired = await TrainingRecord.countDocuments({ ...baseFilter, status: 'expired' }).catch(() => 0);
    const overdue = await TrainingRecord.countDocuments({
      ...baseFilter,
      status: { $in: ['in-progress', 'expired'] },
      expiresAt: { $lt: new Date() },
    }).catch(() => 0);

    // Get training record details
    const records = await TrainingRecord.find(baseFilter)
      .populate('employeeId', 'personalInfo')
      .select('employeeId courseName provider status completedAt expiresAt')
      .lean()
      .catch(() => []);

    const recordList = records.map((record) => ({
      employeeName: record.employeeId?.personalInfo?.givenName 
        ? `${record.employeeId.personalInfo.givenName} ${record.employeeId.personalInfo.lastName}` 
        : 'Unknown',
      trainingName: record.courseName || 'Unknown Course',
      status: record.status || 'in-progress',
      completionDate: record.completedAt ? new Date(record.completedAt).toLocaleDateString() : 'N/A',
      expiryDate: record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : 'N/A',
    }));

    return {
      summary: {
        totalPrograms: totalRecords,
        totalAssignments: totalRecords,
        completed,
        pending: inProgress,
        overdue,
      },
      assignments: recordList,
    };
  } catch (error) {
    logger.error(`Get training report error: ${error.message}`);
    throw error;
  }
};

export const getATSTrend = async (filters = {}) => {
  try {
    const window = getTrendWindow(filters);
    if (!window) return [];

    const { rangeStart, rangeEnd } = window;

    const data = await Applicant.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          count: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const map = new Map(data.map((item) => [item.month, item.count]));
    return buildMonthBuckets(rangeStart, rangeEnd).map((bucket) => ({
      month: bucket.month,
      count: map.get(bucket.key) || 0,
    }));
  } catch (error) {
    logger.error(`Get ATS trend error: ${error.message}`);
    throw error;
  }
};

export const getHiringTrend = async (filters = {}) => {
  try {
    const window = getTrendWindow(filters);
    if (!window) return [];

    const { rangeStart, rangeEnd } = window;

    const data = await Applicant.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
          stage: { $in: ['hired', 'rejected'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          hired: {
            $sum: {
              $cond: [{ $eq: ['$stage', 'hired'] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$stage', 'rejected'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          hired: 1,
          rejected: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const map = new Map(data.map((item) => [item.month, item]));
    return buildMonthBuckets(rangeStart, rangeEnd).map((bucket) => {
      const value = map.get(bucket.key);
      return {
        month: bucket.month,
        hired: value?.hired || 0,
        rejected: value?.rejected || 0,
      };
    });
  } catch (error) {
    logger.error(`Get hiring trend error: ${error.message}`);
    throw error;
  }
};

export const getTrainingCompletionTrend = async (filters = {}) => {
  try {
    const window = getTrendWindow(filters);
    if (!window) return [];

    const { rangeStart, rangeEnd } = window;

    const data = await TrainingRecord.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null, $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
          },
          completed: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          completed: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const map = new Map(data.map((item) => [item.month, item.completed]));
    return buildMonthBuckets(rangeStart, rangeEnd).map((bucket) => ({
      month: bucket.month,
      completed: map.get(bucket.key) || 0,
    }));
  } catch (error) {
    logger.error(`Get training completion trend error: ${error.message}`);
    throw error;
  }
};


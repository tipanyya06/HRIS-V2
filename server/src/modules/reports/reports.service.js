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
      const Log = mongoose.models.Log || mongoose.model('Log');
      recentActivity = await Log.find({})
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
    if (filters.department) baseFilter.department = filters.department;

    // Stage counts
    const stageCounts = await Promise.all(
      STAGES.map(async (stage) => ({
        stage,
        count: await Applicant.countDocuments({ ...baseFilter, stage }),
      }))
    );
    const stageData = {};
    stageCounts.forEach((s) => {
      stageData[s.stage] = s.count;
    });
    const total = stageCounts.reduce((sum, s) => sum + s.count, 0);
    const hired = stageData.hired || 0;
    const conversionRate = total > 0 ? `${((hired / total) * 100).toFixed(1)}%` : '0%';
    const inPipeline =
      (stageData.applied || 0) +
      (stageData.screening || 0) +
      (stageData.interview || 0) +
      (stageData.offer || 0);

    // Reuse existing trend functions
    const [atsTrend, hiringTrend] = await Promise.all([
      getATSTrend(filters),
      getHiringTrend(filters),
    ]);

    return {
      stats: {
        totalApplicants: total,
        inPipeline,
        hired,
        conversionRate,
      },
      funnelStages: stageData,
      atsTrend,
      hiringTrend,
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

    const [totalHeadcount, active, inactive, byDept, byType] = await Promise.all([
      User.countDocuments(baseMatch),
      User.countDocuments({ ...baseMatch, isActive: true }),
      User.countDocuments({ ...baseMatch, isActive: false }),
      User.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          },
        },
        {
          $project: {
            _id: 0,
            department: { $ifNull: ['$_id', 'Unassigned'] },
            total: 1,
            active: 1,
            inactive: 1,
            activePercent: {
              $round: [
                {
                  $multiply: [
                    {
                      $cond: [
                        { $eq: ['$total', 0] },
                        0,
                        { $divide: ['$active', '$total'] },
                      ],
                    },
                    100,
                  ],
                },
                1,
              ],
            },
          },
        },
        { $sort: { department: 1 } },
      ]),
      User.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $ifNull: ['$employmentType', 'Full-time'] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, type: '$_id', count: 1 } },
        { $sort: { type: 1 } },
      ]),
    ]);

    const uniqueDepts = new Set(byDept.map((d) => d.department)).size;

    // Add percent to byType
    const byTypeWithPercent = byType.map((t) => ({
      ...t,
      percent: totalHeadcount > 0 ? parseFloat(((t.count / totalHeadcount) * 100).toFixed(1)) : 0,
    }));

    return {
      stats: {
        totalHeadcount,
        active,
        inactive,
        departments: uniqueDepts,
      },
      byDepartment: byDept,
      byEmploymentType: byTypeWithPercent,
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
      stats: {
        totalEmployees: total,
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

    // Join TrainingRecord with User to get department
    const byDept = await TrainingRecord.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: {
          path: '$employee',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            $ifNull: ['$employee.department', 'Unassigned'],
          },
          assigned: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    {
                      $or: [
                        { $eq: ['$expiresAt', null] },
                        { $gte: ['$expiresAt', new Date()] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$expiresAt', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          assigned: 1,
          completed: 1,
          pending: 1,
          overdue: 1,
          completionRate: {
            $cond: [
              { $eq: ['$assigned', 0] },
              '0%',
              {
                $concat: [
                  {
                    $toString: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$completed', '$assigned'] },
                            100,
                          ],
                        },
                        1,
                      ],
                    },
                  },
                  '%',
                ],
              },
            ],
          },
        },
      },
      { $sort: { department: 1 } },
    ]).catch(() => []);

    return {
      stats: {
        totalPrograms: totalRecords,
        totalAssignments: totalRecords,
        completed,
        pending: inProgress,
        overdue,
      },
      assignments: recordList,
      byDepartment: byDept,
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

export const getCustomReportData = async (fields = [], filters = {}) => {
  try {
    const { department, countryOfEmployment, dateFrom, dateTo } = filters;
    const fromDate = parseDateOrNull(dateFrom);
    const toDate = parseDateOrNull(dateTo);

    if (fromDate && toDate && fromDate > toDate) {
      const error = new Error('dateFrom cannot be after dateTo');
      error.status = 400;
      throw error;
    }

    const query = { role: 'employee', isActive: true };
    if (department) query.department = department;
    if (countryOfEmployment) query.countryOfEmployment = countryOfEmployment;
    if (fromDate || toDate) {
      query.dateOfEmployment = {};
      if (fromDate) query.dateOfEmployment.$gte = fromDate;
      if (toDate) query.dateOfEmployment.$lte = toDate;
    }

    const employees = await User.find(query)
      .select('-password')
      .lean();

    return employees.map((emp) => {
      const row = {};
      fields.forEach((field) => {
        switch (field) {
          case 'Full Name':
            row[field] = `${emp.personalInfo?.givenName || ''} ${emp.personalInfo?.lastName || ''}`.trim() || '-';
            break;
          case 'Given Name':
            row[field] = emp.personalInfo?.givenName || '-';
            break;
          case 'Last Name':
            row[field] = emp.personalInfo?.lastName || '-';
            break;
          case 'Middle Name':
            row[field] = emp.personalInfo?.middleName || '-';
            break;
          case 'Date of Birth':
            row[field] = emp.personalInfo?.dateOfBirth || '-';
            break;
          case 'Sex':
            row[field] = emp.personalInfo?.sex || '-';
            break;
          case 'Civil Status':
            row[field] = emp.personalInfo?.civilStatus || '-';
            break;
          case 'Religion':
            row[field] = emp.personalInfo?.religion || '-';
            break;
          case 'Nationality':
            row[field] = emp.personalInfo?.nationality || '-';
            break;
          case 'Personal Email':
            row[field] = emp.contactInfo?.personalEmail || '-';
            break;
          case 'Company Email':
            row[field] = emp.email || '-';
            break;
          case 'Main Contact No':
            row[field] = emp.contactInfo?.mainContactNo || '-';
            break;
          case 'Address':
            row[field] = [
              emp.contactInfo?.address?.addressLine,
              emp.contactInfo?.address?.city,
              emp.contactInfo?.address?.province,
              emp.contactInfo?.address?.country,
            ].filter(Boolean).join(', ') || '-';
            break;
          case 'Department':
            row[field] = emp.department || '-';
            break;
          case 'Position':
            row[field] = emp.positionTitle || '-';
            break;
          case 'Classification':
            row[field] = emp.classification || '-';
            break;
          case 'Country of Employment':
            row[field] = emp.countryOfEmployment || '-';
            break;
          case 'Date of Employment':
            row[field] = emp.dateOfEmployment ? new Date(emp.dateOfEmployment).toLocaleDateString() : '-';
            break;
          case 'Blood Type':
            row[field] = emp.hmoInfo?.bloodType || '-';
            break;
          case 'HMO Provider':
            row[field] = emp.hmoInfo?.provider || '-';
            break;
          case 'HMO Card Number':
            row[field] = emp.hmoInfo?.cardNumber || '-';
            break;
          case 'SSS':
            row[field] = emp.governmentIds?.sss || '-';
            break;
          case 'TIN':
            row[field] = emp.governmentIds?.tin || '-';
            break;
          case 'Pag-IBIG':
            row[field] = emp.governmentIds?.pagIbig || '-';
            break;
          case 'PhilHealth':
            row[field] = emp.governmentIds?.philhealth || '-';
            break;
          case 'Emergency Contact Name':
            row[field] = emp.emergencyContact?.name || '-';
            break;
          case 'Emergency Contact No':
            row[field] = emp.emergencyContact?.contact || '-';
            break;
          case 'Emergency Relationship':
            row[field] = emp.emergencyContact?.relationship || '-';
            break;
          case 'Bank Name':
            row[field] = emp.payrollInfo?.bankName || '-';
            break;
          case 'Account Name':
            row[field] = emp.payrollInfo?.accountName || '-';
            break;
          case 'School':
            row[field] = emp.education?.schoolName || '-';
            break;
          case 'Course':
            row[field] = emp.education?.course || '-';
            break;
          case 'Attainment':
            row[field] = emp.education?.attainment || '-';
            break;
          default:
            row[field] = '-';
        }
      });
      return row;
    });
  } catch (error) {
    logger.error(`Custom report error: ${error.message}`);
    throw error;
  }
};

export const getPESOReportData = async (filters = {}) => {
  const PESO_FIELDS = [
    'Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status',
    'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position',
    'Date of Employment', 'Department',
  ];
  return getCustomReportData(PESO_FIELDS, filters);
};

export const getGlobalKpi = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);

    const [
      totalEmployees,
      activeHeadcount,
      newThisMonth,
      openPositions,
      closingSoon,
      employees,
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({
        role: 'employee',
        createdAt: { $gte: startOfMonth },
      }),
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({
        status: 'active',
        closingDate: { $lte: in7Days, $gte: now },
      }),
      User.find({ role: 'employee', isActive: true })
        .select('dateOfEmployment')
        .lean(),
    ]);

    // Average tenure in years
    let avgTenureYears = '0.0';
    if (employees.length > 0) {
      const totalDays = employees.reduce((sum, emp) => {
        if (!emp.dateOfEmployment) return sum;
        const diff = now - new Date(emp.dateOfEmployment);
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      avgTenureYears = (totalDays / employees.length / 365).toFixed(1);
    }

    const activePercent = totalEmployees > 0
      ? `${((activeHeadcount / totalEmployees) * 100).toFixed(1)}%`
      : '0%';

    return {
      totalEmployees,
      totalEmployeesThisMonth: newThisMonth,
      activeHeadcount,
      activePercent,
      openPositions,
      closingSoon,
      avgTenureYears,
    };
  } catch (error) {
    logger.error(`Get global KPI error: ${error.message}`);
    throw error;
  }
};


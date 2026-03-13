import mongoose from 'mongoose';
import User from '../auth/user.model.js';
import Job from '../jobs/job.model.js';
import Applicant from '../applications/applicant.model.js';
import InterviewSchedule from '../interviews/interview.model.js';
import TrainingRecord from '../training/training.model.js';
import { logger } from '../../utils/logger.js';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

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
export const getATSReport = async () => {
  try {
    const stageCounts = await Promise.all(
      STAGES.map(async (stage) => ({
        stage,
        count: await Applicant.countDocuments({ stage }),
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
export const getHeadcountReport = async () => {
  try {
    const headcount = await User.aggregate([
      { $match: { role: 'employee' } },
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
export const getEmployeeStatusReport = async () => {
  try {
    const total = await User.countDocuments({ role: 'employee' });
    const active = await User.countDocuments({ role: 'employee', isActive: true });
    const inactive = await User.countDocuments({ role: 'employee', isActive: false });
    const terminated = await User.countDocuments({ role: 'employee', terminatedAt: { $exists: true, $ne: null } });

    const employees = await User.find({ role: 'employee' })
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
export const getTrainingReport = async () => {
  try {
    const totalRecords = await TrainingRecord.countDocuments().catch(() => 0);
    const completed = await TrainingRecord.countDocuments({ status: 'completed' }).catch(() => 0);
    const inProgress = await TrainingRecord.countDocuments({ status: 'in-progress' }).catch(() => 0);
    const expired = await TrainingRecord.countDocuments({ status: 'expired' }).catch(() => 0);
    const overdue = await TrainingRecord.countDocuments({
      status: { $in: ['in-progress', 'expired'] },
      expiresAt: { $lt: new Date() },
    }).catch(() => 0);

    // Get training record details
    const records = await TrainingRecord.find()
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


import mongoose from 'mongoose';
import User from '../auth/user.model.js';
import Job from '../jobs/job.model.js';
import Applicant from '../applications/applicant.model.js';
import InterviewSchedule from '../interviews/interview.model.js';
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

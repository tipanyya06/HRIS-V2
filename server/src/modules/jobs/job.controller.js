import * as jobService from './job.service.js';
import { logActivity } from '../../middleware/activityLogger.js';

// Smart GET /api/jobs — Returns all jobs if admin, active jobs if public
export const getSmartJobsController = async (req, res, next) => {
  try {
    const { search, department } = req.query;
    const isAdmin = req.user && ['admin', 'super-admin', 'hr'].includes(req.user.role);

    let jobs;
    if (isAdmin) {
      // Admin: return all jobs
      jobs = await jobService.getAllJobs(req.user?.id);
    } else {
      // Public: return active jobs only
      const filters = {};
      if (search) filters.search = search;
      if (department) filters.department = department;
      jobs = await jobService.getPublicJobs(filters);
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// Create new job (admin only)
export const createJobController = async (req, res, next) => {
  try {
    const { title, department, slots, description, requirements } = req.body;

    // Validation
    if (!title || !department) {
      return res.status(400).json({ error: 'Title and department are required' });
    }

    const jobData = {
      title,
      department,
      slots: slots || 1,
      description,
      requirements: requirements || [],
      postedBy: req.user.id,
      status: 'draft',
    };

    const job = await jobService.createJob(jobData);
    try {
      await logActivity(req, `Job created: ${job.title}`, 'job', job._id);
    } catch (logErr) {
      // Never allow logging to break the request
    }

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Get all public jobs (no auth required)
export const getPublicJobsController = async (req, res, next) => {
  try {
    const { search, department } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (department) filters.department = department;

    const jobs = await jobService.getPublicJobs(filters);

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// Get all jobs - admin view (admin only)
export const getAllJobsController = async (req, res, next) => {
  try {
    const jobs = await jobService.getAllJobs(req.user.id);

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// Get single job by ID (public)
export const getJobByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await jobService.getJobById(id);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    if (error.message === 'Job not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Update job (admin only)
export const updateJobController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const job = await jobService.updateJob(id, updateData);
    try {
      await logActivity(req, `Job updated: ${job.title}`, 'job', job._id);
    } catch (logErr) {
      // Never allow logging to break the request
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  } catch (error) {
    if (error.message === 'Job not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Delete job (admin only)
export const deleteJobController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await jobService.deleteJob(id);
    try {
      await logActivity(req, `Job deleted: ${id}`, 'job', id);
    } catch (logErr) {
      // Never allow logging to break the request
    }

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    if (error.message === 'Job not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Update job status (admin only)
export const updateJobStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const job = await jobService.updateJobStatus(id, status);
    try {
      await logActivity(
        req,
        `Job status changed to ${status}: ${job.title}`,
        'job',
        job._id
      );
    } catch (logErr) {
      // Never allow logging to break the request
    }

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      data: job,
    });
  } catch (error) {
    if (error.message.includes('Job not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Invalid status')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

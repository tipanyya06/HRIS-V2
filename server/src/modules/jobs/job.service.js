import Job from './job.model.js';

// Create a new job posting
export const createJob = async (jobData) => {
  const job = new Job(jobData);
  await job.save();
  return job;
};

// Get all public/active jobs (for public job board)
export const getPublicJobs = async (filters = {}) => {
  try {
    const query = { status: 'active' };
    
    if (filters.department) {
      query.department = filters.department;
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    return jobs || [];
  } catch (error) {
    console.error('Error in getPublicJobs:', error);
    return []; // Return empty array on error instead of throwing
  }
};

// Get all jobs (admin view - includes drafts, paused, etc)
export const getAllJobs = async (adminId) => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return jobs || [];
  } catch (error) {
    console.error('Error in getAllJobs:', error);
    return []; // Return empty array on error instead of throwing
  }
};

// Get single job by ID
export const getJobById = async (jobId) => {
  const job = await Job.findById(jobId)
    .populate('postedBy', 'firstName lastName email');
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  return job;
};

// Update job posting
export const updateJob = async (jobId, updateData) => {
  const job = await Job.findByIdAndUpdate(jobId, updateData, {
    new: true,
    runValidators: true,
  }).populate('postedBy', 'firstName lastName email');
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  return job;
};

// Delete job posting
export const deleteJob = async (jobId) => {
  const job = await Job.findByIdAndDelete(jobId);
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  return job;
};

// Change job status (draft → active, active → closed, etc)
export const updateJobStatus = async (jobId, newStatus) => {
  const validStatuses = ['draft', 'active', 'paused', 'closed'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  const job = await Job.findByIdAndUpdate(
    jobId,
    {
      status: newStatus,
      ...(newStatus === 'closed' && { closedAt: new Date() }),
    },
    { new: true, runValidators: true }
  ).populate('postedBy', 'firstName lastName email');
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  return job;
};

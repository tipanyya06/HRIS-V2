import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Applicant',
    },
    applicantEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    receiverName: String,
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Manila',
    },
    meetingLink: String,
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSchedule', interviewSchema);

import mongoose from 'mongoose';

const interviewScheduleSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Applicant',
      required: true,
    },
    applicantEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    receiverName: {
      type: String,
      default: '',
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: null,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSchedule', interviewScheduleSchema);
import mongoose from 'mongoose';

const meetingRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['meeting'],
      default: 'meeting',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['performance', 'grievance', 'general', 'onboarding', 'other'],
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    duration: {
      type: Number,
      default: 60,
      min: 15,
    },
    location: {
      type: String,
      enum: ['MS Teams', 'In-person', 'Phone Call'],
      required: true,
    },
    agenda: {
      type: String,
      required: true,
      trim: true,
    },
    preparation: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
  },
  { timestamps: true }
);

const talentRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['talent'],
      default: 'talent',
    },
    reportingTo: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    positionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    headcountNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'remote', 'hybrid'],
      required: true,
    },
    roleDescription: {
      type: String,
      required: true,
      trim: true,
    },
    targetStartDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
  },
  { timestamps: true }
);

// Create indexes
meetingRequestSchema.index({ userId: 1, status: 1 });
meetingRequestSchema.index({ createdAt: -1 });
talentRequestSchema.index({ userId: 1, status: 1 });
talentRequestSchema.index({ createdAt: -1 });

// Create separate models for each request type
const MeetingRequest = mongoose.model('MeetingRequest', meetingRequestSchema);
const TalentRequest = mongoose.model('TalentRequest', talentRequestSchema);

export { MeetingRequest, TalentRequest };

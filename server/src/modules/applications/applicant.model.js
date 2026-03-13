import mongoose from 'mongoose';
import { encrypt, decrypt } from '../../utils/encrypt.js';

const applicantSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      set: (val) => val ? encrypt(val) : val,
      get: (val) => val ? decrypt(val) : val,
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    coverLetter: {
      type: String,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    stageHistory: [
      {
        stage: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String,
        notes: String,
      },
    ],
    notes: [
      {
        text: String,
        createdBy: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isEmployee: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  },
  { timestamps: true, getters: true }
);

// TTL index: delete doc when deletedAt is reached
// Only applies to docs where isEmployee is false
applicantSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isEmployee: false } }
);

// When promoting to employee, unset deletedAt and set isEmployee: true
// Example: await Applicant.findByIdAndUpdate(id, { isEmployee: true, $unset: { deletedAt: '' } });

export default mongoose.model('Applicant', applicantSchema);

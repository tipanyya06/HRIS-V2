import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },
    documentUrl: {
      type: String,
      trim: true,
      default: '',
    },
    originalName: {
      type: String,
      trim: true,
      default: '',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedAt: Date,
    reviewedAt: Date,
  },
  { _id: false }
);

const preEmploymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    overallStatus: {
      type: String,
      enum: ['not-started', 'in-progress', 'submitted', 'approved', 'rejected'],
      default: 'not-started',
    },
    items: {
      type: [checklistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('PreEmployment', preEmploymentSchema);

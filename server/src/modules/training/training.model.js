import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    provider: String,
    completedAt: Date,
    certUrl: String,
    expiresAt: Date,
    status: {
      type: String,
      enum: ['completed', 'expired', 'in-progress'],
      default: 'in-progress',
    },
  },
  { timestamps: true }
);

export default mongoose.model('TrainingRecord', trainingSchema);

import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    slots: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed'],
      default: 'draft',
    },
    description: String,
    requirements: [String],
    country: {
      type: String,
      default: 'PH',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    closedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);

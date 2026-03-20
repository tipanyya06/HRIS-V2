import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'stage_changed',
        'interview_scheduled',
        'request_updated',
        'announcement_posted',
        'training_expiry',
        'new_application',
        'request_submitted',
        'pe_created',
        'pe_self_rated',
        'pe_completed',
        'training_assigned',
        'offboarding',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for userId + isRead queries
notificationSchema.index({ userId: 1, isRead: 1 });

// TTL index - auto delete after 90 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export default mongoose.model('Notification', notificationSchema);

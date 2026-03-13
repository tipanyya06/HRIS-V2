import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'employees', 'admins'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetAudience: 1, createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);

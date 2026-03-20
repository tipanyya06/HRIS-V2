import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  returned:    { type: Boolean, default: false },
  returnedAt:  { type: Date, default: null },
  notes:       { type: String, default: '' },
}, { _id: true })

const clearanceSchema = new mongoose.Schema({
  department:  { type: String, required: true },
  cleared:     { type: Boolean, default: false },
  clearedAt:   { type: Date, default: null },
  clearedBy:   {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  notes:       { type: String, default: '' },
}, { _id: true })

const offboardingSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: [
      'initiated',
      'in-progress',
      'completed',
    ],
    default: 'initiated',
  },
  exitInterview: {
    reason: {
      type: String,
      enum: [
        'resignation',
        'termination',
        'end-of-contract',
        'retirement',
        'redundancy',
        'other',
      ],
      default: null,
    },
    lastDay:   { type: Date, default: null },
    notes:     { type: String, default: '' },
    conducted: { type: Boolean, default: false },
    conductedAt: { type: Date, default: null },
  },
  assets: {
    type: [assetSchema],
    default: [
      { name: 'Laptop' },
      { name: 'ID Card' },
      { name: 'Office Keys' },
      { name: 'Access Card' },
      { name: 'Mobile Phone' },
    ],
  },
  systemAccess: {
    emailDisabled:    { type: Boolean, default: false },
    emailDisabledAt:  { type: Date, default: null },
    systemsRevoked:   { type: Boolean, default: false },
    systemsRevokedAt: { type: Date, default: null },
    notes:            { type: String, default: '' },
  },
  clearances: {
    type: [clearanceSchema],
    default: [
      { department: 'IT' },
      { department: 'Finance' },
      { department: 'HR' },
      { department: 'Operations' },
    ],
  },
  notes: { type: String, default: '' },
}, { timestamps: true })

offboardingSchema.index({ employeeId: 1 })
offboardingSchema.index({ status: 1 })
offboardingSchema.index({ createdAt: -1 })

export default mongoose.model(
  'Offboarding', offboardingSchema
)

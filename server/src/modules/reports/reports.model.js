import mongoose from 'mongoose';

const oshaReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    incidentTime: {
      type: String,
      required: true,
    },
    incidentLocation: {
      type: String,
      required: true,
    },
    incidentType: {
      type: String,
      enum: ['Slip and Fall', 'Equipment Injury', 'Chemical Exposure', 'Near Miss', 'Property Damage', 'Other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 50,
    },
    witnesses: {
      type: String,
      default: null,
    },
    correctiveActions: {
      type: String,
      default: null,
    },
    reportedTo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'resolved'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

const incidentReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    incidentTime: {
      type: String,
      required: true,
    },
    incidentLocation: {
      type: String,
      required: true,
    },
    incidentType: {
      type: String,
      enum: ['Workplace Violence', 'Theft', 'Harassment', 'Property Damage', 'Security Breach', 'Other'],
      required: true,
    },
    severityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    reportedTo: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    witnesses: {
      type: String,
      default: null,
    },
    immediateActionsTaken: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'resolved'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

const OshaReport = mongoose.model('OshaReport', oshaReportSchema);
const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema);

export { OshaReport, IncidentReport };

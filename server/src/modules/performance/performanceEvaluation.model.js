import mongoose from 'mongoose'

const scoreSchema = new mongoose.Schema({
  self:       { type: Number, default: null },
  supervisor: { type: Number, default: null },
}, { _id: false })

const performanceEvaluationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  evaluationType: {
    type: String,
    enum: ['1st-month', '3rd-month', '5th-month', 'annual'],
    required: true,
  },
  periodFrom: { type: Date, required: true },
  periodTo:   { type: Date, required: true },
  status: {
    type: String,
    enum: [
      'draft',
      'self-rating',
      'supervisor-rating',
      'completed',
      'acknowledged',
    ],
    default: 'draft',
  },
  classification: {
    type: String,
    default: 'Rank & File',
  },
  scores: {
    productivity:   { ...scoreSchema.obj },
    quality:        { ...scoreSchema.obj },
    mvvEmbrace:     { ...scoreSchema.obj },
    initiative:     { ...scoreSchema.obj },
    attendance:     { ...scoreSchema.obj },
    adherenceCRR:   { ...scoreSchema.obj },
    humanRelations: { ...scoreSchema.obj },
  },
  totalScore:    { type: Number, default: null },
  overallRating: {
    type: String,
    enum: ['S', 'A', 'B', 'C', 'D', 'E', null],
    default: null,
  },
  meetsStandard: { type: Boolean, default: null },
  disposition: {
    type: String,
    enum: ['fail', 'next-pe', 'regularize', null],
    default: null,
  },
  strengths: { type: String, default: '' },
  progress: { type: String, default: '' },
  mistakes: { type: String, default: '' },
  corrections: { type: String, default: '' },
  employeeComment: { type: String, default: '' },
  factorComments: {
    productivity:   { type: String, default: '' },
    quality:        { type: String, default: '' },
    mvvEmbrace:     { type: String, default: '' },
    initiative:     { type: String, default: '' },
    humanRelations: { type: String, default: '' },
  },
  acknowledgedAt: { type: Date, default: null },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true })

performanceEvaluationSchema.index({ employeeId: 1 })
performanceEvaluationSchema.index({ evaluatorId: 1 })
performanceEvaluationSchema.index({ status: 1 })
performanceEvaluationSchema.index({ createdAt: -1 })

export default mongoose.model(
  'PerformanceEvaluation',
  performanceEvaluationSchema
)

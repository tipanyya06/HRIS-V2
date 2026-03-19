import {
  createPerformanceEvaluation,
  submitSelfRating,
  submitSupervisorRating,
  acknowledgePE,
  updateDisposition,
  listPerformanceEvaluations,
  getMyPerformanceEvaluations,
  getPerformanceEvaluationById,
} from './performance.service.js'
import { logger } from '../../utils/logger.js'
import { logActivity } from '../../middleware/activityLogger.js'

export const createPEController =
  async (req, res, next) => {
    try {
      const {
        employeeId, evaluatorId, evaluationType,
        periodFrom, periodTo,
      } = req.body
      const adminId = req.user.id

      if (!employeeId || !evaluatorId ||
          !evaluationType || !periodFrom || !periodTo)
        return res.status(400).json({
          error: 'employeeId, evaluatorId, evaluationType, ' +
                 'periodFrom, periodTo are all required'
        })

      const pe = await createPerformanceEvaluation({
        employeeId, evaluatorId, evaluationType,
        periodFrom, periodTo, adminId,
      })

      logActivity(
        req,
        `Performance evaluation created for employee: ` +
        `${employeeId} — ${evaluationType}`,
        'performance',
        pe._id
      )

      res.status(201).json({ success: true, data: pe })
    } catch (error) {
      next(error)
    }
  }

export const selfRatingController =
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { scores, employeeComment, factorComments } = req.body
      const userId = req.user.id

      const pe = await submitSelfRating(
        id, scores, employeeComment, factorComments, userId
      )
      res.status(200).json({ success: true, data: pe })
    } catch (error) {
      next(error)
    }
  }

export const supervisorRatingController =
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { scores, sections } = req.body
      const userId = req.user.id

      const pe = await submitSupervisorRating(
        id, scores, sections, userId
      )

      logActivity(
        req,
        `Supervisor rating submitted. Score: ` +
        `${pe.totalScore} Grade: ${pe.overallRating}`,
        'performance',
        pe._id
      )

      res.status(200).json({ success: true, data: pe })
    } catch (error) {
      next(error)
    }
  }

export const acknowledgePEController =
  async (req, res, next) => {
    try {
      const { id } = req.params
      const userId = req.user.id
      const pe = await acknowledgePE(id, userId)
      res.status(200).json({ success: true, data: pe })
    } catch (error) {
      next(error)
    }
  }

export const updateDispositionController =
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { disposition } = req.body
      const adminId = req.user.id

      if (!disposition)
        return res.status(400).json({
          error: 'disposition is required'
        })

      const pe = await updateDisposition(
        id, disposition, adminId
      )

      logActivity(
        req,
        `PE disposition set to ${disposition}`,
        'performance',
        pe._id
      )

      res.status(200).json({ success: true, data: pe })
    } catch (error) {
      next(error)
    }
  }

export const listPEController =
  async (req, res, next) => {
    try {
      const result = await listPerformanceEvaluations(
        req.query
      )
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

export const myPEController =
  async (req, res, next) => {
    try {
      const userId = req.user.id
      const evaluations =
        await getMyPerformanceEvaluations(userId)
      res.status(200).json({
        success: true, data: evaluations
      })
    } catch (error) {
      next(error)
    }
  }

export const getPEController =
  async (req, res, next) => {
    try {
      const { id } = req.params
      const pe = await getPerformanceEvaluationById(
        id, req.user.id, req.user.role
      )
      res.status(200).json({ success: true, data: pe })
    } catch (error) {
      next(error)
    }
  }

export const exportPEPdfController =
  async (req, res, next) => {
    try {
      const { id } = req.params
      const pe = await getPerformanceEvaluationById(
        id, req.user.id, req.user.role
      )

      const PDFDocument = (await import('pdfkit')).default
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,
      })
      const chunks = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', () => {
        const buf = Buffer.concat(chunks)
        let empNameForFile = emp?.personalInfo?.fullName
        if (!empNameForFile) {
          const first = emp?.personalInfo?.firstName || ''
          const last = emp?.personalInfo?.lastName || ''
          empNameForFile = `${first} ${last}`.trim()
        }
        if (!empNameForFile) {
          empNameForFile = emp?.email
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="PE-${
            empNameForFile.replace(/\s+/g, '-')
          }-${pe.evaluationType}.pdf"`
        )
        res.status(200).send(buf)
      })

      const emp = pe.employeeId
      let empName = emp?.personalInfo?.fullName
      if (!empName) {
        const first = emp?.personalInfo?.firstName || ''
        const last = emp?.personalInfo?.lastName || ''
        empName = `${first} ${last}`.trim()
      }
      if (!empName) {
        empName = emp?.email || '—'
      }

      const fmt = d => d
        ? new Date(d).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : '—'

      const pageW = doc.page.width
      const margin = 50
      const contentW = pageW - margin * 2

      // ── HEADER ──────────────────────────────────
      doc.rect(margin, margin, contentW, 60)
         .fillAndStroke('#1a3a5c', '#1a3a5c')

      doc.fillColor('white')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(
           'MADISON 88 BUSINESS SOLUTIONS ASIA, INC.',
           margin, margin + 10,
           { width: contentW, align: 'center' }
         )
      doc.fontSize(10)
         .font('Helvetica')
         .text(
           'Performance Evaluation Sheet',
           margin, margin + 30,
           { width: contentW, align: 'center' }
         )
      doc.fillColor('black')

      let y = margin + 75

      // ── EVALUATION TYPE BADGES ───────────────────
      const typeLabel =
        pe.evaluationType === '1st-month'  ? '1st Month' :
        pe.evaluationType === '3rd-month'  ? '3rd Month' :
        pe.evaluationType === '5th-month'  ? '5th Month' :
        pe.evaluationType === 'annual'     ? 'Annual'    :
        pe.evaluationType ?? '—'

      doc.fontSize(9).font('Helvetica')
         .text(`Evaluation Period From: ${
           fmt(pe.periodFrom)
         }   To: ${fmt(pe.periodTo)}`,
           margin, y
         )
      doc.text(`Evaluation Type: ${typeLabel}`,
        margin, y + 12
      )
      y += 30

      // ── EMPLOYEE INFO BOX ────────────────────────
      doc.rect(margin, y, contentW, 14)
         .fillAndStroke('#e5e7eb', '#c8c8c8')
      doc.fillColor('#1a3a5c')
         .fontSize(9).font('Helvetica-Bold')
         .text('EMPLOYEE INFORMATION',
           margin + 4, y + 3,
           { width: contentW }
         )
      doc.fillColor('black')
      y += 14

      // Info grid — 2 columns
      const col1 = margin
      const col2 = margin + contentW / 2
      const infoRows = [
        ['Name', empName,
         'Department', emp?.department ?? '—'],
        ['Position', emp?.positionTitle ?? '—',
         'Classification', pe.classification ?? '—'],
      ]

      infoRows.forEach(([l1, v1, l2, v2]) => {
        doc.rect(col1, y, contentW / 2, 16)
           .stroke('#c8c8c8')
        doc.rect(col2, y, contentW / 2, 16)
           .stroke('#c8c8c8')
        doc.fontSize(8).font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text(l1, col1 + 4, y + 2)
        doc.font('Helvetica').fillColor('black')
           .text(v1, col1 + 50, y + 2,
             { width: contentW / 2 - 54 })
        doc.fontSize(8).font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text(l2, col2 + 4, y + 2)
        doc.font('Helvetica').fillColor('black')
           .text(v2, col2 + 60, y + 2,
             { width: contentW / 2 - 64 })
        y += 16
      })
      y += 10

      // ── SECTION A HEADER ─────────────────────────
      doc.rect(margin, y, contentW, 14)
         .fillAndStroke('#1a3a5c', '#1a3a5c')
      doc.fillColor('white')
         .fontSize(9).font('Helvetica-Bold')
         .text('SECTION A — EVALUATION CRITERIA',
           margin + 4, y + 3)
      doc.fillColor('black')
      y += 14

      // Table header row
      const colFactor = margin
      const colMax    = margin + 230
      const colSelf   = margin + 270
      const colSuperv = margin + 310
      const colRating = margin + 370

      const rowH = 14

      // Header
      doc.rect(margin, y, contentW, rowH)
         .fillAndStroke('#f8f9fa', '#c8c8c8')
      doc.fontSize(8).font('Helvetica-Bold')
         .fillColor('#374151')
      doc.text('Performance Factor',
        colFactor + 4, y + 3,
        { width: 220 })
      doc.text('Max', colMax, y + 3,
        { width: 35, align: 'center' })
      doc.text('Self', colSelf, y + 3,
        { width: 35, align: 'center' })
      doc.text('Supervisor', colSuperv, y + 3,
        { width: 55, align: 'center' })
      doc.fillColor('black')
      y += rowH

      // Factor rows
      const factors = [
        {
          key: 'productivity',
          label: '(1) Productivity',
          desc: 'Ability to meet the desired output',
          max: 20,
          options: [
            { score: 20, grade: 'S',
              text: 'Work output is consistently beyond the requirements' },
            { score: 18, grade: 'A',
              text: 'Work output exceeds the requirements most of the time' },
            { score: 17, grade: 'B',
              text: 'Work output is consistently met' },
            { score: 15, grade: 'C',
              text: 'Work output is sometimes met' },
            { score: 12, grade: 'D',
              text: 'Work quantity is partially sufficient' },
            { score: 10, grade: 'E',
              text: 'Work output is often below what is expected' },
          ]
        },
        {
          key: 'quality',
          label: '(2) Quality',
          desc: 'Ability to meet job quality requirements',
          max: 20,
          options: [
            { score: 20, grade: 'S',
              text: 'Outstanding performance. Performs job with ingenuity to improve quality' },
            { score: 18, grade: 'A',
              text: 'Quality of work exceeds requirements. Practice communication/consult to avoid making NG' },
            { score: 17, grade: 'B',
              text: 'Quality of work is consistently satisfactory' },
            { score: 15, grade: 'C',
              text: 'Quality of work is frequently satisfactory' },
            { score: 12, grade: 'D',
              text: 'Quality of work is improved after coaching of superior' },
            { score: 10, grade: 'E',
              text: 'Quality of work is below normal despite repeated coaching sessions' },
          ]
        },
        {
          key: 'mvvEmbrace',
          label: '(3) MVV Embrace',
          desc: "Ability to live by the Company's MVV",
          max: 10,
          options: [
            { score: 10, grade: 'S',
              text: "Shows the ability to live by the Company's MVV all the time" },
            { score: 9, grade: 'A',
              text: "Shows the ability to live by the Company's MVV most of the time" },
            { score: 8, grade: 'B',
              text: "Shows the ability to live by the Company's MVV sometimes" },
            { score: 5, grade: 'C',
              text: "Can only recite the MVV without living by it, or vice versa" },
            { score: 0, grade: 'E',
              text: "Can neither live by the MVV nor recite them" },
          ]
        },
        {
          key: 'initiative',
          label: '(4) Initiative / Creativity / Knowledge',
          desc: 'Self-starter with contributions',
          max: 10,
          options: [
            { score: 10, grade: 'S',
              text: 'A self-starter with exceptional initiative. Contributed 6 suggestions' },
            { score: 9, grade: 'A',
              text: 'Contributed at least 4 suggestions. Actively participates in Company activities' },
            { score: 8, grade: 'B',
              text: 'Does work without waiting to be told. Contributed at least 2 suggestions' },
            { score: 7, grade: 'C',
              text: 'Does work without waiting to be told. Contributed 1 suggestion' },
            { score: 6, grade: 'D',
              text: 'Waits for instructions to improve his/her work' },
            { score: 5, grade: 'E',
              text: 'Has not improved his/her work within the rating period' },
          ]
        },
        {
          key: 'attendance',
          label: '(5) Attendance & Punctuality',
          desc: 'Absences and tardiness record',
          max: 18,
          options: [
            { score: 18, grade: 'S',
              text: 'Punctual in observance of work hours. No tardiness, no absence' },
            { score: 16, grade: 'A',
              text: 'Has 1 to 2 absences and/or 0 to 2 tardiness per month' },
            { score: 14, grade: 'B',
              text: 'Has 3 to 4 absences and/or 0 to 3 tardiness per month' },
            { score: 10, grade: 'C',
              text: 'Has 5 absences and/or 0 to 5 tardiness for the entire rating period' },
            { score: 6, grade: 'D',
              text: 'Has 6 absences and/or 0 to 6 tardiness for the entire rating period' },
            { score: 4, grade: 'E',
              text: 'Frequently absent and late for work' },
          ]
        },
        {
          key: 'adherenceCRR',
          label: '(6) Adherence to CR&R',
          desc: 'Follows company rules and regulations',
          max: 12,
          options: [
            { score: 12, grade: 'S',
              text: 'Follows company rules consistently. Influences peers to follow the CRR' },
            { score: 11, grade: 'A',
              text: 'Follows company rules. No Disciplinary Action' },
            { score: 8, grade: 'B',
              text: 'Follows company rules. Has committed only a verbal warning' },
            { score: 7, grade: 'C',
              text: 'Follows company rules. Has committed only a written reprimand' },
            { score: 5, grade: 'D',
              text: 'Has been suspended for breaking the CRR (1 time)' },
            { score: 1, grade: 'E',
              text: 'Has been suspended for breaking the CRR (2 or more times)' },
          ]
        },
        {
          key: 'humanRelations',
          label: '(7) Human Relations',
          desc: 'Camaraderie and teamwork',
          max: 10,
          options: [
            { score: 10, grade: 'S',
              text: 'Outstanding camaraderie. Well-liked by co-employees and superiors' },
            { score: 9, grade: 'A',
              text: 'Fits easily with the group. Liked by co-employees and superiors' },
            { score: 8, grade: 'B',
              text: 'Supports fellow employees & subordinates' },
            { score: 7, grade: 'C',
              text: 'Has difficulty in dealing with others. Sometimes arouses resentment' },
            { score: 6, grade: 'D',
              text: 'Does not get along with others. Quarrelsome' },
            { score: 5, grade: 'E',
              text: 'Has been reprimanded for insubordination and offense against persons' },
          ]
        },
      ]

      factors.forEach((f, i) => {
        const bg = i % 2 === 0 ? 'white' : '#f8f9fa'
        const s = pe.scores?.[f.key]

        // Find selected description for supervisor score
        const supervisorOpt = f.options.find(
          o => o.score === s?.supervisor
        )
        const selfOpt = f.options.find(
          o => o.score === s?.self
        )

        const rowHeight = supervisorOpt ? 32 : 20

        doc.rect(margin, y, contentW, rowHeight)
           .fillAndStroke(bg, '#c8c8c8')

        // Factor name
        doc.fontSize(8).font('Helvetica-Bold')
           .fillColor('#1a3a5c')
           .text(f.label, colFactor + 4, y + 3,
             { width: 220 })

        // Max
        doc.fontSize(9).fillColor('black')
           .font('Helvetica-Bold')
           .text(String(f.max), colMax, y + 8,
             { width: 35, align: 'center' })

        // Self score + description
        doc.fillColor('#185FA5')
           .text(
             s?.self != null ? String(s.self) : '—',
             colSelf, y + 3,
             { width: 35, align: 'center' }
           )
        if (selfOpt) {
          doc.fontSize(6).fillColor('#6b7280')
             .font('Helvetica')
             .text(selfOpt.grade,
               colSelf, y + 13,
               { width: 35, align: 'center' }
             )
        }

        // Supervisor score + description
        doc.fontSize(9)
           .fillColor(
             s?.supervisor != null ? '#15803d' : '#9ca3af'
           )
           .font('Helvetica-Bold')
           .text(
             s?.supervisor != null
               ? String(s.supervisor) : '—',
             colSuperv, y + 3,
             { width: 55, align: 'center' }
           )
        if (supervisorOpt) {
          doc.fontSize(6).fillColor('#374151')
             .font('Helvetica')
             .text(
               supervisorOpt.text,
               colFactor + 4, y + 14,
               { width: contentW - 8 }
             )
        }

        doc.fillColor('black')
        y += rowHeight
      })

      // Total row
      doc.rect(margin, y, contentW, 18)
         .fillAndStroke('#1a3a5c', '#1a3a5c')
      doc.fillColor('white')
         .fontSize(9).font('Helvetica-Bold')
         .text('TOTAL', colFactor + 4, y + 5,
           { width: 220 })
         .text('100', colMax, y + 5,
           { width: 35, align: 'center' })

      const selfTotal = factors.reduce((sum, f) => {
        return sum + (pe.scores?.[f.key]?.self ?? 0)
      }, 0)

      doc.fillColor('#93c5fd')
         .text(String(selfTotal), colSelf, y + 5,
           { width: 35, align: 'center' })
      doc.fillColor('#86efac')
         .text(
           pe.totalScore != null
             ? String(pe.totalScore) : '—',
           colSuperv, y + 5,
           { width: 55, align: 'center' }
         )
      doc.fillColor('white')
      y += 18 + 10

      // ── OVERALL RESULT BOX ───────────────────────
      doc.rect(margin, y, contentW, 40)
         .fillAndStroke('#f0fdf4', '#bbf7d0')

      const ratingColor =
        pe.overallRating === 'S' ? '#7c3aed' :
        pe.overallRating === 'A' ? '#15803d' :
        pe.overallRating === 'B' ? '#1d4ed8' :
        pe.overallRating === 'C' ? '#b45309' :
        pe.overallRating === 'D' ? '#c2410c' :
        pe.overallRating === 'E' ? '#b91c1c' :
        '#374151'

      doc.fontSize(10).font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Overall Rating:', margin + 8, y + 8)
      doc.fontSize(16).fillColor(ratingColor)
         .text(pe.overallRating ?? '—',
           margin + 100, y + 4)
      doc.fontSize(10).fillColor('#374151')
         .text('Total Score:', margin + 130, y + 8)
      doc.fontSize(16).fillColor('#185FA5')
         .text(
           pe.totalScore != null
             ? String(pe.totalScore) : '—',
           margin + 205, y + 4
         )
      doc.fontSize(10).fillColor('#374151')
         .text('Standard:', margin + 240, y + 8)
      doc.fillColor(
           pe.meetsStandard ? '#15803d' : '#b91c1c'
         )
         .text(
           pe.meetsStandard === true  ? 'PASS' :
           pe.meetsStandard === false ? 'FAIL' : '—',
           margin + 295, y + 8
         )

      doc.fontSize(10).fillColor('#374151')
         .font('Helvetica-Bold')
         .text('Disposition:', margin + 8, y + 24)
      doc.font('Helvetica')
         .fillColor(
           pe.disposition === 'fail'
             ? '#b91c1c' : '#15803d'
         )
         .text(
           pe.disposition === 'fail'
             ? 'FAIL — Probationary employment terminated' :
           pe.disposition === 'next-pe'
             ? 'Proceed to next PE' :
           pe.disposition === 'regularize'
             ? 'For Regularization' : '—',
           margin + 90, y + 24
         )
      doc.fillColor('black')
      y += 50

      // ── PAGE 2 ───────────────────────────────────
      doc.addPage()
      y = margin

      // Page 2 header (smaller)
      doc.rect(margin, y, contentW, 30)
         .fillAndStroke('#1a3a5c', '#1a3a5c')
      doc.fillColor('white')
         .fontSize(11).font('Helvetica-Bold')
         .text(
           'MADISON 88 BUSINESS SOLUTIONS ASIA, INC.',
           margin, y + 4,
           { width: contentW, align: 'center' }
         )
      doc.fontSize(8).font('Helvetica')
         .text(
           `Performance Evaluation — ${empName} — ${typeLabel}`,
           margin, y + 18,
           { width: contentW, align: 'center' }
         )
      doc.fillColor('black')
      y += 40

      // Sections B–E
      const drawSection = (title, content) => {
        doc.rect(margin, y, contentW, 14)
           .fillAndStroke('#f1f5f9', '#c8c8c8')
        doc.fontSize(9).font('Helvetica-Bold')
           .fillColor('#1a3a5c')
           .text(title, margin + 4, y + 3)
        doc.fillColor('black')
        y += 14

        const text = content?.trim() || '(none)'
        doc.fontSize(9).font('Helvetica')
           .fillColor('#374151')
           .text(text, margin + 8, y + 4,
             { width: contentW - 16, lineGap: 2 })
        const textH = doc.heightOfString(
          text,
          { width: contentW - 16, lineGap: 2 }
        )
        doc.rect(margin, y, contentW,
          Math.max(textH + 12, 30))
          .stroke('#c8c8c8')
        y += Math.max(textH + 12, 30) + 6
      }

      drawSection(
        'SECTION B — Job Strengths & Superior Performance ' +
        '(For S and A ratings)',
        pe.strengths
      )
      drawSection(
        'SECTION C — Progress Achieved',
        pe.progress
      )
      drawSection(
        'SECTION D — Mistakes/Inefficiencies ' +
        '(For C to E ratings)',
        pe.mistakes
      )
      drawSection(
        'SECTION E — Corrections/Goals/Improvement Programs',
        pe.corrections
      )
      drawSection(
        "EMPLOYEE'S COMMENT",
        pe.employeeComment
      )

      y += 10

      // Acknowledgement line
      doc.rect(margin, y, contentW, 30)
         .fillAndStroke('#fffbeb', '#fde68a')
      doc.fontSize(9).font('Helvetica')
         .fillColor('#374151')
         .text(
           'I hereby certify that this performance ' +
           'evaluation has been discussed to me on ' +
           (pe.acknowledgedAt
             ? fmt(pe.acknowledgedAt)
             : '____________________') + '.',
           margin + 8, y + 10,
           { width: contentW - 16 }
         )
      doc.fillColor('black')
      y += 40

      // Signature blocks
      const sigW = contentW / 3 - 10
      const sigs = [
        "Employee's Name & Signature",
        'Supervisor/Manager',
        'Check and Noted By (HR)',
      ]

      sigs.forEach((label, i) => {
        const sx = margin + i * (sigW + 10)
        // signature line
        doc.moveTo(sx, y + 30)
           .lineTo(sx + sigW, y + 30)
           .strokeColor('#374151')
           .lineWidth(0.5)
           .stroke()
        doc.fontSize(8).font('Helvetica')
           .fillColor('#6b7280')
           .text(label, sx, y + 34,
             { width: sigW, align: 'center' })
        // date line below
        doc.moveTo(sx, y + 50)
           .lineTo(sx + sigW, y + 50)
           .stroke()
        doc.text('Date', sx, y + 53,
          { width: sigW, align: 'center' })
      })

      y += 70

      // Footer
      doc.fontSize(7).fillColor('#9ca3af')
         .text(
           'Madison 88 Business Solutions Asia, Inc. ' +
           '· PE Form 01 rev0, June 2023 · ' +
           `Generated: ${new Date().toLocaleDateString('en-PH')}`,
           margin, doc.page.height - 40,
           { width: contentW, align: 'center' }
         )

      doc.end()
    } catch (error) {
      next(error)
    }
  }

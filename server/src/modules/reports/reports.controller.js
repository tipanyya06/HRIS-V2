import { OshaReport, IncidentReport } from './reports.model.js';
import { logger } from '../../utils/logger.js';

export const createOshaReport = async (req, res, next) => {
  try {
    const { incidentDate, incidentTime, incidentLocation, incidentType, description, witnesses, correctiveActions, reportedTo } = req.body;

    // Validate required fields
    if (!incidentDate || !incidentTime || !incidentLocation || !incidentType || !description) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
      });
    }

    // Validate description length
    if (description.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Description must be at least 50 characters',
      });
    }

    // Create new OSHA report
    const oshaReport = await OshaReport.create({
      userId: req.user.id,
      incidentDate,
      incidentTime,
      incidentLocation,
      incidentType,
      description,
      witnesses: witnesses || null,
      correctiveActions: correctiveActions || null,
      reportedTo: reportedTo || null,
    });

    logger.info(`OSHA report created by user ${req.user.id}: ${oshaReport._id}`);

    res.status(201).json({
      success: true,
      message: 'OSHA report submitted successfully',
      data: oshaReport,
    });
  } catch (error) {
    logger.error(`Create OSHA report error: ${error.message}`);
    next(error);
  }
};

export const createIncidentReport = async (req, res, next) => {
  try {
    const { incidentDate, incidentTime, incidentLocation, incidentType, severityLevel, reportedTo, description, witnesses, immediateActionsTaken } = req.body;

    // Validate required fields
    if (!incidentDate || !incidentTime || !incidentLocation || !incidentType || !severityLevel || !reportedTo || !description || !immediateActionsTaken) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
      });
    }

    // Create new Incident report
    const incidentReport = await IncidentReport.create({
      userId: req.user.id,
      incidentDate,
      incidentTime,
      incidentLocation,
      incidentType,
      severityLevel,
      reportedTo,
      description,
      witnesses: witnesses || null,
      immediateActionsTaken,
    });

    logger.info(`Incident report created by user ${req.user.id}: ${incidentReport._id}`);

    res.status(201).json({
      success: true,
      message: 'Incident report submitted successfully',
      data: incidentReport,
    });
  } catch (error) {
    logger.error(`Create incident report error: ${error.message}`);
    next(error);
  }
};

/**
 * Export report as CSV
 * Query param: type=ats|headcount|employees|training
 */
export const exportCSV = async (req, res, next) => {
  try {
    const { type, dateFrom, dateTo, department } = req.query;
    const filters = { dateFrom, dateTo, department };

    if (!type || !['ats', 'headcount', 'employees', 'training'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be: ats, headcount, employees, or training',
      });
    }

    let csvContent;
    let filename;

    switch (type) {
      case 'ats': {
        const { getATSReport } = await import('./reports.service.js');
        const atsData = await getATSReport(filters);
        filename = `ats-report-${new Date().toISOString().split('T')[0]}.csv`;
        const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
        csvContent = 'Stage,Count\n' + 
          stages.map((s) => `${s},${atsData[s] || 0}`).join('\n');
        break;
      }
      case 'headcount': {
        const { getHeadcountReport } = await import('./reports.service.js');
        const hcData = await getHeadcountReport(filters);
        filename = `headcount-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Department,Total,Active,Inactive\n' +
          (hcData.departments || [])
            .map((d) => `${d.department},${d.total},${d.active},${d.inactive}`)
            .join('\n');
        break;
      }
      case 'employees': {
        const { getEmployeeStatusReport } = await import('./reports.service.js');
        const empData = await getEmployeeStatusReport(filters);
        filename = `employee-status-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Name,Department,Position,Status,Start Date\n' +
          (empData.employees || [])
            .map((e) => `"${e.name}","${e.department}","${e.position}",${e.status},${e.startDate}`)
            .join('\n');
        break;
      }
      case 'training': {
        const { getTrainingReport } = await import('./reports.service.js');
        const trData = await getTrainingReport(filters);
        filename = `training-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Employee,Course,Status,Completed,Expires\n' +
          (trData.assignments || [])
            .map((t) => `"${t.employeeName}","${t.trainingName}",${t.status},"${t.completionDate}","${t.expiryDate}"`)
            .join('\n');
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid report type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);

    logger.info(`CSV export: ${type} by user ${req.user.id}`);
  } catch (error) {
    logger.error(`CSV export error: ${error.message}`);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to export CSV report',
    });
  }
};

/**
 * Export report as PDF
 * Query param: type=ats|headcount|employees|training
 */
export const exportPDF = async (req, res, next) => {
  try {
    const { type, dateFrom, dateTo, department } = req.query;
    const filters = { dateFrom, dateTo, department };

    if (!type || !['ats', 'headcount', 'employees', 'training'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be: ats, headcount, employees, or training',
      });
    }

    // Dynamic import to facilitate creating PDFs on demand
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument();

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe document to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Madison 88 Ltd.', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Fetch data based on type
    switch (type) {
      case 'ats': {
        const { getATSReport } = await import('./reports.service.js');
        const reportData = await getATSReport(filters);
        doc.fontSize(12).text('ATS Funnel by Stage:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
        stages.forEach((s) => {
          doc.text(`${s}: ${reportData[s] || 0}`);
        });
        doc.moveDown();
        doc.fontSize(11).text(`Total: ${reportData.total || 0}`);
        break;
      }
      case 'headcount': {
        const { getHeadcountReport } = await import('./reports.service.js');
        const reportData = await getHeadcountReport(filters);
        doc.fontSize(12).text('Headcount by Department:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);
        (reportData.departments || []).forEach((d) => {
          doc.text(`${d.department}: Total=${d.total} Active=${d.active} Inactive=${d.inactive}`);
        });
        break;
      }
      case 'employees': {
        const { getEmployeeStatusReport } = await import('./reports.service.js');
        const reportData = await getEmployeeStatusReport(filters);
        doc.fontSize(12).text('Employee Status Summary:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Total: ${reportData.summary.total}`);
        doc.text(`Active: ${reportData.summary.active}`);
        doc.text(`Inactive: ${reportData.summary.inactive}`);
        doc.text(`Terminated: ${reportData.summary.terminated}`);
        doc.moveDown();
        doc.fontSize(12).text('Employee List (First 20):', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8);
        (reportData.employees || []).slice(0, 20).forEach((e) => {
          doc.text(`${e.name} | ${e.department} | ${e.position} | ${e.status} | ${e.startDate}`);
        });
        break;
      }
      case 'training': {
        const { getTrainingReport } = await import('./reports.service.js');
        const reportData = await getTrainingReport(filters);
        doc.fontSize(12).text('Training Summary:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Total Programs: ${reportData.summary.totalPrograms}`);
        doc.text(`Total Assignments: ${reportData.summary.totalAssignments}`);
        doc.text(`Completed: ${reportData.summary.completed}`);
        doc.text(`Pending: ${reportData.summary.pending}`);
        doc.text(`Overdue: ${reportData.summary.overdue}`);
        doc.moveDown();
        doc.fontSize(12).text('Assignments (First 20):', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8);
        (reportData.assignments || []).slice(0, 20).forEach((a) => {
          doc.text(`${a.employeeName} | ${a.trainingName} | ${a.status} | ${a.completionDate} | ${a.expiryDate}`);
        });
        break;
      }
    }

    // End the PDF document - MUST be called after all content added
    doc.end();

    logger.info(`PDF export: ${type} by user ${req.user.id}`);
  } catch (error) {
    logger.error(`PDF export error: ${error.message}`);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to export PDF report',
    });
  }
};

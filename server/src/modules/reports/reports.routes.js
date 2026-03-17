import express from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  getDashboardStats,
  getATSReport,
  getHeadcountReport,
  getEmployeeStatusReport,
  getTrainingReport,
  getATSTrend,
  getHiringTrend,
  getTrainingCompletionTrend,
  getCustomReportData,
  getPESOReportData,
} from './reports.service.js';
import ExcelJS from 'exceljs';
import {
  createOshaReport,
  createIncidentReport,
  exportCSV,
  exportPDF,
} from './reports.controller.js';

const router = express.Router();

// Dashboard stats (existing)
router.get(
  '/dashboard',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const stats = await getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ATS Report
router.get(
  '/ats',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getATSReport({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Headcount Report
router.get(
  '/headcount',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getHeadcountReport({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Employee Status Report
router.get(
  '/employees',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getEmployeeStatusReport({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Training Report
router.get(
  '/training',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getTrainingReport({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/trends/ats',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getATSTrend({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/trends/hiring',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getHiringTrend({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/trends/training',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo, department } = req.query;
      const data = await getTrainingCompletionTrend({ dateFrom, dateTo, department });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export as CSV
router.get(
  '/export/csv',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  exportCSV
);

// Export as PDF
router.get(
  '/export/pdf',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  exportPDF
);

// Contact HR reports (existing)
router.post('/osha', verifyToken, createOshaReport);
router.post('/incident', verifyToken, createIncidentReport);

// Custom Report - get data
router.post(
  '/custom',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { fields = [], filters = {} } = req.body;
      if (!fields.length) {
        return res.status(400).json({ error: 'At least one field is required' });
      }
      const data = await getCustomReportData(fields, filters);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
);

// PESO Report - get data
router.get(
  '/peso',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const data = await getPESOReportData(req.query);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
);

// Custom Report - export
router.post(
  '/custom/export/:format',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { format } = req.params;
      const { fields = [], filters = {}, reportName = 'Custom Report' } = req.body;

      if (!fields.length) {
        return res.status(400).json({ error: 'At least one field is required' });
      }

      if (!['csv', 'xlsx', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Format must be csv, xlsx, or pdf' });
      }

      const data = await getCustomReportData(fields, filters);
      const date = new Date().toISOString().split('T')[0];
      const filename = `${reportName.replace(/\s+/g, '-')}-${date}`;

      if (format === 'csv') {
        const header = fields.join(',');
        const rows = data.map((row) => fields.map((f) => `"${(row[f] || '').replace(/"/g, '""')}"`).join(','));
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.status(200).send(csv);
      }

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(reportName);
        worksheet.addRow(['No.', ...fields]);
        worksheet.getRow(1).font = { bold: true };
        data.forEach((row, idx) => {
          worksheet.addRow([idx + 1, ...fields.map((f) => row[f] || '-')]);
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        await workbook.xlsx.write(res);
        return res.end();
      }

      if (format === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        doc.pipe(res);
        doc.fontSize(14).font('Helvetica-Bold').text(reportName, { align: 'center' });
        doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(8).font('Helvetica-Bold').text(fields.join(' | '));
        doc.moveDown(0.5);
        data.forEach((row) => {
          doc.fontSize(7).font('Helvetica').text(fields.map((f) => row[f] || '-').join(' | '));
        });
        doc.end();
      }

      return undefined;
    } catch (error) {
      return next(error);
    }
  }
);

// PESO Report - export
router.post(
  '/peso/export/:format',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  async (req, res, next) => {
    try {
      const { format } = req.params;
      const filters = req.body?.filters || {};

      const PESO_FIELDS = [
        'Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status',
        'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position',
        'Date of Employment', 'Department',
      ];

      const data = await getCustomReportData(PESO_FIELDS, filters);
      const date = new Date().toISOString().split('T')[0];
      const filename = `PESO-Report-${date}`;

      if (format === 'csv') {
        const header = PESO_FIELDS.join(',');
        const rows = data.map((row) => PESO_FIELDS.map((f) => `"${(row[f] || '').replace(/"/g, '""')}"`).join(','));
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.status(200).send(csv);
      }

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('PESO Report');
        worksheet.addRow(['No.', ...PESO_FIELDS]);
        worksheet.getRow(1).font = { bold: true };
        data.forEach((row, idx) => {
          worksheet.addRow([idx + 1, ...PESO_FIELDS.map((f) => row[f] || '-')]);
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        await workbook.xlsx.write(res);
        return res.end();
      }

      if (format === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        doc.pipe(res);
        doc.fontSize(14).font('Helvetica-Bold').text('PESO Report', { align: 'center' });
        doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(8).font('Helvetica-Bold').text(PESO_FIELDS.join(' | '));
        doc.moveDown(0.5);
        data.forEach((row) => {
          doc.fontSize(7).font('Helvetica').text(PESO_FIELDS.map((f) => row[f] || '-').join(' | '));
        });
        doc.end();
      }

      return undefined;
    } catch (error) {
      return next(error);
    }
  }
);

export default router;


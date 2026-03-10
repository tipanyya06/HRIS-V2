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

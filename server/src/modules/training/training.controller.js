import TrainingRecord from './training.model.js';
import { logger } from '../../utils/logger.js';

export const getMyTrainingController = async (req, res) => {
  try {
    const userId = req.user.id;

    const records = await TrainingRecord.find({
      employeeId: userId,
    })
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (err) {
    logger.error('Get my training error:', err);
    return res.status(500).json({
      error: 'Failed to fetch training records',
    });
  }
};

import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { getMyTrainingController } from './training.controller.js';
import TrainingRecord from './training.model.js';

const router = express.Router();

router.get('/my', verifyToken, getMyTrainingController);
router.get(
  '/:employeeId',
  verifyToken,
  async (req, res, next) => {
    try {
      const { employeeId } = req.params;
      // Employee can only see their own records
      if (req.user.id !== employeeId &&
          !['admin', 'super-admin', 'hr']
            .includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }
      const records = await TrainingRecord
        .find({ employeeId })
        .sort({ completedAt: -1 })
        .lean();
      res.status(200).json({
        success: true, data: records,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { getMyTrainingController } from './training.controller.js';

const router = express.Router();

router.get('/my', verifyToken, getMyTrainingController);

export default router;

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

import InterviewSchedule from '../modules/interviews/interview.model.js';
import Applicant from '../modules/applications/applicant.model.js';
import { logger } from '../utils/logger.js';

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB');

    // Find all interviews missing applicantId
    const interviews = await InterviewSchedule.find({
      applicantId: { $exists: false },
      applicantEmail: { $exists: true, $ne: '' },
    }).lean();

    logger.info(`Found ${interviews.length} interviews missing applicantId`);

    let fixed = 0;
    let notFound = 0;

    for (const interview of interviews) {
      const applicant = await Applicant.findOne({
        email: { $regex: new RegExp(`^${interview.applicantEmail}$`, 'i') },
      }).select('_id').lean();

      if (applicant) {
        await InterviewSchedule.findByIdAndUpdate(
          interview._id,
          { $set: { applicantId: applicant._id } }
        );
        logger.info(`Fixed: ${interview.applicantEmail} -> applicantId: ${applicant._id}`);
        fixed++;
      } else {
        logger.warn(`No applicant found for email: ${interview.applicantEmail}`);
        notFound++;
      }
    }

    logger.info(`Migration complete - fixed: ${fixed}, not found: ${notFound}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

migrate();

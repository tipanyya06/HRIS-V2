import cron from 'node-cron';
import TrainingRecord from '../modules/training/training.model.js';
import User from '../modules/auth/user.model.js';
import { createNotification } from '../modules/notifications/notification.service.js';
import { sendEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const getDayRange = (daysFromNow) => {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const checkTrainingExpiry = async () => {
  logger.info('Running training expiry check...');

  const targetDays = [30, 14, 7];

  for (const days of targetDays) {
    try {
      const { start, end } = getDayRange(days);

      const expiring = await TrainingRecord.find({
        expiresAt: {
          $gte: start,
          $lte: end,
        },
        status: { $ne: 'expired' },
      })
        .populate('employeeId', 'email personalInfo')
        .lean();

      logger.info(`Found ${expiring.length} records expiring in ${days} days`);

      for (const record of expiring) {
        try {
          const employee = record.employeeId;
          if (!employee) continue;

          const employeeName = employee.personalInfo?.givenName
            ? `${employee.personalInfo.givenName} ${employee.personalInfo.surname}`
            : employee.email;

          // Create in-app notification
          await createNotification(
            employee._id,
            'training_expiry',
            'Certification Expiring Soon',
            `Your ${record.courseName} certification expires in ${days} days`,
            '/employee/dashboard'
          );

          // Send Brevo email
          try {
            await sendEmail({
              to: employee.email,
              subject: `Action Required — ${record.courseName} Expires in ${days} Days`,
              html: `
                <h2>Certification Expiry Notice</h2>
                <p>Hi ${employeeName},</p>
                <p>Your certification is expiring soon:</p>
                <ul>
                  <li><strong>Course:</strong> ${record.courseName}</li>
                  <li><strong>Provider:</strong> ${record.provider || '—'}</li>
                  <li><strong>Expires:</strong> ${new Date(record.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</li>
                  <li><strong>Days Remaining:</strong> ${days} days</li>
                </ul>
                <p>Please renew your certification before it expires.</p>
                <p>Contact HR if you need assistance with renewal.</p>
              `,
            });
          } catch (emailErr) {
            logger.error(`Training expiry email failed for ${employee.email}:`, emailErr);
          }
        } catch (recordErr) {
          logger.error('Error processing training record:', recordErr);
        }
      }
    } catch (dayErr) {
      logger.error(`Training expiry check failed for ${days} days:`, dayErr);
    }
  }

  logger.info('Training expiry check complete.');
};

export const startTrainingExpiryJob = () => {
  // Run at 8:00 AM every day
  cron.schedule('0 8 * * *', () => {
    checkTrainingExpiry().catch((err) => {
      logger.error('Training expiry cron error:', err);
    });
  });

  logger.info('Training expiry cron job scheduled — runs daily at 8AM');
};

export { checkTrainingExpiry };

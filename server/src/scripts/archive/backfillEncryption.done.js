import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../modules/auth/user.model.js';
import { encrypt } from '../utils/encrypt.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const isEncrypted = (val) => typeof val === 'string' && val.includes(':');

const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({ role: 'employee' })
      .select('+password')
      .lean();

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        const updates = {};

        // Government IDs
        const gIds = user.governmentIds || {};
        if (gIds.sss && !isEncrypted(gIds.sss)) updates['governmentIds.sss'] = encrypt(gIds.sss);
        if (gIds.tin && !isEncrypted(gIds.tin)) updates['governmentIds.tin'] = encrypt(gIds.tin);
        if (gIds.philhealth && !isEncrypted(gIds.philhealth)) {
          updates['governmentIds.philhealth'] = encrypt(gIds.philhealth);
        }
        if (gIds.pagIbig && !isEncrypted(gIds.pagIbig)) {
          updates['governmentIds.pagIbig'] = encrypt(gIds.pagIbig);
        }

        // Payroll
        const pay = user.payrollInfo || {};
        if (pay.accountNumber && !isEncrypted(pay.accountNumber)) {
          updates['payrollInfo.accountNumber'] = encrypt(pay.accountNumber);
        }
        if (pay.basicSalary && !isEncrypted(pay.basicSalary)) {
          updates['payrollInfo.basicSalary'] = encrypt(pay.basicSalary);
        }

        // Contact
        const contact = user.contactInfo || {};
        if (contact.mainContactNo && !isEncrypted(contact.mainContactNo)) {
          updates['contactInfo.mainContactNo'] = encrypt(contact.mainContactNo);
        }

        // Emergency contact
        const emergency = user.emergencyContact || {};
        if (emergency.contact && !isEncrypted(emergency.contact)) {
          updates['emergencyContact.contact'] = encrypt(emergency.contact);
        }

        if (Object.keys(updates).length > 0) {
          await User.updateOne({ _id: user._id }, { $set: updates });
          updated++;
          logger.info(`Backfilled encryption for user ${user._id}`);
        } else {
          skipped++;
        }
      } catch (error) {
        logger.error(`Backfill user failed (${user._id}): ${error.message}`);
      }
    }

    logger.info(`Backfill complete: ${updated} updated, ${skipped} skipped`);
    await mongoose.disconnect();
  } catch (error) {
    logger.error(`Backfill failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      logger.error(`Backfill disconnect failed: ${disconnectError.message}`);
    }
    process.exit(1);
  }
};

backfill();

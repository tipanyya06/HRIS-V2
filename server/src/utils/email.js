import { logger } from './logger.js';

export const sendEmail = async ({ to, subject, html }) => {
  // Placeholder for Brevo email sending
  // For now, just log the email to console
  try {
    logger.info(`Email queued for ${to}: "${subject}"`);
    // In production, integrate Brevo SDK here:
    // const brevo = new TransactionalEmailsApi();
    // await brevo.sendTransacEmail({ to, subject, htmlContent: html });
  } catch (err) {
    logger.error('Email send error:', err);
    throw err;
  }
};

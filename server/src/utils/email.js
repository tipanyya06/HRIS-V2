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

export const sendWelcomeEmail = async (user, companyEmail) => {
  try {
    const firstName =
      user.personalInfo?.givenName ||
      user.personalInfo?.fullName?.split(' ')[0] ||
      'there';

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Madison 88 — Your account is ready',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1a3a5c;margin-bottom:8px">Welcome to Madison 88, ${firstName}!</h2>
          <p style="color:#4b5563;line-height:1.6;margin-bottom:16px">
            Your employee account has been created. You can now log in to the Madison 88 HRIS portal
            using your personal email address.
          </p>
          <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="font-size:12px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">
              Your company email
            </p>
            <p style="font-size:16px;font-weight:600;color:#1a3a5c;margin:0">${companyEmail}</p>
          </div>
          <p style="color:#4b5563;line-height:1.6;margin-bottom:24px">
            Use your personal email to log in. Your company email is for internal communications only.
          </p>
          <a href="${process.env.FRONTEND_URL}/login"
            style="display:inline-block;background:#185FA5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            Log in to HRIS Portal
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">Madison 88 HR Team</p>
        </div>
      `,
    });

    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error(`sendWelcomeEmail error: ${error.message}`);
    throw error;
  }
};

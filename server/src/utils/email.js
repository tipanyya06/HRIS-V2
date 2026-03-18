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

export const sendRejectionEmail = async (applicant, jobTitle) => {
  try {
    await sendEmail({
      to: applicant.email,
      subject: `Your application for ${jobTitle} - Update`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1a3a5c;margin-bottom:8px">
            Application Update
          </h2>
          <p style="color:#4b5563;line-height:1.6;margin-bottom:16px">
            Dear ${applicant.fullName ?? applicant.email},
          </p>
          <p style="color:#4b5563;line-height:1.6;margin-bottom:16px">
            Thank you for your interest in the
            <strong>${jobTitle}</strong> position at
            Madison 88 and for taking the time to go
            through our application process.
          </p>
          <p style="color:#4b5563;line-height:1.6;margin-bottom:16px">
            After careful consideration, we regret to
            inform you that we will not be moving forward
            with your application at this time.
          </p>
          <p style="color:#4b5563;line-height:1.6;margin-bottom:24px">
            We encourage you to apply for future
            opportunities that match your skills and
            experience. We wish you the best in your
            job search.
          </p>
          <p style="color:#9ca3af;font-size:12px">
            Madison 88 HR Team
          </p>
        </div>
      `,
    });
    logger.info(`Rejection email sent to ${applicant.email}`);
  } catch (error) {
    // Fire and forget - never crash stage change
    logger.error(`sendRejectionEmail error: ${error.message}`);
  }
};

export const generateOfferLetterPDF = async (employee, job) => {
  try {
    const PDFDocument = (await import('pdfkit')).default;
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 60,
        size: 'A4',
      });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const today = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const name =
        employee.personalInfo?.fullName ??
        `${employee.personalInfo?.firstName ?? ''} ${employee.personalInfo?.lastName ?? ''}`.trim() ??
        employee.email;

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text('Madison 88', { align: 'center' });
      doc.fontSize(11).font('Helvetica')
        .text('Offer of Employment', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(today, { align: 'right' });
      doc.moveDown(2);

      // Body
      doc.fontSize(11).font('Helvetica')
        .text(`Dear ${name},`);
      doc.moveDown();
      doc.text(
        `We are pleased to offer you the position of ` +
        `${job?.title ?? 'the position'} at Madison 88. ` +
        `This is a ${employee.employmentType ?? 'full-time'} ` +
        `role in the ${job?.department ?? employee.department ?? ''} ` +
        `department.`,
        { lineGap: 4 }
      );
      doc.moveDown();
      doc.text(
        'Your employment is contingent upon the successful ' +
        'completion of all pre-employment requirements and ' +
        'background verification.',
        { lineGap: 4 }
      );
      doc.moveDown();
      doc.text(
        'Please sign and return a copy of this letter to ' +
        'confirm your acceptance of this offer within 5 ' +
        'business days.',
        { lineGap: 4 }
      );
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Madison 88 HR Team');
      doc.moveDown(3);

      // Signature line
      doc.moveTo(60, doc.y)
        .lineTo(300, doc.y)
        .stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10)
        .text('Candidate signature & date');

      doc.end();
    });
  } catch (error) {
    logger.error(`generateOfferLetterPDF error: ${error.message}`);
    throw error;
  }
};

const BRAND_COLOR = '#B8860B'; // Royal Ember gold
const DARK_BG = '#011F28';

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sahlearn</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${DARK_BG};padding:28px 32px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:${BRAND_COLOR};letter-spacing:1px;">SAHLEARN</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} Sahlearn. All rights reserved.<br />
              Questions? Reply to this email or chat us on WhatsApp.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Sent immediately after a Paystack enrollment is created (payment already confirmed).
 */
function enrollmentPaystackConfirmed({ fullName, courseTitleSnapshot, amountPaid, paymentRef }) {
  const amount = amountPaid ? `₦${Number(amountPaid).toLocaleString('en-NG')}` : '';
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Payment Confirmed!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${fullName}, your enrollment payment was received successfully.</p>

    <table width="100%" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Course</td>
          <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;">${courseTitleSnapshot}</td></tr>
      ${amount ? `<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Amount paid</td>
          <td style="font-size:13px;color:${BRAND_COLOR};font-weight:700;text-align:right;">${amount}</td></tr>` : ''}
      ${paymentRef ? `<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Reference</td>
          <td style="font-size:12px;color:#374151;font-family:monospace;text-align:right;">${paymentRef}</td></tr>` : ''}
    </table>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;">
      Our team will review your enrollment and reach out within <strong>1-2 business days</strong>
      with your access details and next steps.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">Keep this email for your records.</p>
  `;
  return baseLayout(content);
}

/**
 * Sent after admin manually marks a bank transfer as paid.
 */
function enrollmentBankTransferConfirmed({ fullName, courseTitleSnapshot, amountPaid }) {
  const amount = amountPaid ? `₦${Number(amountPaid).toLocaleString('en-NG')}` : '';
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Bank Transfer Verified!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${fullName}, great news — your bank transfer has been verified and your enrollment is confirmed.</p>

    <table width="100%" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Course</td>
          <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;">${courseTitleSnapshot}</td></tr>
      ${amount ? `<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Amount verified</td>
          <td style="font-size:13px;color:${BRAND_COLOR};font-weight:700;text-align:right;">${amount}</td></tr>` : ''}
    </table>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;">
      We will contact you within <strong>1-2 business days</strong> with your course access details and onboarding instructions.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">Thank you for choosing Sahlearn!</p>
  `;
  return baseLayout(content);
}

/**
 * Sent after a bank-transfer enrollment is submitted (payment not yet verified).
 */
function enrollmentBankTransferReceived({ fullName, courseTitleSnapshot, bankName, bankAccount, bankAccountName }) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Enrollment Request Received</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${fullName}, we received your enrollment request for <strong>${courseTitleSnapshot}</strong>.</p>

    <p style="margin:0 0 12px;color:#374151;font-size:14px;">To complete your enrollment, please make payment to the bank account below:</p>

    <table width="100%" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Bank</td>
          <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;">${bankName || 'See WhatsApp'}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Account number</td>
          <td style="font-size:14px;color:#111827;font-weight:700;font-family:monospace;text-align:right;">${bankAccount || 'See WhatsApp'}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Account name</td>
          <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;">${bankAccountName || 'Sahlearn'}</td></tr>
    </table>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;">
      After payment, send your proof of transfer to us on WhatsApp. We will verify and confirm your enrollment within <strong>24 hours</strong>.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">Reply to this email if you have any questions.</p>
  `;
  return baseLayout(content);
}

/**
 * Sent to a student when their account is auto-created after enrollment is approved.
 */
function studentWelcomeTemplate({ fullName, studentId, email, tempPassword, loginUrl }) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Welcome to Sahlearn!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${fullName}, your student account is ready. Use the credentials below to log in.</p>

    <table width="100%" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Student ID</td>
          <td style="font-size:13px;color:#111827;font-weight:600;font-family:monospace;text-align:right;">${studentId}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Email</td>
          <td style="font-size:13px;color:#111827;text-align:right;">${email}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Temp Password</td>
          <td style="font-size:13px;color:#111827;font-weight:700;font-family:monospace;text-align:right;">${tempPassword}</td></tr>
    </table>

    <p style="margin:0 0 16px;color:#374151;font-size:14px;">
      Please log in and <strong>change your password</strong> immediately.
    </p>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${loginUrl}" style="display:inline-block;background:#068562;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Log In to Student Portal</a>
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">If you did not expect this email, please contact us immediately.</p>
  `;
  return baseLayout(content);
}

/**
 * Sent when a student requests a password reset (or admin triggers one).
 */
function passwordResetTemplate({ fullName, resetUrl }) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Reset Your Password</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${fullName}, click the button below to reset your Sahlearn password. This link expires in <strong>1 hour</strong>.</p>

    <p style="text-align:center;margin:0 0 24px;">
      <a href="${resetUrl}" style="display:inline-block;background:#068562;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Reset Password</a>
    </p>

    <p style="margin:0;color:#9ca3af;font-size:12px;">
      If you did not request a password reset, ignore this email — your password will not change.
      If you are concerned, contact us immediately.
    </p>
  `;
  return baseLayout(content);
}

module.exports = {
  enrollmentPaystackConfirmed,
  enrollmentBankTransferConfirmed,
  enrollmentBankTransferReceived,
  studentWelcomeTemplate,
  passwordResetTemplate,
};

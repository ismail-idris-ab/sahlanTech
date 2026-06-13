const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return _transporter;
}

async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[mailer] GMAIL_USER or GMAIL_APP_PASSWORD not set — email skipped');
    return;
  }

  const from = process.env.MAIL_FROM || `Sahlearn <${process.env.GMAIL_USER}>`;

  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
  }
}

module.exports = { sendMail };

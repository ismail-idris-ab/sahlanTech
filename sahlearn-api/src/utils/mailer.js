const { Resend } = require('resend');

let _resend = null;

function getClient() {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) return null;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Send an email. Fails silently if RESEND_API_KEY is not configured.
 * @param {{ to: string, subject: string, html: string }} options
 */
async function sendMail({ to, subject, html }) {
  const client = getClient();
  if (!client) return;

  const from = process.env.MAIL_FROM || 'Sahlearn <noreply@sahlearn.com>';

  try {
    await client.emails.send({ from, to, subject, html });
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
  }
}

module.exports = { sendMail };

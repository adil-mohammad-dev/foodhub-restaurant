// Simple test email sender for FoodHub
// Usage: set SENDGRID_API_KEY or EMAIL_USER/EMAIL_PASS in env (or .env) then:
// node scripts/send_test_email.js recipient@example.com

require('dotenv').config();
const to = process.argv[2] || process.env.TEST_RECIPIENT;
if (!to) {
  console.error('Usage: node scripts/send_test_email.js recipient@example.com');
  process.exit(1);
}

async function main() {
  const sg = (() => {
    try { return require('@sendgrid/mail'); } catch (e) { return null; }
  })();

  if (process.env.SENDGRID_API_KEY && sg) {
    sg.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = { to, from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com', subject: 'FoodHub test email', text: 'This is a test email from FoodHub.' };
    try {
      const res = await sg.send(msg);
      console.log('SendGrid send result:', res && res[0] && res[0].statusCode);
      process.exit(0);
    } catch (err) {
      console.error('SendGrid error:', err && err.message ? err.message : err);
      process.exit(2);
    }
  }

  // Fallback to nodemailer SMTP
  const nodemailer = require('nodemailer');
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('No SendGrid key and no EMAIL_USER/PASS configured. Set one to send email.');
    process.exit(3);
  }

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject: 'FoodHub test email', text: 'This is a test email from FoodHub (SMTP).' });
  console.log('SMTP send info:', info && info.response);
}

main().catch(err => { console.error('Error in send_test_email:', err); process.exit(99); });

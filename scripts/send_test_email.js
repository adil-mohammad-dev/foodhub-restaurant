// Simple test email sender for FoodHub
// Usage: set EMAIL_USER and EMAIL_PASS in env (or .env) then:
// node scripts/send_test_email.js recipient@example.com

require('dotenv').config();
const to = process.argv[2] || process.env.TEST_RECIPIENT;
if (!to) {
  console.error('Usage: node scripts/send_test_email.js recipient@example.com');
  process.exit(1);
}

async function main() {
  // Use nodemailer SMTP only
  const nodemailer = require('nodemailer');
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('No SMTP credentials configured. Set EMAIL_USER and EMAIL_PASS in .env to send email.');
    process.exit(3);
  }

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject: 'FoodHub test email', text: 'This is a test email from FoodHub (SMTP).' });
  console.log('SMTP send info:', info && info.response);
}

main().catch(err => { console.error('Error in send_test_email:', err); process.exit(99); });

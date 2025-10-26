require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: (process.env.EMAIL_USER || process.env.SMTP_USER), pass: (function(){
    const raw = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_APP_PASS || process.env.SMTP_PASS;
    if (!raw) return null;
    return raw.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/\s+/g, '');
  })() }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('Transport verify failed:', err && (err.message || err));
    return process.exit(1);
  }
  console.log('Transport verified');

  const mailOptions = {
    from: `"FoodHub Test" <${user}>`,
    to: user,
    subject: 'Test email from FoodHub',
    text: 'This is a test message sent from your FoodHub server to verify SMTP settings.'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Send failed:', error);
      process.exit(1);
    }
    console.log('Send success:', info && info.response);
    process.exit(0);
  });
});
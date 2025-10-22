require('dotenv').config();
const nodemailer = require('nodemailer');

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

if (!user || !pass) {
  console.error('EMAIL_USER or EMAIL_PASS missing in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('Transport verify failed:', err.message || err);
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
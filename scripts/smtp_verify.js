// Quick SMTP verification script for FoodHub
// Usage: node scripts/smtp_verify.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function run() {
  try {
    let transporter;
    if (process.env.SENDGRID_API_KEY) {
      console.log('Config: using SendGrid SMTP (smtp.sendgrid.net:587)');
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
      });
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('Config: using Gmail SMTP (via service gmail)');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
    } else {
      console.log('No SMTP config found in environment. Set SENDGRID_API_KEY or EMAIL_USER/EMAIL_PASS in .env');
      process.exit(2);
    }

    console.log('Running transporter.verify() ...');
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP verify error:');
        console.error(error && error.message ? error.message : error);
        // Show some structured fields if available
        if (error && error.response) console.error('response:', error.response);
        if (error && error.code) console.error('code:', error.code);
        process.exit(1);
      } else {
        console.log('SMTP ready: server accepted connection/config looks good');
        process.exit(0);
      }
    });
  } catch (e) {
    console.error('Unexpected error running SMTP verify:', e && e.message ? e.message : e);
    process.exit(3);
  }
}

run();

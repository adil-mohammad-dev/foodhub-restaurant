// Quick SMTP verification script for FoodHub
// Usage: node scripts/smtp_verify.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function run() {
  try {
  // TEMP DEBUG: show what env vars Node actually reads (masked and normalized)
  const rawPass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_APP_PASS || process.env.SMTP_PASS;
  const normPass = rawPass ? rawPass.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/\s+/g, '') : null;
  console.log('[DEBUG env] EMAIL_USER:', process.env.EMAIL_USER);
  console.log('[DEBUG env] EMAIL_VAR_NAMES:', Object.keys(process.env).filter(k => /EMAIL|SMTP/i.test(k)));
  console.log('[DEBUG env] rawPass_len:', rawPass ? rawPass.length : null);
  console.log('[DEBUG env] normPass_len:', normPass ? normPass.length : null);
  console.log('[DEBUG env] normPass_preview:', normPass ? (normPass.slice(0,4) + '...' + normPass.slice(-4)) : null);

    let transporter;
    if (process.env.EMAIL_USER && normPass) {
      console.log('Config: using Gmail SMTP (via service gmail)');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: normPass }
      });
    } else {
      console.log('No SMTP config found in environment. Set EMAIL_USER and EMAIL_PASS in .env');
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

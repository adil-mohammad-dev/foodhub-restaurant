require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');
let sendgrid = null;
try { sendgrid = require('@sendgrid/mail'); } catch (e) { sendgrid = null; }
const crypto = require('crypto');

const db = new sqlite3.Database(path.join(__dirname, '..', 'reservations.db'));

async function sendMailAsync(opts) {
  console.log('[resend_confirmation] sendMailAsync called, to=', opts && opts.to);
  if (process.env.SENDGRID_API_KEY && sendgrid && typeof sendgrid.send === 'function') {
    try {
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = { to: opts.to, from: opts.from, subject: opts.subject, text: opts.text, html: opts.html };
      const res = await sendgrid.send(msg);
      console.log('[resend_confirmation] SendGrid response:', res && res[0] && res[0].statusCode);
      return { ok: true, response: res && res[0] && res[0].statusCode };
    } catch (err) {
      console.error('[resend_confirmation] SendGrid error:', err && (err.message || err));
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { ok: false, error: 'No SMTP credentials configured (EMAIL_USER/EMAIL_PASS)' };
  }
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  return new Promise((resolve) => {
    transporter.sendMail(opts, (error, info) => {
      console.log('[resend_confirmation] SMTP send callback, error=', error, 'info=', info && info.response);
      if (error) return resolve({ ok: false, error: error && error.message ? error.message : String(error) });
      return resolve({ ok: true, response: info && info.response });
    });
  });
}

async function main() {
  const id = Number(process.argv[2]);
  if (!id) { console.error('Usage: node resend_confirmation.js <reservationId>'); process.exit(2); }

  db.get('SELECT * FROM reservations WHERE id = ?', [id], async (err, row) => {
    if (err) { console.error('DB error:', err); process.exit(1); }
    if (!row) { console.error('Reservation not found for id', id); process.exit(1); }

    const mailOptions = {
      from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
      to: row.email,
      subject: '✅ Payment Received — Reservation Confirmed',
      text: `Hi ${row.name || ''},\n\nWe have received your payment. Your reservation is confirmed. Reservation ID: ${row.id}\n\nThank you!`
    };

    try {
      const res = await sendMailAsync(mailOptions);
      console.log('sendMailAsync result:', res);
      process.exit(res && res.ok ? 0 : 1);
    } catch (e) {
      console.error('Unexpected send error:', e);
      process.exit(1);
    }
  });
}

main();

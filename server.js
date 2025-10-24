/**
 * Clean server.js for FoodHub
 * - Uses SendGrid API when SENDGRID_API_KEY is present
 * - Falls back to nodemailer SMTP when EMAIL_USER/EMAIL_PASS provided
 * - DEV_SHOW_OTP=1 returns OTP in response for testing
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
let sendgrid = null;
try { sendgrid = require('@sendgrid/mail'); } catch (e) { sendgrid = null; }
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Optional SMTP transporter (fallback)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  console.log('Configured Gmail SMTP transporter (fallback)');
}

// Unified send helper
async function sendMailAsync(opts) {
  console.log('[sendMailAsync] called, to=', opts && opts.to);
  // Prefer SendGrid API (HTTPS) if available
  if (process.env.SENDGRID_API_KEY && sendgrid && typeof sendgrid.send === 'function') {
    try {
      console.log('[sendMailAsync] using SendGrid API');
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = { to: opts.to, from: opts.from, subject: opts.subject, text: opts.text, html: opts.html };
      const res = await sendgrid.send(msg);
      console.log('[sendMailAsync] SendGrid response:', res && res[0] && res[0].statusCode);
      return { ok: true, response: res && res[0] && res[0].statusCode };
    } catch (err) {
      console.error('[sendMailAsync] SendGrid error:', err && (err.message || err));
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  }

  // Fallback to nodemailer
  if (!transporter) return { ok: false, error: 'No SMTP transporter configured' };
  return new Promise((resolve) => {
    transporter.sendMail(opts, (error, info) => {
      console.log('[sendMailAsync] SMTP send callback, error=', error, 'info=', info && info.response);
      if (error) return resolve({ ok: false, error: error && error.message ? error.message : String(error) });
      return resolve({ ok: true, response: info && info.response });
    });
  });
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));
app.use(cors());

// Helpers
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

function generateOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10).toString();
  return otp;
}

// Optional Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try { const twilio = require('twilio'); twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); } catch (e) { twilioClient = null; }
}

// Database
const db = new sqlite3.Database('reservations.db', (err) => { if (err) console.error('DB open error', err); else console.log('Connected to reservations.db'); });

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, email TEXT, phone TEXT, date TEXT, time TEXT, people INTEGER,
    occasion TEXT, meal_type TEXT, payment_mode TEXT DEFAULT 'Cash', payment_status TEXT DEFAULT 'pending',
    message TEXT, status TEXT DEFAULT 'pending', delivery_option TEXT DEFAULT 'Dine-in', menu_items TEXT, delivery_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_data TEXT,
    email TEXT,
    phone TEXT,
    otp TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // archived reservations for audit/restore
  db.run(`CREATE TABLE IF NOT EXISTS archived_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER,
    name TEXT, email TEXT, phone TEXT, date TEXT, time TEXT, people INTEGER,
    occasion TEXT, meal_type TEXT, payment_mode TEXT, payment_status TEXT,
    message TEXT, status TEXT, delivery_option TEXT, menu_items TEXT,
    delivery_address TEXT, delivery_lat REAL, delivery_lng REAL,
    created_at DATETIME, archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    archived_reason TEXT
  )`);
});

// Routes
app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));
// Simple in-memory attempt tracker (per-OTP id) - persisted storage recommended for production
const otpAttempts = {};

function formatE164(digits) {
  // digits expected to be only numbers (no +). Prefers DEFAULT_COUNTRY_CODE from env or '91'
  const cc = (process.env.DEFAULT_COUNTRY_CODE || '91').replace(/^\+/, '');
  if (!digits) return null;
  // If digits already start with country code (length > 10), assume it's full number
  if (digits.length > 10) return '+' + digits;
  return '+' + cc + digits;
}

// Request OTP (uses hashed OTP in DB and logs send results)
app.post('/reserve/request-otp', (req, res) => {
  try {
    const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, delivery_option, menu_items, delivery_address } = req.body;
    if (!name || !email || !phone || !date || !time || !people || !payment_mode) return res.status(400).json({ success: false, message: 'Missing required fields.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email.' });
    const phoneNorm = normalizePhone(phone); if (!phoneNorm) return res.status(400).json({ success: false, message: 'Invalid phone.' });

    // Clean up expired otps (best-effort)
    try { db.run(`DELETE FROM otps WHERE expires_at <= ?`, [new Date().toISOString()]); } catch (e) { console.error('Failed to cleanup expired otps', e); }

    const otp = generateOTP(6);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservationData = JSON.stringify({ name, email: email.trim(), phone: phoneNorm, date, time, people, occasion, meal_type, message, payment_mode, delivery_option, menu_items, delivery_address });

    db.run(`INSERT INTO otps (reservation_data, email, phone, otp, expires_at) VALUES (?,?,?,?,?)`, [reservationData, email.trim(), phoneNorm, otpHash, expiresAt.toISOString()], function(err) {
      if (err) { console.error('Failed to insert otp', err); return res.status(500).json({ success: false, message: 'Failed to create OTP.' }); }
      const otpId = this.lastID;

      const mailOptions = { from: `"FoodHub" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: email.trim(), subject: 'Your FoodHub reservation OTP', text: `Your OTP: ${otp} (expires in 10 minutes)` };

      (async () => {
        try {
          let emailResult = { ok: false, info: 'skipped' };
          if (process.env.DEV_SHOW_OTP === '1') {
            emailResult = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
            console.log('[request-otp] DEV_SHOW_OTP=1, skipping email send; OTP=', otp);
          } else {
            emailResult = await sendMailAsync(mailOptions);
          }

          let smsResult = { ok: false, error: 'Twilio not configured' };
          if (twilioClient) {
            try {
              const toNumber = formatE164(phoneNorm);
              const fromNumber = process.env.TWILIO_FROM_NUMBER;
              console.log('[request-otp] sending SMS to', toNumber, 'from', fromNumber);
              const msg = await twilioClient.messages.create({ body: `Your FoodHub reservation OTP: ${otp}`, from: fromNumber, to: toNumber });
              smsResult = { ok: true, sid: msg.sid };
            } catch (e) {
              console.error('[request-otp] Twilio send error:', e && e.message ? e.message : e);
              smsResult = { ok: false, error: e && e.message ? e.message : String(e) };
            }
          }

          console.log('[request-otp] emailResult=', emailResult, 'smsResult=', smsResult);
          const resp = { success: true, otpId, message: 'OTP processed', expiresAt: expiresAt.toISOString(), emailSent: emailResult.ok, emailInfo: emailResult, smsSent: smsResult.ok, smsInfo: smsResult };
          if (process.env.DEV_SHOW_OTP === '1') resp.otp = otp;
          return res.json(resp);
        } catch (e) {
          console.error('Request OTP internal error:', e);
          return res.status(500).json({ success: false, message: 'Internal error while sending OTP.' });
        }
      })();
    });
  } catch (e) { console.error('Request OTP error', e); return res.status(500).json({ success: false, message: 'Internal server error' }); }
});

// Verify OTP and finalize
app.post('/reserve/verify-otp', (req, res) => {
  try {
    const { otpId, otp } = req.body; if (!otpId || !otp) return res.status(400).json({ success: false, message: 'otpId and otp required.' });
    // rate-limit attempts per otpId
    otpAttempts[otpId] = (otpAttempts[otpId] || 0) + 1;
    if (otpAttempts[otpId] > 5) return res.status(429).json({ success: false, message: 'Too many attempts, try again later.' });

    db.get(`SELECT * FROM otps WHERE id = ?`, [otpId], (err, row) => {
      if (err) { console.error('DB error on select otp:', err); return res.status(500).json({ success: false, message: 'DB error' }); }
      if (!row) return res.status(404).json({ success: false, message: 'OTP not found.' });
      if (new Date(row.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'OTP expired.' });

      // Compare hashed OTP
      const incomingHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
      if (row.otp !== incomingHash) {
        console.warn('[verify-otp] invalid otp attempt for id', otpId);
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
      }

      let data; try { data = JSON.parse(row.reservation_data); } catch (e) { console.error('Invalid reservation_data JSON', e); return res.status(500).json({ success: false, message: 'Invalid reservation data.' }); }
      const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, delivery_option, menu_items, delivery_address } = data;
      const payment_status = payment_mode === 'Cash' ? 'not_required' : 'pending'; const finalDeliveryOption = delivery_option || 'Dine-in'; const menuItemsStr = menu_items ? JSON.stringify(menu_items) : null;

      db.run(`INSERT INTO reservations (name,email,phone,date,time,people,occasion,meal_type,message,payment_mode,payment_status,delivery_option,menu_items,delivery_address)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, finalDeliveryOption, menuItemsStr, delivery_address], async function(err) {
        if (err) { console.error('Failed to insert reservation:', err); return res.status(500).json({ success: false, message: 'Failed to save reservation.' }); }
        const reservationId = this.lastID;
        db.run(`DELETE FROM otps WHERE id = ?`, [otpId]);

        // If payment is Online, do not send confirmation email yet — wait for payment completion.
        const mailOptions = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: email, subject: '✅ Table Reservation Confirmed - FoodHub Restaurant', text: `Your reservation is confirmed. Reservation ID: ${reservationId}` };
        let confirmationEmail = { ok: false, info: 'not-sent' };
        const paymentRequired = String(payment_mode).toLowerCase() === 'online';
        const paymentAmount = Number(process.env.DEFAULT_ONLINE_AMOUNT || 500);

        if (!paymentRequired) {
          if (process.env.DEV_SHOW_OTP === '1') confirmationEmail = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
          else {
            try { confirmationEmail = await sendMailAsync(mailOptions); } catch (e) { console.error('Error sending confirmation email:', e); confirmationEmail = { ok: false, error: e && e.message ? e.message : String(e) }; }
          }
        } else {
          confirmationEmail = { ok: false, info: 'awaiting_payment' };
        }

        // cleanup attempts
        delete otpAttempts[otpId];

        return res.json({ success: true, reservationId, message: 'Reservation created', paymentRequired, paymentAmount, confirmationEmailSent: confirmationEmail.ok, confirmationEmailInfo: confirmationEmail });
      });
    });
  } catch (e) { console.error('Verify OTP error:', e); return res.status(500).json({ success: false, message: 'Internal server error while verifying OTP.' }); }
});
// POST /reserve - accept reservation directly and send confirmation
app.post('/reserve', (req, res) => {
  try {
    const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, delivery_option, menu_items, delivery_address } = req.body;
    if (!name || !email || !phone || !date || !time || !people || !payment_mode) return res.status(400).json({ success: false, message: 'Missing required fields.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email.' });
    const phoneNorm = normalizePhone(phone); if (!phoneNorm) return res.status(400).json({ success: false, message: 'Invalid phone.' });

    const payment_status = payment_mode === 'Cash' ? 'not_required' : 'pending';
    const finalDeliveryOption = delivery_option || 'Dine-in';
    const menuItemsStr = menu_items ? JSON.stringify(menu_items) : null;

    db.run(`INSERT INTO reservations (name,email,phone,date,time,people,occasion,meal_type,message,payment_mode,payment_status,delivery_option,menu_items,delivery_address)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [name, email.trim(), phoneNorm, date, time, people, occasion, meal_type, message, payment_mode, payment_status, finalDeliveryOption, menuItemsStr, delivery_address], async function(err) {
      if (err) { console.error('Failed to insert reservation:', err); return res.status(500).json({ success: false, message: 'Failed to save reservation.' }); }
      const reservationId = this.lastID;

      const mailOptions = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: email.trim(), subject: '✅ Table Reservation Confirmed - FoodHub Restaurant', text: `Your reservation is confirmed. Reservation ID: ${reservationId}` };
      let confirmationEmail = { ok: false, error: 'skipped' };
      if (process.env.DEV_SHOW_OTP === '1') confirmationEmail = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
      else {
        try { confirmationEmail = await sendMailAsync(mailOptions); } catch (e) { console.error('Error sending confirmation email:', e); confirmationEmail = { ok: false, error: e && e.message ? e.message : String(e) }; }
      }

      return res.json({ success: true, reservationId, message: 'Reservation saved', confirmationEmailSent: confirmationEmail.ok, confirmationEmailInfo: confirmationEmail });
    });
  } catch (e) { console.error('Reserve error:', e); return res.status(500).json({ success: false, message: 'Internal server error' }); }
});

// Serve favicon
app.get('/favicon.ico', (req, res) => { res.sendFile(path.join(__dirname, 'assets', 'img', 'favicon.ico')); });

// Admin: list reservations (JSON)
app.get('/admin/reservations', (req, res) => {
  try {
    db.all(`SELECT id,name,email,phone,date,time,people,occasion,meal_type,payment_mode,payment_status,status,created_at FROM reservations ORDER BY created_at DESC`, [], (err, rows) => {
      if (err) { console.error('DB error fetching reservations:', err); return res.status(500).json({ success: false, message: 'DB error' }); }
      return res.json({ success: true, reservations: rows });
    });
  } catch (e) { console.error('Admin list error:', e); return res.status(500).json({ success: false, message: 'Internal server error' }); }
});

// Admin: delete a reservation by id
app.delete('/admin/reservations/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
    db.run(`DELETE FROM reservations WHERE id = ?`, [id], function(err) {
      if (err) { console.error('DB delete error:', err); return res.status(500).json({ success: false, message: 'DB error' }); }
      if (this.changes && this.changes > 0) return res.json({ success: true, deletedId: id });
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    });
  } catch (e) { console.error('Admin delete error:', e); return res.status(500).json({ success: false, message: 'Internal server error' }); }
});

// --- API routes protected by ADMIN_API_KEY (used by Admin.html script)
function requireAdminKey(req, res) {
  const provided = req.get('x-api-key') || req.query.api_key || req.headers['x-api-key'];
  // Debug logging for admin auth
  try {
    console.log('[requireAdminKey] provided=', provided, ' ADMIN_API_KEY_set=', !!process.env.ADMIN_API_KEY);
  } catch (e) { /* ignore logging errors */ }
  if (!process.env.ADMIN_API_KEY) return { ok: false, code: 500, message: 'Server misconfigured: ADMIN_API_KEY not set' };
  if (!provided || provided !== process.env.ADMIN_API_KEY) return { ok: false, code: 401, message: 'Invalid API key' };
  return { ok: true };
}

app.get('/api/reservations', (req, res) => {
  console.log('[api GET /api/reservations] incoming request from', req.ip, 'headers:', { 'x-api-key': req.get('x-api-key') });
  const check = requireAdminKey(req, res);
  if (!check.ok) return res.status(check.code).json({ success: false, message: check.message });
  db.all(`SELECT * FROM reservations ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) { console.error('DB error fetching reservations (api):', err); return res.status(500).json({ success: false, message: 'DB error' }); }
    return res.json({ success: true, reservations: rows });
  });
});

app.put('/api/reservations/:id', (req, res) => {
  const check = requireAdminKey(req, res);
  if (!check.ok) return res.status(check.code).json({ success: false, message: check.message });
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
  const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status } = req.body;
  db.run(`UPDATE reservations SET name=?,email=?,phone=?,date=?,time=?,people=?,occasion=?,meal_type=?,message=?,payment_mode=?,payment_status=?,status=? WHERE id=?`, [name,email,phone,date,time,people,occasion,meal_type,message,payment_mode,payment_status,status,id], function(err) {
    if (err) { console.error('DB update error (api):', err); return res.status(500).json({ success: false, message: 'DB error' }); }
    // fetch updated row to decide if we need to trigger actions (e.g., resend confirmation)
    db.get(`SELECT * FROM reservations WHERE id = ?`, [id], async (getErr, row) => {
      if (getErr) { console.error('DB fetch after update error:', getErr); return res.status(500).json({ success: false, message: 'DB error' }); }
      try {
          // If reservation is cancelled by admin and there's a message, send cancellation email to customer
          if (row && String(row.status).toLowerCase() === 'cancelled') {
            try {
              const adminMessage = row.message || message || 'Your reservation was cancelled by the admin.';
              const mailOptionsCancel = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: row.email, subject: 'Reservation Cancelled — FoodHub Restaurant', text: `Hi ${row.name || ''},\n\nWe are sorry to inform you that your reservation (ID: ${row.id}) has been cancelled by the admin.\n\nMessage from admin:\n${adminMessage}\n\nIf you have questions, please contact us.` };
              let cancellationEmail = { ok: false, info: 'skipped' };
              if (process.env.DEV_SHOW_OTP === '1') cancellationEmail = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
              else { cancellationEmail = await sendMailAsync(mailOptionsCancel); }
              console.log('[api PUT /api/reservations/:id] cancellation email status:', cancellationEmail);
              return res.json({ success: true, updatedId: id, cancellationEmailSent: cancellationEmail.ok, cancellationEmailInfo: cancellationEmail });
            } catch (e) { console.error('Error sending cancellation email after admin cancel:', e); }
          }

          // If reservation is confirmed and it's Online but not paid, resend confirmation email
          if (row && String(row.status).toLowerCase() === 'confirmed' && String(row.payment_mode).toLowerCase() === 'online' && String(row.payment_status).toLowerCase() !== 'paid') {
            const mailOptions = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: row.email, subject: 'Reservation Confirmed — Payment Pending', text: `Hi ${row.name || ''},\n\nYour reservation (ID: ${row.id}) has been confirmed. Please complete the payment to finalize your booking.\n\nThank you!` };
            let confirmationEmail = { ok: false, info: 'skipped' };
            if (process.env.DEV_SHOW_OTP === '1') confirmationEmail = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
            else {
              try { confirmationEmail = await sendMailAsync(mailOptions); } catch (e) { console.error('Error sending confirmation email after admin confirm:', e); confirmationEmail = { ok: false, error: e && e.message ? e.message : String(e) }; }
            }
            console.log('[api PUT /api/reservations/:id] auto-resend confirmation status:', confirmationEmail);
            return res.json({ success: true, updatedId: id, confirmationEmailSent: confirmationEmail.ok, confirmationEmailInfo: confirmationEmail });
          }
      } catch (e) { console.error('Post-update action error:', e); }
      return res.json({ success: true, updatedId: id });
    });
  });
});

app.delete('/api/reservations/:id', (req, res) => {
  const check = requireAdminKey(req, res);
  if (!check.ok) return res.status(check.code).json({ success: false, message: check.message });
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
  // Archive-then-delete pattern: copy row into archived_reservations then delete
  db.get(`SELECT * FROM reservations WHERE id = ?`, [id], (getErr, row) => {
    if (getErr) { console.error('DB error fetching reservation for archive:', getErr); return res.status(500).json({ success: false, message: 'DB error' }); }
    if (!row) return res.status(404).json({ success: false, message: 'Reservation not found' });

    const params = [row.id, row.name, row.email, row.phone, row.date, row.time, row.people, row.occasion, row.meal_type, row.payment_mode, row.payment_status, row.message, row.status, row.delivery_option, row.menu_items, row.delivery_address, row.delivery_lat, row.delivery_lng, row.created_at, 'archived_via_api_delete'];
    db.run(`INSERT INTO archived_reservations (original_id,name,email,phone,date,time,people,occasion,meal_type,payment_mode,payment_status,message,status,delivery_option,menu_items,delivery_address,delivery_lat,delivery_lng,created_at,archived_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, params, function(insErr) {
      if (insErr) { console.error('DB error inserting archive row:', insErr); return res.status(500).json({ success: false, message: 'DB error' }); }
      // now delete
      db.run(`DELETE FROM reservations WHERE id = ?`, [id], function(delErr) {
        if (delErr) { console.error('DB delete error (api):', delErr); return res.status(500).json({ success: false, message: 'DB error' }); }
        if (this.changes && this.changes > 0) return res.json({ success: true, archivedId: this.lastID, deletedId: id });
        return res.status(500).json({ success: false, message: 'Failed to delete after archive' });
      });
    });
  });
});

// Admin: resend confirmation email for a reservation (protected)
app.post('/api/reservations/:id/resend-confirmation', async (req, res) => {
  const check = requireAdminKey(req, res);
  if (!check.ok) return res.status(check.code).json({ success: false, message: check.message });
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
  db.get(`SELECT * FROM reservations WHERE id = ?`, [id], async (err, row) => {
    if (err) { console.error('DB error fetching reservation for resend:', err); return res.status(500).json({ success: false, message: 'DB error' }); }
    if (!row) return res.status(404).json({ success: false, message: 'Reservation not found' });

    const mailOptions = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: row.email, subject: '✅ Reservation Confirmation — FoodHub Restaurant', text: `Hi ${row.name || ''},\n\nThis is a confirmation for your reservation (ID: ${row.id}).\n\nThank you!` };
    try {
      let confirmationEmail = { ok: false, info: 'skipped' };
      if (process.env.DEV_SHOW_OTP === '1') confirmationEmail = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
      else { confirmationEmail = await sendMailAsync(mailOptions); }
      console.log('[admin resend-confirmation] sent status for id', id, confirmationEmail);
      return res.json({ success: true, reservationId: id, confirmationEmailSent: confirmationEmail.ok, confirmationEmailInfo: confirmationEmail });
    } catch (e) {
      console.error('Error sending confirmation email (admin resend):', e);
      return res.status(500).json({ success: false, message: 'Failed to send email', error: e && e.message ? e.message : String(e) });
    }
  });
});

// Payment confirmation webhook / endpoint
// Marks a reservation as paid and sends the final confirmation email to the customer.
app.post('/payment/confirm', (req, res) => {
  try {
    const { reservationId, amount, paymentProvider, transactionId } = req.body;
    if (!reservationId) return res.status(400).json({ success: false, message: 'reservationId required' });
    const id = Number(reservationId);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid reservationId' });

    db.get(`SELECT * FROM reservations WHERE id = ?`, [id], async (err, row) => {
      if (err) { console.error('DB error fetching reservation for payment confirm:', err); return res.status(500).json({ success: false, message: 'DB error' }); }
      if (!row) return res.status(404).json({ success: false, message: 'Reservation not found' });

      if (String(row.payment_status).toLowerCase() === 'paid') {
        // Reservation already marked as paid — resend confirmation email (idempotent)
        try {
          const mailOptionsAlready = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: row.email, subject: '✅ Payment Received — Reservation Confirmed', text: `Hi ${row.name || ''},\n\nWe have already received your payment. Your reservation is confirmed. Reservation ID: ${id}${transactionId ? `\nTransaction: ${transactionId}` : ''}\n\nThank you!` };
          let confirmationEmailAlready = { ok: false, info: 'skipped' };
          if (process.env.DEV_SHOW_OTP === '1') confirmationEmailAlready = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
          else {
            try { confirmationEmailAlready = await sendMailAsync(mailOptionsAlready); } catch (e) { console.error('Error re-sending confirmation email for already-paid reservation:', e); confirmationEmailAlready = { ok: false, error: e && e.message ? e.message : String(e) }; }
          }
          console.log('[payment/confirm] reservation already paid - resend status:', confirmationEmailAlready);
          return res.json({ success: true, message: 'Reservation already marked as paid', reservationId: id, confirmationEmailSent: confirmationEmailAlready.ok, confirmationEmailInfo: confirmationEmailAlready });
        } catch (e) {
          console.error('Error while attempting to resend confirmation for already-paid reservation:', e);
          return res.json({ success: true, message: 'Reservation already marked as paid', reservationId: id, confirmationEmailSent: false, confirmationEmailInfo: { ok: false, error: String(e) } });
        }
      }

      // Update payment_status and status to confirmed
      db.run(`UPDATE reservations SET payment_status = ?, status = ? WHERE id = ?`, ['paid', 'confirmed', id], async function(updateErr) {
        if (updateErr) { console.error('DB update error on payment confirm:', updateErr); return res.status(500).json({ success: false, message: 'Failed to update reservation' }); }

        // Send confirmation email
        const mailOptions = { from: `"FoodHub Restaurant" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`, to: row.email, subject: '✅ Payment Received — Reservation Confirmed', text: `Hi ${row.name || ''},\n\nWe have received your payment${amount ? ` of ${amount}` : ''}. Your reservation is confirmed. Reservation ID: ${id}${transactionId ? `\nTransaction: ${transactionId}` : ''}\n\nThank you!` };

        let confirmationEmail = { ok: false, info: 'skipped' };
        if (process.env.DEV_SHOW_OTP === '1') confirmationEmail = { ok: false, info: 'DEV_SHOW_OTP=1 - skipped send' };
        else {
          try { confirmationEmail = await sendMailAsync(mailOptions); } catch (e) { console.error('Error sending payment confirmation email:', e); confirmationEmail = { ok: false, error: e && e.message ? e.message : String(e) }; }
        }

        return res.json({ success: true, reservationId: id, confirmationEmailSent: confirmationEmail.ok, confirmationEmailInfo: confirmationEmail });
      });
    });
  } catch (e) { console.error('Payment confirm error:', e); return res.status(500).json({ success: false, message: 'Internal server error' }); }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('reservations.db', (err) => { if (err) { console.error('DB open error', err); process.exit(1); } });

// Print the most recent OTP row (id, email, phone, otp (hash), expires_at)
db.serialize(() => {
  db.get(`SELECT id, email, phone, otp, expires_at FROM otps ORDER BY id DESC LIMIT 1`, [], (err, row) => {
    if (err) { console.error('Query error', err); process.exit(1); }
    if (!row) {
      console.log('No otps rows found');
      process.exit(0);
    }
    // Redact email/phone partially for privacy
    const redactedEmail = row.email ? row.email.replace(/(.{2})(.*)(@.*)/, (m, a, b, c) => a + '***' + c) : null;
    const redactedPhone = row.phone ? row.phone.replace(/.(?=.{4})/g, '*') : null;
    console.log(JSON.stringify({ id: row.id, email: redactedEmail, phone: redactedPhone, otp_hash: row.otp, expires_at: row.expires_at }, null, 2));
    process.exit(0);
  });
});

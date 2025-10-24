const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('reservations.db', (err) => { if (err) return console.error('DB open error', err.message); });

db.serialize(() => {
  db.all(`SELECT id, email, phone, otp, expires_at, created_at FROM otps ORDER BY id DESC LIMIT 10`, (err, rows) => {
    if (err) {
      console.error('Query error', err.message);
      process.exit(1);
    }
    if (!rows || rows.length === 0) {
      console.log('No OTP rows found');
      process.exit(0);
    }
    console.log('Last OTP rows:');
    rows.forEach(r => {
      console.log(`ID:${r.id} email:${r.email} phone:${r.phone} otp:${r.otp} expires:${r.expires_at} created:${r.created_at}`);
    });
    process.exit(0);
  });
});

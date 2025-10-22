const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'reservations.db');
const backupPath = path.join(__dirname, '..', `reservations-backup-${Date.now()}.db`);

// Make a backup copy first
fs.copyFileSync(dbPath, backupPath);
console.log('Backup created at', backupPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Failed to open DB', err.message);
});

const patterns = ['%@test.com%', '%@example.com%', '%CurrentTime%'];

db.serialize(() => {
  patterns.forEach((pat) => {
    db.run(`DELETE FROM reservations WHERE email LIKE ? OR name LIKE ?`, [pat, pat], function(err) {
      if (err) return console.error('Delete error', err.message);
      console.log(`Deleted ${this.changes} rows for pattern ${pat}`);
    });
  });
});

setTimeout(() => db.close(() => console.log('DB closed')), 800);

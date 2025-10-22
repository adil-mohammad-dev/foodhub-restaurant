const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'reservations.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error('Failed to open DB', err.message);
});

const patterns = ['%@test.com%', '%@example.com%', '%CurrentTime%'];

console.log('Inspecting DB for demo/test reservations...');

db.serialize(() => {
  patterns.forEach((pat) => {
    db.all(`SELECT * FROM reservations WHERE email LIKE ? OR name LIKE ? LIMIT 100`, [pat, pat], (err, rows) => {
      if (err) return console.error('Query error', err.message);
      if (rows && rows.length) {
        console.log(`\nMatches for pattern "${pat}":`);
        rows.forEach(r => console.log(JSON.stringify(r)));
      } else {
        console.log(`\nNo matches for pattern "${pat}".`);
      }
    });
  });
});

setTimeout(() => db.close(), 600);
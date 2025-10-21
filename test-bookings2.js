const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./reservations.db');

db.all(`SELECT COUNT(*) as count FROM reservations 
        WHERE date='2025-11-01' AND time='18:00' 
        AND delivery_option='Dine-in'`, 
  (err, rows) => {
    if (err) console.error(err);
    else console.log('Bookings for Nov 1 at 6 PM:', rows);
    db.close();
  }
);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./reservations.db');

db.all(`SELECT id, name, date, time, delivery_option FROM reservations 
        WHERE date='2025-12-01' AND time='20:00' 
        AND delivery_option='Dine-in'
        ORDER BY id`, 
  (err, rows) => {
    if (err) console.error(err);
    else {
      console.log(`\nTotal bookings for Dec 1 at 8 PM: ${rows.length}\n`);
      rows.forEach(row => console.log(`ID: ${row.id}, Name: ${row.name}`));
    }
    db.close();
  }
);

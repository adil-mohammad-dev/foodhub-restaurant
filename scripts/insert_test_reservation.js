const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('reservations.db');
const now = new Date().toISOString();
const stmt = `INSERT INTO reservations (name,email,phone,date,time,people,occasion,meal_type,message,payment_mode,payment_status,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
const params = ['Headless Test','headless@example.com','9999999999','2025-10-30','19:00',2,'Test','Dinner','Test message','Cash','not_required','pending', now];

db.run(stmt, params, function(err) {
  if (err) return console.error('Insert error', err);
  console.log('Inserted reservation id', this.lastID);
  db.close();
});

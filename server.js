const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "assets"))); // CSS/JS
app.use(express.static(__dirname)); // HTML files

// Database setup
const db = new sqlite3.Database("reservations.db", (err) => {
  if (err) console.error("❌ Error opening database:", err);
  else console.log("✅ Connected to SQLite database.");
});

// Create table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      date TEXT,
      time TEXT,
      people INTEGER,
      occasion TEXT,
      meal_type TEXT,
      payment_mode TEXT DEFAULT 'Cash',
      payment_status TEXT DEFAULT 'pending',
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add payment columns if they don't exist (for existing databases)
  db.run(`ALTER TABLE reservations ADD COLUMN payment_mode TEXT DEFAULT 'Cash'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: payment_mode column already exists or error:', err.message);
    }
  });
  
  db.run(`ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'pending'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: payment_status column already exists or error:', err.message);
    }
  });
  
  db.run(`ALTER TABLE reservations ADD COLUMN status TEXT DEFAULT 'pending'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: status column already exists or error:', err.message);
    }
  });
});

// Admin API key
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "admin123";

// -------------------
// API ROUTES
// -------------------

// Get all reservations
app.get("/api/reservations", (req, res) => {
  const key = req.headers["x-api-key"];
  if (key !== ADMIN_API_KEY)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  db.all(`SELECT * FROM reservations ORDER BY date, time, id`, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Failed to fetch reservations" });
    res.json({ success: true, count: rows.length, reservations: rows });
  });
});

// Update reservation
app.put("/api/reservations/:id", (req, res) => {
  const key = req.headers["x-api-key"];
  if (key !== ADMIN_API_KEY)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const id = req.params.id;
  const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status } = req.body;

  const query = `UPDATE reservations
    SET name=?, email=?, phone=?, date=?, time=?, people=?, occasion=?, meal_type=?, message=?, payment_mode=?, payment_status=?, status=?
    WHERE id=?`;

  db.run(query, [name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status, id], function (err) {
    if (err) return res.status(500).json({ success: false, message: "Failed to update reservation" });
    res.json({ success: true, message: "Reservation updated" });
  });
});

// Delete reservation
app.delete("/api/reservations/:id", (req, res) => {
  const key = req.headers["x-api-key"];
  if (key !== ADMIN_API_KEY)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const id = req.params.id;
  db.run(`DELETE FROM reservations WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ success: false, message: "Failed to delete reservation" });
    res.json({ success: true, message: "Reservation deleted" });
  });
});

// Save new reservation (user-facing)
app.post("/reserve", (req, res) => {
  const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode } = req.body;
  
  console.log('Received reservation:', { name, email, phone, date, time, people, occasion, meal_type, payment_mode });
  
  if (!name || !email || !phone || !date || !time || !people || !payment_mode) {
    console.log('Missing required fields');
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const payment_status = payment_mode === "Cash" ? "not_required" : "pending";

  db.run(`INSERT INTO reservations (name,email,phone,date,time,people,occasion,meal_type,message,payment_mode,payment_status)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: "Failed to save reservation: " + err.message });
      }
      console.log('Reservation saved successfully with ID:', this.lastID);
      res.json({ success: true, reservationId: this.lastID });
    });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

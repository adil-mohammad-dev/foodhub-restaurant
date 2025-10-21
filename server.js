/**
 * FoodHub Restaurant - Backend Server
 * Author: Mohammad Adil
 * Description: Node.js + Express server for restaurant reservation and online ordering system
 * Features: Table booking with overlap detection, IST validation, email notifications
 */

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
      delivery_option TEXT DEFAULT 'Dine-in',
      menu_items TEXT,
      delivery_address TEXT,
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
  
  // Add new columns for delivery and menu items
  db.run(`ALTER TABLE reservations ADD COLUMN delivery_option TEXT DEFAULT 'Dine-in'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: delivery_option column already exists or error:', err.message);
    }
  });
  
  db.run(`ALTER TABLE reservations ADD COLUMN menu_items TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: menu_items column already exists or error:', err.message);
    }
  });
  
  db.run(`ALTER TABLE reservations ADD COLUMN delivery_address TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: delivery_address column already exists or error:', err.message);
    }
  });

  // Add latitude and longitude columns for delivery location
  db.run(`ALTER TABLE reservations ADD COLUMN delivery_lat REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: delivery_lat column already exists or error:', err.message);
    }
  });

  db.run(`ALTER TABLE reservations ADD COLUMN delivery_lng REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Note: delivery_lng column already exists or error:', err.message);
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
  const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status, delivery_option, menu_items, delivery_address } = req.body;

  const query = `UPDATE reservations
    SET name=?, email=?, phone=?, date=?, time=?, people=?, occasion=?, meal_type=?, message=?, payment_mode=?, payment_status=?, status=?, delivery_option=?, menu_items=?, delivery_address=?
    WHERE id=?`;

  db.run(query, [name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status, delivery_option, menu_items, delivery_address, id], function (err) {
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
  const { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, delivery_option, menu_items, delivery_address } = req.body;
  
  console.log('Received reservation:', { name, email, phone, date, time, people, occasion, meal_type, payment_mode, delivery_option, menu_items, delivery_address });
  
  if (!name || !email || !phone || !date || !time || !people || !payment_mode) {
    console.log('Missing required fields');
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  // Validate delivery address if delivery option is selected
  if (delivery_option === 'Delivery' && !delivery_address) {
    return res.status(400).json({ success: false, message: "Delivery address is required for delivery orders." });
  }

  // Validate date and time - must be advance booking (at least 2 hours from now)
  // Use Indian Standard Time (IST) - UTC+5:30
  
  // Get current time in IST
  const nowUTC = new Date();
  const currentDateTimeIST = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // Calculate minimum advance booking time (2 hours from now, minus 1 minute buffer)
  const minAdvanceBookingTime = new Date(currentDateTimeIST.getTime() + (2 * 60 * 60 * 1000) - (1 * 60 * 1000)); // 2 hours - 1 min buffer
  
  // Parse reservation date/time in IST
  const reservationDateTime = new Date(`${date}T${time}:00`);
  
  console.log('🕒 Current IST time:', currentDateTimeIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('🕒 Minimum booking time:', minAdvanceBookingTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('🕒 Requested booking time:', reservationDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  // Check if booking is in the past
  if (reservationDateTime < currentDateTimeIST) {
    console.log('Invalid reservation time: Past date/time not allowed (IST)');
    return res.status(400).json({ 
      success: false, 
      message: "Cannot book a reservation in the past. Please select a future date and time (Indian Standard Time)." 
    });
  }
  
  // Check if booking meets minimum advance time (2 hours)
  if (reservationDateTime < minAdvanceBookingTime) {
    console.log('Invalid reservation time: Less than 2 hours advance notice');
    const requiredTime = minAdvanceBookingTime.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return res.status(400).json({ 
      success: false, 
      message: `Advance booking required. Please book at least 2 hours in advance. Earliest available time: ${requiredTime}` 
    });
  }

  // Check for table availability - only for Dine-in (table reservations)
  // Restaurant has 10 tables total. Each reservation lasts ~2 hours.
  // Need to check overlapping time slots (±2 hours)
  console.log('🔍 DEBUG: Checking table availability for delivery_option:', delivery_option);
  console.log('🔍 DEBUG: Date:', date, 'Time:', time);
  
  if (delivery_option === 'Dine-in' || !delivery_option) {
    console.log('✅ DEBUG: Entering table availability check for Dine-in');
    
    // Parse the requested time to calculate overlap window
    const [hours, minutes] = time.split(':').map(Number);
    const requestedTime = hours * 60 + minutes; // Convert to minutes since midnight
    
    // Check for overlapping reservations (2 hours = 120 minutes before and after)
    const overlapWindow = 120; // minutes
    
    // Get all reservations for the same date
    db.all(
      `SELECT time FROM reservations 
       WHERE date = ? 
       AND (delivery_option = 'Dine-in' OR delivery_option IS NULL)
       AND status != 'cancelled'`,
      [date],
      (err, rows) => {
        if (err) {
          console.error('❌ Error checking for table availability:', err);
          return res.status(500).json({ success: false, message: "Error checking availability." });
        }

        console.log(`📊 DEBUG: Found ${rows.length} existing reservations on ${date}`);
        
        // Count tables occupied during the requested time slot
        let tablesOccupied = 0;
        rows.forEach(reservation => {
          const [resHours, resMinutes] = reservation.time.split(':').map(Number);
          const resTime = resHours * 60 + resMinutes;
          
          // Check if this reservation overlaps with requested time
          // A reservation overlaps if it's within 2 hours before or after
          const timeDiff = Math.abs(requestedTime - resTime);
          if (timeDiff < overlapWindow) {
            tablesOccupied++;
            console.log(`   ⏰ Overlapping: ${reservation.time} (${timeDiff} minutes apart)`);
          }
        });
        
        const totalTables = 10; // Total tables in restaurant
        console.log(`📊 DEBUG: Tables occupied during ${time}: ${tablesOccupied}/${totalTables}`);
        
        if (tablesOccupied >= totalTables) {
          console.log(`🚫 REJECTING: All tables occupied - ${tablesOccupied} tables already booked around ${time} on ${date}`);
          return res.status(400).json({ 
            success: false, 
            message: `Sorry, all tables are occupied around ${time} on ${date}. Please choose a different time slot (at least 2 hours apart from existing bookings).` 
          });
        }

        console.log(`✅ DEBUG: Tables available (${totalTables - tablesOccupied} free), proceeding with booking`);
        // If available, proceed with booking
        saveReservation();
      }
    );
  } else {
    console.log('📦 DEBUG: Delivery/Takeaway order - skipping table availability check');
    // For Delivery and Takeaway, proceed directly (no table limits)
    saveReservation();
  }

  function saveReservation() {
    const payment_status = payment_mode === "Cash" ? "not_required" : "pending";
    const finalDeliveryOption = delivery_option || 'Dine-in';
    const menuItemsStr = menu_items ? JSON.stringify(menu_items) : null;
    const google_maps_link = req.body.google_maps_link || null;

    db.run(`INSERT INTO reservations (name,email,phone,date,time,people,occasion,meal_type,message,payment_mode,payment_status,delivery_option,menu_items,delivery_address)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, finalDeliveryOption, menuItemsStr, delivery_address],
      function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: "Failed to save reservation: " + err.message });
      }
      
      const reservationId = this.lastID;
      console.log('Reservation saved successfully with ID:', reservationId);
      
      // Parse menu items for email display
      let menuItemsDisplay = '';
      if (menu_items) {
        const items = typeof menu_items === 'string' ? JSON.parse(menu_items) : menu_items;
        if (Array.isArray(items) && items.length > 0) {
          menuItemsDisplay = `
            <div class="detail-row">
              <span class="label">🍽️ Menu Items:</span>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${items.map(item => `<li>${item.name} - Quantity: ${item.quantity}${item.price ? ` - $${item.price}` : ''}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      }
      
      // Send confirmation email to user
      const mailOptions = {
        from: `"FoodHub Restaurant" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "✅ Table Reservation Confirmed - FoodHub Restaurant",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #cda45e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .reservation-details { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #cda45e; }
              .detail-row { margin: 10px 0; }
              .label { font-weight: bold; color: #555; }
              .value { color: #333; }
              .footer { background-color: #1a1814; color: white; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; }
              .success-icon { font-size: 48px; color: #28a745; text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍽️ FoodHub Restaurant</h1>
              </div>
              <div class="content">
                <div class="success-icon">✅</div>
                <h2 style="text-align: center; color: #cda45e;">Table Reserved Successfully!</h2>
                <p>Dear <strong>${name}</strong>,</p>
                <p>Thank you for choosing FoodHub Restaurant! We are delighted to confirm your table reservation.</p>
                
                <div class="reservation-details">
                  <h3 style="color: #cda45e; margin-top: 0;">Reservation Details:</h3>
                  <div class="detail-row">
                    <span class="label">Reservation ID:</span> <span class="value">#${reservationId}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🛵 Service Type:</span> <span class="value">${finalDeliveryOption}</span>
                  </div>
                  ${finalDeliveryOption === 'Delivery' && delivery_address ? `
                  <div class="detail-row">
                    <span class="label">📍 Delivery Address:</span> <span class="value">${delivery_address}</span>
                  </div>
                  ${google_maps_link ? `
                  <div class="detail-row">
                    <span class="label">🗺️ View Location:</span> 
                    <a href="${google_maps_link}" target="_blank" style="color: #cda45e; text-decoration: none;">
                      📍 Open in Google Maps
                    </a>
                  </div>` : ''}` : ''}
                  <div class="detail-row">
                    <span class="label">� Date:</span> <span class="value">${date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🕐 Time:</span> <span class="value">${time}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">👥 Number of Guests:</span> <span class="value">${people}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🍽️ Meal Type:</span> <span class="value">${meal_type || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🎉 Occasion:</span> <span class="value">${occasion || 'N/A'}</span>
                  </div>
                  ${menuItemsDisplay}
                  <div class="detail-row">
                    <span class="label">💳 Payment Mode:</span> <span class="value">${payment_mode}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📧 Email:</span> <span class="value">${email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📞 Phone:</span> <span class="value">${phone}</span>
                  </div>
                  ${message ? `<div class="detail-row"><span class="label">💬 Special Requests:</span> <span class="value">${message}</span></div>` : ''}
                </div>

                <p style="margin-top: 20px;"><strong>Important Information:</strong></p>
                <ul>
                  ${finalDeliveryOption === 'Dine-in' ? '<li>Please arrive 10 minutes before your reservation time</li>' : ''}
                  ${finalDeliveryOption === 'Delivery' ? '<li>Your order will be delivered to the address provided</li>' : ''}
                  ${finalDeliveryOption === 'Takeaway' ? '<li>Please arrive at the specified time to collect your order</li>' : ''}
                  <li>If you need to cancel or modify your ${finalDeliveryOption === 'Dine-in' ? 'reservation' : 'order'}, please contact us at least 2 hours in advance</li>
                  ${finalDeliveryOption === 'Dine-in' ? '<li>Your table will be held for 15 minutes past your reservation time</li>' : ''}
                  ${payment_mode === 'Online' ? '<li>⚠️ Payment confirmation pending. Please complete the payment process.</li>' : ''}
                </ul>

                <p>We look forward to serving you an unforgettable dining experience!</p>
                
                <p style="margin-top: 30px;">Best regards,<br><strong>FoodHub Restaurant Team</strong></p>
              </div>
              <div class="footer">
                <p style="margin: 5px 0;">📍 123 Restaurant Street, Food City</p>
                <p style="margin: 5px 0;">📞 Contact: +1 234 567 8900</p>
                <p style="margin: 5px 0;">📧 Email: ${process.env.EMAIL_USER}</p>
                <p style="margin: 5px 0; font-size: 12px; color: #999;">© 2025 FoodHub Restaurant. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending confirmation email:', error);
          // Still send success response even if email fails
          return res.json({ 
            success: true, 
            reservationId: reservationId,
            emailSent: false,
            message: "Reservation confirmed but email notification failed"
          });
        }
        console.log('Confirmation email sent:', info.response);
        res.json({ 
          success: true, 
          reservationId: reservationId,
          emailSent: true,
          message: "Reservation confirmed and confirmation email sent"
        });
      });
    });
  } // End of saveReservation function
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

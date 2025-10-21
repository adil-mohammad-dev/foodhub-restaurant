<div align="center">

# 🍽️ FoodHub Restaurant Management System

### *Intelligent Table Reservations & Online Ordering Platform*

[![Author](https://img.shields.io/badge/Author-Mohammad%20Adil-blue?style=for-the-badge)](https://github.com/adil-mohammad-dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-FF6B6B?style=for-the-badge)](https://foodhub-restaurant.onrender.com)

**A comprehensive web-based restaurant management system featuring smart table capacity management, advance booking, and automated customer notifications**

[🌐 Live Demo](https://foodhub-restaurant.onrender.com) • [📖 Documentation](#documentation) • [🚀 Features](#-key-features) • [💻 Tech Stack](#-technology-stack)

---

</div>

## 👨‍💻 Author
**Mohammad Adil** - *Full Stack Developer*

[![GitHub](https://img.shields.io/badge/GitHub-adil--mohammad--dev-181717?style=flat&logo=github)](https://github.com/adil-mohammad-dev)

---

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Deployment](#-deployment)
- [Database Schema](#-database-schema)
- [Business Logic](#-business-logic)
- [Use Cases](#-use-cases)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 📋 Project Overview

FoodHub is a modern restaurant management platform that streamlines table reservations and online food ordering. The system features intelligent table management, advance booking requirements, Indian Standard Time validation, and automated email confirmations.

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🪑 Smart Table Reservation
- ⏰ **2-Hour Advance Booking** - No walk-ins
- 🔢 **10-Table Capacity** - Intelligent management
- ⏳ **Overlap Detection** - 2-hour dining duration
- 📅 **Unlimited Future Booking** - Plan months ahead
- 🇮🇳 **IST Time Validation** - Indian Standard Time

</td>
<td width="50%">

### 🛵 Online Ordering System
- � **Delivery & Takeaway** - Separate workflows
- 🍛 **12-Item Menu** - Pre-configured with prices
- ☑️ **Easy Selection** - Checkbox + quantity
- 🏠 **Structured Address** - 6 separate fields
- 📍 **Google Maps** - Optional location sharing

</td>
</tr>
<tr>
<td width="50%">

### 📧 Automation & Notifications
- ✉️ **Instant Email Confirmation** - HTML templates
- 🎨 **Professional Branding** - Customized design
- 📋 **Complete Details** - All booking info
- � **Real-time Updates** - Status changes

</td>
<td width="50%">

### 👨‍💼 Admin Dashboard
- � **View All Reservations** - Centralized panel
- ✅ **Status Management** - Pending/Confirmed/Cancelled
- � **Payment Tracking** - Cash vs Online
- 🔐 **Secure Access** - API key authentication

</td>
</tr>
</table>

---

## 🛠️ Technology Stack

<div align="center">

### Backend Technologies
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

### Frontend Technologies
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

### Tools & Services
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Gmail](https://img.shields.io/badge/Gmail_SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white)

</div>

### Detailed Stack

**Backend:**
- **Node.js** v18+ - JavaScript runtime
- **Express** v5.1.0 - Web application framework
- **SQLite3** v5.1.7 - Embedded database
- **Nodemailer** v7.0.9 - Email service integration
- **dotenv** v17.2.3 - Environment configuration

**Frontend:**
- **HTML5** / **CSS3** / **JavaScript** - Core technologies
- **Bootstrap** v5.3.3 - Responsive UI framework
- **AOS** - Animate On Scroll library
- **GLightbox** - Lightbox image gallery
- **Swiper** - Touch slider component
- **Bootstrap Icons** - Icon library

**Development & Deployment:**
- **Git** - Version control
- **GitHub** - Code repository
- **Render.com** - Cloud hosting platform
- **VS Code** - Development environment

---

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (Node Package Manager)
- Gmail account (for email notifications)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/adil-mohammad-dev/foodhub-restaurant.git

# 2. Navigate to project directory
cd foodhub-restaurant

# 3. Install dependencies
npm install

# 4. Create environment variables file
# Create a .env file in the root directory with:
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_API_KEY=your-secret-admin-key

# 5. Start the server
npm start

# 6. Open your browser
# Visit: http://localhost:3000
```

### Getting Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords section
4. Generate a new app password for "Mail"
5. Use this password in your `.env` file

---

## 🚀 Deployment

### Live Production Site
**URL:** https://foodhub-restaurant.onrender.com

### Deployment Platform: Render.com

#### Steps to Deploy:
1. Push code to GitHub repository
2. Connect Render to your GitHub account
3. Create a new Web Service
4. Select `foodhub-restaurant` repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Add EMAIL_USER, EMAIL_PASS, ADMIN_API_KEY
6. Deploy! 🎉

#### Auto-Deploy
- Every push to `main` branch triggers automatic redeployment
- Build time: ~2-3 minutes
- Cold start (free tier): ~30 seconds

---

## 📊 Database Schema

### reservations Table
```sql
- id (PRIMARY KEY)
- name, email, phone
- date, time, people
- occasion, meal_type
- delivery_option, menu_items, delivery_address
- payment_mode, payment_status
- status, created_at
```

## 🔒 Business Logic

### Validation Rules
1. ✅ Minimum 2 hours advance booking required
2. ✅ Maximum 10 tables per overlapping 2-hour window
3. ✅ Indian Standard Time (IST) for all date/time checks
4. ✅ Delivery address required for delivery orders
5. ✅ Past bookings automatically rejected

### Error Messages
- "Advance booking required. Please book at least 2 hours in advance"
- "Sorry, all tables are occupied around [time] on [date]"
- "Cannot book a reservation in the past (Indian Standard Time)"

## 📁 Project Structure

```
foodhub-restaurant/
├── server.js                 # Main backend server
├── index.html               # Home page with dine-in reservation
├── order.html               # Online ordering page
├── Admin.html               # Admin dashboard
├── reservations.html        # Simple reservation form
├── payment.html             # Payment page
├── package.json             # Dependencies
├── .env                     # Environment variables
├── reservations.db          # SQLite database
├── assets/
│   ├── css/
│   │   └── main.css        # Main stylesheet
│   ├── js/
│   │   ├── main.js         # Main JavaScript
│   │   ├── reservation.js  # Reservation form handler
│   │   ├── order.js        # Order form handler
│   │   └── reservations-list.js  # Admin list handler
│   ├── img/                # Images and icons
│   └── vendor/             # Third-party libraries
└── forms/                   # PHP form handlers (legacy)
```

## 🎯 Use Cases

### � Scenario 1: Birthday Party Booking
```
Customer wants to book a table for 8 people on Dec 25, 2025
→ Books 2 months in advance at 7:00 PM
→ System validates: ✅ Future date, ✅ 2+ hours advance
→ Instant email confirmation sent with reservation ID
→ Restaurant has ample time for special arrangements
```

### 🍽️ Scenario 2: Friday Night Rush (Capacity Management)
```
Current bookings: 10 tables reserved for 7:00 PM
→ 11th customer tries to book at 7:30 PM
→ System checks: Tables occupied 7:00-9:00 PM (overlap)
→ Rejects booking: ❌ "All tables occupied around 7:30 PM"
→ Suggests: "Please book at 9:00 PM or later"
```

### 🛵 Scenario 3: Online Food Delivery
```
Customer wants home delivery
→ Tries to order immediately
→ System rejects: ❌ "Advance booking required (2 hours)"
→ Customer books for 2 hours later
→ Selects 5 menu items with quantities
→ Provides structured address + Google Maps link
→ Kitchen receives order with full details
```

### 🏢 Scenario 4: Corporate Lunch Takeaway
```
Office orders 20 items for pickup at 1:00 PM
→ Books at 11:00 AM (2 hours advance)
→ No table capacity check (takeaway)
→ Kitchen receives 2-hour prep time
→ Order ready for pickup at 1:00 PM
```

---

## 🌟 Key Highlights

<div align="center">

| Feature | Description | Status |
|---------|-------------|--------|
| 🚫 Zero Overbooking | Mathematical guarantee via overlap detection | ✅ Active |
| 📧 100% Email Delivery | Nodemailer with error handling | ✅ Active |
| ⏰ 2-Hour Lead Time | Enforced for all bookings | ✅ Active |
| 🇮🇳 IST Accuracy | Timezone-safe regardless of location | ✅ Active |
| 📱 Mobile Responsive | Works on all devices | ✅ Active |

</div>

---

## 📝 License

MIT License - Free to use and modify

Copyright (c) 2025 Mohammad Adil

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check [issues page](https://github.com/adil-mohammad-dev/foodhub-restaurant/issues) if you want to contribute.

### How to Contribute:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact

<div align="center">

### Mohammad Adil

[![GitHub](https://img.shields.io/badge/GitHub-adil--mohammad--dev-181717?style=for-the-badge&logo=github)](https://github.com/adil-mohammad-dev)
[![Email](https://img.shields.io/badge/Email-info@foodhub.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:info@foodhub.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com)

**Project Link:** [https://github.com/adil-mohammad-dev/foodhub-restaurant](https://github.com/adil-mohammad-dev/foodhub-restaurant)

**Live Demo:** [https://foodhub-restaurant.onrender.com](https://foodhub-restaurant.onrender.com)

</div>

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ for the restaurant industry**

© 2025 Mohammad Adil | FoodHub Restaurant Management System

</div>

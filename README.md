# 🍽️ FoodHub Restaurant

**A comprehensive web-based restaurant management system for table reservations and online ordering**

---

## 👨‍💻 Author
**Mohammad Adil**

## 📋 Project Overview

FoodHub is a modern restaurant management platform that streamlines table reservations and online food ordering. The system features intelligent table management, advance booking requirements, Indian Standard Time validation, and automated email confirmations.

## ✨ Key Features

### Table Reservation System
- ⏰ **Advance Booking Required**: Minimum 2 hours notice
- 🪑 **10 Tables Total**: Intelligent overlap detection for optimal capacity management
- 🕐 **2-Hour Dining Duration**: Prevents overbooking with time slot overlap checking
- 📅 **Long-Term Bookings**: Support for events/birthdays months in advance
- 🇮🇳 **IST Validation**: All time checks based on Indian Standard Time

### Online Ordering
- 🛵 **Delivery & Takeaway**: Separate ordering interface
- 🍛 **12-Item Menu**: Pre-configured menu with prices
- ☑️ **Checkbox Selection**: Easy menu browsing with quantity inputs
- 🏠 **Structured Address**: 6 separate fields for accurate delivery
- 📍 **Google Maps Integration**: Optional location sharing

### Admin Features
- 📊 **Dashboard**: View all reservations and orders
- ✅ **Status Management**: Track pending/confirmed/cancelled bookings
- 💰 **Payment Tracking**: Monitor Cash vs Online payments

### Automation
- 📧 **Email Notifications**: Instant confirmation emails
- 🎨 **HTML Templates**: Professional branded emails
- 📋 **Complete Details**: Reservation info, menu items, delivery address

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express** v5.1.0
- **SQLite3** v5.1.7
- **Nodemailer** v7.0.9
- **dotenv** v17.2.3

### Frontend
- **HTML5** / **CSS3** / **JavaScript**
- **Bootstrap** v5.3.3
- **AOS** (Animate On Scroll)
- **GLightbox** (Image gallery)
- **Swiper** (Touch slider)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/adil-mohammad-dev/foodhub-restaurant.git

# Navigate to project directory
cd foodhub-restaurant

# Install dependencies
npm install

# Create .env file with your credentials
# EMAIL_USER=your-gmail@gmail.com
# EMAIL_PASS=your-app-password
# ADMIN_API_KEY=your-secret-key

# Start the server
npm start
```

## 🚀 Deployment

The application is deployed on **Render.com**:
- Production URL: https://foodhub-restaurant.onrender.com
- GitHub Repository: adil-mohammad-dev/foodhub-restaurant

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

- 🍽️ **Daily Operations**: Regular lunch/dinner reservations
- 🎂 **Special Events**: Birthdays, anniversaries, parties
- 🏠 **Home Delivery**: Online food ordering with structured address
- 📊 **Capacity Management**: Prevent overbooking with intelligent table tracking
- 📧 **Customer Service**: Automated confirmations reduce phone inquiries

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Contact

**Mohammad Adil**
- GitHub: [@adil-mohammad-dev](https://github.com/adil-mohammad-dev)
- Email: info@foodhub.com

---

**Made with ❤️ for the restaurant industry**

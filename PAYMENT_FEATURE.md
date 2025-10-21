# Payment Feature Documentation

## Overview
Added payment functionality to the FoodHub Restaurant reservation system with two payment options:
1. **Pay Online (Advance)** - Redirects to payment gateway for advance booking
2. **Pay at Restaurant** - Cash payment option upon arrival

## Features Added

### 1. Payment Mode Selection
- Added dropdown in reservation form with two options:
  - **Online Payment**: ₹500 advance booking fee
  - **Cash Payment**: Pay at restaurant (no advance required)

### 2. Payment Gateway Page (`payment.html`)
- Beautiful, modern UI with gradient design
- Multiple payment method options:
  - UPI (Google Pay, PhonePe, Paytm)
  - Credit/Debit Card (Visa, Mastercard, RuPay)
  - Net Banking
- Displays reservation ID and amount
- Secure payment processing simulation
- Mobile responsive design

### 3. Database Updates
Added new fields to reservations table:
- `payment_mode` - Stores "Online" or "Cash"
- `payment_status` - Tracks payment status:
  - `pending` - Payment not completed
  - `completed` - Payment successful
  - `not_required` - Cash payment (no advance needed)

### 4. Admin Panel Updates
Enhanced admin dashboard to show:
- Payment Mode column
- Payment Status column with dropdown to update
- Full tracking of payment information

### 5. Workflow

#### Online Payment Flow:
1. User fills reservation form
2. Selects "Pay Online (Advance)"
3. Clicks "Reserve my Table"
4. System saves reservation with status "pending"
5. Redirects to payment page with reservation ID
6. User selects payment method (UPI/Card/NetBanking)
7. Completes payment
8. Receives confirmation
9. Redirects back to home page

#### Cash Payment Flow:
1. User fills reservation form
2. Selects "Pay at Restaurant"
3. Clicks "Reserve my Table"
4. System saves reservation with payment_status "not_required"
5. Shows success message
6. User pays cash upon arrival

## Files Modified

### Frontend Files:
- `index.html` - Added payment mode dropdown
- `assets/js/reservation.js` - Added payment logic and redirect
- `assets/js/reservations-list.js` - Updated admin panel for payment fields
- `payment.html` - **NEW** - Payment gateway page

### Backend Files:
- `server.js` - Updated database schema and API endpoints

## Testing Instructions

1. **Start the server**:
   ```bash
   node server.js
   ```

2. **Test Online Payment**:
   - Go to http://localhost:3000
   - Fill the reservation form
   - Select "Pay Online (Advance)" from Payment Mode
   - Submit form
   - Verify redirect to payment page
   - Complete mock payment

3. **Test Cash Payment**:
   - Fill the reservation form
   - Select "Pay at Restaurant"
   - Submit form
   - Verify success message (no redirect)

4. **Test Admin Panel**:
   - Go to http://localhost:3000/Admin.html
   - Enter API key
   - Verify payment columns display correctly
   - Update payment status
   - Save changes

## Integration Notes

### For Real Payment Gateway:
To integrate with actual payment gateways (Razorpay, Stripe, PayU, etc.):

1. **Install payment gateway SDK**:
   ```bash
   npm install razorpay
   # or
   npm install stripe
   ```

2. **Update `server.js`** with payment gateway API:
   ```javascript
   const Razorpay = require('razorpay');
   const razorpay = new Razorpay({
     key_id: process.env.RAZORPAY_KEY_ID,
     key_secret: process.env.RAZORPAY_KEY_SECRET
   });
   
   app.post('/create-order', async (req, res) => {
     const options = {
       amount: 50000, // ₹500 in paise
       currency: 'INR',
       receipt: `receipt_${Date.now()}`
     };
     const order = await razorpay.orders.create(options);
     res.json(order);
   });
   ```

3. **Update `payment.html`** with actual gateway:
   ```javascript
   // Initialize Razorpay
   const options = {
     key: 'YOUR_KEY_ID',
     amount: amount * 100,
     currency: 'INR',
     name: 'FoodHub Restaurant',
     description: 'Table Reservation',
     order_id: orderId,
     handler: function(response) {
       // Handle success
     }
   };
   const rzp = new Razorpay(options);
   rzp.open();
   ```

## Security Considerations

1. Payment gateway integration uses HTTPS
2. API keys stored in environment variables
3. Admin API key required for payment status updates
4. Payment webhooks verify authenticity
5. Transaction IDs logged for audit trail

## Future Enhancements

- Email confirmation after payment
- SMS notification for booking confirmation
- Invoice/receipt generation
- Refund processing
- Payment history tracking
- Multiple currency support
- Discount/coupon codes

## Developer Credits

**Developed by**: [Mohammad Adil](https://adil-mohammad-dev.github.io/personal-portfolio/)

---

## Support

For issues or questions, please contact the development team.

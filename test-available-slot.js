// Test booking for an AVAILABLE time slot
const http = require('http');

const postData = JSON.stringify({
  name: "Available Slot Test",
  email: "available@example.com",
  phone: "8888888888",
  date: "2025-12-15",  // Different date
  time: "19:00",       // Different time
  people: 4,
  meal_type: "Dinner",
  payment_mode: "Cash",
  delivery_option: "Dine-in"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/reserve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing booking for AVAILABLE time slot (Dec 15 at 7 PM)...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    console.log('Status Code:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS - Booking was accepted!');
    } else {
      console.log('❌ REJECTED - Booking was rejected');
    }
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
});

req.write(postData);
req.end();

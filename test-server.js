// Simple test to check if server is responding
const http = require('http');

const postData = JSON.stringify({
  name: "Test User",
  email: "test@example.com",
  phone: "9876543210",
  date: "2025-12-01",
  time: "20:00",
  people: 2,
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

console.log('Sending test booking request...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('Parsed:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
});

req.write(postData);
req.end();

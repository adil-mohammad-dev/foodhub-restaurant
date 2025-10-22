const http = require('http');

const body = JSON.stringify({
  name: 'Local Test',
  email: 'adilmohammad2731@gmail.com',
  phone: '919876543210',
  date: '2025-11-01',
  time: '19:00',
  people: 2,
  payment_mode: 'Cash'
});

const opts = {
  hostname: 'localhost',
  port: 3000,
  path: '/reserve/request-otp',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
};

const req = http.request(opts, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try { console.log(JSON.stringify(JSON.parse(data), null, 2)); }
    catch (e) { console.log('Non-JSON response:', data); }
  });
});

req.on('error', (e) => console.error('Request error', e.message));
req.write(body);
req.end();
// Simple IST validation test
const http = require('http');

function makeBooking(description, date, time) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      phone: "9999999999",
      date: date,
      time: time,
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

    console.log(`\n${description}`);
    console.log(`  Trying to book: ${date} at ${time}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`  ✅ ACCEPTED - Reservation ID: ${result.reservationId}`);
          } else {
            console.log(`  ❌ REJECTED - ${result.message}`);
          }
          resolve({ statusCode: res.statusCode, result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, result: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== Simple IST Validation Test ===');
  console.log('Current IST time: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  // Test 1: Yesterday (should FAIL)
  await makeBooking('TEST 1: YESTERDAY', '2025-10-20', '19:00');

  // Test 2: Today morning (should FAIL if it's past)
  await makeBooking('TEST 2: TODAY at 8:00 AM', '2025-10-21', '08:00');

  // Test 3: Tomorrow at 1 PM (should SUCCEED)
  await makeBooking('TEST 3: TOMORROW at 1:00 PM', '2025-10-22', '13:00');

  // Test 4: Next week (should SUCCEED)
  await makeBooking('TEST 4: NEXT WEEK at 7:00 PM', '2025-10-28', '19:00');

  // Test 5: December (should SUCCEED)
  await makeBooking('TEST 5: DECEMBER at 8:00 PM', '2025-12-25', '20:00');

  console.log('\n=== All Tests Complete ===');
}

runTests().catch(console.error);

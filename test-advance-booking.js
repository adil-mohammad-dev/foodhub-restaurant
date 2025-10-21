// Test advance booking requirement (2 hours minimum)
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
  console.log('=== Testing Advance Booking Requirement (2 hours minimum) ===');
  
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  console.log('Current IST time:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  // Get current date and times
  const todayStr = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Test 1: Try to book NOW (should FAIL - no advance)
  const nowTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  await makeBooking('TEST 1: Book for NOW (should FAIL)', todayStr, nowTime);

  // Test 2: Try to book 30 minutes from now (should FAIL - less than 2 hours)
  const in30min = new Date(now.getTime() + 30 * 60 * 1000);
  const in30minTime = `${String(in30min.getHours()).padStart(2, '0')}:${String(in30min.getMinutes()).padStart(2, '0')}`;
  await makeBooking('TEST 2: Book 30 minutes ahead (should FAIL)', todayStr, in30minTime);

  // Test 3: Try to book 1 hour from now (should FAIL - less than 2 hours)
  const in1hour = new Date(now.getTime() + 60 * 60 * 1000);
  const in1hourTime = `${String(in1hour.getHours()).padStart(2, '0')}:${String(in1hour.getMinutes()).padStart(2, '0')}`;
  const in1hourDate = in1hour.toISOString().split('T')[0];
  await makeBooking('TEST 3: Book 1 hour ahead (should FAIL)', in1hourDate, in1hourTime);

  // Test 4: Try to book 2 hours from now (should SUCCEED - exactly 2 hours)
  const in2hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in2hoursTime = `${String(in2hours.getHours()).padStart(2, '0')}:${String(in2hours.getMinutes()).padStart(2, '0')}`;
  const in2hoursDate = in2hours.toISOString().split('T')[0];
  await makeBooking('TEST 4: Book 2 hours ahead (should SUCCEED)', in2hoursDate, in2hoursTime);

  // Test 5: Try to book 3 hours from now (should SUCCEED)
  const in3hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const in3hoursTime = `${String(in3hours.getHours()).padStart(2, '0')}:${String(in3hours.getMinutes()).padStart(2, '0')}`;
  const in3hoursDate = in3hours.toISOString().split('T')[0];
  await makeBooking('TEST 5: Book 3 hours ahead (should SUCCEED)', in3hoursDate, in3hoursTime);

  // Test 6: Book for tomorrow (should SUCCEED)
  await makeBooking('TEST 6: Book for TOMORROW (should SUCCEED)', '2025-10-22', '19:00');

  console.log('\n=== All Tests Complete ===');
}

runTests().catch(console.error);

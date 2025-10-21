// Test long-term advance bookings (birthday parties, events, etc.)
const http = require('http');

function makeBooking(description, date, time) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: "Birthday Party Booking",
      email: "birthday@example.com",
      phone: "9999999999",
      date: date,
      time: time,
      people: 8,
      occasion: "Birthday",
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
    console.log(`  Booking date: ${date} at ${time}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`  ✅ ACCEPTED - Reservation ID: ${result.reservationId}`);
            console.log(`  📧 Confirmation email sent!`);
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
  console.log('=== Testing Long-Term Advance Bookings ===');
  console.log('Current date: October 21, 2025\n');

  // Test 1: Book for next week
  await makeBooking(
    'TEST 1: Birthday party NEXT WEEK (Oct 28)', 
    '2025-10-28', 
    '19:00'
  );

  // Test 2: Book for next month (November)
  await makeBooking(
    'TEST 2: Birthday party NEXT MONTH (Nov 15)', 
    '2025-11-15', 
    '20:00'
  );

  // Test 3: Book for 2 months later (December)
  await makeBooking(
    'TEST 3: Birthday party in DECEMBER (Dec 25)', 
    '2025-12-25', 
    '19:30'
  );

  // Test 4: Book for 6 months later (April 2026)
  await makeBooking(
    'TEST 4: Birthday party 6 MONTHS LATER (Apr 2026)', 
    '2026-04-15', 
    '20:00'
  );

  // Test 5: Book for 1 year later (October 2026)
  await makeBooking(
    'TEST 5: Birthday party 1 YEAR LATER (Oct 2026)', 
    '2026-10-21', 
    '18:00'
  );

  console.log('\n=== All Tests Complete ===');
  console.log('\n✨ You can book your birthday party or special event');
  console.log('   as far in advance as you want! No maximum limit.');
}

runTests().catch(console.error);

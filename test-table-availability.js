// Test the new table availability system
const http = require('http');

function makeBooking(name, time) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: name,
      email: `${name.replace(/\s/g, '')}@test.com`,
      phone: "9999999999",
      date: "2025-12-20",
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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
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
  console.log('=== Testing Table Availability System ===\n');
  console.log('Restaurant has 10 tables total');
  console.log('Each reservation lasts 2 hours\n');

  // Test 1: Book 8 tables at 6:00 PM
  console.log('TEST 1: Booking 8 tables at 6:00 PM (18:00)');
  for (let i = 1; i <= 8; i++) {
    const result = await makeBooking(`Table${i}_6PM`, '18:00');
    if (result.statusCode === 200) {
      console.log(`  ✅ Booking ${i}/8 accepted`);
    } else {
      console.log(`  ❌ Booking ${i}/8 rejected: ${result.result.message}`);
    }
  }

  // Test 2: Try to book at 7:00 PM (overlaps with 6 PM, should allow since only 8 tables occupied)
  console.log('\nTEST 2: Trying to book at 7:00 PM (should SUCCEED - only 8/10 tables occupied)');
  const test2 = await makeBooking('OverlapTest_7PM', '19:00');
  if (test2.statusCode === 200) {
    console.log('  ✅ Booking accepted (9th table)');
  } else {
    console.log('  ❌ Booking rejected:', test2.result.message);
  }

  // Test 3: Book one more at 7:00 PM
  console.log('\nTEST 3: Booking another at 7:00 PM (should SUCCEED - 10th table)');
  const test3 = await makeBooking('Table10_7PM', '19:00');
  if (test3.statusCode === 200) {
    console.log('  ✅ Booking accepted (10th table)');
  } else {
    console.log('  ❌ Booking rejected:', test3.result.message);
  }

  // Test 4: Try to book at 7:30 PM (should FAIL - all 10 tables occupied)
  console.log('\nTEST 4: Trying to book at 7:30 PM (should FAIL - all 10 tables occupied)');
  const test4 = await makeBooking('ShouldFail_730PM', '19:30');
  if (test4.statusCode === 200) {
    console.log('  ❌ ERROR: Booking was accepted (should have been rejected!)');
  } else {
    console.log('  ✅ Booking correctly rejected:', test4.result.message);
  }

  // Test 5: Try to book at 9:00 PM (3 hours after 6 PM, should SUCCEED - tables free)
  console.log('\nTEST 5: Trying to book at 9:00 PM (should SUCCEED - more than 2 hours after 6 PM)');
  const test5 = await makeBooking('LateBooking_9PM', '21:00');
  if (test5.statusCode === 200) {
    console.log('  ✅ Booking accepted (tables are free after 8 PM)');
  } else {
    console.log('  ❌ Booking rejected:', test5.result.message);
  }

  console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);

// Test IST time validation
const http = require('http');

function makeBooking(name, date, time) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: name,
      email: `${name.replace(/\s/g, '')}@test.com`,
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
  console.log('=== Testing IST Time Validation ===\n');
  
  // Get current IST time
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  console.log('Current IST time:', istNow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('');

  // Test 1: Book for PAST time (yesterday)
  console.log('TEST 1: Booking for YESTERDAY (should FAIL)');
  const yesterday = new Date(istNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const test1 = await makeBooking('PastBooking', yesterdayStr, '19:00');
  if (test1.statusCode === 200) {
    console.log('  ❌ ERROR: Past booking was accepted!');
  } else {
    console.log('  ✅ Correctly rejected:', test1.result.message);
  }

  // Test 2: Book for TODAY at a time that just passed (if possible)
  console.log('\nTEST 2: Booking for PAST time today (should FAIL)');
  const todayStr = istNow.toISOString().split('T')[0];
  const test2 = await makeBooking('PastToday', todayStr, '00:00');
  if (test2.statusCode === 200) {
    console.log('  ❌ ERROR: Past time today was accepted!');
  } else {
    console.log('  ✅ Correctly rejected:', test2.result.message);
  }

  // Test 3: Book for NOW/CURRENT time (should SUCCEED)
  console.log('\nTEST 3: Booking for CURRENT/NOW time (should SUCCEED)');
  const currentHour = istNow.getHours();
  const currentMinute = istNow.getMinutes();
  const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  const test3 = await makeBooking('CurrentTime', todayStr, currentTime);
  if (test3.statusCode === 200) {
    console.log('  ✅ Booking accepted for current time');
  } else {
    console.log('  ⚠️ Rejected:', test3.result.message);
  }

  // Test 4: Book for FUTURE time (2 hours from now)
  console.log('\nTEST 4: Booking for FUTURE time (2 hours from now) (should SUCCEED)');
  const futureTime = new Date(istNow.getTime() + 2 * 60 * 60 * 1000);
  const futureHour = futureTime.getHours();
  const futureMinute = futureTime.getMinutes();
  const futureTimeStr = `${String(futureHour).padStart(2, '0')}:${String(futureMinute).padStart(2, '0')}`;
  const futureDateStr = futureTime.toISOString().split('T')[0];
  const test4 = await makeBooking('FutureBooking', futureDateStr, futureTimeStr);
  if (test4.statusCode === 200) {
    console.log('  ✅ Booking accepted for future time');
  } else {
    console.log('  ❌ ERROR: Future booking was rejected:', test4.result.message);
  }

  // Test 5: Book for TOMORROW (should SUCCEED)
  console.log('\nTEST 5: Booking for TOMORROW at 7 PM (should SUCCEED)');
  const tomorrow = new Date(istNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const test5 = await makeBooking('TomorrowBooking', tomorrowStr, '19:00');
  if (test5.statusCode === 200) {
    console.log('  ✅ Booking accepted for tomorrow');
  } else {
    console.log('  ❌ ERROR: Tomorrow booking was rejected:', test5.result.message);
  }

  console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);

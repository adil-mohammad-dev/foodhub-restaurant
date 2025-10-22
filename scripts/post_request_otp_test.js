// Use global fetch (Node 18+)
(async () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yyyy = tomorrow.getFullYear();
  const mm = ('0' + (tomorrow.getMonth() + 1)).slice(-2);
  const dd = ('0' + tomorrow.getDate()).slice(-2);
  const date = `${yyyy}-${mm}-${dd}`;
  const time = '19:00';
  const body = { name: 'Tester', email: 'test@21q91a05972mrce.in', phone: '+919876543210', date, time, people: 2, occasion: 'Other', meal_type: 'Dinner', message: 'Test OTP', payment_mode: 'Cash' };
  console.log('POST body:', body);
  try {
    const res = await fetch('http://localhost:3000/reserve/request-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    console.log('status', res.status);
    console.log('response', text);
  } catch (e) {
    console.error('fetch error', e.message);
  }
})();

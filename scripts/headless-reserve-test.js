const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });

  // Capture network requests/responses
  const network = [];
  page.on('requestfinished', async (req) => {
    try {
      const res = req.response();
      if (!res) return;
      const url = req.url();
      const method = req.method();
      const status = res.status();
      const headers = res.headers();
      let text = '';
      try { text = await res.text(); } catch (e) { text = '<non-text response>'; }
      network.push({ url, method, status, headers, text: text.slice(0,2000) });
    } catch (e) {
      console.error('requestfinished error', e.message);
    }
  });

  // Go to the reservations page
  await page.goto('http://localhost:3000/reservations.html', { waitUntil: 'networkidle2' });

  // Fill the form
  await page.type('input[name=name]', 'Headless Tester');
  await page.type('input[name=email]', 'test@21q91a05972mrce.in');
  await page.type('input[name=phone]', '+919876543210');
  // date - set to tomorrow
  const tomorrow = new Date(Date.now() + 24*60*60*1000);
  const yyyy = tomorrow.getFullYear(); const mm = ('0'+(tomorrow.getMonth()+1)).slice(-2); const dd = ('0'+tomorrow.getDate()).slice(-2);
  const dateStr = `${yyyy}-${mm}-${dd}`;
  await page.evaluate((d) => document.querySelector('input[name=date]').value = d, dateStr);
  await page.evaluate(() => document.querySelector('input[name=time]').value = '19:00');
  await page.evaluate(() => document.querySelector('input[name=people]').value = '2');
  await page.select('select[name=occasion]', 'Other');
  // reservation.html uses meal_type values 'Veg' or 'Non-Veg'
  await page.select('select[name=meal_type]', 'Non-Veg');
  await page.select('select[name=payment_mode]', 'Cash');

  // Check form validity and submit; wait longer for network
  const valid = await page.evaluate(() => {
    const form = document.getElementById('reservationForm');
    return form.checkValidity();
  });
  console.log('FORM valid:', valid);
  await page.click('button[type=submit]');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Save network log
  fs.writeFileSync('headless-network.json', JSON.stringify(network, null, 2));
  console.log('Captured network entries:', network.length);

  await browser.close();
})();

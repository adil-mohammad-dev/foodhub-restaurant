const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE_LOG:', msg.type(), ...msg.args().map(a=>a.toString())));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.toString()));

  const url = 'http://localhost:3000/Admin.html';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Fill API key and click Load
  await page.waitForSelector('#apiKey');
  await page.type('#apiKey','admin123');
  await page.click('#load');
  console.log('Clicked load, waiting for table...');

  // Wait for table rows to appear
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
  console.log('Table loaded');

  // Click the first Cancel button (table row) by scanning action button containers
  // select buttons that have the res-action-btn class (they are the actionable buttons)
  const actionButtons = await page.$$('table tbody tr td button.res-action-btn');
  let clicked = false;
  for (const b of actionButtons) {
    const txt = await page.evaluate(el => (el.innerText || el.textContent || '').trim().toLowerCase(), b);
    if (txt.includes('cancel')) { await b.click(); clicked = true; break; }
  }
  console.log('Clicked table cancel?', clicked);

  // Wait for modal to appear
  await page.waitForSelector('#cancelModal.show', { timeout: 5000 }).catch(()=>console.log('Modal did not show via .show class'));
  await page.waitForSelector('#cancelModal', { visible: true, timeout: 5000 });
  console.log('Modal visible');

  // Type reason
  await page.type('#cancelReason','Testing cancel via headless');

  // Click confirm
  await page.click('#confirmCancelBtn');
  console.log('Clicked confirm');

  // Wait a bit for network and UI changes
  await new Promise((r) => setTimeout(r, 2000));

  // Capture any network or console output already logged
  console.log('Done test.');
  await browser.close();
  process.exit(0);
})();
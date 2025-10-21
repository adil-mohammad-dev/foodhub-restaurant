const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('reservations.db');

console.log('Checking database structure...\n');

db.all("PRAGMA table_info(reservations)", (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('✅ Reservations table columns:');
  console.log('─'.repeat(80));
  rows.forEach(col => {
    console.log(`${col.cid}. ${col.name.padEnd(20)} ${col.type.padEnd(15)} ${col.dflt_value || ''}`);
  });
  console.log('─'.repeat(80));
  
  const hasPaymentMode = rows.some(col => col.name === 'payment_mode');
  const hasPaymentStatus = rows.some(col => col.name === 'payment_status');
  
  console.log('\n📊 Payment columns status:');
  console.log(`   payment_mode: ${hasPaymentMode ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   payment_status: ${hasPaymentStatus ? '✅ EXISTS' : '❌ MISSING'}`);
  
  db.all("SELECT COUNT(*) as count FROM reservations", (err, result) => {
    if (err) console.error('Error counting:', err);
    else console.log(`\n📈 Total reservations: ${result[0].count}`);
    
    db.close();
  });
});

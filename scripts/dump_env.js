// scripts/dump_env.js
require('dotenv').config();
console.log({
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_VAR_NAME: Object.keys(process.env).filter(k => /EMAIL/i.test(k)),
  APP_PASS_len: process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : null,
  APP_PASS_preview: process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.slice(0,4) + '...' + process.env.EMAIL_APP_PASSWORD.slice(-4) : null
});

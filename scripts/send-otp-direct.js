require('dotenv').config();
const nodemailer = require('nodemailer');

function generateOTP(len=6){let s=''; for(let i=0;i<len;i++) s+=Math.floor(Math.random()*10); return s;}

(async ()=>{
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if(!user||!pass){ console.error('EMAIL_USER/PASS missing'); process.exit(1); }
  const otp = generateOTP(6);
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  const mailOptions = {
    from: `"FoodHub OTP" <${user}>`,
    to: user,
    subject: 'Your FoodHub OTP',
    text: `Your OTP code is: ${otp}\nIt is valid for 10 minutes.`
  };
  try{
    await new Promise((resolve,reject)=>transporter.sendMail(mailOptions,(err,info)=>err?reject(err):resolve(info)));
    console.log('OTP sent successfully to', user);
    console.log('OTP:', otp);
  }catch(e){
    console.error('Failed to send OTP:', e.message || e);
    process.exit(1);
  }
})();
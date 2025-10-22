document.addEventListener('DOMContentLoaded', () => {
  const otpForm = document.getElementById('otpForm');
  const otpIdInput = document.getElementById('otpId');
  const resMessage = document.getElementById('resMessage');

  const storedOtpId = localStorage.getItem('otpId');
  if (storedOtpId) otpIdInput.value = storedOtpId;

  console.log('[otp.js] loaded, otpId=', storedOtpId);

  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp').value.trim();
    const otpId = otpIdInput.value;
    if (!otpId || !otp) return alert('OTP and otpId required');

    try {
      console.log('[otp.js] verifying otp', otpId, otp);
      const response = await fetch('/reserve/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otpId: Number(otpId), otp }) });
      const text = await response.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { json = null; }
      if (!response.ok) {
        console.error('[otp.js] server error', response.status, text);
        resMessage.innerText = 'Server error: ' + (json && json.message ? json.message : text);
        return;
      }
      if (!json || !json.success) {
        resMessage.innerText = (json && json.message) || 'Verification failed';
        return;
      }
      resMessage.innerText = 'Reservation confirmed! ID: ' + json.reservationId;
      localStorage.removeItem('otpId');
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  });
});
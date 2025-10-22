document.addEventListener('DOMContentLoaded', () => {
  const otpForm = document.getElementById('otpForm');
  const otpIdInput = document.getElementById('otpId');
  const resMessage = document.getElementById('resMessage');

  const storedOtpId = localStorage.getItem('otpId');
  if (storedOtpId) otpIdInput.value = storedOtpId;

  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp').value.trim();
    const otpId = otpIdInput.value;
    if (!otpId || !otp) return alert('OTP and otpId required');

    try {
      const res = await fetch('/reserve/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId: Number(otpId), otp })
      });
      const json = await res.json();
      if (!json.success) {
        resMessage.innerText = json.message || 'Verification failed';
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
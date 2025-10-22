document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Prevent other submit handlers (legacy reservation.js) from also running
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const data = new FormData(form);
    const body = {};
    data.forEach((v, k) => body[k] = v);

    // Convert people to number
    if (body.people) body.people = Number(body.people);

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending OTP...'; }

    try {
      const res = await fetch('/reserve/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!json.success) return alert(json.message || 'Failed to request OTP');

      // Save otpId to localStorage and redirect to otp page
      localStorage.setItem('otpId', json.otpId);
      window.location.href = '/otp.html';
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  });
});
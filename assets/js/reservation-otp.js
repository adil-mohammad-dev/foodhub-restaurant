document.addEventListener('DOMContentLoaded', () => {
  console.log('[reservation-otp] script loaded');
  const form = document.getElementById('reservationForm');
  if (!form) { console.log('[reservation-otp] reservationForm not found'); return; }

  // Use capture phase so this handler runs before other submit listeners
  // Passing `true` as the third argument subscribes to the capture phase
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
  // Prevent other submit handlers (legacy reservation.js) from also running
  if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  // Mark OTP in-progress so legacy handler can detect and skip
  try { localStorage.setItem('otpInProgress', '1'); } catch (e) { /* ignore */ }
    const data = new FormData(form);
    const body = {};
    data.forEach((v, k) => body[k] = v);

    // Convert people to number
    if (body.people) body.people = Number(body.people);

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending OTP...'; }

    try {
      console.log('[reservation-otp] submitting request-otp', body);
      const res = await fetch('/reserve/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log('[reservation-otp] fetch completed', res.status, res.statusText, res.headers && res.headers.get ? res.headers.get('content-type') : undefined);

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { json = null; }

      if (!res.ok) {
        console.error('[reservation-otp] server error', res.status, text);
        alert('Server error: ' + (json && json.message ? json.message : text));
        try { localStorage.removeItem('otpInProgress'); } catch (e) {}
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Reserve my Table'; }
        return;
      }

      if (!json || !json.success) {
        console.error('[reservation-otp] request-otp failed', json || text);
        alert((json && json.message) || 'Failed to request OTP');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Reserve my Table'; }
        return;
      }

      console.log('[reservation-otp] received otpId', json.otpId);
      // Save otpId to localStorage and redirect to otp page
      try { localStorage.setItem('otpId', json.otpId); localStorage.removeItem('otpInProgress'); } catch (e) {}
      window.location.href = '/otp.html';
    } catch (err) {
      console.error('[reservation-otp] network error', err);
      alert('Network error: ' + (err.message || err));
      try { localStorage.removeItem('otpInProgress'); } catch (e) {}
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Reserve my Table'; }
    }
    }, true);
});
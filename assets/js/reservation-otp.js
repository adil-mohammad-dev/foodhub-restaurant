document.addEventListener('DOMContentLoaded', () => {
	console.log('[reservation-otp] script loaded');

	// Quiet noisy extension/runtime unhandled rejection spam that originates
	// outside of our app (some browser extensions return true from a message
	// listener and never call sendResponse). This suppression is targeted and
	// only prevents the specific noisy message while preserving other errors.
	try {
		window.addEventListener('unhandledrejection', (e) => {
			try {
				const reason = e && e.reason;
				const text = reason && (reason.message || (typeof reason === 'string' ? reason : String(reason)));
				if (text && text.includes('A listener indicated an asynchronous response')) {
					e.preventDefault();
					console.warn('Suppressed noisy extension/runtime message in reservation-otp:', text);
				}
			} catch (inner) { /* ignore */ }
		});
	} catch (err) { /* ignore in envs without window.addEventListener */ }

	// Small helper to POST JSON and surface meaningful errors
	async function postJson(url, data) {
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			// Try to parse JSON safely
			const text = await res.text().catch(() => null);
			let json = null;
			try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
			if (!res.ok) {
				console.error('[reservation-otp] server error', res.status, text);
				const err = new Error('Server returned status ' + res.status);
				err.serverResponse = json || text;
				throw err;
			}
			return json;
		} catch (err) {
			console.error('[reservation-otp] postJson error:', err);
			throw err;
		}
	}
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
			const json = await postJson('/reserve/request-otp', body);
			console.log('[reservation-otp] response JSON:', json);
			if (!json || !json.success) {
				console.error('[reservation-otp] request-otp failed', json);
				alert((json && json.message) || 'Failed to request OTP');
				if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Reserve my Table'; }
				return;
			}

			console.log('[reservation-otp] received otpId', json.otpId);
			// Save otpId to localStorage and redirect to otp page
			try { localStorage.setItem('otpId', String(json.otpId)); localStorage.removeItem('otpInProgress'); } catch (e) {}
			window.location.href = '/otp.html';
		} catch (err) {
			console.error('[reservation-otp] network error', err);
			alert('Network error: ' + (err.message || err));
			try { localStorage.removeItem('otpInProgress'); } catch (e) {}
			if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Reserve my Table'; }
		}
		}, true);
});
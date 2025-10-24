document.addEventListener('DOMContentLoaded', () => {
	const otpForm = document.getElementById('otpForm');
	const otpIdInput = document.getElementById('otpId');
	const resMessage = document.getElementById('resMessage');

	const storedOtpId = localStorage.getItem('otpId');
	if (storedOtpId) {
		if (otpIdInput) otpIdInput.value = storedOtpId;
	}

	console.log('[otp.js] loaded, otpId=', storedOtpId);

	otpForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const otp = document.getElementById('otp').value.trim();
		const otpId = otpIdInput.value;
		if (!otpId || !otp) return alert('OTP and otpId required');

		try {
			console.log('[otp.js] verifying otp', otpId, otp);
			const response = await fetch('/reserve/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otpId: Number(otpId), otp }) });
			const json = await response.json().catch(err => { console.error('[otp.js] failed to parse json', err); return null; });
			console.log('[otp.js] verify response:', response.status, json);
			if (!response.ok) {
				console.error('[otp.js] server error', response.status, json);
				resMessage.innerText = 'Server error: ' + (json && json.message ? json.message : response.statusText);
				return;
			}
			if (!json || !json.success) {
				resMessage.innerText = (json && json.message) || 'Verification failed';
				return;
			}
			// If payment is required, redirect to payment page
			if (json.paymentRequired) {
				const amount = json.paymentAmount || 500;
				// Clear otpId and redirect to payment page with reservation id and amount
				localStorage.removeItem('otpId');
				window.location.href = `/payment.html?id=${json.reservationId}&amount=${amount}`;
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
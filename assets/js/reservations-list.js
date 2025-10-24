// Clean admin script used by Admin.html
document.addEventListener('DOMContentLoaded', () => {
  const resultsDiv = document.getElementById('results');
  const toastRoot = document.getElementById('toast');

  function escapeHtml(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function showToast(message, kind = 'info') {
    const id = 't' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = `toast align-items-center text-bg-${kind} border-0 show`;
    el.role = 'alert';
    el.ariaLive = 'polite';
    el.ariaAtomic = 'true';
    el.style.minWidth = '220px';
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button></div>`;
    toastRoot.appendChild(el);
    const closeBtn = el.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => el.remove());
    setTimeout(() => { if (el.parentNode) el.remove(); }, 6000);
  }

  async function loadReservations() {
    const key = document.getElementById('apiKey').value.trim();
    if (!key) return alert('Paste ADMIN_API_KEY first');
    resultsDiv.innerHTML = 'Loading...';
    try {
      const res = await fetch('/api/reservations', { headers: { 'x-api-key': key } });
      const data = await res.json();
      if (!data.success) return alert('Error: ' + (data.message || 'unknown'));
      const rows = data.reservations || [];
      if (!rows.length) return (resultsDiv.innerHTML = '<p class="text-muted">No reservations</p>');

      // build bootstrap table
      let html = `<div class="card"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Date</th><th>Time</th><th>People</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
      rows.forEach((r) => {
        html += `<tr data-aos="fade-up" data-id="${r.id}">
          <td class="fw-medium">${r.id}</td>
          <td><input data-field="name" class="form-control form-control-sm" value="${escapeHtml(r.name || '')}"></td>
          <td><input data-field="email" class="form-control form-control-sm" value="${escapeHtml(r.email || '')}"></td>
          <td><input data-field="phone" class="form-control form-control-sm" value="${escapeHtml(r.phone || '')}"></td>
          <td><input data-field="date" class="form-control form-control-sm" value="${escapeHtml(r.date || '')}" type="date"></td>
          <td><input data-field="time" class="form-control form-control-sm" value="${escapeHtml(r.time || '')}" type="time"></td>
          <td><input data-field="people" class="form-control form-control-sm" value="${escapeHtml(r.people || '')}" type="number" style="width:80px"></td>
          <td><div class="small">Mode: <strong>${escapeHtml(r.payment_mode||'')}</strong><br> <span class="text-muted small">${escapeHtml(r.payment_status||'')}</span></div></td>
          <td><div class="small" data-field="status">${escapeHtml(r.status||'')}</div></td>
          <td>
            <div class="d-flex gap-2">
              <button onclick="updateReservation(${r.id}, this)" class="btn btn-sm btn-success res-action-btn"><i class="bi bi-save"></i> Save</button>
              <button onclick="confirmReservation(${r.id}, this)" class="btn btn-sm btn-primary res-action-btn"><i class="bi bi-check-circle"></i> Confirm</button>
              <button onclick="openCancelModal(${r.id}, this)" class="btn btn-sm btn-outline-danger res-action-btn"><i class="bi bi-x-circle"></i> Cancel</button>
              <button onclick="deleteReservation(${r.id})" class="btn btn-sm btn-danger res-action-btn"><i class="bi bi-trash"></i> Delete</button>
              <button onclick="resendConfirmation(${r.id}, this)" class="btn btn-sm btn-outline-primary res-action-btn"><i class="bi bi-envelope"></i> Resend</button>
            </div>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div></div>';
  resultsDiv.innerHTML = html;
  // refresh AOS so animations apply to newly injected rows
  try { if (window.AOS && typeof window.AOS.refresh === 'function') window.AOS.refresh(); } catch (e) { /* ignore */ }
    } catch (err) { console.error(err); alert('Failed to load reservations'); }
  }

  // Update status helper (reads current row inputs and sets status)
  // Accepts optional adminMessage (used when cancelling) and forwards it to server
  async function updateStatus(id, newStatus, btn, adminMessage) {
    const key = document.getElementById('apiKey').value.trim();
    if (!key) return alert('Paste ADMIN_API_KEY first');
    const row = btn.closest('tr');
    const get = (field) => { const el = row.querySelector(`[data-field="${field}"]`); return el ? el.value : ''; };
    const name = get('name'), email = get('email'), phone = get('phone'), date = get('date'), time = get('time'), people = get('people');
    const occasion = get('occasion') || '', meal_type = get('meal_type') || '';
    // message may come from adminMessage (modal) or from a message input
    const message = adminMessage || get('message') || '';
    // payment_mode & payment_status may be selects or text
    const pmEl = row.querySelector('select[data-field="payment_mode"]');
    const psEl = row.querySelector('select[data-field="payment_status"]');
    const payment_mode = pmEl ? pmEl.value : (row.querySelector('.small strong') ? row.querySelector('.small strong').innerText : 'Cash');
    const payment_status = psEl ? psEl.value : (row.querySelector('.small .text-muted') ? row.querySelector('.small .text-muted').innerText : 'pending');

    const originalText = btn ? btn.innerHTML : '';
    try {
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating'; }
      const body = { name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status: newStatus };
      const res = await fetch(`/api/reservations/${id}`, { method: 'PUT', headers: { 'x-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        showToast(`Reservation #${id} set to ${newStatus}`, 'success');
        // update status cell in UI
        const statusCell = row.querySelectorAll('td')[8];
        if (statusCell) statusCell.innerText = newStatus;
      } else {
        showToast('Failed to update: ' + (data.message || 'unknown'), 'danger');
      }
    } catch (e) { console.error(e); showToast('Server error while updating status', 'danger'); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = originalText; } }
  }

  async function confirmReservation(id, btn) {
    if (!confirm('Confirm reservation #' + id + '?')) return;
    await updateStatus(id, 'confirmed', btn);
  }

  async function cancelReservation(id, btn) {
    if (!confirm('Cancel reservation #' + id + '? This will mark it as cancelled.')) return;
    await updateStatus(id, 'cancelled', btn);
  }

  async function updateReservation(id, btn) {
    const row = btn.closest('tr');
    const get = (field) => { const el = row.querySelector(`[data-field="${field}"]`); return el ? el.value : ''; };
    const name = get('name'), email = get('email'), phone = get('phone'), date = get('date'), time = get('time'), people = get('people'), occasion = get('occasion') || '', meal_type = get('meal_type') || '', message = get('message') || '', status = get('status') || '';
    // payment_mode & payment_status may be displayed as text; try selects
    const pmEl = row.querySelector('select[data-field="payment_mode"]');
    const psEl = row.querySelector('select[data-field="payment_status"]');
    const payment_mode = pmEl ? pmEl.value : (row.querySelector('.small strong') ? row.querySelector('.small strong').innerText : 'Cash');
    const payment_status = psEl ? psEl.value : (row.querySelector('.small .text-muted') ? row.querySelector('.small .text-muted').innerText : 'pending');
    const key = document.getElementById('apiKey').value.trim();
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'PUT', headers: { 'x-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status }) });
      const data = await res.json();
      if (data.success) alert('Updated successfully'); else alert('Failed to update: ' + (data.message || 'unknown'));
    } catch (err) { console.error(err); alert('Server error while updating'); }
  }

  // Resend confirmation for a reservation (admin)
  async function resendConfirmation(id, btn) {
    const key = document.getElementById('apiKey').value.trim();
    if (!key) return alert('Paste ADMIN_API_KEY first');
    const originalText = btn.innerHTML;
    try {
      btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending';
      const res = await fetch(`/api/reservations/${id}/resend-confirmation`, { method: 'POST', headers: { 'x-api-key': key } });
      const data = await res.json();
      if (data && data.success) {
        showToast('Confirmation sent for #' + id, 'success');
      } else {
        showToast('Failed to resend: ' + (data && data.message ? data.message : 'unknown'), 'danger');
      }
    } catch (e) { console.error(e); showToast('Server error while resending', 'danger'); }
    finally { btn.disabled = false; btn.innerHTML = originalText; }
  }

  // Open cancel modal and store context
  let _cancelContext = { id: null, btn: null };
  function openCancelModal(id, btn) {
    _cancelContext.id = id; _cancelContext.btn = btn;
    const modalEl = document.getElementById('cancelModal');
    const reasonEl = document.getElementById('cancelReason');
    reasonEl.value = '';
    const b = new bootstrap.Modal(modalEl);
    b.show();
  }

  // Handle confirm in modal
  document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmCancelBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', async () => {
      const id = _cancelContext.id; const btn = _cancelContext.btn;
      const reason = document.getElementById('cancelReason').value || 'Cancelled by admin';
      // find modal instance and hide
      const modalEl = document.getElementById('cancelModal');
      try { bootstrap.Modal.getInstance(modalEl).hide(); } catch (e) { /* ignore */ }
      // call updateStatus with reason
      await updateStatus(id, 'cancelled', btn, reason);
    });
  });

  async function deleteReservation(id) {
    const key = document.getElementById('apiKey').value.trim();
    if (!confirm('Delete reservation #' + id + '?')) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE', headers: { 'x-api-key': key } });
      const data = await res.json();
      if (data.success) alert('Deleted successfully'); else alert('Failed to delete: ' + (data.message || 'unknown'));
      loadReservations();
    } catch (err) { console.error(err); alert('Server error while deleting'); }
  }

  window.updateReservation = updateReservation;
  window.deleteReservation = deleteReservation;
  window.resendConfirmation = resendConfirmation;

  const loadBtn = document.getElementById('load');
  if (loadBtn) loadBtn.addEventListener('click', loadReservations);
});

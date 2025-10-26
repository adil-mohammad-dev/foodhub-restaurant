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
        // If cancelled, remove the row from the admin table so it's no longer visible
        if (newStatus === 'cancelled') {
          try {
            // Prefer removing the exact row to avoid flicker; if not possible, reload list
            if (row && row.parentNode) {
              row.parentNode.removeChild(row);
              showToast(`Reservation #${id} removed from list`, 'info');
            } else {
              // fallback: reload all reservations
              try { loadReservations(); } catch (e) {}
            }
          } catch (e) { try { loadReservations(); } catch (_) {} }
        }
        // If server returned email/send info, surface it to admin
        try {
          if (data.emailInfo) {
            if (data.emailInfo.ok) showToast('Cancellation emailed to customer', 'success');
            else showToast('Cancellation email failed: ' + (data.emailInfo.error || 'unknown'), 'warning');
          }
        } catch (e) { /* ignore */ }
        // If this was a cancel, give a strong visual cue on the modal confirm button so it's obvious in the UI
        try {
          if (newStatus === 'cancelled') {
            const modalConfirm = document.getElementById('confirmCancelBtn');
            if (modalConfirm) {
              const originalText = modalConfirm.innerHTML;
              const originalClass = modalConfirm.className;
              modalConfirm.innerHTML = 'Cancelled ✓';
              modalConfirm.className = 'btn btn-success';
              modalConfirm.disabled = true;
              setTimeout(() => {
                try { modalConfirm.innerHTML = originalText; modalConfirm.className = originalClass; modalConfirm.disabled = false; } catch (_) {}
              }, 1800);
            }
          }
        } catch (e) { /* ignore visual cue failures */ }
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
    // Ensure confirm button is enabled only when context is set
    try {
      const confirmBtn = document.getElementById('confirmCancelBtn');
      if (confirmBtn) confirmBtn.disabled = false;
    } catch (e) { /* ignore */ }
  }

  // Accessibility: ensure modal toggles inert/aria-hidden and manages focus
  function setupModalA11y() {
    const modalEl = document.getElementById('cancelModal');
    if (!modalEl) return;
    if (modalEl._a11ySetup) return; // avoid duplicate setup
    modalEl._a11ySetup = true;

    // When modal is shown, remove aria-hidden and try to focus a sensible target inside
    modalEl.addEventListener('shown.bs.modal', () => {
      try { modalEl.removeAttribute('aria-hidden'); } catch (e) {}
      try { modalEl.inert = false; } catch (e) {}
      try {
        const focusTarget = modalEl.querySelector('[data-initial-focus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
      } catch (e) { /* ignore focus errors */ }
    });

    // When modal is fully hidden, mark it inert and aria-hidden to remove from AT & tab order
    // Note: we avoid setting aria-hidden here because some browsers warn if a focused
    // descendant remains focused while aria-hidden is applied. Instead we set
    // aria-hidden/inert proactively when hiding is triggered after moving focus out.
    modalEl.addEventListener('hidden.bs.modal', () => {
      // no-op: aria-hidden/inert are managed by the hide flow to avoid focus races
    });

    // Before modal starts hiding, move focus out to avoid aria-hidden focus warnings
    // keep this handler as a last-resort focus move; primary hide flow will move focus
    modalEl.addEventListener('hide.bs.modal', () => {
      try {
        if (document.activeElement && modalEl.contains(document.activeElement)) {
          const tmp = document.createElement('button');
          tmp.type = 'button';
          tmp.style.position = 'absolute';
          tmp.style.left = '-9999px';
          tmp.style.width = '1px';
          tmp.style.height = '1px';
          tmp.style.overflow = 'hidden';
          tmp.setAttribute('aria-hidden', 'true');
          document.body.appendChild(tmp);
          tmp.focus({ preventScroll: true });
          setTimeout(() => { try { tmp.remove(); } catch (_) {} }, 200);
        }
      } catch (e) { /* ignore */ }
    });

    // Initialize state: if modal not shown, ensure inert/aria-hidden is set
    try {
      if (!modalEl.classList.contains('show')) {
        modalEl.setAttribute('aria-hidden', 'true');
        try { modalEl.inert = true; } catch (e) {}
      }
      // disable confirm button until modal is opened with a valid context
      try { const confirmBtn = document.getElementById('confirmCancelBtn'); if (confirmBtn) confirmBtn.disabled = true; } catch(e){}
    } catch (e) { /* ignore init errors */ }
  }

  // Setup modal accessibility handlers on DOM ready
  try { setupModalA11y(); } catch (e) { /* ignore */ }

  // Handle confirm in modal
  // Attach handler immediately — the outer DOMContentLoaded wrapper already guarantees DOM readiness.
  (function attachConfirmHandler() {
    const confirmBtn = document.getElementById('confirmCancelBtn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
      const id = _cancelContext.id; const btn = _cancelContext.btn;
      if (!id) {
        try { showToast('No reservation selected. Open the cancel action from a reservation row.', 'danger'); } catch(e) { alert('No reservation selected.'); }
        // hide modal if it's visible
        try { const modalEl = document.getElementById('cancelModal'); if (bootstrap && modalEl && bootstrap.Modal.getInstance(modalEl)) bootstrap.Modal.getInstance(modalEl).hide(); } catch(e){}
        return;
      }
      const reason = document.getElementById('cancelReason').value || 'Cancelled by admin';
      // find modal instance and hide
      const modalEl = document.getElementById('cancelModal');
      try {
        // Move focus away from modal contents before hiding to avoid aria-hidden focus warnings.
        // Focus a temporary offscreen button, set aria-hidden/inert on the modal, then hide.
        const tmp = document.createElement('button');
        tmp.type = 'button';
        tmp.style.position = 'absolute';
        tmp.style.left = '-9999px';
        tmp.style.width = '1px';
        tmp.style.height = '1px';
        tmp.style.overflow = 'hidden';
        tmp.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tmp);
        // ensure focus moves before setting aria-hidden on the modal
        try { tmp.focus({ preventScroll: true }); } catch (f) { try { tmp.focus(); } catch(_) {} }
        // now mark modal as hidden for AT and remove from tab order
        try { modalEl.setAttribute('aria-hidden', 'true'); } catch (e) {}
        try { modalEl.inert = true; } catch (e) {}
        // hide modal while focus is already moved out
        try { bootstrap.Modal.getInstance(modalEl).hide(); } catch (e) { /* ignore hide errors */ }
        // restore focus to opener button if available
        if (btn && typeof btn.focus === 'function') {
          try { btn.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
        }
        // cleanup temporary element shortly after
        setTimeout(() => { try { tmp.remove(); } catch (_) {} }, 200);
      } catch (e) { /* ignore */ }
      // call updateStatus with reason
      await updateStatus(id, 'cancelled', btn, reason);
    });
  })();

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
  // expose functions used by inline onclick handlers
  window.openCancelModal = openCancelModal;
  window.confirmReservation = confirmReservation;
  window.cancelReservation = cancelReservation;

  const loadBtn = document.getElementById('load');
  if (loadBtn) loadBtn.addEventListener('click', loadReservations);
});

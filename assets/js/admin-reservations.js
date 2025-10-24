document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('tableWrap');
  const status = document.getElementById('status');

  function setStatus(msg, isError) {
    if (!status) return; status.textContent = msg; status.style.color = isError ? 'red' : 'green';
  }

  async function load() {
    wrap.innerHTML = 'Loading...';
    try {
      const res = await fetch('/admin/reservations');
      const json = await res.json();
      if (!json || !json.success) { wrap.innerHTML = 'Failed to load'; setStatus('Failed to load reservations', true); return; }
      const rows = json.reservations || [];
      if (rows.length === 0) { wrap.innerHTML = '<p>No reservations found.</p>'; return; }

      let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Date</th><th>Time</th><th>People</th><th>Payment</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>';
      for (const r of rows) {
        html += `<tr data-id="${r.id}"><td>${r.id}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.time)}</td><td>${escapeHtml(r.people)}</td><td>${escapeHtml(r.payment_mode)} / ${escapeHtml(r.payment_status)}</td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.created_at)}</td><td><button class="btn btn-danger" data-id="${r.id}">Delete</button></td></tr>`;
      }
      html += '</tbody></table>';
      wrap.innerHTML = html;

      // Attach delete handlers
      document.querySelectorAll('.btn-danger').forEach(b => b.addEventListener('click', onDelete));
    } catch (e) { console.error('Load error', e); wrap.innerHTML = 'Error'; setStatus('Error loading reservations', true); }
  }

  function escapeHtml(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function onDelete(e) {
    const id = e.currentTarget.getAttribute('data-id');
    if (!id) return;
    if (!confirm('Delete reservation ID ' + id + ' ?')) return;
    try {
      setStatus('Deleting...');
      const res = await fetch('/admin/reservations/' + encodeURIComponent(id), { method: 'DELETE' });
      const json = await res.json();
      if (json && json.success) { setStatus('Deleted id ' + id); await load(); } else { setStatus('Delete failed: ' + (json && json.message ? json.message : res.statusText), true); }
    } catch (err) { console.error('Delete error', err); setStatus('Delete failed', true); }
  }

  load();
});

const loadBtn = document.getElementById("load");
const resultsDiv = document.getElementById("results");

loadBtn.addEventListener("click", loadReservations);

async function loadReservations() {
  const key = document.getElementById("apiKey").value.trim();
  if (!key) return alert("Paste ADMIN_API_KEY first");

  try {
    const res = await fetch("/api/reservations", { headers: { "x-api-key": key } });
    const data = await res.json();
    if (!data.success) return alert("Error: " + (data.message || "unknown"));

    const rows = data.reservations;
    if (!rows.length) return (resultsDiv.innerHTML = "<p>No reservations</p>");

    let html = `<table>
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Date</th><th>Time</th><th>People</th>
          <th>Occasion</th><th>Meal</th><th>Payment Mode</th><th>Payment Status</th>
          <th>Message</th><th>Status</th><th>Action</th>
        </tr>
      </thead>
      <tbody>`;

    rows.forEach((r) => {
      html += `<tr>
        <td>${r.id}</td>
        <td><input value="${r.name}"></td>
        <td><input value="${r.email}"></td>
        <td><input value="${r.phone}"></td>
        <td><input value="${r.date}" type="date"></td>
        <td><input value="${r.time}" type="time"></td>
        <td><input value="${r.people}" type="number"></td>
        <td><input value="${r.occasion || ""}"></td>
        <td><input value="${r.meal_type || ""}"></td>
        <td>
          <select>
            <option value="Cash" ${r.payment_mode=="Cash"?"selected":""}>Cash</option>
            <option value="Online" ${r.payment_mode=="Online"?"selected":""}>Online</option>
          </select>
        </td>
        <td>
          <select>
            <option value="pending" ${r.payment_status=="pending"?"selected":""}>Pending</option>
            <option value="completed" ${r.payment_status=="completed"?"selected":""}>Completed</option>
            <option value="not_required" ${r.payment_status=="not_required"?"selected":""}>Not Required</option>
          </select>
        </td>
        <td><input value="${r.message || ""}"></td>
        <td>
          <select>
            <option value="pending" ${r.status=="pending"?"selected":""}>pending</option>
            <option value="confirmed" ${r.status=="confirmed"?"selected":""}>confirmed</option>
          </select>
        </td>
        <td>
          <button onclick="updateReservation(${r.id}, this)" class="ok">Save</button>
          <button onclick="deleteReservation(${r.id})" class="danger">Delete</button>
        </td>
      </tr>`;
    });

    html += "</tbody></table>";
    resultsDiv.innerHTML = html;

  } catch (err) {
    console.error(err);
    alert("Failed to load reservations");
  }
}

async function updateReservation(id, btn) {
  const row = btn.closest("tr");
  const inputs = row.querySelectorAll("input, select");
  const [name, email, phone, date, time, people, occasion, meal_type, payment_mode, payment_status, message, status] =
    Array.from(inputs).map(i => i.value);
  const key = document.getElementById("apiKey").value.trim();

  try {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PUT",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, date, time, people, occasion, meal_type, message, payment_mode, payment_status, status }),
    });
    const data = await res.json();
    if (data.success) alert("Updated successfully");
    else alert("Failed to update: " + (data.message || "unknown"));
  } catch (err) {
    console.error(err);
    alert("Server error while updating");
  }
}

async function deleteReservation(id) {
  const key = document.getElementById("apiKey").value.trim();
  if (!confirm("Delete reservation #" + id + "?")) return;
  try {
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE", headers: { "x-api-key": key } });
    const data = await res.json();
    if (data.success) alert("Deleted successfully");
    else alert("Failed to delete: " + (data.message || "unknown"));
    loadReservations();
  } catch (err) {
    console.error(err);
    alert("Server error while deleting");
  }
}

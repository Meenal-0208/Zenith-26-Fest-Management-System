// Zenith '26 - Fest Admin Dashboard JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const statTotalEvents = document.getElementById("stat-total-events");
  const statTotalRegistrations = document.getElementById("stat-total-registrations");
  const statUtilizationPct = document.getElementById("stat-utilization-pct");
  const statUtilizationBar = document.getElementById("stat-utilization-bar");
  const statUpcomingEvents = document.getElementById("stat-upcoming-events");
  const categoryBreakdownContainer = document.getElementById("category-breakdown-container");
  const eventsTableBody = document.getElementById("events-table-body");
  const registrationsTableBody = document.getElementById("registrations-table-body");
  const regEventFilter = document.getElementById("reg-event-filter");
  const eventsTableCount = document.getElementById("events-table-count");
  const registrationsTableCount = document.getElementById("registrations-table-count");
  const eventRowCount = document.getElementById("event-row-count");
  const lastUpdatedText = document.getElementById("last-updated-text");
  const refreshAllBtn = document.getElementById("refresh-all-btn");
  const statsError = document.getElementById("stats-error");

  // Tabs
  const tabEventsBtn = document.getElementById("tab-events-btn");
  const tabRegistrationsBtn = document.getElementById("tab-registrations-btn");
  const sectionEventsTable = document.getElementById("section-events-table");
  const sectionRegistrationsTable = document.getElementById("section-registrations-table");

  // Add Event Modal
  const openAddEventBtn = document.getElementById("open-add-event-btn");
  const closeAddEventModal = document.getElementById("close-add-event-modal");
  const addEventModal = document.getElementById("add-event-modal");
  const addEventForm = document.getElementById("add-event-form");
  const addEventAlert = document.getElementById("add-event-alert");

  let allEvents = [];
  let allRegistrations = [];

  // Tab switching
  tabEventsBtn.addEventListener("click", () => {
    tabEventsBtn.className = "pb-3 border-b-2 border-indigo-500 text-white flex items-center space-x-2";
    tabRegistrationsBtn.className = "pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center space-x-2 transition-colors";
    sectionEventsTable.classList.remove("hidden");
    sectionRegistrationsTable.classList.add("hidden");
  });

  tabRegistrationsBtn.addEventListener("click", () => {
    tabRegistrationsBtn.className = "pb-3 border-b-2 border-indigo-500 text-white flex items-center space-x-2";
    tabEventsBtn.className = "pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center space-x-2 transition-colors";
    sectionRegistrationsTable.classList.remove("hidden");
    sectionEventsTable.classList.add("hidden");
  });

  /**
   * Loads statistics from GET /api/stats
   */
  async function loadStats() {
    try {
      statsError.classList.add("hidden");
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch stats`);
      const stats = await res.json();

      statTotalEvents.textContent = stats.total_events;
      statTotalRegistrations.textContent = stats.total_registrations;
      statUtilizationPct.textContent = `${stats.overall_utilization_pct}%`;
      statUtilizationBar.style.width = `${Math.min(100, stats.overall_utilization_pct)}%`;
      statUpcomingEvents.textContent = stats.upcoming_events_count;

      // Render category breakdown
      categoryBreakdownContainer.innerHTML = "";
      const categories = stats.events_by_category || {};
      const catKeys = Object.keys(categories);

      if (catKeys.length === 0) {
        categoryBreakdownContainer.innerHTML = `<div class="text-xs text-slate-400">No categories found.</div>`;
      } else {
        catKeys.forEach((cat) => {
          const count = categories[cat];
          const pct = stats.total_events > 0 ? Math.round((count / stats.total_events) * 100) : 0;
          const box = document.createElement("div");
          box.className = "bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between";
          box.innerHTML = `
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-semibold text-slate-300">${cat}</span>
              <span class="text-indigo-400 font-bold">${count}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div class="bg-indigo-500 h-full rounded-full" style="width: ${pct}%"></div>
            </div>
            <span class="text-[10px] text-slate-500 mt-1">${pct}% of fest events</span>
          `;
          categoryBreakdownContainer.appendChild(box);
        });
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      statsError.textContent = `Stats Error: ${err.message}. Ensure backend is running.`;
      statsError.classList.remove("hidden");
    }
  }

  /**
   * Loads events from GET /api/events and renders table sorted by utilization desc
   */
  async function loadEventsTable() {
    eventsTableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400">Loading events table...</td></tr>`;

    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch events`);
      allEvents = await res.json();

      eventsTableCount.textContent = allEvents.length;
      eventRowCount.textContent = allEvents.length;

      // Populate filter dropdown in registrations tab
      populateEventFilterDropdown(allEvents);

      // Compute registered count and utilization for sorting
      const enriched = allEvents.map((ev) => {
        const registered = Math.max(0, ev.capacity - ev.available_seats);
        const utilPct = ev.capacity > 0 ? (registered / ev.capacity) * 100 : 0;
        return {
          ...ev,
          registered_count: registered,
          utilization_pct: Math.round(utilPct * 10) / 10,
        };
      });

      // Sort by utilization percentage descending (Step 8.3)
      enriched.sort((a, b) => b.utilization_pct - a.utilization_pct);

      if (enriched.length === 0) {
        eventsTableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400">No events found in database.</td></tr>`;
        return;
      }

      eventsTableBody.innerHTML = "";
      enriched.forEach((ev) => {
        const isHighDemand = ev.utilization_pct >= 90; // Over 90% capacity highlight (Step 8.4)
        const isFull = ev.available_seats <= 0;

        const row = document.createElement("tr");
        row.className = `transition-colors hover:bg-slate-850 ${
          isHighDemand ? "bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-amber-500" : "hover:bg-slate-800/40"
        }`;

        row.innerHTML = `
          <td class="py-3.5 px-4 font-medium text-white flex items-center space-x-2">
            <span class="text-xl">${ev.icon || "📅"}</span>
            <div>
              <div class="font-bold">${escapeHtml(ev.title)}</div>
              <span class="text-[11px] text-slate-400">#${ev.id} • Fee: ${ev.fee === 0 ? "Free" : "₹" + ev.fee}</span>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              ${ev.category}
            </span>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-300">
            <div>${ev.event_date}</div>
            <div class="text-slate-500">${ev.event_time}</div>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-300">${escapeHtml(ev.venue)}</td>
          <td class="py-3.5 px-4 text-xs font-semibold">
            <span class="${isHighDemand ? 'text-amber-300' : 'text-slate-200'}">${ev.registered_count}</span>
            <span class="text-slate-500">/ ${ev.capacity}</span>
          </td>
          <td class="py-3.5 px-4">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold ${isHighDemand ? 'text-amber-400' : 'text-indigo-300'}">
                ${ev.utilization_pct}%
              </span>
              <div class="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div class="${isHighDemand ? 'bg-amber-400' : 'bg-indigo-500'} h-full rounded-full" style="width: ${Math.min(100, ev.utilization_pct)}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-right">
            ${
              isFull
                ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">FULL</span>`
                : isHighDemand
                ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH DEMAND</span>`
                : `<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">OPEN</span>`
            }
          </td>
        `;

        eventsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading events table:", err);
      eventsTableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-red-400">Failed to load events: ${err.message}</td></tr>`;
    }
  }

  function populateEventFilterDropdown(events) {
    const currentVal = regEventFilter.value;
    regEventFilter.innerHTML = `<option value="">All Events (${events.length})</option>`;
    events.forEach((ev) => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = `${ev.title} (#${ev.id})`;
      regEventFilter.appendChild(opt);
    });
    if (currentVal) regEventFilter.value = currentVal;
  }

  /**
   * Loads registrations from GET /api/registrations (Step 8.5)
   */
  async function loadRegistrationsTable() {
    registrationsTableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400">Loading registrations...</td></tr>`;

    try {
      const filterEventId = regEventFilter.value;
      const url = filterEventId ? `/api/registrations?event_id=${filterEventId}` : "/api/registrations";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch registrations`);
      allRegistrations = await res.json();

      registrationsTableCount.textContent = allRegistrations.length;

      if (allRegistrations.length === 0) {
        registrationsTableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400">No registrations found.</td></tr>`;
        return;
      }

      registrationsTableBody.innerHTML = "";
      allRegistrations.forEach((reg) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-slate-800/40 transition-colors";

        row.innerHTML = `
          <td class="py-3.5 px-4 font-mono text-xs text-slate-400">#${reg.id}</td>
          <td class="py-3.5 px-4 font-semibold text-white">${escapeHtml(reg.student_name)}</td>
          <td class="py-3.5 px-4 font-mono text-xs text-indigo-300">${escapeHtml(reg.roll_number)}</td>
          <td class="py-3.5 px-4 text-xs text-slate-300">
            <div>${escapeHtml(reg.email)}</div>
            ${reg.phone ? `<div class="text-slate-500 text-[11px]">${escapeHtml(reg.phone)}</div>` : ""}
          </td>
          <td class="py-3.5 px-4 text-xs font-medium text-slate-200">
            <span class="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">${escapeHtml(reg.event_title)}</span>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-400">${formatDateTime(reg.registered_at)}</td>
          <td class="py-3.5 px-4 text-right">
            <button
              data-reg-id="${reg.id}"
              data-student-name="${escapeHtml(reg.student_name)}"
              class="cancel-reg-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-600 border border-red-800/60 transition-colors"
              title="Cancel Registration"
            >
              Cancel
            </button>
          </td>
        `;

        registrationsTableBody.appendChild(row);
      });

      // Attach cancel listeners (Stretch Goal 2)
      document.querySelectorAll(".cancel-reg-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const regId = e.currentTarget.getAttribute("data-reg-id");
          const studentName = e.currentTarget.getAttribute("data-student-name");
          handleCancelRegistration(regId, studentName);
        });
      });
    } catch (err) {
      console.error("Error loading registrations:", err);
      registrationsTableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-red-400">Failed to load registrations: ${err.message}</td></tr>`;
    }
  }

  // Filter dropdown change
  regEventFilter.addEventListener("change", () => {
    loadRegistrationsTable();
  });

  /**
   * Cancel registration handler (Stretch Goal 2)
   */
  async function handleCancelRegistration(regId, studentName) {
    const confirmed = window.confirm(`Are you sure you want to cancel registration #${regId} for ${studentName}? This will instantly restore 1 available seat.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.detail || "Could not cancel registration"}`);
        return;
      }

      // Success: refresh all tables and numbers immediately
      await refreshAllData();
    } catch (err) {
      console.error("Failed to cancel registration:", err);
      alert("Network error: Could not cancel registration.");
    }
  }

  /**
   * Add new event modal logic (Stretch Goal 1)
   */
  openAddEventBtn.addEventListener("click", () => {
    addEventAlert.className = "hidden";
    addEventForm.reset();
    document.getElementById("new-event-date").value = "2026-11-14";
    document.getElementById("new-event-time").value = "10:00 AM";
    document.getElementById("new-event-icon").value = "⚡";
    document.getElementById("new-event-capacity").value = "50";
    addEventModal.classList.remove("hidden");
  });

  closeAddEventModal.addEventListener("click", () => {
    addEventModal.classList.add("hidden");
  });

  addEventModal.addEventListener("click", (e) => {
    if (e.target === addEventModal) addEventModal.classList.add("hidden");
  });

  addEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    addEventAlert.className = "hidden";

    const title = document.getElementById("new-event-title").value.trim();
    const category = document.getElementById("new-event-category").value;
    const icon = document.getElementById("new-event-icon").value.trim() || "📅";
    const date = document.getElementById("new-event-date").value.trim();
    const time = document.getElementById("new-event-time").value.trim();
    const venue = document.getElementById("new-event-venue").value.trim();
    const capacity = parseInt(document.getElementById("new-event-capacity").value, 10);
    const fee = parseInt(document.getElementById("new-event-fee").value, 10) || 0;
    const description = document.getElementById("new-event-description").value.trim();

    if (!title || !category || !date || !time || !venue || !capacity || capacity <= 0) {
      showAddEventAlert("Please fill in all required fields and ensure capacity > 0.", "error");
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          icon,
          event_date: date,
          event_time: time,
          venue,
          capacity,
          fee,
          description,
        }),
      });

      const data = await res.json();
      if (res.status === 201) {
        showAddEventAlert(`🎉 Event "${data.title}" created successfully!`, "success");
        setTimeout(async () => {
          addEventModal.classList.add("hidden");
          await refreshAllData();
        }, 1200);
      } else {
        showAddEventAlert(data.detail || "Failed to create event", "error");
      }
    } catch (err) {
      console.error("Failed to create event:", err);
      showAddEventAlert("Network error while creating event.", "error");
    }
  });

  function showAddEventAlert(msg, type) {
    addEventAlert.classList.remove("hidden");
    if (type === "success") {
      addEventAlert.className = "p-3 rounded-xl text-sm font-semibold bg-emerald-950/60 border border-emerald-600/50 text-emerald-300";
    } else {
      addEventAlert.className = "p-3 rounded-xl text-sm font-semibold bg-red-950/60 border border-red-600/50 text-red-300";
    }
    addEventAlert.textContent = msg;
  }

  /**
   * Refreshes all data
   */
  async function refreshAllData() {
    lastUpdatedText.textContent = "Updating...";
    await Promise.all([loadStats(), loadEventsTable(), loadRegistrationsTable()]);
    const now = new Date();
    lastUpdatedText.textContent = `Updated ${now.toLocaleTimeString()}`;
  }

  refreshAllBtn.addEventListener("click", refreshAllData);

  function formatDateTime(isoStr) {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return isoStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial dashboard load
  refreshAllData();
});

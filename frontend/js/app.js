// Zenith '26 - Student Events Portal JavaScript
document.addEventListener("DOMContentLoaded", () => {
  let currentCategory = "All";
  let currentSearch = "";
  let searchTimeout = null;
  let cachedEvents = [];

  const eventsGrid = document.getElementById("events-grid");
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const errorMessage = document.getElementById("error-message");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const categoryButtons = document.querySelectorAll("#category-filters .filter-btn");
  const filterStatusText = document.getElementById("filter-status-text");
  const eventsCountBadge = document.getElementById("events-count-badge");

  // Modal elements
  const modal = document.getElementById("registration-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const registrationForm = document.getElementById("registration-form");
  const formEventId = document.getElementById("form-event-id");
  const formAlert = document.getElementById("form-alert");
  const submitRegisterBtn = document.getElementById("submit-register-btn");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");

  // Category badge colors (Spooky Halloween Palette)
  const categoryBadgeColors = {
    Technical: "bg-purple-950/80 text-purple-300 border-purple-700/60",
    Cultural: "bg-orange-950/80 text-orange-300 border-orange-700/60",
    Sports: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
    Gaming: "bg-red-950/80 text-red-300 border-red-700/60",
    Workshop: "bg-amber-950/80 text-amber-300 border-amber-700/60",
  };


  /**
   * Fetches events from API with real query parameters
   */
  async function fetchEvents() {
    showLoading();

    try {
      const params = new URLSearchParams();
      if (currentCategory && currentCategory !== "All") {
        params.append("category", currentCategory);
      }
      if (currentSearch && currentSearch.trim()) {
        params.append("search", currentSearch.trim());
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/events${queryString}`);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status} (${response.statusText})`);
      }

      const events = await response.json();
      cachedEvents = events;
      renderEvents(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      showError(err.message || "Could not connect to the backend API.");
    }
  }

  // Make available globally for retry button
  window.fetchEvents = fetchEvents;

  /**
   * Renders the event cards in the grid
   */
  function renderEvents(events) {
    hideAllStates();
    eventsGrid.innerHTML = "";

    // Update count badge
    eventsCountBadge.textContent = `${events.length} ${events.length === 1 ? 'event' : 'events'} found`;
    filterStatusText.textContent = currentCategory === "All"
      ? (currentSearch ? `Filtered by "${currentSearch}"` : "Showing all events")
      : `Category: ${currentCategory}${currentSearch ? ` • Search: "${currentSearch}"` : ""}`;

    if (!events || events.length === 0) {
      emptyState.classList.remove("hidden");
      emptyState.classList.add("flex");
      return;
    }

    events.forEach((ev, index) => {
      const isFull = ev.available_seats <= 0;
      const categoryColor = categoryBadgeColors[ev.category] || "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      const feeDisplay = ev.fee === 0 ? "Free" : `₹${ev.fee}`;

      const card = document.createElement("div");
      card.className = "group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-orange-500/80 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-md halloween-card-glow hover:-translate-y-1.5 flex flex-col justify-between animate-fade-in";
      card.style.animationDelay = `${index * 40}ms`;

      card.innerHTML = `
        <div>
          <!-- Header: Icon & Category Badge -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="w-12 h-12 flex items-center justify-center text-2xl bg-slate-900 border border-slate-700/80 rounded-xl group-hover:scale-105 transition-transform">
              ${ev.icon || "📅"}
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColor}">
                ${ev.category}
              </span>
              ${
                isFull
                  ? `<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">FULL</span>`
                  : `<span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${feeDisplay}</span>`
              }
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
            ${escapeHtml(ev.title)}
          </h3>

          <!-- Description preview -->
          <p class="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            ${escapeHtml(ev.description || "No description provided.")}
          </p>

          <!-- Meta: Date, Time, Venue -->
          <div class="space-y-1.5 text-xs text-slate-300 mb-5">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>${formatDate(ev.event_date)} • ${ev.event_time}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="truncate">${escapeHtml(ev.venue)}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
          <div class="text-xs">
            <span class="text-slate-400 block text-[11px]">Availability</span>
            ${
              isFull
                ? `<span class="font-bold text-red-400">0 / ${ev.capacity} seats left</span>`
                : `<span class="font-semibold text-slate-200"><strong class="text-indigo-400">${ev.available_seats}</strong> / ${ev.capacity} left</span>`
            }
          </div>

          <button
            data-event-id="${ev.id}"
            class="view-details-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              isFull
                ? "bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700"
                : "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/40"
            }"
          >
            ${isFull ? "Details" : "Register"}
          </button>

        </div>
      `;

      eventsGrid.appendChild(card);
    });

    // Attach listeners to View Details buttons
    document.querySelectorAll(".view-details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.getAttribute("data-event-id"), 10);
        openEventModal(id);
      });
    });
  }

  /**
   * Opens the event detail modal and loads details
   */
  async function openEventModal(eventId) {
    clearFormErrors();
    formAlert.className = "hidden";
    formAlert.innerHTML = "";
    registrationForm.reset();

    // Find in cache or fetch
    let ev = cachedEvents.find((x) => x.id === eventId);
    if (!ev) {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          ev = await res.json();
        }
      } catch (e) {
        console.error("Failed to load event detail:", e);
      }
    }

    if (!ev) return;

    formEventId.value = ev.id;
    document.getElementById("modal-event-icon").textContent = ev.icon || "📅";
    document.getElementById("modal-event-title").textContent = ev.title;
    document.getElementById("modal-event-category-badge").textContent = ev.category;
    document.getElementById("modal-event-datetime").textContent = `${formatDate(ev.event_date)} • ${ev.event_time}`;
    document.getElementById("modal-event-venue").textContent = ev.venue;
    document.getElementById("modal-event-fee").textContent = ev.fee === 0 ? "Free" : `₹${ev.fee}`;
    document.getElementById("modal-event-seats").textContent = `${ev.available_seats} / ${ev.capacity} left`;
    document.getElementById("modal-event-description").textContent = ev.description || "No full description provided.";

    const isFull = ev.available_seats <= 0;
    if (isFull) {
      submitRegisterBtn.disabled = true;
      btnText.textContent = "Event is Full";
      showAlert("This event has reached full capacity. No new registrations can be accepted.", "warning");
    } else {
      submitRegisterBtn.disabled = false;
      btnText.textContent = "Confirm Registration";
    }

    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  /**
   * Registration form submit with client + server validation
   */
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors();
    formAlert.className = "hidden";

    const eventId = parseInt(formEventId.value, 10);
    const studentName = document.getElementById("student-name").value.trim();
    const rollNumber = document.getElementById("roll-number").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    // 1. Client-side validation
    let hasError = false;
    if (!studentName) {
      showFieldError("student-name", "Student name is required");
      hasError = true;
    }
    if (!rollNumber) {
      showFieldError("roll-number", "Roll number is required");
      hasError = true;
    }
    if (!email) {
      showFieldError("email", "Email address is required");
      hasError = true;
    } else if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
      showFieldError("email", "Please enter a valid email address containing '@'");
      hasError = true;
    }

    if (hasError) return;

    // Set submitting state
    setSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_name: studentName,
          roll_number: rollNumber,
          email: email,
          phone: phone || null,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        // Success
        const evTitle = document.getElementById("modal-event-title").textContent;
        showAlert(`🎉 Successfully registered for ${evTitle}! Confirmation ID: #${data.id}`, "success");
        registrationForm.reset();

        // Refresh event data so seats update immediately
        await fetchEvents();

        setTimeout(() => {
          closeModal();
        }, 1800);
      } else {
        // Error from server (400, 404, 409, etc.)
        const errorMsg = data.detail || "Registration failed. Please try again.";
        showAlert(errorMsg, "error");
      }
    } catch (err) {
      console.error("Network error during registration:", err);
      showAlert("Failed to communicate with server. Please verify your connection.", "error");
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(isSubmitting) {
    submitRegisterBtn.disabled = isSubmitting;
    if (isSubmitting) {
      btnText.textContent = "Processing...";
      btnSpinner.classList.remove("hidden");
    } else {
      btnText.textContent = "Confirm Registration";
      btnSpinner.classList.add("hidden");
    }
  }

  function showAlert(message, type) {
    formAlert.classList.remove("hidden");
    if (type === "success") {
      formAlert.className = "p-3 rounded-xl text-sm font-semibold bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 animate-fade-in";
    } else if (type === "warning") {
      formAlert.className = "p-3 rounded-xl text-sm font-semibold bg-amber-950/60 border border-amber-600/50 text-amber-300 animate-fade-in";
    } else {
      formAlert.className = "p-3 rounded-xl text-sm font-semibold bg-red-950/60 border border-red-600/50 text-red-300 animate-fade-in";
    }
    formAlert.textContent = message;
  }

  function showFieldError(fieldId, errorMsg) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = errorMsg;
      errorEl.classList.remove("hidden");
    }
    if (inputEl) {
      inputEl.classList.add("border-red-500", "focus:ring-red-500/20");
    }
  }

  function clearFormErrors() {
    ["student-name", "roll-number", "email"].forEach((fieldId) => {
      const errorEl = document.getElementById(`error-${fieldId}`);
      const inputEl = document.getElementById(fieldId);
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
      }
      if (inputEl) {
        inputEl.classList.remove("border-red-500", "focus:ring-red-500/20");
      }
    });
  }

  // Category filter click handlers
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      currentCategory = category;

      // Update button visual states
      categoryButtons.forEach((b) => {
        b.className = "filter-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all bg-black text-slate-300 hover:text-orange-300 hover:bg-[#150d24] border border-orange-950/80";
      });
      btn.className = "filter-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-orange-600 text-white shadow-sm shadow-orange-600/40";

      fetchEvents();
    });
  });

  // Search input handler with 300ms debounce
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value.trim();
      fetchEvents();
    }, 300);
  });

  window.resetFilters = () => {
    currentCategory = "All";
    currentSearch = "";
    searchInput.value = "";
    categoryButtons.forEach((b) => {
      if (b.getAttribute("data-category") === "All") {
        b.className = "filter-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-orange-600 text-white shadow-sm shadow-orange-600/40";
      } else {
        b.className = "filter-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all bg-black text-slate-300 hover:text-orange-300 hover:bg-[#150d24] border border-orange-950/80";
      }
    });
    fetchEvents();
  };


  // State helpers
  function showLoading() {
    loadingState.classList.remove("hidden");
    loadingState.classList.add("flex");
    errorState.classList.add("hidden");
    emptyState.classList.add("hidden");
    eventsGrid.innerHTML = "";
    eventsCountBadge.textContent = "Loading...";
  }

  function showError(msg) {
    loadingState.classList.add("hidden");
    emptyState.classList.add("hidden");
    eventsGrid.innerHTML = "";
    errorMessage.textContent = msg;
    errorState.classList.remove("hidden");
    errorState.classList.add("flex");
    eventsCountBadge.textContent = "Error";
  }

  function hideAllStates() {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    emptyState.classList.add("hidden");
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    try {
      const parts = isoStr.split("-");
      if (parts.length === 3) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parseInt(parts[2], 10)} ${monthNames[mIdx] || parts[1]}`;
      }
    } catch (_) {}
    return isoStr;
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

  // Initial load
  fetchEvents();
});

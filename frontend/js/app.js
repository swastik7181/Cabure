(() => {
  "use strict";

  // Point this at your backend. Override by setting window.CABURE_API_BASE
  // before this script loads (e.g. in a small inline <script> tag) if you
  // deploy the frontend and backend to different hosts.
  const API_BASE = window.CABURE_API_BASE || "http://localhost:4000";

  const SERVICE_COLORS = {
    Uber: "#2dd4bf",
    Ola: "#ff6b6b",
    Meru: "#f5b700",
  };
  const SERVICE_BOOK_LINKS = {
    Uber: "https://www.uber.com/in/en/ride/",
    Ola: "https://book.olacabs.com/",
    Meru: "https://book.meru.in/login",
  };
  const VEHICLE_ORDER = ["Bike", "Auto", "Hatchback", "Sedan", "SUV"];

  const form = document.getElementById("compare-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnLabel = submitBtn.querySelector(".btn-label");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");

  const emailToggle = document.getElementById("email-toggle");
  const emailInput = document.getElementById("email");

  const errorPanel = document.getElementById("error-panel");
  const errorMessage = document.getElementById("error-message");

  const resultsSection = document.getElementById("results");
  const mockNote = document.getElementById("mock-note");

  let chartInstance = null;

  emailToggle.addEventListener("change", () => {
    emailInput.classList.toggle("hidden", !emailToggle.checked);
    if (!emailToggle.checked) emailInput.value = "";
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnLabel.textContent = isLoading ? "Dispatching…" : "Compare fares";
    btnSpinner.classList.toggle("hidden", !isLoading);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorPanel.classList.remove("hidden");
  }

  function clearError() {
    errorPanel.classList.add("hidden");
    errorMessage.textContent = "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const source = document.getElementById("source").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const email = emailToggle.checked ? emailInput.value.trim() : "";

    if (!source || !destination) {
      showError("Please fill in both a pickup and a drop-off location.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("That email address doesn't look right.");
      return;
    }

    setLoading(true);
    resultsSection.classList.add("hidden");

    try {
      const response = await fetch(`${API_BASE}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination, email: email || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong fetching fares.");
      }

      renderResults(data);
    } catch (err) {
      showError(
        err.message ||
          "We couldn't reach the Caburé backend. Is it running at " + API_BASE + "?"
      );
    } finally {
      setLoading(false);
    }
  });

  function renderResults(data) {
    mockNote.hidden = !data.mock;

    document.getElementById("results-route-title").textContent =
      `${data.source} → ${data.destination}`;

    document.getElementById("route-duration").textContent = data.route?.duration || "—";
    document.getElementById("route-distance").textContent = data.route?.distance || "—";
    document.getElementById("route-desc").textContent = data.route?.route || "—";
    document.getElementById("route-traffic-note").textContent = data.route?.trafficNote || "";

    const mapImg = document.getElementById("map-screenshot");
    const mapFallback = document.getElementById("map-fallback");
    if (data.mapScreenshotUrl) {
      mapImg.src = `${API_BASE}${data.mapScreenshotUrl}`;
      mapImg.classList.remove("hidden");
      mapFallback.classList.add("hidden");
    } else {
      mapImg.classList.add("hidden");
      mapFallback.classList.remove("hidden");
    }

    document.getElementById("pdf-link").href = `${API_BASE}${data.pdfUrl}`;

    renderChart(data.fares);
    renderManifestCards(data.fares);

    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fareToNumber(fare) {
    const n = Number(fare);
    return Number.isFinite(n) ? n : 0;
  }

  function renderChart(fares) {
    const ctx = document.getElementById("fares-chart");
    const datasets = fares.map((service) => ({
      label: service.Service,
      data: VEHICLE_ORDER.map((type) => {
        const detail = service.Details.find((d) => d.Type === type);
        return detail ? fareToNumber(detail.Fare) : 0;
      }),
      backgroundColor: SERVICE_COLORS[service.Service] || "#999",
      borderRadius: 4,
      maxBarThickness: 22,
    }));

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels: VEHICLE_ORDER, datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#f3f1ea", font: { family: "Inter" } } },
          tooltip: {
            callbacks: {
              label: (item) =>
                item.raw > 0 ? ` ${item.dataset.label}: ₹${item.raw}` : ` ${item.dataset.label}: N/A`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#9aa1b0", font: { family: "Inter" } },
            grid: { color: "rgba(255,255,255,0.06)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#9aa1b0", font: { family: "JetBrains Mono" } },
            grid: { color: "rgba(255,255,255,0.06)" },
          },
        },
      },
    });
  }

  function renderManifestCards(fares) {
    const grid = document.getElementById("manifest-grid");
    grid.innerHTML = "";

    fares.forEach((service) => {
      const card = document.createElement("article");
      card.className = "ticket";
      card.style.setProperty("--service-color", SERVICE_COLORS[service.Service] || "#f5b700");

      const rows = VEHICLE_ORDER.map((type) => {
        const detail = service.Details.find((d) => d.Type === type);
        const fare = detail ? detail.Fare : "NOT AVAILABLE";
        const isAvailable = fare !== "NOT AVAILABLE";
        return `
          <div class="ticket-row">
            <span class="vehicle">${type}</span>
            <span class="fare ${isAvailable ? "" : "unavailable"}">
              ${isAvailable ? "₹" + fare : "N/A"}
            </span>
          </div>`;
      }).join("");

      const bookHref = SERVICE_BOOK_LINKS[service.Service] || "#";

      card.innerHTML = `
        <div class="ticket-header">
          <span class="ticket-service">${service.Service}</span>
        </div>
        <div class="ticket-rows">${rows}</div>
        <a class="ticket-book" href="${bookHref}" target="_blank" rel="noopener">Book ${service.Service} ↗</a>
      `;

      grid.appendChild(card);
    });
  }
})();

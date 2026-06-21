/* ---------- nav ---------- */
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    
    // Automatically matches target views based on dataset values
    const targetView = document.getElementById("view-" + btn.dataset.view);
    if (targetView) {
      targetView.classList.add("active");
    }
  });
});

/* ---------- shared card renderer ---------- */
function badgeLabel(sev) {
  return { critical: "Critical", warning: "Warning", resolved: "Resolved" }[sev] || sev;
}

function renderCards(container, items, metaLine) {
  if (!container) return;
  container.innerHTML = "";
  items.forEach(i => {
    const card = document.createElement("div");
    card.className = "icard";
    card.innerHTML = `
      <div class="icard-top">
        <span class="icard-tag">${i.cat}</span>
        <span class="badge ${i.sev}">${badgeLabel(i.sev)}</span>
      </div>
      <p class="icard-title">${i.title}</p>
      <p class="icard-detail">${i.detail}</p>
      <div class="icard-fix">
        <span class="icon">&#9679;</span>
        <p>${i.fix}</p>
      </div>
      ${metaLine ? `<div class="icard-meta">${metaLine(i)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

/* ---------- overview ---------- */
function renderStatGrid() {
  const counts = { critical: 0, warning: 0, resolved: 0 };
  if (typeof OVERVIEW_ISSUES !== "undefined") {
    OVERVIEW_ISSUES.forEach(i => counts[i.sev]++);
  }
  const grid = document.getElementById("stat-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div class="stat-card"><p class="stat-label">Critical issues</p><p class="stat-value red">${counts.critical}</p></div>
    <div class="stat-card"><p class="stat-label">Warnings</p><p class="stat-value amber">${counts.warning}</p></div>
    <div class="stat-card"><p class="stat-label">Resolved</p><p class="stat-value teal">${counts.resolved}</p></div>
    <div class="stat-card"><p class="stat-label">Connections registered</p><p class="stat-value">${typeof CONNECTIONS !== "undefined" ? CONNECTIONS.length : 0}</p></div>
  `;
}

function renderOverview(filter) {
  if (typeof OVERVIEW_ISSUES === "undefined") return;
  const items = OVERVIEW_ISSUES.filter(i => filter === "all" || i.sev === filter);
  renderCards(document.getElementById("overview-list"), items);
}

document.querySelectorAll("#overview-filters .chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#overview-filters .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    renderOverview(chip.dataset.f);
  });
});

/* ---------- connections ---------- */
function renderConnections() {
  const grid = document.getElementById("conn-grid");
  if (!grid || typeof CONNECTIONS === "undefined") return;
  grid.innerHTML = "";
  CONNECTIONS.forEach(c => {
    const card = document.createElement("div");
    card.className = "conn-card";
    const initials = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    card.innerHTML = `
      <div class="conn-icon">${initials}</div>
      <div style="flex:1; min-width:0;">
        <p class="conn-name">${c.name}</p>
        <p class="conn-scope">${c.scope}</p>
      </div>
      <span class="badge ${c.risk === "low" ? "resolved" : c.risk === "medium" ? "warning" : "critical"}">${c.risk}</span>
    `;
    grid.appendChild(card);
  });
}

/* ---------- code review ---------- */
const CR_CATEGORIES = ["all", "Security", "Dependencies", "AI provenance", "Code quality", "Test coverage", "Performance", "Style", "Process", "Compliance & Testing"];

function renderCrFilters() {
  const row = document.getElementById("cr-filters");
  if (!row) return;
  row.innerHTML = "";
  CR_CATEGORIES.forEach((cat, idx) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (idx === 0 ? " active" : "");
    chip.textContent = cat === "all" ? "All categories" : cat;
    chip.dataset.cat = cat;
    chip.addEventListener("click", () => {
      row.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderCodeReview(cat);
    });
    row.appendChild(chip);
  });
}

function renderCrSummary() {
  const counts = { critical: 0, warning: 0, resolved: 0 };
  if (typeof CODE_REVIEW !== "undefined") {
    CODE_REVIEW.forEach(i => counts[i.sev]++);
  }
  const summary = document.getElementById("cr-summary");
  if (!summary) return;
  summary.innerHTML = `
    <div class="stat-card"><p class="stat-label">Blocking issues</p><p class="stat-value red">${counts.critical}</p></div>
    <div class="stat-card"><p class="stat-label">Needs attention</p><p class="stat-value amber">${counts.warning}</p></div>
    <div class="stat-card"><p class="stat-label">Resolved this scan</p><p class="stat-value teal">${counts.resolved}</p></div>
    <div class="stat-card"><p class="stat-label">Files scanned</p><p class="stat-value">214</p></div>
  `;
}

function renderCodeReview(cat) {
  if (typeof CODE_REVIEW === "undefined") return;
  const items = CODE_REVIEW.filter(i => cat === "all" || i.cat === cat);
  renderCards(document.getElementById("cr-list"), items, i => `<span>${i.file}</span>`);
}

const rescanBtn = document.getElementById("cr-rescan");
if (rescanBtn) {
  rescanBtn.addEventListener("click", () => {
    rescanBtn.disabled = true;
    rescanBtn.innerHTML = `<span class="icon">&#8635;</span> Scanning…`;
    setTimeout(() => {
      rescanBtn.disabled = false;
      rescanBtn.innerHTML = `<span class="icon">&#8635;</span> Re-run scan`;
      renderCrSummary();
      renderCodeReview(document.querySelector("#cr-filters .chip.active")?.dataset.cat || "all");
    }, 900);
  });
}

/* ---------- registry ---------- */
function renderRegistry() {
  const tbody = document.querySelector("#registry-table tbody");
  if (!tbody || typeof REGISTRY === "undefined") return;
  tbody.innerHTML = "";
  REGISTRY.forEach(r => {
    const statusClass = r.status === "Approved" ? "resolved" : r.status === "Quarantined" ? "critical" : "warning";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${r.name}</td>
      <td>${r.type}</td>
      <td class="mono">${r.version}</td>
      <td>${r.source}</td>
      <td><span class="badge ${statusClass}">${r.status}</span></td>
    `;
    tbody.appendChild(row);
  });
}

/* ---------- init ---------- */
renderStatGrid();
renderOverview("all");
renderConnections();
renderCrFilters();
renderCrSummary();
renderCodeReview("all");
renderRegistry();
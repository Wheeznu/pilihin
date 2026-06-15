// frontend/js/logic-pages/laporan.js

function showToast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatNumber(num) {
  return new Intl.NumberFormat("id-ID").format(num);
}

function getMonthName(month) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return months[month];
}

function initPage() {
  // Load data
  const _db = JSON.parse(localStorage.getItem("pilih-in-db"));
  let films = _db?.films || [];
  let users = _db?.users || [];
  let reviews = _db?.reviews || [];
  let actors = _db?.actors || [];
  let directors = _db?.directors || [];

  // Date filter elements
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const periodSelect = document.getElementById("periodSelect");
  const applyFilterBtn = document.getElementById("applyFilter");
  const exportBtn = document.getElementById("exportBtn");

  let currentStartDate = null;
  let currentEndDate = null;

  // Helper to filter by date
  function filterByDate(items, dateField = "createdAt") {
    if (!currentStartDate && !currentEndDate) return items;
    return items.filter((item) => {
      const itemDate = new Date(item[dateField]);
      if (currentStartDate && itemDate < currentStartDate) return false;
      if (currentEndDate && itemDate > currentEndDate) return false;
      return true;
    });
  }

  // Update stats
  function updateStats() {
    let filteredFilms = filterByDate(films);
    let filteredUsers = filterByDate(users);
    let filteredReviews = filterByDate(reviews, "createdAt");
    let filteredActors = filterByDate(actors);
    let filteredDirectors = filterByDate(directors);

    // Total views from films (mock)
    const totalViews = filteredFilms.reduce(
      (sum, f) => sum + (f.watchCount || 0),
      0,
    );

    document.getElementById("totalFilms").textContent = formatNumber(
      filteredFilms.length,
    );
    document.getElementById("totalUsers").textContent = formatNumber(
      filteredUsers.length,
    );
    document.getElementById("totalReviews").textContent = formatNumber(
      filteredReviews.length,
    );
    document.getElementById("totalViews").textContent =
      formatNumber(totalViews);
  }

  // Update top films chart
  function updateTopFilms() {
    let filteredFilms = filterByDate(films);
    const topFilms = [...filteredFilms]
      .sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0))
      .slice(0, 5);

    const container = document.getElementById("topFilmsChart");
    if (!container) return;

    if (topFilms.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada data film</div>';
      return;
    }

    const maxCount = Math.max(...topFilms.map((f) => f.watchCount || 0), 1);
    container.innerHTML = topFilms
      .map((film) => {
        const percent = ((film.watchCount || 0) / maxCount) * 100;
        return `
        <div class="chart-bar-item">
          <div class="chart-bar-label">${escapeHtml(film.title || "-")}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${percent}%">
              ${formatNumber(film.watchCount || 0)}
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Update rating distribution
  function updateRatingDistribution() {
    let filteredReviews = filterByDate(reviews, "createdAt");
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredReviews.forEach((r) => {
      const rating = Math.floor(r.rating);
      if (rating >= 1 && rating <= 5) ratingCounts[rating]++;
    });

    const total = filteredReviews.length;
    const container = document.getElementById("ratingChart");
    if (!container) return;

    if (total === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada data rating</div>';
      return;
    }

    const stars = [
      { label: "⭐ 5", value: ratingCounts[5] },
      { label: "⭐ 4", value: ratingCounts[4] },
      { label: "⭐ 3", value: ratingCounts[3] },
      { label: "⭐ 2", value: ratingCounts[2] },
      { label: "⭐ 1", value: ratingCounts[1] },
    ];

    container.innerHTML = stars
      .map((star) => {
        const percent = (star.value / total) * 100;
        return `
        <div class="rating-row">
          <div class="rating-label">${star.label}</div>
          <div class="rating-bar-track">
            <div class="rating-bar-fill" style="width: ${percent}%">
              ${star.value}
            </div>
          </div>
          <div class="rating-percent">${percent.toFixed(1)}%</div>
        </div>
      `;
      })
      .join("");
  }

  // Update recent content table
  function updateRecentContent() {
    let filteredFilms = filterByDate(films);
    const recentFilms = [...filteredFilms]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);

    const tbody = document.getElementById("recentContentTable");
    if (!tbody) return;

    if (recentFilms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px;">
            Belum ada data konten
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recentFilms
      .map(
        (film) => `
      <tr>
        <td><strong>${escapeHtml(film.title || "-")}</strong></td>
        <td>Film</td>
        <td>${formatDate(film.createdAt)}</td>
        <td><span class="status-badge status-published">Published</span></td>
      </tr>
    `,
      )
      .join("");
  }

  // Update category stats
  function updateCategoryStats() {
    let filteredFilms = filterByDate(films);
    let filteredActors = filterByDate(actors);
    let filteredDirectors = filterByDate(directors);
    let filteredReviews = filterByDate(reviews, "createdAt");

    document.getElementById("totalActors").textContent = formatNumber(
      filteredActors.length,
    );
    document.getElementById("totalDirectors").textContent = formatNumber(
      filteredDirectors.length,
    );
    document.getElementById("totalContent").textContent = formatNumber(
      filteredFilms.length + filteredActors.length + filteredDirectors.length,
    );
    document.getElementById("avgRating").textContent =
      calculateAvgRating(filteredReviews);
  }

  function calculateAvgRating(reviews) {
    if (reviews.length === 0) return "0";
    const sum = reviews.reduce((total, r) => total + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setPeriod(period) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case "week":
        start.setDate(today.getDate() - 7);
        break;
      case "month":
        start.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(today.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start = null;
        end = null;
    }

    currentStartDate = start;
    currentEndDate = end;

    if (startDateInput)
      startDateInput.value = start ? start.toISOString().split("T")[0] : "";
    if (endDateInput)
      endDateInput.value = end ? end.toISOString().split("T")[0] : "";
  }

  function applyFilter() {
    if (startDateInput && startDateInput.value) {
      currentStartDate = new Date(startDateInput.value);
    } else {
      currentStartDate = null;
    }

    if (endDateInput && endDateInput.value) {
      currentEndDate = new Date(endDateInput.value);
      currentEndDate.setHours(23, 59, 59);
    } else {
      currentEndDate = null;
    }

    refreshAllData();
    showToast("Filter diterapkan");
  }

  function refreshAllData() {
    const _db = JSON.parse(localStorage.getItem("pilih-in-db"));
    films = _db?.films || [];
    users = _db?.users || [];
    reviews = _db?.reviews || [];
    actors = _db?.actors || [];
    directors = _db?.directors || [];

    updateStats();
    updateTopFilms();
    updateRatingDistribution();
    updateRecentContent();
    updateCategoryStats();
  }

  function exportData() {
    const data = {
      films: filterByDate(films),
      users: filterByDate(users),
      reviews: filterByDate(reviews, "createdAt"),
      actors: filterByDate(actors),
      directors: filterByDate(directors),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan_pilih_in_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data berhasil diekspor!");
  }

  // Event listeners
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      setPeriod(e.target.value);
      refreshAllData();
    });
  }

  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", applyFilter);
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportData);
  }

  // Initial load
  refreshAllData();
}

// Helper untuk status badge
function statusBadge(status) {
  if (status === "published") {
    return '<span class="status-badge status-published">Published</span>';
  }
  if (status === "pending") {
    return '<span class="status-badge status-pending">Pending</span>';
  }
  return '<span class="status-badge status-pending">Pending</span>';
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}

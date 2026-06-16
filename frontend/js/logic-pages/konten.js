import { getDbReady, apiRequest } from "../../../backend/init.js";

function escHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(msg, type) {
  const ex = document.querySelector(".toast");
  if (ex) ex.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function statusPill(status) {
  const s = (status || "pending").toLowerCase();
  const labels = { published: "Published", pending: "Menunggu", rejected: "Ditolak" };
  return `<span class="status-pill ${s}">${labels[s] || s}</span>`;
}

function fi() {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
}

function getMasterDb() {
  return JSON.parse(localStorage.getItem("pilih-in-db"));
}

function initPage() {
  const TAB_CONFIG = {
    film: {
      label: "Film",
      icon: "film",
      editPage: "film-edit.html",
      idField: "id",
      titleField: "title",
    },
    aktor: {
      label: "Aktor",
      icon: "users",
      editPage: "aktor-edit.html",
      idField: "id",
      titleField: "name",
    },
    sutradara: {
      label: "Sutradara",
      icon: "user",
      editPage: "sutradara-edit.html",
      idField: "id",
      titleField: "name",
    },
    artikel: {
      label: "Artikel & Berita",
      icon: "file-text",
      editPage: "artikel-edit.html",
      idField: "id",
      titleField: "title",
    },
  };

  let currentTab = "film";
  let allData = {};
  let filteredItems = [];
  let currentPage = 1;
  const perPage = 10;
  let searchQuery = "";

  const modal = document.getElementById("deleteModal");
  const deleteTitle = document.getElementById("deleteItemTitle");
  let deleteTarget = null;

  function loadAllData() {
    const db = getMasterDb();

    allData = {
      film: db?.films || [],
      aktor: db?.actors || [],
      sutradara: db?.directors || [],
    };

    const articles = (db?.articles || []).map((a) => ({ ...a, _subtype: "artikel" }));
    const news = (db?.news || []).map((n) => ({ ...n, _subtype: "berita" }));
    allData.artikel = [...articles, ...news].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }

  function getCounts() {
    const films = allData.film || [];
    const aktors = allData.aktor || [];
    const sutradaras = allData.sutradara || [];
    const artikels = (allData.artikel || []).filter((a) => a._subtype === "artikel");
    const beritas = (allData.artikel || []).filter((a) => a._subtype === "berita");
    const allItems = [...films, ...aktors, ...sutradaras, ...allData.artikel];
    const published = allItems.filter((i) => i.status === "published").length;
    const pending = allItems.filter((i) => i.status === "pending").length;

    return { films: films.length, aktors: aktors.length, sutradaras: sutradaras.length, artikels: artikels.length, beritas: beritas.length, published, pending };
  }

  function renderStats() {
    const c = getCounts();
    const container = document.getElementById("statsContainer");
    container.innerHTML = [
      { label: "Total Film", num: c.films, icon: "film" },
      { label: "Total Aktor", num: c.aktors, icon: "users" },
      { label: "Total Sutradara", num: c.sutradaras, icon: "user" },
      { label: "Artikel", num: c.artikels, icon: "file-text" },
      { label: "Berita", num: c.beritas, icon: "file-text" },
      { label: "Published", num: c.published, icon: "check-circle" },
      { label: "Pending", num: c.pending, icon: "clock" },
    ]
      .map(
        (s) => `
          <div class="ak-stat">
            <div class="ak-stat__icon"><i data-feather="${s.icon}"></i></div>
            <div>
              <div class="ak-stat__label">${s.label}</div>
              <div class="ak-stat__num">${s.num}</div>
            </div>
          </div>`
      )
      .join("");
    fi();
  }

  function applyFilters() {
    let items = [...(allData[currentTab] || [])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          (item.title || item.name || "").toLowerCase().includes(q) ||
          (item.id || "").toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    filteredItems = items;
  }

  function renderTable() {
    const thead = document.getElementById("tableHead");
    const tbody = document.getElementById("tableBody");

    const cols = getTableColumns();
    thead.innerHTML = `<tr>${cols.headers.map((h) => `<th>${h}</th>`).join("")}<th>Aksi</th></tr>`;

    const start = (currentPage - 1) * perPage;
    const page = filteredItems.slice(start, start + perPage);

    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cols.headers.length + 1}"><div class="ak-empty"><div class="ak-empty__icon"><i data-feather="${TAB_CONFIG[currentTab].icon}"></i></div><h3>Tidak Ada Data</h3><p>Belum ada ${TAB_CONFIG[currentTab].label.toLowerCase()} yang tersedia.</p></div></td></tr>`;
      fi();
      return;
    }

    tbody.innerHTML = page
      .map((item) => {
        const cells = cols.render(item);
        const editHref = `${TAB_CONFIG[currentTab].editPage}?id=${escHtml(item.id)}`;
        return `<tr>
          ${cells.map((c) => `<td>${c}</td>`).join("")}
          <td class="td-actions">
            <div class="action-wrap">
              <a href="${editHref}" class="btn-act btn-act--edit">
                <i data-feather="edit-2"></i> Edit
              </a>
              <button class="btn-act btn-act--delete" data-id="${escHtml(item.id)}" data-title="${escHtml(item.title || item.name || "")}" data-type="${currentTab}">
                <i data-feather="trash-2"></i> Hapus
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    document.querySelectorAll(".btn-act--delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteTarget = { id: btn.dataset.id, type: btn.dataset.type };
        if (deleteTitle) deleteTitle.textContent = btn.dataset.title;
        if (modal) modal.classList.add("show");
      });
    });
    fi();
  }

  function getTableColumns() {
    const cols = {
      film: {
        headers: ["Poster", "Judul Film", "Rating", "Rilis", "Pemeran", "Status"],
        render: (f) => [
          `<div class="td-poster">${f.poster ? `<img src="${escHtml(f.poster)}" class="poster-thumb" alt="">` : `<div class="no-poster"><i data-feather="image"></i></div>`}</div>`,
          `<div class="td-title"><strong>${escHtml(f.title || "-")}</strong><span class="item-id">${escHtml(f.id)}</span></div>`,
          `<span class="rating-pill"><i data-feather="star"></i> ${(f.averageRating || f.rating || 0)}/10</span>`,
          f.releaseDate ? new Date(f.releaseDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
          `${f.actors?.length || 0} pemeran`,
          statusPill(f.status),
        ],
      },
      aktor: {
        headers: ["Foto", "Nama Aktor", "Tgl Lahir", "Film", "Status"],
        render: (a) => [
          `<div class="td-poster">${a.photo ? `<img src="${escHtml(a.photo)}" class="photo-thumb" alt="">` : `<div class="no-poster"><i data-feather="camera"></i></div>`}</div>`,
          `<div class="td-title"><strong>${escHtml(a.name || "-")}</strong><span class="item-id">${escHtml(a.id)}</span></div>`,
          a.birthDate ? new Date(a.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
          `<span class="films-count">${a.films?.length || 0} film</span>`,
          statusPill(a.status),
        ],
      },
      sutradara: {
        headers: ["Foto", "Nama Sutradara", "Tgl Lahir", "Film", "Status"],
        render: (s) => [
          `<div class="td-poster">${s.photo ? `<img src="${escHtml(s.photo)}" class="photo-thumb" alt="">` : `<div class="no-poster"><i data-feather="camera"></i></div>`}</div>`,
          `<div class="td-title"><strong>${escHtml(s.name || "-")}</strong><span class="item-id">${escHtml(s.id)}</span></div>`,
          s.birthDate ? new Date(s.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
          `<span class="films-count">${s.films?.length || 0} film</span>`,
          statusPill(s.status),
        ],
      },
      artikel: {
        headers: ["Thumbnail", "Judul", "Tipe", "Kategori", "Tanggal", "Status"],
        render: (a) => [
          `<div class="td-poster">${a.coverImage ? `<img src="${escHtml(a.coverImage)}" class="poster-thumb" alt="">` : `<div class="no-poster"><i data-feather="image"></i></div>`}</div>`,
          `<div class="td-title"><strong>${escHtml(a.title || "-")}</strong><span class="item-id">${escHtml(a.slug || a.id)}</span></div>`,
          `<span class="type-badge type-badge--${a._subtype}">${a._subtype === "artikel" ? "Artikel" : "Berita"}</span>`,
          escHtml(a.category || "-"),
          a.createdAt ? new Date(a.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
          statusPill(a.status),
        ],
      },
    };
    return cols[currentTab] || cols.film;
  }

  function renderPagination() {
    const container = document.getElementById("pagination");
    if (!container) return;
    const total = Math.ceil(filteredItems.length / perPage);
    if (total <= 1) {
      container.innerHTML = "";
      return;
    }
    let html = `<button class="prev-btn" ${currentPage === 1 ? "disabled" : ""}><i data-feather="chevron-left"></i></button>`;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="next-btn" ${currentPage === total ? "disabled" : ""}><i data-feather="chevron-right"></i></button>`;
    html += `<span class="page-info">${currentPage} / ${total}</span>`;
    container.innerHTML = html;

    container.querySelector(".prev-btn")?.addEventListener("click", () => {
      if (currentPage > 1) { currentPage--; render(); }
    });
    container.querySelector(".next-btn")?.addEventListener("click", () => {
      if (currentPage < total) { currentPage++; render(); }
    });
    container.querySelectorAll(".page-btn").forEach((b) => {
      b.addEventListener("click", () => { currentPage = parseInt(b.dataset.page); render(); });
    });
    fi();
  }

  function render() {
    applyFilters();
    renderTable();
    renderPagination();
  }

  function switchTab(type) {
    currentTab = type;
    searchQuery = "";
    document.getElementById("searchInput").value = "";
    document.querySelectorAll(".ak-tab").forEach((t) => t.classList.toggle("ak-tab--active", t.dataset.type === type));
    render();
    fi();
  }

  async function performDelete() {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    const cfg = TAB_CONFIG[type];
    if (!cfg) return;

    const db = getMasterDb();

    const dbKey = type === "film" ? "films" : type === "aktor" ? "actors" : type === "sutradara" ? "directors" : null;
    const collection = dbKey || (allData[type].find((i) => i.id === id)?._subtype === "artikel" ? "articles" : "news");
    if (dbKey) {
      db[dbKey] = (db[dbKey] || []).filter((i) => i.id !== id);
    } else {
      const subtype = allData[type].find((i) => i.id === id)?._subtype;
      if (subtype === "artikel") {
        db.articles = (db.articles || []).filter((a) => a.id !== id);
      } else {
        db.news = (db.news || []).filter((n) => n.id !== id);
      }
    }
    localStorage.setItem("pilih-in-db", JSON.stringify(db));

    await apiRequest("DELETE", "/api/content/" + collection + "/" + id);

    modal?.classList.remove("show");
    deleteTarget = null;
    loadAllData();
    render();
    showToast("Konten berhasil dihapus!");
  }

  function initEvents() {
    document.getElementById("tabFilters")?.addEventListener("click", (e) => {
      const tab = e.target.closest(".ak-tab");
      if (tab) switchTab(tab.dataset.type);
    });

    document.getElementById("searchInput")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      render();
    });

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      searchQuery = "";
      document.getElementById("searchInput").value = "";
      render();
    });

    document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
      modal?.classList.remove("show");
    });

    document.getElementById("confirmDeleteBtn")?.addEventListener("click", performDelete);

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });
  }

  loadAllData();
  renderStats();
  switchTab("film");
  initEvents();
}

(async () => {
  await getDbReady();
  initPage();
})();

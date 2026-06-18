// frontend/js/logic-pages/faq.js

import { DOM } from "../utils/dom.js";

function fi() {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
}

function showToast(msg, type = "success") {
  const ex = document.querySelector(".toast");
  if (ex) ex.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function escHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ═══════════════════════════════════════════════════
// PUBLIC FAQ PAGE
// ═══════════════════════════════════════════════════

class FaqPage {
  constructor() {
    this._faqs = [];
    this._activeCategory = "all";
    this._searchQuery = "";
    this._init();
  }

  async _init() {
    try {
      await this._loadFaqs();
      if (!this._cacheElements()) return;
      this._bindEvents();
      this._render();
    } catch (err) {
      console.warn("FaqPage: data belum siap, retrying...", err);
      setTimeout(() => this._init(), 500);
    }
  }

  async _loadFaqs() {
    const db = JSON.parse(localStorage.getItem("pilih-in-db"));
    if (db?.faqs?.length) {
      this._faqs = db.faqs;
      return;
    }
    const res = await fetch("/data/faq.json");
    const data = await res.json();
    this._faqs = data.faqs || [];
  }

  _cacheElements() {
    this._container = DOM.$("#faqList");
    this._searchInput = DOM.$("#faqSearch");
    this._categoriesEl = DOM.$("#faqCategories");
    return this._container && this._categoriesEl;
  }

  _bindEvents() {
    if (this._searchInput) {
      this._searchInput.addEventListener("input", (e) => {
        this._searchQuery = e.target.value.toLowerCase();
        this._render();
      });
    }

    this._categoriesEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".faq-category-btn");
      if (!btn) return;
      const cat = btn.dataset.category;
      if (cat === this._activeCategory) return;
      this._activeCategory = cat;
      this._render();
    });

    this._container.addEventListener("click", (e) => {
      const btn = e.target.closest(".faq-item__question");
      if (!btn) return;
      const item = btn.closest(".faq-item");
      if (!item) return;
      const isOpen = item.classList.contains("faq-item--open");

      DOM.$$(".faq-item--open", this._container).forEach((el) => {
        if (el !== item) el.classList.remove("faq-item--open");
      });

      item.classList.toggle("faq-item--open");
    });
  }

  _getCategories() {
    const cats = [...new Set(this._faqs.map((f) => f.category))];
    return ["all", ...cats];
  }

  _getCategoryLabel(cat) {
    const labels = {
      all: "Semua",
      umum: "Umum",
      akun: "Akun",
      langganan: "Langganan",
      teknis: "Teknis",
    };
    return labels[cat] || cat;
  }

  _getFiltered() {
    return this._faqs.filter((f) => {
      const matchCategory =
        this._activeCategory === "all" || f.category === this._activeCategory;
      const matchSearch =
        !this._searchQuery ||
        f.question.toLowerCase().includes(this._searchQuery) ||
        f.answer.toLowerCase().includes(this._searchQuery);
      return matchCategory && matchSearch;
    });
  }

  _render() {
    this._renderCategories();
    this._renderList();
  }

  _renderCategories() {
    const categories = this._getCategories();

    this._categoriesEl.innerHTML = categories
      .map(
        (cat) => `
        <button class="faq-category-btn${cat === this._activeCategory ? " faq-category-btn--active" : ""}" data-category="${cat}">
          ${this._getCategoryLabel(cat)}
        </button>
      `,
      )
      .join("");
  }

  _renderList() {
    const filtered = this._getFiltered();

    if (!filtered.length) {
      this._container.innerHTML = `
        <div class="faq-empty">
          <i data-feather="search"></i>
          <p>Tidak ditemukan hasil untuk pencarian Anda</p>
        </div>
      `;
      feather.replace();
      return;
    }

    this._container.innerHTML = filtered
      .map(
        (faq) => `
        <div class="faq-item" data-faq-id="${faq.id}">
          <button class="faq-item__question">
            <span>${faq.question}</span>
            <i data-feather="chevron-down"></i>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__answer-inner">${faq.answer}</div>
          </div>
        </div>
      `,
      )
      .join("");

    feather.replace();
  }
}

export default FaqPage;

// ═══════════════════════════════════════════════════
// ADMIN FAQ CRUD
// ═══════════════════════════════════════════════════

// Seed demo data
function seedDemo() {
  const ex = JSON.parse(localStorage.getItem("pilih-in-faqs") || "[]");
  if (ex.length > 0) return;
  const demo = [
    {
      id: "faq-001",
      question: "Bagaimana cara mendaftar di Pilih.in?",
      answer:
        "Kunjungi halaman beranda Pilih.in, klik tombol Daftar, lalu isi formulir dengan data diri Anda. Setelah verifikasi email, akun Anda langsung aktif.",
      status: "published",
      createdAt: "2024-01-10T08:00:00Z",
    },
    {
      id: "faq-002",
      question: "Apakah Pilih.in gratis untuk digunakan?",
      answer:
        "Ya, Pilih.in menyediakan layanan gratis untuk menonton dan merating film. Fitur premium tersedia untuk pengalaman tanpa iklan dan akses konten eksklusif.",
      status: "published",
      createdAt: "2024-02-05T09:00:00Z",
    },
    {
      id: "faq-003",
      question: "Bagaimana cara memberikan rating pada film?",
      answer:
        "Setelah login, buka halaman detail film yang ingin Anda rating. Klik bintang yang sesuai dengan penilaian Anda (1–10). Rating Anda akan tersimpan otomatis.",
      status: "published",
      createdAt: "2024-03-12T10:00:00Z",
    },
    {
      id: "faq-004",
      question: "Bisakah saya mengubah rating yang sudah saya berikan?",
      answer:
        "Ya, Anda bisa mengubah rating kapan saja. Buka kembali halaman film tersebut dan klik bintang baru sesuai penilaian Anda yang diperbarui.",
      status: "published",
      createdAt: "2024-04-01T11:00:00Z",
    },
    {
      id: "faq-005",
      question: "Bagaimana cara melaporkan konten yang tidak sesuai?",
      answer:
        "Gunakan tombol Laporkan yang ada di setiap halaman film. Tim moderasi kami akan meninjau laporan dalam 1×24 jam pada hari kerja.",
      status: "published",
      createdAt: "2024-05-20T12:00:00Z",
    },
  ];
  localStorage.setItem("pilih-in-faqs", JSON.stringify(demo));
}

function initPage() {
  seedDemo();

  let faqs = [];
  let filteredFaqs = [];
  let searchQuery = "";
  let editingId = null;

  const formModal = document.getElementById("formModal");
  const deleteModal = document.getElementById("deleteModal");

  function loadData() {
    faqs = JSON.parse(localStorage.getItem("pilih-in-faqs") || "[]");
    applyFilters();
  }

  function saveData() {
    localStorage.setItem("pilih-in-faqs", JSON.stringify(faqs));
  }

  function applyFilters() {
    let result = [...faqs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.question?.toLowerCase().includes(q) ||
          f.answer?.toLowerCase().includes(q),
      );
    }
    result.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
    filteredFaqs = result;
  }

  function renderStats() {
    document.getElementById("totalFaqs").textContent = faqs.length;
    document.getElementById("publishedFaqs").textContent = faqs.filter(
      (f) => f.status === "published",
    ).length;
    const now = new Date();
    const thisMonth = faqs.filter((f) => {
      const d = new Date(f.createdAt || 0);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    }).length;
    document.getElementById("monthFaqs").textContent = thisMonth;
  }

  function formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function renderTable() {
    const tbody = document.getElementById("faqTableBody");
    if (!tbody) return;

    if (filteredFaqs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="fq-empty">
              <div class="fq-empty__icon"><i data-feather="help-circle"></i></div>
              <h3>Belum Ada FAQ</h3>
              <p>Tambahkan pertanyaan pertama Anda sekarang</p>
              <button class="btn-add-faq" id="emptyAddBtn" style="margin: 0 auto;">
                <i data-feather="plus"></i> Tambah FAQ
              </button>
            </div>
          </td>
        </tr>
      `;
      document
        .getElementById("emptyAddBtn")
        ?.addEventListener("click", () => openFormModal());
      fi();
      return;
    }

    tbody.innerHTML = filteredFaqs
      .map(
        (faq, idx) => `
        <tr>
          <td class="td-num">${idx + 1}</td>
          <td class="td-question">
            <div class="fq-question-text">${escHtml(faq.question || "-")}</div>
            <div class="fq-question-id">${escHtml(faq.id)}</div>
          </td>
          <td class="td-answer">
            <div class="fq-answer-text">${escHtml(faq.answer || "-")}</div>
          </td>
          <td class="td-date">${formatDate(faq.createdAt)}</td>
          <td class="td-actions">
            <div class="fq-action-wrap">
              <button class="btn-act btn-act--edit"
                data-id="${escHtml(faq.id)}"
                data-question="${escHtml(faq.question)}"
                data-answer="${escHtml(faq.answer)}">
                <i data-feather="edit-2"></i> Edit
              </button>
              <button class="btn-act btn-act--delete"
                data-id="${escHtml(faq.id)}"
                data-question="${escHtml(faq.question)}">
                <i data-feather="trash-2"></i> Hapus
              </button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("");

    tbody.querySelectorAll(".btn-act--edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        openFormModal({
          id: btn.dataset.id,
          question: btn.dataset.question,
          answer: btn.dataset.answer,
        });
      });
    });

    tbody.querySelectorAll(".btn-act--delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteModal.dataset.faqId = btn.dataset.id;
        deleteModal.classList.add("show");
        fi();
      });
    });

    fi();
  }

  function render() {
    renderStats();
    renderTable();
  }

  // Form Modal
  function openFormModal(faq = null) {
    const title = document.getElementById("modalTitle");
    const qInput = document.getElementById("faqQuestion");
    const aInput = document.getElementById("faqAnswer");
    if (faq) {
      editingId = faq.id;
      if (title) title.textContent = "Edit FAQ";
      if (qInput) qInput.value = faq.question || "";
      if (aInput) aInput.value = faq.answer || "";
    } else {
      editingId = null;
      if (title) title.textContent = "Tambah FAQ Baru";
      if (qInput) qInput.value = "";
      if (aInput) aInput.value = "";
    }
    formModal.classList.add("show");
    fi();
    setTimeout(() => qInput?.focus(), 80);
  }

  function closeFormModal() {
    formModal.classList.remove("show");
    editingId = null;
  }

  document
    .getElementById("addFaqBtn")
    ?.addEventListener("click", () => openFormModal());
  document
    .getElementById("closeModalBtn")
    ?.addEventListener("click", closeFormModal);
  formModal?.addEventListener("click", (e) => {
    if (e.target === formModal) closeFormModal();
  });

  document.getElementById("saveFaqBtn")?.addEventListener("click", () => {
    const q = document.getElementById("faqQuestion")?.value.trim();
    const a = document.getElementById("faqAnswer")?.value.trim();
    if (!q) {
      showToast("Pertanyaan wajib diisi", "error");
      return;
    }
    if (!a) {
      showToast("Jawaban wajib diisi", "error");
      return;
    }

    if (editingId) {
      const idx = faqs.findIndex((f) => f.id === editingId);
      if (idx !== -1) {
        faqs[idx] = {
          ...faqs[idx],
          question: q,
          answer: a,
          updatedAt: new Date().toISOString(),
        };
        showToast("FAQ berhasil diperbarui!");
      }
    } else {
      faqs.push({
        id: "faq-" + Date.now(),
        question: q,
        answer: a,
        status: "published",
        createdAt: new Date().toISOString(),
      });
      showToast("FAQ berhasil ditambahkan!");
    }

    saveData();
    applyFilters();
    render();
    closeFormModal();
  });

  // Delete Modal
  document
    .getElementById("cancelDeleteBtn")
    ?.addEventListener("click", () => deleteModal.classList.remove("show"));
  deleteModal?.addEventListener("click", (e) => {
    if (e.target === deleteModal) deleteModal.classList.remove("show");
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => {
    const id = deleteModal?.dataset.faqId;
    if (id) {
      faqs = faqs.filter((f) => f.id !== id);
      saveData();
      applyFilters();
      render();
      showToast("FAQ berhasil dihapus!");
    }
    deleteModal.classList.remove("show");
  });

  // Search & Reset
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    applyFilters();
    render();
  });

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    searchQuery = "";
    const si = document.getElementById("searchInput");
    if (si) si.value = "";
    applyFilters();
    render();
  });

  loadData();
  render();
}

// Jalankan initPage hanya di halaman admin (ada formModal)
if (document.getElementById("formModal")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
}

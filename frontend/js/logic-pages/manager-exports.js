import { repositories, getDbReady } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

const DB_KEY = "pilih-in-db";

function _getCollection(name) {
    try {
        const db = JSON.parse(localStorage.getItem(DB_KEY));
        return db?.[name] || [];
    } catch {
        return [];
    }
}

function _formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function _formatDate(iso) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

class ManagerExportsPage {
    constructor() {
        this.formats = {};
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();

        this._render();
        this._bindEvents();
    }

    _getReportData(type) {
        switch (type) {
            case "revenue": {
                const txns = _getCollection("transactions").filter((t) => t.status === "completed");
                const tiers = _getCollection("pricingTiers");
                const users = _getCollection("users");
                return {
                    count: txns.length,
                    label: `Pendapatan (${_formatCurrency(txns.reduce((s, t) => s + t.totalAmount, 0))})`,
                    headers: ["ID", "Pengguna", "Paket", "Jumlah", "Metode", "Tanggal", "Status"],
                    rows: txns.map((t) => {
                        const user = users.find((u) => u.id === t.userId);
                        const tier = tiers.find((p) => p.id === t.tierId);
                        return [t.id, user?.username || "", tier?.name || "", t.totalAmount.toString(), t.paymentMethod || "", _formatDate(t.createdAt), t.status];
                    }),
                };
            }
            case "users": {
                const users = _getCollection("users");
                return {
                    count: users.length,
                    label: `${users.length} pengguna`,
                    headers: ["ID", "Username", "Email", "Role", "Status", "Bergabung"],
                    rows: users.map((u) => [u.id, u.username, u.email, u.role, u.status, _formatDate(u.createdAt)]),
                };
            }
            case "films": {
                const films = repositories.films.findPublished();
                return {
                    count: films.length,
                    label: `${films.length} film`,
                    headers: ["ID", "Judul", "Durasi", "Rating", "Tayang", "Penonton", "Status"],
                    rows: films.map((f) => [f.id, f.title, `${f.duration} mnt`, f.averageRating.toString(), new Date(f.releaseDate).getFullYear().toString(), f.watchCount.toString(), f.status]),
                };
            }
            case "reviews": {
                const reviews = _getCollection("reviews");
                const films = repositories.films.findPublished();
                const users = _getCollection("users");
                return {
                    count: reviews.length,
                    label: `${reviews.length} ulasan`,
                    headers: ["ID", "Film", "Pengguna", "Rating", "Status", "Tanggal"],
                    rows: reviews.map((r) => {
                        const film = films.find((f) => f.id === r.filmId);
                        const user = users.find((u) => u.id === r.userId);
                        return [r.id, film?.title || "", user?.username || "", r.rating.toString(), r.status, _formatDate(r.createdAt)];
                    }),
                };
            }
            default:
                return { count: 0, label: "", headers: [], rows: [] };
        }
    }

    _toCSV(headers, rows) {
        const escape = (v) => {
            const s = String(v ?? "");
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    }

    _toJSON(headers, rows) {
        return JSON.stringify(rows.map((r) => Object.fromEntries(headers.map((h, i) => [h.toLowerCase().replace(/\s+/g, "_"), r[i]]))), null, 2);
    }

    _download(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    _render() {
        const container = DOM.$("#managerExportsPage");
        if (!container) return;

        this.formats = { revenue: "csv", users: "csv", films: "csv", reviews: "csv" };

        const reports = [
            { type: "revenue", icon: "trending-up", color: "revenue", name: "Pendapatan", desc: "Data transaksi dan pemasukan platform" },
            { type: "users", icon: "users", color: "users", name: "Pengguna", desc: "Data pengguna terdaftar di platform" },
            { type: "films", icon: "film", color: "films", name: "Film", desc: "Katalog film dan konten yang tersedia" },
            { type: "reviews", icon: "message-square", color: "reviews", name: "Ulasan", desc: "Rating dan ulasan dari pengguna" },
        ];

        const history = _getCollection("exportHistory") || [];

        container.innerHTML = `
            <div class="exports-header">
                <div>
                    <h1 class="exports-header__title">
                        <i data-feather="download"></i> Ekspor Laporan
                    </h1>
                    <p class="exports-header__subtitle">Unduh data platform dalam format CSV atau JSON</p>
                </div>
            </div>

            <div class="exports-grid">
                ${reports.map((r) => {
                    const data = this._getReportData(r.type);
                    const fmt = this.formats[r.type];
                    const previewData = fmt === "csv" ? this._toCSV(data.headers, data.rows.slice(0, 3)) : this._toJSON(data.headers, data.rows.slice(0, 3));
                    return `
                        <div class="exports-card" data-report="${r.type}">
                            <div class="exports-card__header">
                                <div class="exports-card__icon exports-card__icon--${r.color}">
                                    <i data-feather="${r.icon}"></i>
                                </div>
                                <div class="exports-card__info">
                                    <div class="exports-card__name">${r.name}</div>
                                    <div class="exports-card__desc">${r.desc}</div>
                                </div>
                                <div class="exports-card__count">${data.count}</div>
                            </div>
                            <div class="exports-card__body">
                                <div class="exports-card__format">
                                    <button class="exports-card__format-btn ${fmt === "csv" ? "exports-card__format-btn--active" : ""}" data-format="csv">CSV</button>
                                    <button class="exports-card__format-btn ${fmt === "json" ? "exports-card__format-btn--active" : ""}" data-format="json">JSON</button>
                                </div>
                                <div class="exports-card__preview">${previewData.slice(0, 500)}${previewData.length > 500 ? "..." : ""}</div>
                                <div class="exports-card__row-count">${data.count} baris data</div>
                                <div class="exports-card__actions">
                                    <button class="btn btn-primary" data-action="export" data-type="${r.type}">
                                        <i data-feather="download"></i> Download ${fmt.toUpperCase()}
                                    </button>
                                    <button class="btn btn-secondary" data-action="preview" data-type="${r.type}">
                                        <i data-feather="eye"></i> Preview
                                    </button>
                                </div>
                                <div class="exports-success" id="exportSuccess-${r.type}">
                                    <i data-feather="check-circle"></i>
                                    <span>File ${r.name.toLowerCase()} berhasil diunduh</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>

            <div class="exports-history">
                <div class="exports-history__header">
                    <h3 class="exports-history__title"><i data-feather="clock"></i> Riwayat Ekspor</h3>
                </div>
                ${history.length > 0 ? `
                    <div class="exports-history__list">
                        ${history.map((h) => `
                            <div class="exports-history__item">
                                <div class="exports-history__info">
                                    <div class="exports-history__icon">
                                        <i data-feather="${h.icon || "file-text"}"></i>
                                    </div>
                                    <div>
                                        <div class="exports-history__name">${h.name}</div>
                                        <div class="exports-history__meta">${h.format.toUpperCase()} - ${_formatDate(h.date)}</div>
                                    </div>
                                </div>
                                <a href="#" class="exports-history__download" data-history="${h.id}">
                                    <i data-feather="download"></i> Unduh Lagi
                                </a>
                            </div>
                        `).join("")}
                    </div>
                ` : `
                    <div class="exports-empty">
                        <i data-feather="inbox"></i>
                        <div class="exports-empty__title">Belum ada riwayat ekspor</div>
                        <div class="exports-empty__desc">File yang sudah diunduh akan tercatat di sini.</div>
                    </div>
                `}
            </div>
        `;

        feather.replace();
    }

    _bindEvents() {
        DOM.$("#managerExportsPage")?.addEventListener("click", (e) => {
            const formatBtn = e.target.closest(".exports-card__format-btn");
            if (formatBtn) {
                const card = formatBtn.closest(".exports-card");
                const type = card?.dataset.report;
                if (!type) return;
                this.formats[type] = formatBtn.dataset.format;
                card.querySelectorAll(".exports-card__format-btn").forEach((b) => b.classList.remove("exports-card__format-btn--active"));
                formatBtn.classList.add("exports-card__format-btn--active");
                const actionBtn = card.querySelector('[data-action="export"]');
                if (actionBtn) actionBtn.innerHTML = `<i data-feather="download"></i> Download ${formatBtn.dataset.format.toUpperCase()}`;
                const preview = card.querySelector(".exports-card__preview");
                const data = this._getReportData(type);
                const fmt = this.formats[type];
                const previewData = fmt === "csv" ? this._toCSV(data.headers, data.rows.slice(0, 3)) : this._toJSON(data.headers, data.rows.slice(0, 3));
                preview.textContent = `${previewData.slice(0, 500)}${previewData.length > 500 ? "..." : ""}`;
                feather.replace();
                return;
            }

            const exportBtn = e.target.closest('[data-action="export"]');
            if (exportBtn) {
                const type = exportBtn.dataset.type;
                this._handleExport(type);
                return;
            }

            const historyLink = e.target.closest(".exports-history__download");
            if (historyLink) {
                e.preventDefault();
                const history = _getCollection("exportHistory") || [];
                const item = history.find((h) => h.id === historyLink.dataset.history);
                if (item) {
                    this._download(item.content, item.filename, item.mime);
                }
            }
        });
    }

    _handleExport(type) {
        const data = this._getReportData(type);
        if (data.count === 0) return;

        const fmt = this.formats[type];
        const content = fmt === "csv" ? this._toCSV(data.headers, data.rows) : this._toJSON(data.headers, data.rows);
        const filename = `pilih-in-${type}-${new Date().toISOString().slice(0, 10)}.${fmt}`;
        const mime = fmt === "csv" ? "text/csv" : "application/json";

        this._download(content, filename, mime);

        const history = _getCollection("exportHistory") || [];
        const reportNames = { revenue: "Pendapatan", users: "Pengguna", films: "Film", reviews: "Ulasan" };
        const reportIcons = { revenue: "trending-up", users: "users", films: "film", reviews: "message-square" };
        history.unshift({
            id: `export-${Date.now()}`,
            type,
            name: reportNames[type] || type,
            format: fmt,
            icon: reportIcons[type] || "file-text",
            filename,
            mime,
            content,
            date: new Date().toISOString(),
        });
        if (history.length > 20) history.length = 20;
        _saveCollection("exportHistory", history);
        try {
            const db = JSON.parse(localStorage.getItem(DB_KEY)) || {};
            db.exportHistory = history;
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        } catch {}

        const successEl = DOM.$(`#exportSuccess-${type}`);
        if (successEl) {
            successEl.classList.add("exports-success--visible");
            setTimeout(() => successEl.classList.remove("exports-success--visible"), 3000);
        }
    }
}

export default ManagerExportsPage;

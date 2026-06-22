import authService from "../../../backend/services/AuthService.js";
import { loadNotifBadge } from "../utils/notif-badge.js";
import Navbar from "../components/navbar.js";

const API = "http://localhost:3000";

const TIER_NAMES = {
    "tier-001": "Free",
    "tier-002": "Basic",
    "tier-003": "Standard",
    "tier-004": "Premium",
};

const METHOD_LABELS = {
    gopay:           "GoPay",
    ovo:             "OVO",
    dana:            "DANA",
    linkaja:         "LinkAja",
    "bca-transfer":      "Transfer BCA",
    "mandiri-transfer":  "Transfer Mandiri",
    "bni-transfer":      "Transfer BNI",
    "bri-transfer":      "Transfer BRI",
    "credit-card":   "Kartu Kredit/Debit",
};

const METHOD_ICONS = {
    gopay:           "smartphone",
    ovo:             "smartphone",
    dana:            "smartphone",
    linkaja:         "smartphone",
    "bca-transfer":      "briefcase",
    "mandiri-transfer":  "briefcase",
    "bni-transfer":      "briefcase",
    "bri-transfer":      "briefcase",
    "credit-card":   "credit-card",
};

class TransactionsPage {
    constructor() {
        this._user         = null;
        this._transactions = [];
        this._filtered     = [];
        this._filterStatus = "all";
        this._sortOrder    = "newest";
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            // Fallback: gunakan data session langsung
            const session = authService.getSession();
            if (!session) {
                window.location.href = "/frontend/pages/main/login.html";
                return;
            }
            this._user = session; // session punya userId, email, dll
        }

        loadNotifBadge(this._user);
        this._renderPage();
        feather.replace();

        await this._loadTransactions();
    }

    /* ─────────── RENDER PAGE (skeleton) ─────────── */
    _renderPage() {
        const main = document.getElementById("transactionsMain");
        if (!main) return;

        main.innerHTML = `
            <div class="user-page">

                <!-- Page Header -->
                <div class="page-header">
                    <div class="page-header__text">
                        <h1 class="page-header__title">Riwayat Transaksi</h1>
                        <p class="page-header__subtitle">Semua transaksi pembayaran langgananmu</p>
                    </div>
                </div>

                <!-- Filter & Sort Bar -->
                <div class="trx-bar">
                    <div class="trx-filter-tabs" id="filterTabs">
                        <button class="trx-filter-tab trx-filter-tab--active" data-status="all">Semua</button>
                        <button class="trx-filter-tab" data-status="completed">Berhasil</button>
                        <button class="trx-filter-tab" data-status="pending">Pending</button>
                        <button class="trx-filter-tab" data-status="failed">Gagal</button>
                    </div>
                    <div class="trx-sort">
                        <label for="sortOrder"><i data-feather="list"></i></label>
                        <select id="sortOrder" class="trx-sort__select">
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                            <option value="highest">Tertinggi</option>
                            <option value="lowest">Terendah</option>
                        </select>
                    </div>
                </div>

                <!-- Transaction List -->
                <div class="trx-list" id="trxList">
                    ${this._skeletonRows(4)}
                </div>

            </div>

            <!-- Modal Detail Transaksi -->
            <div class="modal-backdrop" id="modalDetail">
                <div class="modal">
                    <div class="modal__header">
                        <h3 class="modal__title"><i data-feather="file-text"></i> Detail Transaksi</h3>
                        <button class="modal__close" id="modalClose"><i data-feather="x"></i></button>
                    </div>
                    <div class="modal__body" id="modalDetailBody"></div>
                    <div class="modal__footer">
                        <button class="btn btn-ghost" id="modalCloseBtn">Tutup</button>
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    /* ─────────── LOAD DATA ─────────── */
    async _loadTransactions() {
        const userId = this._user?.id || this._user?.userId
            || JSON.parse(localStorage.getItem("pilih-in-session") || "{}").userId;
        if (!userId) {
            this._showError("Sesi tidak ditemukan. Silakan login ulang.");
            return;
        }
        try {
            const res  = await fetch(`${API}/api/transactions?userId=${userId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            this._transactions = data.transactions || [];
        } catch (err) {
            if (err.message === "Failed to fetch") {
                this._showError("Server tidak terhubung. Jalankan: <code>node backend/server.js</code>");
            } else {
                this._showError(err.message || "Gagal memuat transaksi.");
            }
            return;
        }

        this._applyFilter();
    }

    /* ─────────── FILTER & SORT ─────────── */
    _applyFilter() {
        let list = [...this._transactions];

        if (this._filterStatus !== "all") {
            list = list.filter(t => t.status === this._filterStatus);
        }

        switch (this._sortOrder) {
            case "oldest":  list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
            case "highest": list.sort((a, b) => b.totalAmount - a.totalAmount); break;
            case "lowest":  list.sort((a, b) => a.totalAmount - b.totalAmount); break;
            default:        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
        }

        this._filtered = list;
        this._renderList();
    }

    /* ─────────── RENDER LIST ─────────── */
    _renderList() {
        const el = document.getElementById("trxList");
        if (!el) return;

        if (this._filtered.length === 0) {
            el.innerHTML = `
                <div class="trx-empty">
                    <div class="trx-empty__icon"><i data-feather="inbox"></i></div>
                    <p class="trx-empty__title">Belum ada transaksi</p>
                    <p class="trx-empty__desc">Transaksimu akan muncul di sini setelah melakukan pembayaran.</p>
                    <a href="/frontend/pages/main/pricing.html" class="btn btn-primary">
                        <i data-feather="layers"></i> Pilih Paket
                    </a>
                </div>
            `;
            feather.replace();
            return;
        }

        el.innerHTML = this._filtered.map(t => this._rowHTML(t)).join("");
        feather.replace();

        // Bind klik per baris
        el.querySelectorAll(".trx-row").forEach(row => {
            row.addEventListener("click", () => {
                const id = row.dataset.id;
                const trx = this._transactions.find(t => t.id === id);
                if (trx) this._openDetail(trx);
            });
        });
    }

    _rowHTML(t) {
        const tierName   = TIER_NAMES[t.tierId] || t.tierId || "-";
        const methodIcon = METHOD_ICONS[t.paymentMethod] || "credit-card";
        const methodName = METHOD_LABELS[t.paymentMethod] || t.paymentMethod || "-";
        const dateStr    = this._formatDate(t.createdAt);
        const statusCls  = `trx-badge trx-badge--${t.status}`;
        const statusText = { completed: "Berhasil", pending: "Pending", failed: "Gagal" }[t.status] || t.status;

        return `
            <div class="trx-row" data-id="${t.id}" title="Klik untuk detail">
                <div class="trx-row__icon">
                    <i data-feather="${methodIcon}"></i>
                </div>
                <div class="trx-row__body">
                    <div class="trx-row__top">
                        <span class="trx-row__tier">Paket ${tierName}</span>
                        <span class="${statusCls}">${statusText}</span>
                    </div>
                    <div class="trx-row__meta">
                        <span><i data-feather="calendar"></i> ${dateStr}</span>
                        <span><i data-feather="${methodIcon}"></i> ${methodName}</span>
                        ${t.promoCode ? `<span><i data-feather="tag"></i> ${t.promoCode}</span>` : ""}
                    </div>
                </div>
                <div class="trx-row__amount">
                    <p class="trx-row__total">Rp ${this._fmt(t.totalAmount)}</p>
                    ${t.discountAmount > 0 ? `<p class="trx-row__discount">Hemat Rp ${this._fmt(t.discountAmount)}</p>` : ""}
                </div>
                <div class="trx-row__chevron"><i data-feather="chevron-right"></i></div>
            </div>
        `;
    }

    /* ─────────── MODAL DETAIL ─────────── */
    _openDetail(t) {
        const tierName   = TIER_NAMES[t.tierId] || t.tierId || "-";
        const methodName = METHOD_LABELS[t.paymentMethod] || t.paymentMethod || "-";
        const statusText = { completed: "Berhasil", pending: "Menunggu", failed: "Gagal" }[t.status] || t.status;
        const statusCls  = `trx-badge trx-badge--${t.status}`;

        const paidAt   = t.paidAt    ? this._formatDateFull(t.paidAt)    : "-";
        const expireAt = t.expiresAt ? this._formatDateFull(t.expiresAt) : "-";

        document.getElementById("modalDetailBody").innerHTML = `
            <div class="trx-detail">
                <div class="trx-detail__id">
                    <span>ID Transaksi</span>
                    <code>${t.id}</code>
                </div>

                <div class="trx-detail__row">
                    <span>Status</span>
                    <span class="${statusCls}">${statusText}</span>
                </div>
                <div class="trx-detail__row">
                    <span>Paket</span>
                    <strong>Paket ${tierName}</strong>
                </div>
                <div class="trx-detail__row">
                    <span>Metode Bayar</span>
                    <span>${methodName}</span>
                </div>
                <div class="trx-detail__row">
                    <span>Periode</span>
                    <span>${t.billingPeriod || "Bulanan"}</span>
                </div>

                <div class="trx-detail__divider"></div>

                <div class="trx-detail__row">
                    <span>Harga Paket</span>
                    <span>Rp ${this._fmt(t.amount)}</span>
                </div>
                ${t.promoCode ? `
                <div class="trx-detail__row trx-detail__row--discount">
                    <span><i data-feather="tag"></i> Promo (${t.promoCode})</span>
                    <span>- Rp ${this._fmt(t.discountAmount)}</span>
                </div>` : ""}
                ${t.pointsUsed > 0 ? `
                <div class="trx-detail__row trx-detail__row--discount">
                    <span><i data-feather="zap"></i> Diskon Poin (${t.pointsUsed} poin)</span>
                    <span>- Rp ${this._fmt(t.discountAmount - (t.promoCode ? 0 : 0))}</span>
                </div>` : ""}
                <div class="trx-detail__row trx-detail__row--total">
                    <span>Total Dibayar</span>
                    <strong>Rp ${this._fmt(t.totalAmount)}</strong>
                </div>

                <div class="trx-detail__divider"></div>

                <div class="trx-detail__row">
                    <span>Tanggal Bayar</span>
                    <span>${paidAt}</span>
                </div>
                <div class="trx-detail__row">
                    <span>Masa Aktif s/d</span>
                    <span>${expireAt}</span>
                </div>
            </div>
        `;

        document.getElementById("modalDetail").classList.add("modal-backdrop--visible");
        feather.replace();
    }

    _closeDetail() {
        document.getElementById("modalDetail")?.classList.remove("modal-backdrop--visible");
    }

    /* ─────────── EVENTS ─────────── */
    _bindEvents() {
        // Filter tabs
        document.getElementById("filterTabs")?.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-status]");
            if (!btn) return;
            document.querySelectorAll(".trx-filter-tab").forEach(b => b.classList.remove("trx-filter-tab--active"));
            btn.classList.add("trx-filter-tab--active");
            this._filterStatus = btn.dataset.status;
            this._applyFilter();
        });

        // Sort
        document.getElementById("sortOrder")?.addEventListener("change", (e) => {
            this._sortOrder = e.target.value;
            this._applyFilter();
        });

        // Modal close
        document.getElementById("modalClose")?.addEventListener("click", () => this._closeDetail());
        document.getElementById("modalCloseBtn")?.addEventListener("click", () => this._closeDetail());
        document.getElementById("modalDetail")?.addEventListener("click", (e) => {
            if (e.target === document.getElementById("modalDetail")) this._closeDetail();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this._closeDetail();
        });
    }

    /* ─────────── HELPERS ─────────── */
    _skeletonRows(n) {
        return Array.from({ length: n }).map(() => `
            <div class="trx-row trx-row--skeleton">
                <div class="trx-row__icon skel-box"></div>
                <div class="trx-row__body">
                    <div class="skel-line skel-line--md"></div>
                    <div class="skel-line skel-line--sm"></div>
                </div>
                <div class="trx-row__amount">
                    <div class="skel-line skel-line--sm"></div>
                </div>
            </div>
        `).join("");
    }

    _showError(msg) {
        const el = document.getElementById("trxList");
        if (!el) return;
        el.innerHTML = `
            <div class="trx-empty">
                <div class="trx-empty__icon trx-empty__icon--error"><i data-feather="wifi-off"></i></div>
                <p class="trx-empty__title">Gagal memuat transaksi</p>
                <p class="trx-empty__desc">${msg}</p>
            </div>
        `;
        feather.replace();
    }

    _fmt(n) {
        return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    _formatDate(iso) {
        if (!iso) return "-";
        return new Date(iso).toLocaleDateString("id-ID", {
            day: "numeric", month: "short", year: "numeric",
        });
    }

    _formatDateFull(iso) {
        if (!iso) return "-";
        return new Date(iso).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }
}

export default TransactionsPage;
import authService from "../../../backend/services/AuthService.js";
import { loadNotifBadge } from "../utils/notif-badge.js";
import Navbar from "../components/navbar.js";

const API = "http://localhost:3000";
const KEY_DB = "pilih-in-db";

const TIER_NAMES = {
    "tier-001": "Free",
    "tier-002": "Basic",
    "tier-003": "Standard",
    "tier-004": "Premium",
    basic: "Basic",
    standard: "Standard",
    premium: "Premium",
};

const TYPE_META = {
    welcome:      { icon: "heart",          colorClass: "notif-icon--accent" },
    subscription: { icon: "alert-triangle", colorClass: "notif-icon--warning" },
    transaction:  { icon: "check-circle",   colorClass: "notif-icon--success" },
    promo:        { icon: "tag",            colorClass: "notif-icon--promo" },
    film_release: { icon: "film",           colorClass: "notif-icon--info" },
    review_reply: { icon: "message-circle", colorClass: "notif-icon--accent" },
    system:       { icon: "bell",           colorClass: "notif-icon--muted" },
};

const FILTERS = [
    { id: "all",          label: "Semua" },
    { id: "subscription", label: "Langganan" },
    { id: "transaction",  label: "Transaksi" },
    { id: "promo",        label: "Promo" },
    { id: "film_release", label: "Film Baru" },
    { id: "review_reply", label: "Balasan Review" },
];

class UserNotificationsPage {
    constructor() {
        this._user = null;
        this._notifications = [];
        this._activeFilter = "all";
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            window.location.href = "/frontend/pages/main/login.html";
            return;
        }

        try {
            await this._buildNotifications();
        } catch (err) {
            console.warn('Gagal membangun notifikasi:', err);
        }
        loadNotifBadge(this._user);
        this._renderPage();
        this._bindEvents();
        feather.replace();
    }

    /* ─────────── DB HELPERS (localStorage, sama seperti watchHistory/watchLists) ─────────── */
    _getDb() {
        try {
            return JSON.parse(localStorage.getItem(KEY_DB)) || {};
        } catch {
            return {};
        }
    }

    _saveDb(db) {
        localStorage.setItem(KEY_DB, JSON.stringify(db));
    }

    _getUserId() {
        return this._user?.userId || this._user?.id;
    }

    /* Status baca/dismiss notifikasi disimpan per-user di db.notificationStates */
    _getStates() {
        const db = this._getDb();
        const userId = this._getUserId();
        return (db.notificationStates && db.notificationStates[userId]) || {};
    }

    _setState(notifId, patch) {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db.notificationStates) db.notificationStates = {};
        if (!db.notificationStates[userId]) db.notificationStates[userId] = {};
        db.notificationStates[userId][notifId] = {
            ...(db.notificationStates[userId][notifId] || {}),
            ...patch,
        };
        this._saveDb(db);
    }

    _markAllRead() {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db.notificationStates) db.notificationStates = {};
        if (!db.notificationStates[userId]) db.notificationStates[userId] = {};
        this._notifications.forEach((n) => {
            db.notificationStates[userId][n.id] = {
                ...(db.notificationStates[userId][n.id] || {}),
                read: true,
            };
        });
        this._saveDb(db);
    }

    /* ─────────── BANGUN DAFTAR NOTIFIKASI ─────────── */
    async _buildNotifications() {
        const userId = this._getUserId();
        const list = [];
        const db = this._getDb();

        /* 1) Selamat bergabung - sekali, sejak akun dibuat */
        list.push({
            id: `welcome-${userId}`,
            type: "welcome",
            title: "Terima kasih telah bergabung dengan Pilih.in! 🎉",
            message:
                "Selamat datang di Pilih.in! Yuk mulai jelajahi ribuan film & series favoritmu. " +
                "Berlangganan paket Standard atau Premium untuk nonton tanpa iklan, kualitas HD/4K, dan banyak lagi.",
            createdAt: this._user.createdAt || new Date().toISOString(),
            actionLabel: "Lihat Paket Langganan",
            actionUrl: "/frontend/pages/main/pricing.html",
        });

        /* 2) Peringatan masa berlaku langganan */
        if (this._user.subscriptionExpiry) {
            const expiry = new Date(this._user.subscriptionExpiry);
            const daysLeft = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
            const tierName = TIER_NAMES[this._user.subscriptionTier] || "kamu";
            const dateStr = expiry.toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
            });

            if (daysLeft <= 0) {
                list.push({
                    id: `sub-expired-${this._user.subscriptionExpiry}`,
                    type: "subscription",
                    title: "Paket langganan kamu sudah berakhir",
                    message: `Paket ${tierName} kamu berakhir pada ${dateStr}. Perpanjang sekarang agar kamu tidak kehilangan akses ke konten favoritmu.`,
                    createdAt: this._user.subscriptionExpiry,
                    actionLabel: "Perpanjang Sekarang",
                    actionUrl: "/frontend/pages/user/payment.html",
                });
            } else if (daysLeft <= 7) {
                list.push({
                    id: `sub-expiring-${this._user.subscriptionExpiry}`,
                    type: "subscription",
                    title: `Paket ${tierName} kamu akan segera berakhir`,
                    message: `Masa berlaku paket ${tierName} kamu tinggal ${daysLeft} hari lagi (berakhir ${dateStr}). Perpanjang sekarang supaya tontonanmu tidak terputus, atau biarkan dan paketmu akan turun ke Basic.`,
                    createdAt: new Date(expiry.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    actionLabel: "Perpanjang Langganan",
                    actionUrl: "/frontend/pages/user/payment.html",
                });
            }
        }

        /* 3) Transaksi berhasil */
        try {
            const res = await fetch(`${API}/api/transactions?userId=${userId}`);
            const data = await res.json();
            const trans = (data.transactions || []).filter((t) => t.status === "completed");
            trans.forEach((t) => {
                const label = t.itemLabel || `Paket ${TIER_NAMES[t.tierId] || t.tierId}`;
                list.push({
                    id: `trans-${t.id}`,
                    type: "transaction",
                    title: "Pembayaran berhasil",
                    message: `Kamu baru saja melakukan transaksi ${label} sebesar Rp ${this._fmt(t.totalAmount)}. Paket sudah aktif dan siap digunakan!`,
                    createdAt: t.paidAt || t.createdAt,
                    actionLabel: "Lihat Riwayat Transaksi",
                    actionUrl: "/frontend/pages/user/transactions.html",
                });
            });
        } catch {
            /* abaikan jika gagal */
        }

        /* 4) Info promo terbaru */
        try {
            const res = await fetch("/data/promotions.json");
            const data = await res.json();
            const promos = (data.promotions || []).filter((p) => p.featured || p.discount >= 25).slice(0, 3);
            promos.forEach((p, idx) => {
                list.push({
                    id: `promo-${p.id}`,
                    type: "promo",
                    title: `Promo: ${p.title}`,
                    message: `${p.description} Dapatkan diskon ${p.discount}% - harga spesial Rp ${this._fmt(p.promoPrice)} (dari Rp ${this._fmt(p.originalPrice)}).`,
                    createdAt: new Date(Date.now() - (idx + 1) * 36 * 60 * 60 * 1000).toISOString(),
                    actionLabel: "Lihat Promo",
                    actionUrl: `/frontend/pages/user/payment.html?promo=${p.id}`,
                });
            });
        } catch {
            /* abaikan */
        }

        /* 5) Info film terbaru */
        try {
            const res = await fetch("/data/data-film.json");
            const data = await res.json();
            const films = (data.films || [])
                .filter((f) => f.status === "published")
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3);
            films.forEach((f) => {
                list.push({
                    id: `film-${f.id}`,
                    type: "film_release",
                    title: "Film baru di Pilih.in",
                    message: `"${f.title}" sudah bisa ditonton sekarang! ${f.description?.slice(0, 100) || ""}${(f.description?.length || 0) > 100 ? "..." : ""}`,
                    createdAt: f.createdAt,
                    actionLabel: "Tonton Sekarang",
                    actionUrl: `/frontend/pages/film/detail.html#${f.id}`,
                });
            });
        } catch {
            /* abaikan */
        }

        /* 6) Balasan admin untuk review user */
        const myReviews = (db.reviews || []).filter(
            (r) => r.userId === userId && r.adminReply
        );
        myReviews.forEach((r, idx) => {
            list.push({
                id: `review-reply-${r.id || `${r.filmId}-${idx}`}`,
                type: "review_reply",
                title: "Admin membalas review kamu",
                message: `Terkait ulasanmu "${(r.comment || "").slice(0, 60)}${(r.comment || "").length > 60 ? "..." : ""}", admin Pilih.in membalas: "${r.adminReply}"`,
                createdAt: r.adminReplyAt || r.createdAt,
                actionLabel: "Lihat Film",
                actionUrl: `/frontend/pages/film/detail.html#${r.filmId}`,
            });
        });

        // Terapkan status baca/dismiss & urutkan terbaru dulu
        const states = this._getStates();
        this._notifications = list
            .filter((n) => !states[n.id]?.dismissed)
            .map((n) => ({ ...n, read: !!states[n.id]?.read }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /* ─────────── HELPERS ─────────── */
    _fmt(n) {
        return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    _formatRelative(iso) {
        if (!iso) return "-";
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffMin < 1) return "Baru saja";
        if (diffMin < 60) return `${diffMin} menit yang lalu`;
        if (diffHour < 24) return `${diffHour} jam yang lalu`;
        if (diffDay < 7) return `${diffDay} hari yang lalu`;

        return date.toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
        });
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }

    /* ─────────── CARD ─────────── */
    _itemHTML(n) {
        const meta = TYPE_META[n.type] || TYPE_META.system;
        return `
            <div class="notif-card ${n.read ? "" : "notif-card--unread"}" data-id="${n.id}">
                <div class="notif-icon ${meta.colorClass}">
                    <i data-feather="${meta.icon}"></i>
                </div>
                <div class="notif-body">
                    <div class="notif-top">
                        <h3 class="notif-title">${n.title}</h3>
                        ${!n.read ? `<span class="notif-dot" title="Belum dibaca"></span>` : ""}
                    </div>
                    <p class="notif-message">${n.message}</p>
                    <div class="notif-meta">
                        <span class="notif-time"><i data-feather="clock"></i> ${this._formatRelative(n.createdAt)}</span>
                        ${n.actionUrl ? `<a href="${n.actionUrl}" class="btn btn-ghost btn-sm notif-action">${n.actionLabel || "Lihat"} <i data-feather="arrow-right"></i></a>` : ""}
                    </div>
                </div>
                <button class="btn-dismiss-notif" data-id="${n.id}" aria-label="Hapus notifikasi">
                    <i data-feather="x"></i>
                </button>
            </div>
        `;
    }

    /* ─────────── PAGE ─────────── */
    _renderPage() {
        const main = document.getElementById("notificationsMain");
        if (!main) return;

        const unreadCount = this._notifications.filter((n) => !n.read).length;
        const filtered = this._activeFilter === "all"
            ? this._notifications
            : this._notifications.filter((n) => n.type === this._activeFilter);

        const headerHTML = `
            <div class="page-header">
                <div class="page-header__left">
                    <h1 class="page-header__title">Notifikasi</h1>
                    <p class="page-header__subtitle">
                        ${unreadCount > 0
                            ? `<span class="page-header__count">${unreadCount}</span> notifikasi belum dibaca`
                            : "Semua notifikasi sudah dibaca"}
                    </p>
                </div>
                ${unreadCount > 0 ? `
                <button id="btnMarkAllRead" class="btn-mark-all">
                    <i data-feather="check"></i> Tandai Semua Dibaca
                </button>` : ""}
            </div>
        `;

        const filterHTML = `
            <div class="notif-filters">
                ${FILTERS.map((f) => `
                    <button class="notif-filter ${this._activeFilter === f.id ? "notif-filter--active" : ""}" data-filter="${f.id}">
                        ${f.label}
                    </button>
                `).join("")}
            </div>
        `;

        if (!filtered.length) {
            main.innerHTML = `
                <div class="user-page">
                    ${headerHTML}
                    ${filterHTML}
                    <div class="notif-empty">
                        <i data-feather="bell-off"></i>
                        <h3>Tidak ada notifikasi</h3>
                        <p>Belum ada notifikasi untuk kategori ini.</p>
                    </div>
                </div>
            `;
            return;
        }

        main.innerHTML = `
            <div class="user-page">
                ${headerHTML}
                ${filterHTML}
                <div class="notif-list">
                    ${filtered.map((n) => this._itemHTML(n)).join("")}
                </div>
            </div>
        `;
    }

    /* ─────────── EVENTS ─────────── */
    _bindEvents() {
        document.getElementById("notificationsMain")?.addEventListener("click", (e) => {
            const markAllBtn = e.target.closest("#btnMarkAllRead");
            if (markAllBtn) {
                this._markAllRead();
                this._notifications = this._notifications.map((n) => ({ ...n, read: true }));
                this._renderPage();
                feather.replace();
                loadNotifBadge(this._user);
                return;
            }

            const filterBtn = e.target.closest(".notif-filter");
            if (filterBtn) {
                this._activeFilter = filterBtn.dataset.filter;
                this._renderPage();
                feather.replace();
                return;
            }

            const dismissBtn = e.target.closest(".btn-dismiss-notif");
            if (dismissBtn) {
                e.preventDefault();
                e.stopPropagation();
                const id = dismissBtn.dataset.id;
                this._setState(id, { dismissed: true });
                this._notifications = this._notifications.filter((n) => n.id !== id);
                this._renderPage();
                feather.replace();
                loadNotifBadge(this._user);
                return;
            }

            // Klik kartu (selain tombol aksi/dismiss) → tandai sudah dibaca
            const card = e.target.closest(".notif-card");
            if (card && !e.target.closest(".notif-action")) {
                const id = card.dataset.id;
                const notif = this._notifications.find((n) => n.id === id);
                if (notif && !notif.read) {
                    notif.read = true;
                    this._setState(id, { read: true });
                    card.classList.remove("notif-card--unread");
                    card.querySelector(".notif-dot")?.remove();
                    loadNotifBadge(this._user);
                }
            }
        });
    }
}

export default UserNotificationsPage;
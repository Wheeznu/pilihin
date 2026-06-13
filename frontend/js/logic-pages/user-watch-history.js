import authService from "../../../backend/services/AuthService.js";

const KEY_DB = "pilih-in-db";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class UserWatchHistoryPage {
    constructor() {
        this._user = null;
        this._allFilms = [];
        this._genres = [];
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            window.location.href = "/frontend/pages/main/login.html";
            return;
        }
        await this._loadData();
        this._renderSidebar();
        this._renderPage();
        this._bindEvents();
        feather.replace();
    }

    /* ─────────── LOAD DATA ─────────── */
    async _loadData() {
        try {
            const [fR, gR] = await Promise.all([
                fetch("/data/data-film.json"),
                fetch("/data/genres.json"),
            ]);
            const [fd, gd] = await Promise.all([fR.json(), gR.json()]);
            this._allFilms = fd.films || fd || [];
            this._genres = gd.genres || gd || [];
        } catch {
            this._allFilms = [];
            this._genres = [];
        }
    }

    /* ─────────── DB HELPERS ─────────── */
    _getDb() {
        try {
            return JSON.parse(localStorage.getItem(KEY_DB));
        } catch {
            return null;
        }
    }

    _saveDb(db) {
        localStorage.setItem(KEY_DB, JSON.stringify(db));
    }

    _getUserId() {
        return this._user?.userId || this._user?.id;
    }

    /* ─────────── BACA RIWAYAT ─────────── */
    _getHistoryItems() {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db || !userId) return [];

        const records = db.watchHistory || [];
        return records
            .filter((r) => r.userId === userId)
            .map((r) => {
                const film = this._allFilms.find((f) => f.id === r.filmId);
                if (!film) return null;
                return { record: r, film };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.record.watchedAt) - new Date(a.record.watchedAt));
    }

    _removeHistory(filmId) {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db || !userId) return;
        db.watchHistory = (db.watchHistory || []).filter(
            (r) => !(r.userId === userId && r.filmId === filmId)
        );
        this._saveDb(db);
    }

    _clearHistory() {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db || !userId) return;
        db.watchHistory = (db.watchHistory || []).filter((r) => r.userId !== userId);
        this._saveDb(db);
    }

    /* ─────────── HELPERS ─────────── */
    _genreNames(genreIds) {
        if (!genreIds?.length) return "";
        return genreIds
            .map((id) => this._genres.find((g) => g.id === id)?.name || GENRE_MAP[id] || id)
            .filter(Boolean)
            .join(", ");
    }

    _formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }

    /* ─────────── SIDEBAR ─────────── */
    _renderSidebar() {
        const sidebar = document.getElementById("userSidebar");
        if (!sidebar) return;
        const u = this._user, cur = window.location.pathname;

        const navItems = [
            { section: "Akun Saya" },
            { href: "/frontend/pages/user/profile.html", icon: "user", label: "Profil" },
            { href: "/frontend/pages/user/security.html", icon: "shield", label: "Keamanan" },
            { href: "/frontend/pages/user/settings.html", icon: "settings", label: "Pengaturan" },
            { section: "Konten" },
            { href: "/frontend/pages/user/history.html", icon: "clock", label: "Riwayat Tonton" },
            { href: "/frontend/pages/user/favorites.html", icon: "heart", label: "Favorit" },
            { href: "/frontend/pages/user/watchlist.html", icon: "bookmark", label: "Daftar Tonton" },
            { section: "Langganan" },
            { href: "/frontend/pages/user/subscription.html", icon: "star", label: "Status Langganan" },
            { href: "/frontend/pages/user/payment.html", icon: "credit-card", label: "Pembayaran & Poin" },
            { href: "/frontend/pages/user/transactions.html", icon: "list", label: "Transaksi" },
            { href: "/frontend/pages/user/notifications.html", icon: "bell", label: "Notifikasi" },
        ];

        const linksHTML = navItems.map(item => {
            if (item.section) return `<span class="user-sidebar__section-label">${item.section}</span>`;
            const active = cur === item.href ? " user-sidebar__link--active" : "";
            return `<a href="${item.href}" class="user-sidebar__link${active}">
                        <i data-feather="${item.icon}"></i><span>${item.label}</span>
                    </a>`;
        }).join("");

        sidebar.innerHTML = `
            <div class="user-sidebar__logo">
                <a href="/frontend/index.html">Pilih<span>.in</span></a>
            </div>
            <div class="user-sidebar__avatar-section">
                <img src="${u.profilePhoto || this._fallback(u.username)}"
                     alt="${u.username}" class="user-sidebar__avatar">
                <div class="user-sidebar__user-info">
                    <div class="user-sidebar__username">${u.username}</div>
                    <div class="user-sidebar__role">Pengguna</div>
                </div>
            </div>
            <nav class="user-sidebar__nav">
                <a href="/frontend/index.html" class="user-sidebar__link">
                    <i data-feather="home"></i><span>Beranda</span>
                </a>
                <a href="/frontend/pages/film/katalog.html" class="user-sidebar__link">
                    <i data-feather="film"></i><span>Film</span>
                </a>
                ${linksHTML}
            </nav>
            <div class="user-sidebar__footer">
                <button class="user-sidebar__logout" id="btnLogout">
                    <i data-feather="log-out"></i><span>Keluar</span>
                </button>
            </div>`;

        document.getElementById("btnLogout")?.addEventListener("click", () => {
            authService.logout();
            window.location.href = "/frontend/pages/main/login.html";
        });
    }

    /* ─────────── CARD ─────────── */
    _itemHTML({ record, film }) {
        const genreNames = this._genreNames(film.genres);
        const quality = film.videoQuality?.[0] || "HD";
        const progress = Math.min(100, Math.max(0, record.progress || 0));
        const completed = !!record.completed || progress >= 95;

        const statusLabel = completed
            ? "Selesai ditonton"
            : `${progress}% ditonton (belum selesai)`;

        const actionBtn = completed
            ? `<a href="/frontend/pages/film/detail.html#${film.id}" class="btn btn-primary btn-history-action" data-film-id="${film.id}">
                   <i data-feather="rotate-ccw"></i> Tonton Lagi
               </a>`
            : `<a href="/frontend/pages/film/detail.html#${film.id}" class="btn btn-primary btn-history-action" data-film-id="${film.id}">
                   <i data-feather="play"></i> Lanjutkan Menonton
               </a>`;

        return `
            <div class="history-card" data-film-id="${film.id}">
                <div class="history-card__poster">
                    <button class="btn-remove-history" data-film-id="${film.id}" aria-label="Hapus dari riwayat">
                        <i data-feather="trash-2"></i>
                    </button>
                    <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                    <span class="film-card__rating"><i data-feather="star" style="width:12px;height:12px;fill:currentColor"></i> ${film.averageRating || "?"}</span>
                    <span class="film-card__quality">${quality}</span>
                    <div class="history-card__progress">
                        <div class="history-card__progress-bar" style="width:${progress}%"></div>
                    </div>
                </div>
                <div class="history-card__info">
                    <h3 class="film-card__title">${film.title}</h3>
                    <div class="film-card__meta">
                        <span>${film.releaseDate ? new Date(film.releaseDate).getFullYear() : "—"}</span>
                        <span>${film.duration || "?"} mnt</span>
                    </div>
                    <p class="film-card__genre">${genreNames}</p>
                    <p class="history-card__status ${completed ? "is-completed" : "is-progress"}">
                        <i data-feather="${completed ? "check-circle" : "clock"}"></i>
                        ${statusLabel}
                    </p>
                    <p class="history-card__date">
                        <i data-feather="calendar"></i> Ditonton pada ${this._formatDate(record.watchedAt)}
                    </p>
                    ${actionBtn}
                </div>
            </div>
        `;
    }

    /* ─────────── PAGE ─────────── */
    _renderPage() {
        const main = document.getElementById("historyMain");
        if (!main) return;

        const items = this._getHistoryItems();

        const headerHTML = `
            <div class="page-header">
                <button class="page-header__burger" id="btnBurger" aria-label="Buka menu">
                    <i data-feather="menu"></i>
                </button>
                <div class="page-header__text">
                    <h1 class="page-header__title">Riwayat Tonton</h1>
                    <p class="page-header__subtitle">Film yang sudah kamu tonton di Pilih.in</p>
                </div>
                ${items.length ? `
                <button id="btnClearHistory" class="btn btn-ghost">
                    <i data-feather="trash-2"></i> Hapus Semua
                </button>` : ""}
            </div>
        `;

        if (!items.length) {
            main.innerHTML = `
                <div class="user-page">
                    ${headerHTML}
                    <div class="history-empty">
                        <i data-feather="clock"></i>
                        <h3>Belum ada riwayat tonton</h3>
                        <p>Film yang kamu tonton dari katalog akan muncul di sini, lengkap dengan progres tontonanmu.</p>
                        <a href="/frontend/pages/film/katalog.html" class="btn btn-primary">
                            <i data-feather="film"></i> Jelajahi Film
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        main.innerHTML = `
            <div class="user-page">
                ${headerHTML}
                <div class="history-grid">
                    ${items.map((item) => this._itemHTML(item)).join("")}
                </div>
            </div>
        `;
    }

    /* ─────────── EVENTS ─────────── */
    _bindEvents() {
        // Burger
        this._overlay = document.createElement("div");
        this._overlay.className = "user-sidebar-overlay";
        document.body.appendChild(this._overlay);
        document.getElementById("btnBurger")?.addEventListener("click", () => {
            document.getElementById("userSidebar")?.classList.add("user-sidebar--open");
            this._overlay.classList.add("user-sidebar-overlay--visible");
            document.body.style.overflow = "hidden";
        });
        this._overlay.addEventListener("click", () => {
            document.getElementById("userSidebar")?.classList.remove("user-sidebar--open");
            this._overlay.classList.remove("user-sidebar-overlay--visible");
            document.body.style.overflow = "";
        });

        document.getElementById("historyMain")?.addEventListener("click", (e) => {
            const clearBtn = e.target.closest("#btnClearHistory");
            if (clearBtn) {
                this._clearHistory();
                this._renderPage();
                feather.replace();
                return;
            }

            const removeBtn = e.target.closest(".btn-remove-history");
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const filmId = removeBtn.dataset.filmId;
                this._removeHistory(filmId);
                this._renderPage();
                feather.replace();
                return;
            }

            // Action button (Tonton Lagi / Lanjutkan Menonton) navigates normally via <a>
            if (e.target.closest(".btn-history-action")) return;

            const card = e.target.closest(".history-card");
            if (!card) return;
            const filmId = card.dataset.filmId;
            if (filmId) {
                window.location.href = `/frontend/pages/film/detail.html#${filmId}`;
            }
        });
    }
}

export default UserWatchHistoryPage;

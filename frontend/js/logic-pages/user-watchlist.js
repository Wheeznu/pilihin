import authService from "../../../backend/services/AuthService.js";

const KEY_DB = "pilih-in-db";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class UserWatchlistPage {
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

    /* ─────────── BACA WATCHLIST ─────────── */
    _getWatchlistFilms() {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db || !userId) return [];

        const records = db.watchLists || [];
        return records
            .filter((r) => r.userId === userId)
            .map((r) => this._allFilms.find((f) => f.id === r.filmId))
            .filter(Boolean);
    }

    _removeFromWatchlist(filmId) {
        const db = this._getDb();
        const userId = this._getUserId();
        if (!db || !userId) return;
        db.watchLists = (db.watchLists || []).filter(
            (r) => !(r.userId === userId && r.filmId === filmId)
        );
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
    _filmCardHTML(film) {
        const genreNames = this._genreNames(film.genres);
        const quality = film.videoQuality?.[0] || "HD";

        return `
            <div class="watchlist-card" data-film-id="${film.id}">
                <div class="film-card">
                    <div class="film-card__poster">
                        <button class="btn-remove-watchlist" data-film-id="${film.id}" aria-label="Hapus dari daftar tonton">
                            <i data-feather="trash-2"></i>
                        </button>
                        <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                        <span class="film-card__rating"><i data-feather="star" style="width:12px;height:12px;fill:currentColor"></i> ${film.averageRating || "?"}</span>
                        <span class="film-card__quality">${quality}</span>
                        <div class="film-card__overlay">
                            <button class="btn btn-primary btn-sm">
                                <i data-feather="play"></i> Tonton Sekarang
                            </button>
                        </div>
                    </div>
                    <div class="film-card__info">
                        <h3 class="film-card__title">${film.title}</h3>
                        <div class="film-card__meta">
                            <span>${film.releaseDate ? new Date(film.releaseDate).getFullYear() : "—"}</span>
                            <span>${film.duration || "?"} mnt</span>
                        </div>
                        <p class="film-card__genre">${genreNames}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /* ─────────── PAGE ─────────── */
    _renderPage() {
        const main = document.getElementById("watchlistMain");
        if (!main) return;

        const films = this._getWatchlistFilms();

        const headerHTML = `
            <div class="page-header">
                <button class="page-header__burger" id="btnBurger" aria-label="Buka menu">
                    <i data-feather="menu"></i>
                </button>
                <div class="page-header__text">
                    <h1 class="page-header__title">Daftar Tonton</h1>
                    <p class="page-header__subtitle">Film yang kamu simpan untuk ditonton nanti</p>
                </div>
            </div>
        `;

        if (!films.length) {
            main.innerHTML = `
                <div class="user-page">
                    ${headerHTML}
                    <div class="watchlist-empty">
                        <i data-feather="bookmark"></i>
                        <h3>Daftar tonton masih kosong</h3>
                        <p>Tambahkan film ke daftar tonton dari katalog atau halaman detail film.</p>
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
                <div class="watchlist-grid">
                    ${films.map((f) => this._filmCardHTML(f)).join("")}
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

        document.getElementById("watchlistMain")?.addEventListener("click", (e) => {
            const removeBtn = e.target.closest(".btn-remove-watchlist");
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const filmId = removeBtn.dataset.filmId;
                this._removeFromWatchlist(filmId);
                this._renderPage();
                feather.replace();
                return;
            }

            const card = e.target.closest(".film-card");
            if (!card) return;
            const wrapper = card.closest(".watchlist-card");
            const filmId = wrapper?.dataset.filmId;
            if (filmId) {
                window.location.href = `/frontend/pages/film/detail.html#${filmId}`;
            }
        });
    }
}

export default UserWatchlistPage;

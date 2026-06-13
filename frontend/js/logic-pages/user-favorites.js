import authService from "../../../backend/services/AuthService.js";

const KEY_DB        = "pilih-in-db";
const KEY_ACTORS    = "pilih-in-favorites-actors";
const KEY_DIRECTORS = "pilih-in-favorites-directors";

class UserFavoritesPage {
    constructor() {
        this._user      = null;
        this._allFilms  = [];
        this._allActors = [];
        this._allDirs   = [];
        this._genres    = [];
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
            const [fR, aR, dR, gR] = await Promise.all([
                fetch("/data/data-film.json"),
                fetch("/data/data-actor.json"),
                fetch("/data/data-director.json"),
                fetch("/data/genres.json"),
            ]);
            const [fd, ad, dd, gd] = await Promise.all([fR.json(), aR.json(), dR.json(), gR.json()]);
            this._allFilms  = fd.films      || fd  || [];
            this._allActors = ad.actors     || ad  || [];
            this._allDirs   = dd.directors  || dd  || [];
            this._genres    = gd.genres     || gd  || [];
        } catch {
            this._allFilms = []; this._allActors = []; this._allDirs = []; this._genres = [];
        }
    }

    /* ─────────── BACA FAVORIT ─────────── */
    _getSession() {
        try { return JSON.parse(localStorage.getItem("pilih-in-session")); } catch { return null; }
    }

    _getFavFilms() {
        try {
            const db = JSON.parse(localStorage.getItem(KEY_DB));
            const session = this._getSession();
            if (!db || !session) return [];
            const userId = session.userId || session.id;
            return (db.favorites || [])
                .filter(r => r.userId === userId)
                .map(r => this._allFilms.find(f => f.id === r.filmId))
                .filter(Boolean);
        } catch { return []; }
    }

    _getFavActors() {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_ACTORS)) || [];
            return names.map(n => this._allActors.find(a => a.name === n)).filter(Boolean);
        } catch { return []; }
    }

    _getFavDirs() {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_DIRECTORS)) || [];
            return names.map(n => this._allDirs.find(d => d.name === n)).filter(Boolean);
        } catch { return []; }
    }

    /* ─────────── HAPUS FAVORIT ─────────── */
    _removeFilm(filmId) {
        try {
            const db = JSON.parse(localStorage.getItem(KEY_DB)) || {};
            const session = this._getSession();
            if (!db || !session) return;
            const userId = session.userId || session.id;
            db.favorites = (db.favorites || []).filter(
                r => !(r.userId === userId && r.filmId === filmId)
            );
            localStorage.setItem(KEY_DB, JSON.stringify(db));
        } catch { /* ignore */ }
    }

    _removeActor(name) {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_ACTORS)) || [];
            localStorage.setItem(KEY_ACTORS, JSON.stringify(names.filter(n => n !== name)));
        } catch { /* ignore */ }
    }

    _removeDirector(name) {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_DIRECTORS)) || [];
            localStorage.setItem(KEY_DIRECTORS, JSON.stringify(names.filter(n => n !== name)));
        } catch { /* ignore */ }
    }

    /* ─────────── SIDEBAR ─────────── */
    _renderSidebar() {
        const sidebar = document.getElementById("userSidebar");
        if (!sidebar) return;
        const u = this._user, cur = window.location.pathname;

        const navItems = [
            { section: "Akun Saya" },
            { href: "/frontend/pages/user/profile.html",       icon: "user",        label: "Profil" },
            { href: "/frontend/pages/user/security.html",      icon: "shield",      label: "Keamanan" },
            { href: "/frontend/pages/user/settings.html",      icon: "settings",    label: "Pengaturan" },
            { section: "Konten" },
            { href: "/frontend/pages/user/history.html",       icon: "clock",       label: "Riwayat Tonton" },
            { href: "/frontend/pages/user/favorites.html",     icon: "heart",       label: "Favorit" },
            { href: "/frontend/pages/user/watchlist.html",     icon: "bookmark",    label: "Daftar Tonton" },
            { section: "Langganan" },
            { href: "/frontend/pages/user/subscription.html",  icon: "star",        label: "Status Langganan" },
            { href: "/frontend/pages/user/payment.html",       icon: "credit-card", label: "Pembayaran & Poin" },
            { href: "/frontend/pages/user/transactions.html",  icon: "list",        label: "Transaksi" },
            { href: "/frontend/pages/user/notifications.html", icon: "bell",        label: "Notifikasi" },
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

    /* ─────────── PAGE — 3 section sekaligus ─────────── */
    _renderPage() {
        const main = document.getElementById("favoritesMain");
        if (!main) return;

        const films  = this._getFavFilms();
        const actors = this._getFavActors();
        const dirs   = this._getFavDirs();

        main.innerHTML = `
            <div class="user-page">

                <div class="page-header">
                    <button class="page-header__burger" id="btnBurger" aria-label="Buka menu">
                        <i data-feather="menu"></i>
                    </button>
                    <div class="page-header__text">
                        <h1 class="page-header__title">Favorit Saya</h1>
                        <p class="page-header__subtitle">Kumpulan film, aktor, dan sutradara yang kamu sukai</p>
                    </div>
                </div>

                <!-- SECTION: Film Favorit -->
                <div class="fav-section">
                    <div class="fav-section__header">
                        <div class="fav-section__title-wrap">
                            <i data-feather="film"></i>
                            <h2 class="fav-section__title">Film Favorit</h2>
                            ${films.length > 0 ? `<span class="fav-count">${films.length}</span>` : ""}
                        </div>
                        ${films.length > 0 ? `<a href="/frontend/pages/film/katalog.html" class="fav-section__link">Jelajahi lebih <i data-feather="arrow-right"></i></a>` : ""}
                    </div>
                    <div id="section-film">
                        ${this._filmGridHTML(films)}
                    </div>
                </div>

                <!-- SECTION: Aktor Favorit -->
                <div class="fav-section">
                    <div class="fav-section__header">
                        <div class="fav-section__title-wrap">
                            <i data-feather="users"></i>
                            <h2 class="fav-section__title">Aktor Favorit</h2>
                            ${actors.length > 0 ? `<span class="fav-count">${actors.length}</span>` : ""}
                        </div>
                    </div>
                    <div id="section-aktor">
                        ${this._personGridHTML(actors, "aktor")}
                    </div>
                </div>

                <!-- SECTION: Sutradara Favorit -->
                <div class="fav-section">
                    <div class="fav-section__header">
                        <div class="fav-section__title-wrap">
                            <i data-feather="camera"></i>
                            <h2 class="fav-section__title">Sutradara Favorit</h2>
                            ${dirs.length > 0 ? `<span class="fav-count">${dirs.length}</span>` : ""}
                        </div>
                    </div>
                    <div id="section-sutradara">
                        ${this._personGridHTML(dirs, "sutradara")}
                    </div>
                </div>

            </div>`;
    }

    /* ─────────── FILM GRID — pakai .film-card dari card.css Restu ─────────── */
    _filmGridHTML(films) {
        if (!films.length) return this._emptyHTML(
            "film favorit",
            "Buka halaman film dan klik ♥ Favorit untuk menambahkan."
        );

        return `<div class="fav-film-grid">${films.map(film => {
            const genreNames = (film.genres || [])
                .map(id => this._genres.find(g => g.id === id)?.name || id)
                .slice(0, 2).join(", ");
            const quality = film.videoQuality?.[0] || "HD";
            const rating  = film.averageRating || film.rating || "—";

            return `
            <div class="film-card" data-film-id="${film.id}">
                <button class="btn-remove-fav" data-type="film" data-id="${film.id}" title="Hapus dari favorit">
                    <i data-feather="x"></i>
                </button>
                <a href="/frontend/pages/film/detail.html#${film.id}" style="text-decoration:none;display:contents">
                    <div class="film-card__poster">
                        <img src="${film.poster || ""}" alt="${film.title}"
                             onerror="this.src='https://picsum.photos/seed/${film.id}/300/450'">
                        <div class="film-card__rating"><i data-feather="star"></i> ${rating}</div>
                        <div class="film-card__quality">${quality}</div>
                        <div class="film-card__overlay">
                            <div class="film-card__play-btn">
                                <i data-feather="play"></i>
                            </div>
                        </div>
                    </div>
                    <div class="film-card__info">
                        <h3 class="film-card__title">${film.title}</h3>
                        <p class="film-card__genre">${genreNames}</p>
                    </div>
                </a>
            </div>`;
        }).join("")}</div>`;
    }

    /* ─────────── PERSON GRID ─────────── */
    _personGridHTML(persons, type) {
        if (!persons.length) return this._emptyHTML(
            `${type === "aktor" ? "aktor" : "sutradara"} favorit`,
            `Buka halaman ${type === "aktor" ? "aktor" : "sutradara"} dan klik ♥ untuk menambahkan.`
        );

        const pageBase = type === "aktor"
            ? "/frontend/pages/film/aktor.html?name="
            : "/frontend/pages/film/sutradara.html?name=";

        return `<div class="fav-person-grid">${persons.map(p => `
            <a class="fav-person-card" href="${pageBase}${encodeURIComponent(p.name)}">
                <button class="btn-remove-fav" data-type="${type}" data-id="${p.name}"
                        title="Hapus dari favorit" onclick="event.preventDefault();event.stopPropagation()">
                    <i data-feather="x"></i>
                </button>
                <div class="fav-person-card__img-wrap">
                    <img class="fav-person-card__img" src="${p.photo || ""}" alt="${p.name}"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1db954&color=fff&size=300'">
                </div>
                <div class="fav-person-card__body">
                    <p class="fav-person-card__name">${p.name}</p>
                    <p class="fav-person-card__meta">${type === "aktor" ? "Aktor" : "Sutradara"} · ${p.filmCount || "—"} film</p>
                </div>
            </a>`).join("")}</div>`;
    }

    _emptyHTML(label, desc) {
        return `
            <div class="fav-empty">
                <i data-feather="heart"></i>
                <p class="fav-empty__title">Belum ada ${label}</p>
                <p class="fav-empty__desc">${desc}</p>
            </div>`;
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

        // Hapus favorit
        document.getElementById("favoritesMain")?.addEventListener("click", e => {
            const btn = e.target.closest(".btn-remove-fav");
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            this._removeFav(btn.dataset.type, btn.dataset.id);
        });
    }

    _removeFav(type, id) {
        if (type === "film")       this._removeFilm(id);
        else if (type === "aktor") this._removeActor(id);
        else                       this._removeDirector(id);

        // Re-render section yang berubah saja
        if (type === "film") {
            document.getElementById("section-film").innerHTML = this._filmGridHTML(this._getFavFilms());
            this._updateCount("section-film", this._getFavFilms().length);
        } else if (type === "aktor") {
            document.getElementById("section-aktor").innerHTML = this._personGridHTML(this._getFavActors(), "aktor");
            this._updateCount("section-aktor", this._getFavActors().length);
        } else {
            document.getElementById("section-sutradara").innerHTML = this._personGridHTML(this._getFavDirs(), "sutradara");
            this._updateCount("section-sutradara", this._getFavDirs().length);
        }

        feather.replace();
        this._toast("Dihapus dari favorit.", "success");
    }

    _updateCount(sectionId, count) {
        // Update badge jumlah di header section
        const section = document.getElementById(sectionId)?.closest(".fav-section");
        if (!section) return;
        const badge = section.querySelector(".fav-count");
        if (count > 0) {
            if (badge) badge.textContent = count;
        } else {
            badge?.remove();
        }
    }

    /* ─────────── HELPERS ─────────── */
    _toast(message, type = "success") {
        document.querySelector(".toast")?.remove();
        const icons = { success: "check-circle", error: "alert-circle" };
        const t = document.createElement("div");
        t.className = `toast toast--${type}`;
        t.innerHTML = `<i data-feather="${icons[type]}"></i><span>${message}</span>`;
        document.body.appendChild(t);
        feather.replace();
        requestAnimationFrame(() => t.classList.add("toast--visible"));
        setTimeout(() => { t.classList.remove("toast--visible"); setTimeout(() => t.remove(), 350); }, 3000);
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }
}

export default UserFavoritesPage;
import authService from "../../../backend/services/AuthService.js";
import Navbar from "../components/navbar.js";
import { UserData } from "../utils/user-data.js";

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
        this._genres    = [];
        this._watchLists = [];
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
        this._renderPage();
        this._bindEvents();
        feather.replace();
    }

    /* ─────────── LOAD DATA ─────────── */
    async _loadData() {
        try {
            const [fR, gR, wlData] = await Promise.all([
                fetch("/data/data-film.json"),
                fetch("/data/genres.json"),
                UserData.get("watchLists"),
            ]);
            const [fd, gd] = await Promise.all([fR.json(), gR.json()]);
            this._allFilms  = fd.films || fd || [];
            this._genres    = gd.genres || gd || [];
            this._watchLists = wlData || [];
        } catch {
            this._allFilms = [];
            this._genres = [];
            this._watchLists = [];
        }
    }

    /* ─────────── BACA WATCHLIST ─────────── */
    _getUserId() {
        return this._user?.userId || this._user?.id;
    }

    _getWatchlistFilms() {
        const userId = this._getUserId();
        if (!userId) return [];
        return (this._watchLists || [])
            .filter((r) => r.userId === userId)
            .map((r) => this._allFilms.find((f) => f.id === r.filmId))
            .filter(Boolean);
    }

    async _removeFromWatchlist(filmId) {
        const userId = this._getUserId();
        if (!userId) return;
        this._watchLists = (this._watchLists || []).filter(
            (r) => !(r.userId === userId && r.filmId === filmId)
        );
        await UserData.set("watchLists", this._watchLists);
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
                            <span>${film.releaseDate ? new Date(film.releaseDate).getFullYear() : "-"}</span>
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
                <div class="page-header__text">
                    <h1 class="page-header__title">Daftar Tonton</h1>
                    <p class="page-header__subtitle">Film yang kamu simpan untuk ditonton nanti</p>
                    ${films.length > 0 ? `<div class="page-header__count">
                        <i data-feather="bookmark"></i> ${films.length} film
                    </div>` : ""}
                </div>
                ${films.length > 0 ? `<a href="/frontend/pages/film/katalog.html" class="btn btn-ghost">
                    <i data-feather="film"></i> Jelajahi Film
                </a>` : ""}
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
        document.getElementById("watchlistMain")?.addEventListener("click", async (e) => {
            const removeBtn = e.target.closest(".btn-remove-watchlist");
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const filmId = removeBtn.dataset.filmId;
                await this._removeFromWatchlist(filmId);
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

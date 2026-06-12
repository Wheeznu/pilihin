import { DOM } from "../utils/dom.js";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class FavoritPage {
    constructor() {
        this._films = [];
        this._init();
    }

    async _init() {
        try {
            this._loadFavorites();
            this._render();
            this._bindCardClicks();
        } catch (err) {
            console.warn("FavoritPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _getSessionUser() {
        try {
            const raw = localStorage.getItem("pilih-in-session");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    _loadFavorites() {
        this._db = this._getDb();
        if (!this._db || !this._db.films) {
            throw new Error("Database not ready");
        }

        this._genres = this._db.genres || [];
        this._films = [];

        const user = this._getSessionUser();
        if (!user) return;

        const records = this._db.favorites || [];
        const userRecords = records.filter((r) => r.userId === user.userId);
        this._films = userRecords
            .map((r) => this._db.films.find((f) => f.id === r.filmId && f.status === "published"))
            .filter(Boolean);
    }

    _removeFromFavorites(filmId) {
        const user = this._getSessionUser();
        if (!user) return;
        this._db.favorites = (this._db.favorites || []).filter(
            (r) => !(r.userId === user.userId && r.filmId === filmId)
        );
        localStorage.setItem("pilih-in-db", JSON.stringify(this._db));
    }

    _genreNames(genreIds) {
        if (!genreIds?.length) return "";
        return genreIds
            .map((id) => this._genres.find((g) => g.id === id)?.name || GENRE_MAP[id] || id)
            .filter(Boolean)
            .join(", ");
    }

    _filmCardHTML(film) {
        const genreNames = this._genreNames(film.genres);
        const quality = film.videoQuality?.[0] || "HD";

        return `
            <div class="favorit-card" data-film-id="${film.id}">
                <div class="film-card">
                    <div class="film-card__poster">
                        <button class="btn-remove-favorit" data-film-id="${film.id}" aria-label="Hapus dari favorit">
                            <i data-feather="trash-2"></i>
                        </button>
                        <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                        <span class="film-card__rating"><i data-feather="star" style="width:12px;height:12px;fill:currentColor"></i> ${film.averageRating || "?"}</span>
                        <span class="film-card__quality">${quality}</span>
                        <div class="film-card__overlay">
                            <div class="film-card__play-btn"><i data-feather="play" style="margin-left:2px"></i></div>
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

    _render() {
        const container = DOM.$("#favoritPage");
        if (!container) return;

        if (!this._films.length) {
            container.innerHTML = `
                <div class="page-hero">
                    <div>
                        <h1>Film Favorit</h1>
                        <p>Film yang kamu tandai sebagai favorit</p>
                    </div>
                </div>
                <div class="favorit-empty">
                    <i data-feather="heart"></i>
                    <h3>Belum ada film favorit</h3>
                    <p>Tandai film sebagai favorit dari halaman detail film.</p>
                    <a href="/frontend/pages/film/katalog.html" class="btn btn-primary">
                        <i data-feather="film"></i> Jelajahi Film
                    </a>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = `
            <div class="page-hero">
                <div>
                    <h1>Film Favorit</h1>
                    <p>${this._films.length} film favorit</p>
                </div>
            </div>
            <div class="favorit-grid">
                ${this._films.map((f) => this._filmCardHTML(f)).join("")}
            </div>
        `;
        feather.replace();
    }

    _bindCardClicks() {
        document.addEventListener("click", (e) => {
            const removeBtn = e.target.closest(".btn-remove-favorit");
            if (removeBtn) {
                const filmId = removeBtn.dataset.filmId;
                this._removeFromFavorites(filmId);
                this._loadFavorites();
                this._render();
                feather.replace();
                return;
            }

            const card = e.target.closest(".film-card");
            if (!card) return;
            const wrapper = card.closest(".favorit-card");
            const filmId = wrapper?.dataset.filmId;
            if (filmId) {
                window.location.href = `/frontend/pages/film/detail.html#${filmId}`;
            }
        });
    }
}

export default FavoritPage;

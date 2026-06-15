import { DOM } from "../utils/dom.js";
import { getDbReady } from "../../../backend/init.js";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class CatalogPage {
    constructor() {
        this._films = [];
        this._sortBy = "latest";
        this._genreFilter = null;
        this._genreName = "";
        this._init();
    }

    async _init() {
        try {
            await getDbReady();
            this._loadFilms();
            this._readGenreFilter();
            this._bindSort();
            this._render();
            this._bindCardClicks();
        } catch (err) {
            console.warn("CatalogPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _loadFilms() {
        const db = this._getDb();
        if (!db || !db.films) {
            throw new Error("Database not ready");
        }
        this._films = db.films.filter((f) => f.status === "published");
        this._genres = db.genres || [];
    }

    _readGenreFilter() {
        const params = new URLSearchParams(window.location.search);
        const genreId = params.get("genre");
        if (!genreId) return;

        const genre = this._genres.find((g) => g.id === genreId);
        if (genre) {
            this._genreFilter = genreId;
            this._genreName = genre.name;
        }
    }

    _genreNames(genreIds) {
        if (!genreIds || !genreIds.length) return "";
        return genreIds
            .map((id) => this._genres.find((g) => g.id === id)?.name || GENRE_MAP[id] || id)
            .filter(Boolean)
            .join(", ");
    }

    _sortFilms(films) {
        const sorted = [...films];
        switch (this._sortBy) {
            case "trending":
                sorted.sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0));
                break;
            case "rating":
                sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                break;
            case "latest":
            default:
                sorted.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
                break;
        }
        return sorted;
    }

    _filteredFilms() {
        let result = this._films;
        if (this._genreFilter) {
            result = result.filter((f) => f.genres?.includes(this._genreFilter));
        }
        return result;
    }

    _filmCardHTML(film) {
        const genreNames = this._genreNames(film.genres);
        const qArr = film.videoQuality || []; const quality = qArr.length > 2 ? qArr[2 + Math.floor(Math.random() * (qArr.length - 2))] : qArr[qArr.length - 1] || "HD";

        return `
            <div class="film-card" data-film-id="${film.id}">
                <div class="film-card__poster">
                    <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                    <span class="film-card__rating">
                        <i data-feather="star" style="width:12px;height:12px;fill:currentColor"></i> ${film.averageRating || "?"}
                    </span>
                    <span class="film-card__quality">${quality}</span>
                    <div class="film-card__overlay">
                        <div class="film-card__play-btn">
                            <i data-feather="play" style="margin-left: 2px"></i>
                        </div>
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
        `;
    }

    _render() {
        const grid = DOM.$("#filmGrid");
        const headerEl = DOM.$("#catalogHeader");
        if (!grid) return;

        const filtered = this._filteredFilms();
        const sorted = this._sortFilms(filtered);

        // Render genre header section with sort filters
        if (headerEl) {
            const backBtn = this._genreFilter
                ? `<button class="btn-icon btn-back" aria-label="Kembali" onclick="location.href='/frontend/pages/film/katalog.html'"><i data-feather="arrow-left"></i></button>`
                : "";
            const title = this._genreFilter ? this._genreName : "Katalog Film";
            const showDivider = this._genreFilter;

            headerEl.innerHTML = `
                <div class="genre-header-section">
                    <div class="genre-title-row">
                        ${backBtn}
                        <h1 class="genre-title">${title}</h1>
                    </div>
                    <div class="genre-filters">
                        <button class="filter-pill ${this._sortBy === 'latest' ? 'active' : ''}" data-sort="latest">Terbaru</button>
                        <button class="filter-pill ${this._sortBy === 'trending' ? 'active' : ''}" data-sort="trending">Trending</button>
                        <button class="filter-pill ${this._sortBy === 'rating' ? 'active' : ''}" data-sort="rating">Rating</button>
                    </div>
                    ${showDivider ? '<hr class="genre-divider" />' : ''}
                </div>
            `;
            feather.replace();
        }

        if (!sorted.length) {
            grid.innerHTML = `
                <div class="catalog-empty">
                    <i data-feather="film"></i>
                    <h3>Belum ada film</h3>
                    <p>${this._genreFilter ? `Belum ada film dengan genre ${this._genreName}.` : "Film akan muncul setelah ditambahkan oleh admin."}</p>
                    ${this._genreFilter ? `<a href="/frontend/pages/film/katalog.html" class="btn btn-primary" style="margin-top:var(--space-md)"><i data-feather="x"></i> Hapus Filter</a>` : ""}
                </div>
            `;
            feather.replace();
            return;
        }

        grid.innerHTML = sorted.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _bindCardClicks() {
        document.addEventListener("click", (e) => {
            const card = e.target.closest(".film-card[data-film-id]");
            if (!card) return;
            const filmId = card.dataset.filmId;
            window.location.href = `/frontend/pages/film/detail.html#${filmId}`;
        });
    }

    _bindSort() {
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".filter-pill");
            if (!btn) return;
            if (!this._genres) return;
            const sort = btn.dataset.sort;
            if (sort === this._sortBy) return;
            document.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            this._sortBy = sort;
            this._render();
        });
    }
}

export default CatalogPage;

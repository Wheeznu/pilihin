import { DOM } from "../utils/dom.js";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class SearchPage {
    constructor() {
        this._films = [];
        this._query = "";
        this._init();
    }

    async _init() {
        try {
            this._query = this._getQueryFromURL();
            this._loadFilms();
            this._render();
            this._bindCardClicks();
        } catch (err) {
            console.warn("SearchPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getQueryFromURL() {
        const params = new URLSearchParams(window.location.search);
        return (params.get("q") || "").trim();
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

    _genreNames(genreIds) {
        if (!genreIds || !genreIds.length) return "";
        return genreIds
            .map((id) => this._genres.find((g) => g.id === id)?.name || GENRE_MAP[id] || id)
            .filter(Boolean)
            .join(", ");
    }

    _searchFilms() {
        if (!this._query) return [];
        const q = this._query.toLowerCase();

        return this._films
            .filter((film) => (film.title || "").toLowerCase().includes(q))
            .sort((a, b) => {
                const aTitle = (a.title || "").toLowerCase();
                const bTitle = (b.title || "").toLowerCase();

                const aScore = aTitle === q ? 3 : aTitle.startsWith(q) ? 2 : 1;
                const bScore = bTitle === q ? 3 : bTitle.startsWith(q) ? 2 : 1;

                return bScore - aScore;
            });
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
        const grid = DOM.$("#searchGrid");
        const infoEl = DOM.$("#searchInfo");
        if (!grid) return;

        if (!this._query) {
            grid.innerHTML = `
                <div class="catalog-empty">
                    <i data-feather="search"></i>
                    <h3>Cari film favoritmu</h3>
                    <p>Ketik judul film di kolom pencarian navbar untuk mulai mencari.</p>
                </div>
            `;
            if (infoEl) infoEl.innerHTML = "";
            feather.replace();
            return;
        }

        const results = this._searchFilms();

        if (infoEl) {
            infoEl.innerHTML = `
                <span class="search-info__query">Menampilkan hasil untuk "<strong>${this._query}</strong>"</span>
                <span class="search-info__count">${results.length} film ditemukan</span>
            `;
        }

        if (!results.length) {
            grid.innerHTML = `
                <div class="catalog-empty">
                    <i data-feather="search"></i>
                    <h3>Film tidak ditemukan</h3>
                    <p>Maaf, tidak ada film yang cocok dengan "${this._query}". Coba kata kunci lain.</p>
                </div>
            `;
            feather.replace();
            return;
        }

        grid.innerHTML = results.map((f) => this._filmCardHTML(f)).join("");
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
}

export default SearchPage;

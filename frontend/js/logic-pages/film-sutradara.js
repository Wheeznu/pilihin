import { DOM } from "../utils/dom.js";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class DirectorPage {
    constructor() {
        this._director = null;
        this._films = [];
        this._init();
    }

    async _init() {
        try {
            this._director = await this._findDirector();
            if (!this._director) {
                this._renderError();
                return;
            }
            this._loadFilms();
            this._render();
            this._bindCardClicks();
            this._bindFavButton();
            feather.replace();
        } catch (err) {
            console.warn("DirectorPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getQueryName() {
        const params = new URLSearchParams(window.location.search);
        return (params.get("name") || "").trim();
    }

    async _findDirector() {
        const name = this._getQueryName();
        if (!name) return null;

        const db = this._getDb();
        if (db?.directors?.length) {
            return db.directors.find((d) => d.name.toLowerCase() === name.toLowerCase()) || null;
        }

        try {
            const res = await fetch("/data/data-director.json");
            const data = await res.json();
            return (data.directors || []).find((d) => d.name.toLowerCase() === name.toLowerCase()) || null;
        } catch {
            return null;
        }
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _loadFilms() {
        const db = this._getDb();
        if (!db?.films) return;
        this._films = db.films.filter(
            (f) => f.status === "published" && f.director?.toLowerCase() === this._director.name.toLowerCase()
        );
        this._genres = db.genres || [];
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
        const qArr = film.videoQuality || []; const quality = qArr.length > 2 ? qArr[2 + Math.floor(Math.random() * (qArr.length - 2))] : qArr[qArr.length - 1] || "HD";
        return `
            <div class="film-card" data-film-id="${film.id}">
                <div class="film-card__poster">
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
        `;
    }

    _getDirectorFavKey() {
        return "pilih-in-favorites-directors";
    }

    _getDirectorFavIds() {
        const raw = localStorage.getItem(this._getDirectorFavKey());
        return raw ? JSON.parse(raw) : [];
    }

    _setDirectorFavIds(ids) {
        localStorage.setItem(this._getDirectorFavKey(), JSON.stringify(ids));
    }

    _isDirectorFavorite() {
        return this._getDirectorFavIds().includes(this._director.name);
    }

    _toggleDirectorFavorite() {
        const ids = this._getDirectorFavIds();
        const idx = ids.indexOf(this._director.name);
        if (idx > -1) {
            ids.splice(idx, 1);
        } else {
            ids.push(this._director.name);
        }
        this._setDirectorFavIds(ids);
    }

    _render() {
        const d = this._director;
        const container = DOM.$("#directorPage");
        if (!container) return;

        const birthYear = d.birthDate ? new Date(d.birthDate).getFullYear() : "—";
        const age = d.birthDate ? new Date().getFullYear() - birthYear : "—";
        const popularity = d.popularity ?? 50;
        const isFav = this._isDirectorFavorite();

        container.innerHTML = `
            <div class="profile-page">
                <div class="profile-header">
                    <div class="profile-photo">
                        <img src="${d.photo || "https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=1db954&color=fff&size=300"}" alt="${d.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=1db954&color=fff&size=300'" />
                    </div>
                    <div class="profile-info">
                        <div class="profile-name-row">
                            <h1 class="profile-name">${d.name}</h1>
                            <button class="btn-icon btn-fav-profile ${isFav ? "active" : ""}" data-profile="${d.name}" aria-label="Favorit">
                                <i data-feather="heart"></i>
                            </button>
                        </div>
                        <p class="profile-bio">${d.biography || "Tidak ada biografi."}</p>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat__value">${d.filmCount ?? "—"}</span>
                        <span class="profile-stat__label">Film</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat__value">${d.awards ?? 0}</span>
                        <span class="profile-stat__label">Penghargaan</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat__value">${age}</span>
                        <span class="profile-stat__label">Usia</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat__value">${popularity}%</span>
                        <span class="profile-stat__label">Popularitas</span>
                    </div>
                </div>

                <div class="profile-details">
                    <div class="profile-detail-item">
                        <span class="profile-detail-item__label">Tempat Lahir</span>
                        <span class="profile-detail-item__value">${d.birthPlace || "—"}</span>
                    </div>
                    <div class="profile-detail-item">
                        <span class="profile-detail-item__label">Tanggal Lahir</span>
                        <span class="profile-detail-item__value">${d.birthDate ? new Date(d.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}</span>
                    </div>
                </div>

                ${this._films.length ? `
                    <section class="profile-section">
                        <h2 class="profile-section__title">Filmografi <span class="profile-section__count">${this._films.length} film</span></h2>
                        <div class="profile-film-grid">
                            ${this._films.map((f) => this._filmCardHTML(f)).join("")}
                        </div>
                    </section>
                ` : ""}
            </div>
        `;
    }

    _bindCardClicks() {
        document.addEventListener("click", (e) => {
            const card = e.target.closest(".film-card[data-film-id]");
            if (!card) return;
            const filmId = card.dataset.filmId;
            window.location.href = `/frontend/pages/film/detail.html#${filmId}`;
        });
    }

    _bindFavButton() {
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-fav-profile");
            if (!btn) return;
            this._toggleDirectorFavorite();
            btn.classList.toggle("active");
            feather.replace();
        });
    }

    _renderError() {
        window.location.href = "/frontend/pages/main/404.html";
    }
}

export default DirectorPage;

import { DOM } from "../utils/dom.js";
import { UserData } from "../utils/user-data.js";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class WatchlistPage {
    constructor() {
        this._films = [];
        this._watchLists = [];
        this._init();
    }

    async _init() {
        try {
            await this._loadWatchlist();
            this._render();
            this._bindCardClicks();
        } catch (err) {
            console.warn("WatchlistPage: retrying...", err);
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

    async _loadWatchlist() {
        this._db = this._getDb();
        if (!this._db || !this._db.films) {
            throw new Error("Database not ready");
        }

        this._genres = this._db.genres || [];
        this._films = [];

        const user = this._getSessionUser();
        if (!user) return;

        this._watchLists = await UserData.get("watchLists");
        const userRecords = this._watchLists.filter((r) => r.userId === user.userId);
        this._films = userRecords
            .map((r) => this._db.films.find((f) => f.id === r.filmId && f.status === "published"))
            .filter(Boolean);
    }

    async _removeFromWatchlist(filmId) {
        const user = this._getSessionUser();
        if (!user) return;
        this._watchLists = this._watchLists.filter(
            (r) => !(r.userId === user.userId && r.filmId === filmId)
        );
        await UserData.set("watchLists", this._watchLists);
    }

    _genreNames(genreIds) {
        if (!genreIds?.length) return "";
        return genreIds
            .map((id) => this._genres.find((g) => g.id === id)?.name || GENRE_MAP[id] || id)
            .filter(Boolean)
            .join(", ");
    }

    _filmCardHTML(film, showRemove = true) {
        const genreNames = this._genreNames(film.genres);
        const qArr = film.videoQuality || []; const quality = qArr.length > 2 ? qArr[2 + Math.floor(Math.random() * (qArr.length - 2))] : qArr[qArr.length - 1] || "HD";

        return `
            <div class="watchlist-card" data-film-id="${film.id}">
                <div class="film-card">
                    <div class="film-card__poster">
                        ${showRemove ? `<button class="btn-remove-watchlist" data-film-id="${film.id}" aria-label="Hapus dari daftar tonton">
                            <i data-feather="trash-2"></i>
                        </button>` : ""}
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
        const container = DOM.$("#watchlistPage");
        if (!container) return;

        if (!this._films.length) {
            const popular = this._films.length
                ? []
                : [...this._db.films]
                    .filter((f) => f.status === "published")
                    .sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0))
                    .slice(0, 5);

            container.innerHTML = `
                <div class="page-hero">
                    <div>
                        <h1>Daftar Tonton</h1>
                        <p>Film yang kamu simpan untuk ditonton nanti</p>
                    </div>
                </div>
                <div class="watchlist-empty-section">
                    <div class="watchlist-empty">
                        <i data-feather="bookmark"></i>
                        <h3>Duh, masih kosong nih!</h3>
                        <p>Mau nambah film ke daftar tonton? Gampang banget:</p>
                        <ol class="watchlist-steps">
                            <li><i data-feather="search"></i> Cari film favorit kamu di halaman <a href="/frontend/pages/film/katalog.html">Katalog</a></li>
                            <li><i data-feather="bookmark"></i> Klik tombol <strong>Tonton Nanti</strong> di halaman detail film</li>
                            <li><i data-feather="check-circle"></i> Selesai! Film kamu akan muncul di sini</li>
                        </ol>
                    </div>
                </div>
                ${popular.length ? `
                <div class="watchlist-recommendation">
                    <div class="recommendation-header">
                        <h2>Rekomendasi Film Populer</h2>
                        <p>Mulai dari film yang lagi banyak ditonton</p>
                    </div>
                    <div class="watchlist-grid">
                        ${popular.map((f) => this._filmCardHTML(f, false)).join("")}
                    </div>
                </div>
                ` : ""}
            `;
            feather.replace();
            return;
        }

        container.innerHTML = `
            <div class="page-hero">
                <div>
                    <h1>Daftar Tonton</h1>
                    <p>${this._films.length} film tersimpan</p>
                </div>
            </div>
            <div class="watchlist-grid">
                ${this._films.map((f) => this._filmCardHTML(f)).join("")}
            </div>
        `;
        feather.replace();
    }

    _bindCardClicks() {
        document.addEventListener("click", async (e) => {
            const removeBtn = e.target.closest(".btn-remove-watchlist");
            if (removeBtn) {
                const filmId = removeBtn.dataset.filmId;
                await this._removeFromWatchlist(filmId);
                await this._loadWatchlist();
                this._render();
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

export default WatchlistPage;
